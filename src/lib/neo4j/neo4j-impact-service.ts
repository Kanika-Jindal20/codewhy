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
      type: targetRow.type as any,
      filePath: targetRow.filePath ?? '',
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

      const paths: DependencyPath[] = record.samplePaths.map(p => ({
        nodes: [targetNode],
        edges: [],
        hops: p.hops,
        description: `Neo4j Cypher Traversal: ${p.pathNodeLabels.join(' ➔ ')} (${p.hops} ${p.hops === 1 ? 'hop' : 'hops'})`,
      }));

      affectedComponents.push({
        node: {
          id: record.id,
          label: record.label,
          type: record.type as any,
          filePath: record.filePath ?? '',
          description: record.description,
        },
        impactKind,
        severity,
        severityReason: isDirect
          ? `Directly imports or calls ${targetNode.label} (1 hop) in ${record.filePath || 'codebase'}.`
          : `Indirectly depends on ${targetNode.label} via ${record.minHops}-hop execution path.`,
        isDirect,
        paths,
        evidence: [],
        recommendedChecks: isDirect
          ? [`Update call-site signature in ${record.filePath || record.label}`, `Run verification tests`]
          : [`Review transitive contract expectations`],
      });
    }

    // Add tests
    for (const t of testRecords) {
      if (!affectedComponents.some(a => a.node.id === t.id)) {
        affectedComponents.push({
          node: {
            id: t.id,
            label: t.label,
            type: 'test',
            filePath: t.filePath ?? '',
            description: `Automated test suite asserting ${targetNode.label}`,
          },
          impactKind: 'test_suite',
          severity: 'high',
          severityReason: `Test suite directly validates ${targetNode.label}; expectations may fail after change.`,
          isDirect: true,
          paths: [
            {
              nodes: [targetNode],
              edges: [],
              hops: 1,
              description: `Neo4j TESTS relationship: ${t.label} ➔ ${targetNode.label}`,
            },
          ],
          evidence: [],
          recommendedChecks: [`Execute test suite before and after PR merge`],
        });
      }
    }

    // Calculate blast radius breakdown
    const directCount = affectedComponents.filter(c => c.isDirect && c.impactKind !== 'test_suite').length;
    const transitiveCount = affectedComponents.filter(c => !c.isDirect).length;
    const testCount = affectedComponents.filter(c => c.impactKind === 'test_suite').length;

    const overallRisk: ImpactSeverity =
      directCount > 3 || changeCategory === 'breaking_interface'
        ? 'high'
        : directCount > 0
        ? 'medium'
        : 'low';

    const relatedTests = affectedComponents.filter(c => c.impactKind === 'test_suite');
    const configReferences = affectedComponents.filter(c => c.impactKind === 'config_consumer');
    const directComponents = affectedComponents.filter(c => c.impactKind !== 'test_suite' && c.impactKind !== 'config_consumer');
    const allPaths: DependencyPath[] = affectedComponents.flatMap(c => c.paths);

    return {
      id: `neo4j-impact-${Date.now()}`,
      repoId,
      analyzedAt: new Date().toISOString(),
      selectedComponent: targetNode,
      proposedChange: {
        category: changeCategory,
        description: proposedChangeDescription,
      },
      summary: {
        overview: `Neo4j identified ${directCount} direct and ${transitiveCount} transitive callers for ${targetNode.label}.`,
        totalAffected: affectedComponents.length,
        directCount,
        transitiveCount,
        testCount,
        configCount: configReferences.length,
        coChangeCount: 0,
      },
      affectedComponents: directComponents,
      dependencyPaths: allPaths,
      relatedTests,
      configReferences,
      coChangedFiles: [],
      pastRegressions: [],
      potentialRisks: [
        {
          risk: `${directCount} direct callers may break`,
          level: overallRisk,
          rationale: `Neo4j graph traversal found ${directCount} direct and ${transitiveCount} transitive consumers of ${targetNode.label}.`,
        },
      ],
      manualVerificationAreas: [
        {
          area: 'Direct callers',
          checklist: [
            `Verify all ${directCount} direct callers compile without type errors.`,
            `Run linked test suites (${testCount} detected) against new behavior.`,
          ],
        },
      ],
      separation: {
        staticAnalysis: directComponents.map(c => `${c.node.label} (${c.node.filePath || 'codebase'})`),
        heuristicSuggestions: [
          'Components outside the computed caller path',
          'Independent service modules with decoupled interfaces',
        ],
        aiInterpretations: [],
      },
      confidence: {
        level: 'high' as const,
        score: 0.95,
        reasoning: '100% verified graph relationships from Neo4j Cypher traversal.',
        limitations: [
          'Dynamic dispatch and runtime polymorphism are not modelled.',
          'Only relationships explicitly stored in the Neo4j graph are considered.',
        ],
      },
      limitations: [
        'Dynamic dispatch and runtime polymorphism are not modelled.',
        'Only relationships explicitly stored in the Neo4j graph are considered.',
      ],
      isDemoData: false,
    };
  } catch (err) {
    console.error('[Neo4j Impact] Traversal failed:', err);
    return null;
  }
}
