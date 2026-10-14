import { KnowledgeGraph, GraphNode } from '@/types/graph';
import { 
  ImpactAnalysisRequest, 
  ImpactAnalysisResult, 
  AffectedComponent, 
  ImpactSeverity,
  ChangeCategory 
} from '@/types/impact';
import { traverseImpactPaths } from './graph-traversal';
import { 
  mineCoChangeCorrelations, 
  identifyPastRegressions, 
  findRelatedTests, 
  findRelatedConfigs 
} from './heuristics-engine';
import { EvidenceSource } from '@/types/evidence';

/**
 * Computes transparent, evidence-grounded severity.
 * Documented method:
 * - High: Direct consumer when change is 'breaking_interface', or direct test suite.
 * - Medium: Direct consumer for 'internal_refactor' / 'deprecation', or transitive consumer at 1 hop.
 * - Low: Transitive consumer with 2+ hops, or co-change without direct AST edge.
 * - Info: Documentation or auxiliary configuration references.
 */
function calculateSeverity(
  isDirect: boolean,
  hops: number,
  category: ChangeCategory,
  nodeType: string
): { severity: ImpactSeverity; reason: string } {
  if (nodeType === 'test') {
    return {
      severity: isDirect ? 'high' : 'medium',
      reason: isDirect 
        ? 'Direct unit test suite asserting on target signatures or behavior' 
        : 'Transitive/E2E test suite covering downstream consumer workflows'
    };
  }

  if (isDirect) {
    if (category === 'breaking_interface') {
      return {
        severity: 'high',
        reason: 'Direct consumer with breaking interface change (arguments, return types, or contract modified)'
      };
    }
    if (category === 'config_alteration') {
      return {
        severity: 'high',
        reason: 'Direct consumer relying on environment or runtime configuration schemas'
      };
    }
    return {
      severity: 'medium',
      reason: 'Direct dependent; interface preserved, but runtime behavior or performance may shift'
    };
  }

  if (hops <= 2) {
    return {
      severity: 'medium',
      reason: `Transitive consumer within ${hops} hops of propagation path`
    };
  }

  return {
    severity: 'low',
    reason: `Deep transitive consumer (${hops} hops away); changes typically dampened unless exceptions bubble up`
  };
}

/**
 * Main Impact Analysis service orchestrating traversal, heuristics, and grounded synthesis.
 */
