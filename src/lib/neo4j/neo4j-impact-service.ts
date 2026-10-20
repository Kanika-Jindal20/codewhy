import { runCypherQuery } from './driver';
import { isNeo4jConfigured } from './config';
import { NODE_LABELS } from './schema';
import {
  ImpactAnalysisRequest,
  ImpactAnalysisResult,
  AffectedComponent,
  DependencyPath,
  ImpactSeverity,
} from '@/types/impact';
import { GraphNode } from '@/types/graph';
import { EvidenceSource } from '@/types/evidence';
import { mineCoChangeCorrelations, identifyPastRegressions } from '@/lib/impact/heuristics-engine';

/**
 * Executes a Cypher graph traversal in Neo4j to compute pre-change impact analysis.
 * Traces incoming callers, module consumers, and linked test suites with bounded depth.
 */
export async function analyzeChangeImpactInNeo4j(
  request: ImpactAnalysisRequest
): Promise<ImpactAnalysisResult | null> {
  if (!isNeo4jConfigured()) {
    return null;
  }

  const { repoId, targetNodeId, maxTransitiveDepth = 4, changeCategory, proposedChangeDescription } = request;
  const boundedDepth = Math.max(1, Math.min(maxTransitiveDepth, 5));

  try {
    // 1. Fetch Target Node
    const targetRecords = await runCypherQuery<{
      id: string;
      label: string;
      type: string;
      filePath?: string;
      description?: string;
    }>(
      `MATCH (target:${NODE_LABELS.ENTITY} {repoId: $repoId, id: $targetNodeId})
       RETURN target.id AS id, target.label AS label, target.type AS type,
              target.filePath AS filePath, target.description AS description`,
      { repoId, targetNodeId }
    );

    if (targetRecords.length === 0) {
      return null;
    }

    const targetRow = targetRecords[0];
    const targetNode: GraphNode = {
      id: targetRow.id,
      label: targetRow.label,
      type: (targetRow.type as any) || 'file',
      filePath: targetRow.filePath || '',
      description: targetRow.description,
    };

    // 2. Cypher traversal for incoming consumers (CALLS, IMPORTS, DEPENDS_ON, CONFIGURES)
    const cypherTraversal = `
      MATCH (target:${NODE_LABELS.ENTITY} {repoId: $repoId, id: $targetNodeId})
      MATCH path = (consumer:${NODE_LABELS.ENTITY} {repoId: $repoId})-[:CALLS|IMPORTS|DEPENDS_ON|CONFIGURES*1..${boundedDepth}]->(target)
      WHERE consumer.id <> target.id
      WITH consumer, path, length(path) AS hops,
           [rel IN relationships(path) | coalesce(rel.type, type(rel))] AS relTypes,
           [n IN nodes(path) | n.label] AS pathLabels
      RETURN consumer.id AS id,
             consumer.label AS label,
             consumer.type AS type,
             consumer.filePath AS filePath,
             consumer.description AS description,
             min(hops) AS minHops,
             collect({
               hops: hops,
               relationshipTypes: relTypes,
               pathNodeLabels: pathLabels
             })[0..3] AS samplePaths
    `;

    const consumerRecords = await runCypherQuery<{
      id: string;
      label: string;
      type: string;
      filePath?: string;
      description?: string;
      minHops: number;
      samplePaths: Array<{
        hops: number;
        relationshipTypes: string[];
        pathNodeLabels: string[];
      }>;
    }>(cypherTraversal, { repoId, targetNodeId });

    // 3. Query linked tests
    const testRecords = await runCypherQuery<{
      id: string;
      label: string;
      type: string;
      filePath?: string;
    }>(
      `MATCH (test:${NODE_LABELS.ENTITY} {repoId: $repoId, type: 'test'})-[:TESTS]->(target:${NODE_LABELS.ENTITY} {repoId: $repoId, id: $targetNodeId})
       RETURN test.id AS id, test.label AS label, test.type AS type, test.filePath AS filePath`,
      { repoId, targetNodeId }
    );

    // Build affected components
    const affectedComponents: AffectedComponent[] = [];

    // Add consumers
    for (const record of consumerRecords) {
      const isDirect = record.minHops === 1;
      const severity: ImpactSeverity = isDirect ? 'high' : record.minHops === 2 ? 'medium' : 'low';
      const impactKind = isDirect
        ? 'direct_dependent'
        : record.type === 'config'
        ? 'config_consumer'
        : 'transitive_consumer';

      const consumerNode: GraphNode = {
        id: record.id,
        label: record.label,
        type: (record.type as any) || 'file',
        filePath: record.filePath || '',
        description: record.description,
      };

      const paths: DependencyPath[] = record.samplePaths.map(p => ({
        nodes: [consumerNode, targetNode],
        edges: [],
        hops: p.hops,
        description: `Neo4j Cypher Traversal: ${p.pathNodeLabels.join(' ➔ ')} (${p.hops} ${p.hops === 1 ? 'hop' : 'hops'})`,
      }));

      const edgeEvidence: EvidenceSource[] = [
        {
          id: `ev-neo4j-${record.id}`,
          type: 'ast_relation',
          title: `Neo4j: ${record.label} depends on ${targetNode.label}`,
          filePath: record.filePath || '',
          confidenceScore: 0.95,
        },
      ];

      affectedComponents.push({
        node: consumerNode,
        impactKind,
        severity,
        severityReason: isDirect
          ? `Directly imports or calls ${targetNode.label} (1 hop) in ${record.filePath || 'codebase'}.`
          : `Indirectly depends on ${targetNode.label} via ${record.minHops}-hop execution path.`,
        isDirect,
        paths,
        evidence: edgeEvidence,
        recommendedChecks: isDirect
          ? [`Update call-site signature in ${record.filePath || record.label}`, `Run verification tests`]
          : [`Review transitive contract expectations`],
      });
    }

    // Add tests
    const relatedTests: AffectedComponent[] = [];
    for (const t of testRecords) {
      const testNode: GraphNode = {
        id: t.id,
        label: t.label,
        type: 'test',
        filePath: t.filePath || '',
        description: `Automated test suite asserting ${targetNode.label}`,
      };
      const testPath: DependencyPath = {
        nodes: [testNode, targetNode],
        edges: [],
        hops: 1,
        description: `Neo4j TESTS relationship: ${t.label} ➔ ${targetNode.label}`,
      };
      const testEvidence: EvidenceSource[] = [
        {
          id: `ev-neo4j-test-${t.id}`,
          type: 'ast_relation',
          title: `Neo4j TESTS: ${t.label} tests ${targetNode.label}`,
          filePath: t.filePath || '',
          confidenceScore: 1.0,
        },
      ];
      relatedTests.push({
        node: testNode,
        impactKind: 'test_suite',
        severity: 'high',
        severityReason: `Test suite directly validates ${targetNode.label}; expectations may fail after change.`,
        isDirect: true,
        paths: [testPath],
        evidence: testEvidence,
        recommendedChecks: [`Execute test suite before and after PR merge`],
      });
    }

    const configReferences = affectedComponents.filter(c => c.impactKind === 'config_consumer');
    const coChanges = mineCoChangeCorrelations(targetNode.filePath);
    const pastRegressions = identifyPastRegressions(targetNode.filePath);

    // Calculate blast radius breakdown
    const directCount = affectedComponents.filter(c => c.isDirect).length;
    const transitiveCount = affectedComponents.filter(c => !c.isDirect).length;
    const testCount = relatedTests.length;
    const allAffected = [...affectedComponents, ...relatedTests];

    const overallRisk: ImpactSeverity =
      directCount > 3 || changeCategory === 'breaking_interface'
        ? 'high'
        : directCount > 0
        ? 'medium'
        : 'low';

    const allPaths: DependencyPath[] = [];
    for (const comp of affectedComponents) {
      allPaths.push(...comp.paths);
    }

    return {
      id: `neo4j-impact-${Date.now()}`,
      repoId,
      analyzedAt: new Date().toISOString(),
      selectedComponent: targetNode,
      proposedChange: {
        category: changeCategory,
        description: proposedChangeDescription || 'Refactoring component contract and behavior',
      },
      summary: {
        overview: `Neo4j graph analysis identified ${allAffected.length} potentially affected components across ${directCount} direct consumers, ${transitiveCount} transitive callers, ${testCount} linked test suites, and ${coChanges.length} historical co-change files.`,
        totalAffected: allAffected.length,
        directCount,
        transitiveCount,
        testCount,
        configCount: configReferences.length,
        coChangeCount: coChanges.length,
      },
      affectedComponents,
      dependencyPaths: allPaths,
      relatedTests,
      configReferences,
      coChangedFiles: coChanges,
      pastRegressions,
      potentialRisks: [
        {
          risk: `Downstream impact on callers of ${targetNode.label}`,
          level: overallRisk,
          rationale: `Neo4j identified ${directCount} direct and ${transitiveCount} transitive callers for ${targetNode.label}.`,
        },
      ],
      manualVerificationAreas: [
        {
          area: 'Direct Callers and Type Checking',
          checklist: [
            `Verify all ${directCount} direct callers compile without type errors.`,
            `Check call-sites in affected files: ${affectedComponents.filter(c => c.isDirect).map(c => c.node.label).join(', ') || 'None'}.`,
          ],
        },
        {
          area: 'Test Verification',
          checklist: [
            `Run linked test suites (${testCount} detected) against new behavior.`,
          ],
        },
      ],
      separation: {
        staticAnalysis: [
          `Neo4j Cypher query traced ${directCount} direct incoming relationships.`,
          `Neo4j Cypher query traced ${transitiveCount} transitive relationships up to depth ${boundedDepth}.`,
        ],
        heuristicSuggestions: [
          `Identified ${testCount} associated test suites in graph.`,
          `Co-change analysis found ${coChanges.length} correlated files.`,
        ],
        aiInterpretations: [
          `Category '${changeCategory}': changes will impact downstream callers in ${repoId}.`,
        ],
      },
      confidence: {
        level: 'high',
        score: 0.95,
        reasoning: 'Grounded directly in Neo4j persistent knowledge graph relationships and Cypher path traversal.',
        limitations: [
          'Dynamic runtime reflection or eval() cannot be captured in the graph.',
          'External APIs outside repository boundaries are not traced.',
        ],
      },
      limitations: [
        'Dynamic runtime reflection or eval() cannot be captured in the graph.',
        'External APIs outside repository boundaries are not traced.',
      ],
    };
  } catch (err) {
    console.error('[Neo4j Impact] Traversal failed:', err);
    return null;
  }
}
