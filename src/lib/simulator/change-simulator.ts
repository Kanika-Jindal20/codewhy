import { KnowledgeGraph, GraphNode } from '@/types/graph';
import { getRepositoryGraph, getActiveRepositoryGraph } from '@/lib/graph/graph-store';
import { searchCode, getSymbolDetails, traceDependencies, findRelatedTests } from '@/lib/ask/investigation-tools';
import { querySarvamAI, isSarvamConfigured } from '@/lib/sarvam/sarvam-client';
import { EvidenceSource } from '@/types/evidence';

export interface ChangeSimulationRequest {
  repoId: string;
  changeDescription: string;
  proposedApproach?: string;
  targetSymbolHint?: string;
  maxTransitiveDepth?: number;
}

export interface ChangeSimulationResult {
  simulationId: string;
  repoId: string;
  repoName: string;
  changeDescription: string;
  proposedApproach?: string;
  timestamp: string;
  targetComponents: Array<{
    id: string;
    label: string;
    type: string;
    filePath: string;
    line?: number;
  }>;
  verifiedDirectDependents: Array<{
    id: string;
    label: string;
    type: string;
    filePath: string;
    relation: string;
  }>;
  transitiveBlastRadius: Array<{
    id: string;
    label: string;
    depth: number;
    path: string[];
  }>;
  testsToExecute: Array<{
    id: string;
    label: string;
    filePath: string;
    assertsComponent: string;
  }>;
  predictedRisks: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    isEstimate: true;
  }>;
  stepByStepChangePlan: Array<{
    stepNumber: number;
    title: string;
    affectedFiles: string[];
    action: string;
    verification: string;
  }>;
  assumptionsAndLimitations: string[];
  executiveSummary: string;
  aiReasoned: boolean;
}

/**
 * Simulates a proposed architectural change using real graph traversal and AI prediction.
 */