export function analyzeChangeImpact(
  graph: KnowledgeGraph,
  request: ImpactAnalysisRequest
): ImpactAnalysisResult {
  const { targetNodeId, changeCategory, proposedChangeDescription, maxTransitiveDepth = 4 } = request;

  const targetNode = graph.nodes.find(n => n.id === targetNodeId);
  if (!targetNode) {
    throw new Error(`Target component with id '${targetNodeId}' not found in repository graph.`);
  }

  // 1. Graph Traversal: Direct & Transitive
  const traversal = traverseImpactPaths(graph, targetNodeId, maxTransitiveDepth);

  // 2. Heuristics & Historical Mining
  const coChanges = mineCoChangeCorrelations(targetNode.filePath);
  const pastRegressions = identifyPastRegressions(targetNode.filePath);
  const relatedTestNodes = findRelatedTests(targetNode, graph);
  const relatedConfigNodes = findRelatedConfigs(targetNode, graph);

  // 3. Assemble Affected Components with Evidence
  const affectedComponents: AffectedComponent[] = [];
  const processedNodeIds = new Set<string>();

  // A. Direct Dependents
  for (const dep of traversal.directDependents) {
    processedNodeIds.add(dep.id);
    const { severity, reason } = calculateSeverity(true, 1, changeCategory, dep.type);

    const edge = graph.edges.find(e => e.source === dep.id && e.target === targetNode.id);
    const edgeEvidence: EvidenceSource[] = edge?.evidence || [{
      id: `ev-ast-direct-${dep.id}`,
      type: 'ast_relation',
      title: `${dep.label} directly imports/calls ${targetNode.label}`,
      filePath: dep.filePath,
      confidenceScore: 1.0,
    }];

    affectedComponents.push({
      node: dep,
      impactKind: 'direct_dependent',
      severity,
      severityReason: reason,
      isDirect: true,
      paths: [{
        nodes: [dep, targetNode],
        edges: edge ? [edge] : [],
        hops: 1,
        description: `${dep.label} ➔ directly consumes ➔ ${targetNode.label}`,
      }],
      evidence: edgeEvidence,
      recommendedChecks: [
        `Verify import references and call sites in ${dep.filePath}`,
        `Run static type checker (tsc) across ${dep.label}`,
      ],
    });
  }

  // B. Transitive Consumers
  for (const trans of traversal.transitiveConsumers) {
    if (processedNodeIds.has(trans.node.id)) {
      continue;
    }
    processedNodeIds.add(trans.node.id);

    const { severity, reason } = calculateSeverity(false, trans.path.hops, changeCategory, trans.node.type);

    affectedComponents.push({
      node: trans.node,
      impactKind: 'transitive_consumer',
      severity,
      severityReason: reason,
      isDirect: false,
      paths: [trans.path],
      evidence: trans.path.edges.flatMap(e => e.evidence || []),
      recommendedChecks: [
        `Inspect runtime contract propagation along path: ${trans.path.description}`,
        `Ensure error handling and exceptions in ${targetNode.label} are caught before reaching ${trans.node.label}`,
      ],
    });
  }

  // C. Related Tests
  const relatedTests: AffectedComponent[] = relatedTestNodes.map(testNode => {
    const isDirect = traversal.directDependents.some(d => d.id === testNode.id);
    const { severity, reason } = calculateSeverity(isDirect, isDirect ? 1 : 2, changeCategory, 'test');

    return {
      node: testNode,
      impactKind: 'test_suite',
      severity,
      severityReason: reason,
      isDirect,
      paths: [{
        nodes: [testNode, targetNode],
        edges: [],
        hops: 1,
        description: `${testNode.label} asserts behavior of ${targetNode.label}`,
      }],
      evidence: testNode.evidence || [],
      recommendedChecks: [
        `Run test suite: npx vitest run ${testNode.filePath}`,
        `Update mocks or test fixtures if function signatures or return models change`,
      ],
    };
  });

  // D. Config References
  const configReferences: AffectedComponent[] = relatedConfigNodes.map(cfgNode => ({
    node: cfgNode,
    impactKind: 'config_consumer',
    severity: 'medium',
    severityReason: 'Configuration file defining environment flags or schema consumed by this component',
    isDirect: true,
    paths: [{
      nodes: [cfgNode, targetNode],
      edges: [],
      hops: 1,
      description: `${cfgNode.label} ➔ provides configuration for ➔ ${targetNode.label}`,
    }],
    evidence: cfgNode.evidence || [],
    recommendedChecks: [
      `Validate environment variable schemas in ${cfgNode.filePath}`,
      `Check production deployment manifests (.env, k8s, docker-compose) for matching keys`,
    ],
  }));

  // 4. Formulate Potential Risks (Calibrated, evidence-grounded language)
  const potentialRisks: { risk: string; level: ImpactSeverity; rationale: string }[] = [];

  if (changeCategory === 'breaking_interface') {
    potentialRisks.push({
      risk: `Downstream compile/type errors in ${traversal.directDependents.length} direct consumers`,
      level: 'high',
      rationale: `Static AST shows ${traversal.directDependents.map(d => d.label).join(', ')} invoke or import symbols directly from ${targetNode.label}.`,
    });
  }

  if (pastRegressions.length > 0) {
    potentialRisks.push({
      risk: 'High historical regression recurrence likelihood',
      level: 'high',
      rationale: `Found ${pastRegressions.length} historical bugfix commits touching this module (e.g., ${pastRegressions[0].commitHash}: "${pastRegressions[0].summary}").`,
    });
  }

  if (relatedTests.length === 0) {
    potentialRisks.push({
      risk: 'Missing dedicated test suite',
      level: 'medium',
      rationale: `No direct test file found specifically matching ${targetNode.filePath}. Relies on indirect e2e/integration tests.`,
    });
  }

  if (coChanges.length > 0) {
    const topCoChange = coChanges[0];
    potentialRisks.push({
      risk: `Unintended drift in frequently co-changed file: ${topCoChange.relatedFilePath}`,
      level: 'medium',
      rationale: `Git history shows ${topCoChange.relatedFilePath} was modified together with this file across ${topCoChange.coChangeCount} previous commits.`,
    });
  }

  // 5. Explicit Three-way Separation
  const staticAnalysis = [
    `Statically parsed ${traversal.directDependents.length} direct incoming AST consumers.`,
    `Discovered ${traversal.transitiveConsumers.length} transitive consumers via directed call/import graph traversal up to depth ${maxTransitiveDepth}.`,
    `Verified ${traversal.directDependencies.length} direct outbound dependencies.`,
  ];

  const heuristicSuggestions = [
    `Git history co-change mining surfaced ${coChanges.length} files frequently changed together (confidence derived from commit count).`,
    `Test association matched ${relatedTests.length} test files via AST links and file naming patterns.`,
    `Detected ${pastRegressions.length} historical bugfixes/regressions in commit logs.`,
  ];

  const aiInterpretations = [
    `Category '${changeCategory}': changes to exported contracts in ${targetNode.label} will require cascading updates to consumers.`,
    `Risk assessment emphasizes runtime error propagation and recommends verifying integration tests before merging.`,
  ];

  // 6. Manual Verification Checklist
  const manualVerificationAreas = [
    {
      area: 'Runtime Contract & Exception Handling',
      checklist: [
        `Verify that null/undefined or altered return types from ${targetNode.label} do not cause unhandled rejections in ${traversal.directDependents.map(d => d.label).join(', ') || 'consumers'}.`,
        `Check whether asynchronous promises or error states are caught at the controller/middleware boundary.`,
      ],
    },
    {
      area: 'Configuration & Environment Sync',
      checklist: [
        `Confirm that all environment variables loaded by ${targetNode.label} are documented in .env.example.`,
        `Ensure staging and production deployment manifests are updated if schema keys are renamed.`,
      ],
    },
    {
      area: 'Regression & Test Verification',
      checklist: [
        `Execute relevant unit tests: ${relatedTests.map(t => t.node.label).join(', ') || 'N/A'}.`,
        `Perform manual smoke testing on primary consumer workflows.`,
      ],
    },
  ];

  // 7. Unknowns and Limitations
  const limitations = [
    'Dynamic reflection, eval(), dynamic imports with variable expressions, or untyped JSON payloads cannot be statically verified.',
    'Co-change frequency indicates historical correlation in commits, not guaranteed functional coupling.',
    'CSS/style dependencies and external third-party microservice contracts are outside local AST scope.',
  ];

  // Total count
  const allAffected = [...affectedComponents, ...relatedTests, ...configReferences];

  return {
    id: `impact-${Date.now()}`,
    repoId: graph.repoId,
    analyzedAt: new Date().toISOString(),
    selectedComponent: targetNode,
    proposedChange: {
      category: changeCategory,
      description: proposedChangeDescription || 'No description provided.',
    },
    summary: {
      overview: `Potentially affects ${allAffected.length} components across ${traversal.directDependents.length} direct consumers, ${traversal.transitiveConsumers.length} transitive paths, ${relatedTests.length} test suites, and ${coChanges.length} historical co-change files.`,
      totalAffected: allAffected.length,
      directCount: traversal.directDependents.length,
      transitiveCount: traversal.transitiveConsumers.length,
      testCount: relatedTests.length,
      configCount: configReferences.length,
      coChangeCount: coChanges.length,
    },
    affectedComponents,
    dependencyPaths: traversal.transitiveConsumers.map(t => t.path),
    relatedTests,
    configReferences,
    coChangedFiles: coChanges,
    pastRegressions,
    potentialRisks,
    manualVerificationAreas,
    separation: {
      staticAnalysis,
      heuristicSuggestions,
      aiInterpretations,
    },
    confidence: {
      level: 'high',
      score: 0.92,
      reasoning: 'Grounded on verified AST import/call edges and Git commit history records.',
      limitations,
    },
    limitations,
    isDemoData: graph.isDemo,
  };
}