export async function simulateProposedChange(
  request: ChangeSimulationRequest
): Promise<ChangeSimulationResult> {
  const graph = getRepositoryGraph(request.repoId) || getActiveRepositoryGraph();
  const maxDepth = Math.min(request.maxTransitiveDepth || 4, 6);

  // 1. Identify target symbols matching the plain English description
  const searchTerms = request.targetSymbolHint
    ? [request.targetSymbolHint]
    : request.changeDescription.split(/[^a-zA-Z0-9_.]+/).filter((t) => t.length > 2);

  const matchedTargets: GraphNode[] = [];
  const seenTargetIds = new Set<string>();

  for (const term of searchTerms) {
    const hits = searchCode(graph.repoId, term, 4);
    for (const h of hits) {
      if (!seenTargetIds.has(h.nodeId)) {
        seenTargetIds.add(h.nodeId);
        const node = graph.nodes.find((n) => n.id === h.nodeId);
        if (node) matchedTargets.push(node);
      }
    }
    if (matchedTargets.length >= 3) break;
  }

  // Fallback to primary module or first node if no specific keyword matched
  if (matchedTargets.length === 0) {
    matchedTargets.push(graph.nodes[0]);
  }

  // 2. Trace verified direct and transitive dependents
  const verifiedDirect: ChangeSimulationResult['verifiedDirectDependents'] = [];
  const transitiveList: ChangeSimulationResult['transitiveBlastRadius'] = [];
  const testsToRun: ChangeSimulationResult['testsToExecute'] = [];
  const seenDirectIds = new Set<string>();
  const seenTransitiveIds = new Set<string>();

  for (const target of matchedTargets) {
    const details = getSymbolDetails(graph.repoId, target.id);
    if (details) {
      for (const caller of details.directCallers) {
        if (!seenDirectIds.has(caller.id)) {
          seenDirectIds.add(caller.id);
          verifiedDirect.push({
            id: caller.id,
            label: caller.label,
            type: caller.type,
            filePath: caller.filePath,
            relation: 'Invokes target symbol',
          });
        }
      }

      for (const test of details.tests) {
        testsToRun.push({
          id: test.id,
          label: test.label,
          filePath: test.filePath,
          assertsComponent: target.label,
        });
      }
    }

    // Trace transitive reachable nodes
    const trace = traceDependencies(graph.repoId, target.id, 'upstream', maxDepth);
    if (trace) {
      for (const up of trace.upstream) {
        if (!seenDirectIds.has(up.node.id) && !seenTransitiveIds.has(up.node.id)) {
          seenTransitiveIds.add(up.node.id);
          transitiveList.push({
            id: up.node.id,
            label: up.node.label,
            depth: up.depth,
            path: up.path,
          });
        }
      }
    }

    // Associated test suites
    const relatedTests = findRelatedTests(graph.repoId, target.id);
    for (const tn of relatedTests.testNodes) {
      if (!testsToRun.some((t) => t.id === tn.id)) {
        testsToRun.push({
          id: tn.id,
          label: tn.label,
          filePath: tn.filePath,
          assertsComponent: target.label,
        });
      }
    }
  }

  // 3. Assemble evidence for AI reasoning
  const evidenceList: EvidenceSource[] = [];
  for (const t of matchedTargets) {
    evidenceList.push({
      id: `ev-sim-target-${t.id}`,
      type: 'ast_relation',
      title: `Proposed modification target: ${t.label}`,
      filePath: t.filePath,
      startLine: t.line,
      snippet: t.description || `Target component declared in ${t.filePath}`,
      confidenceScore: 1.0,
    });
  }

  for (const d of verifiedDirect) {
    evidenceList.push({
      id: `ev-sim-direct-${d.id}`,
      type: 'ast_relation',
      title: `Direct dependent: ${d.label}`,
      filePath: d.filePath,
      snippet: `Relies on ${matchedTargets[0]?.label}`,
      confidenceScore: 1.0,
    });
  }

  // 4. Synthesize with Sarvam AI or Deterministic Rules
  let executiveSummary = `Proposed Change Simulation for: "${request.changeDescription}". Targets ${matchedTargets.map((t) => t.label).join(', ')}. Found ${verifiedDirect.length} direct dependents and ${transitiveList.length} transitive consumers. ${testsToRun.length} automated test suite(s) must be executed to verify integrity.`;
  let aiReasoned = false;

  const predictedRisks: ChangeSimulationResult['predictedRisks'] = [
    {
      severity: verifiedDirect.length > 2 ? 'high' : 'medium',
      title: `Interface Contract Breaking Risk (${verifiedDirect.length} direct consumers)`,
      description: `Modifying public exports in ${matchedTargets.map((t) => t.label).join(', ')} may cause compile or runtime regressions in dependent callers.`,
      isEstimate: true,
    },
    {
      severity: testsToRun.length === 0 ? 'critical' : 'low',
      title: testsToRun.length === 0 ? 'Zero Test Coverage Warning' : `${testsToRun.length} Test Suites Require Execution`,
      description:
        testsToRun.length === 0
          ? 'No automated test files cover the target components; verification must rely on manual QA.'
          : `Run: ${testsToRun.map((t) => t.label).join(', ')}.`,
      isEstimate: true,
    },
  ];

  const stepByStepChangePlan: ChangeSimulationResult['stepByStepChangePlan'] = [
    {
      stepNumber: 1,
      title: 'Define or expand regression test suites before changing contract',
      affectedFiles: testsToRun.map((t) => t.filePath).filter(Boolean),
      action: 'Create test fixtures asserting existing behavior and edge cases.',
      verification: 'Run test runner to confirm green baseline.',
    },
    {
      stepNumber: 2,
      title: `Implement change in ${matchedTargets[0]?.label || 'target component'}`,
      affectedFiles: matchedTargets.map((t) => t.filePath),
      action: request.changeDescription,
      verification: 'Verify local types and module exports.',
    },
    {
      stepNumber: 3,
      title: 'Migrate upstream consumers and callers',
      affectedFiles: verifiedDirect.map((d) => d.filePath),
      action: 'Update invocation call-sites to match new parameter contracts.',
      verification: 'Run full test suite across dependents.',
    },
  ];

  if (isSarvamConfigured()) {
    try {
      const aiRes = await querySarvamAI({
        question: `Simulate this proposed code change and predict potential interface breaks, affected files, and recommended plan: ${request.changeDescription}`,
        questionKind: 'change_impact',
        evidence: evidenceList,
        repoName: graph.repoName,
      });

      if (aiRes.success && aiRes.structuredResponse?.answer) {
        executiveSummary = aiRes.structuredResponse.answer;
        aiReasoned = true;
      }
    } catch {
      // Deterministic rules preserved
    }
  }

  return {
    simulationId: `sim-${Date.now()}`,
    repoId: graph.repoId,
    repoName: graph.repoName,
    changeDescription: request.changeDescription,
    proposedApproach: request.proposedApproach,
    timestamp: new Date().toISOString(),
    targetComponents: matchedTargets.map((t) => ({
      id: t.id,
      label: t.label,
      type: t.type,
      filePath: t.filePath,
      line: t.line,
    })),
    verifiedDirectDependents: verifiedDirect,
    transitiveBlastRadius: transitiveList,
    testsToExecute: testsToRun,
    predictedRisks,
    stepByStepChangePlan,
    assumptionsAndLimitations: [
      'Predictions are heuristic engineering estimates based on static AST links; dynamic runtime reflection is not guaranteed.',
      'CodeWhy does not automatically edit repository files; user review and authorization is required.',
      'Transitive reach was computed up to ' + maxDepth + ' hops.',
    ],
    executiveSummary,
    aiReasoned,
  };
}
