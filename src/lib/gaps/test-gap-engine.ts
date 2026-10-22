import { KnowledgeGraph, GraphNode } from '@/types/graph';
import { getRepositoryGraph, getActiveRepositoryGraph } from '@/lib/graph/graph-store';
import { traceDependencies, findRelatedTests } from '@/lib/ask/investigation-tools';
import { querySarvamAI, isSarvamConfigured } from '@/lib/sarvam/sarvam-client';

export interface TestGapItem {
  id: string;
  symbolName: string;
  type: string;
  filePath: string;
  line?: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  callerCount: number;
  callers: string[];
  executionPathDescription: string;
  whyItMatters: string;
  recommendedTestCases: Array<{
    name: string;
    scenario: string;
    edgeCase: string;
    suggestedAssertion: string;
  }>;
  concreteTestCodeTemplate: string;
}

export interface TestGapAnalysisResult {
  repoId: string;
  repoName: string;
  timestamp: string;
  coverageEstimate: {
    totalTestableSymbols: number;
    testedSymbols: number;
    untestedSymbols: number;
    estimatedCoveragePercent: number;
    isCoverageEstimated: true;
  };
  criticalGaps: TestGapItem[];
  aiReasoned: boolean;
}

/**
 * Identifies functions and execution paths that lack automated tests and generates concrete test templates.
 */
export async function analyzeTestGaps(repoId?: string): Promise<TestGapAnalysisResult> {
  const graph = (repoId ? getRepositoryGraph(repoId) : undefined) || getActiveRepositoryGraph();

  const testEdges = graph.edges.filter((e) => e.type === 'tests');
  const testedTargetIds = new Set(testEdges.map((e) => e.target));

  const testableNodes = graph.nodes.filter(
    (n) => (n.type === 'function' || n.type === 'class' || n.type === 'file') && !n.label.includes('test')
  );

  const gaps: TestGapItem[] = [];
  let testedCount = 0;

  for (const node of testableNodes) {
    const isDirectlyTested = testedTargetIds.has(node.id);
    const related = findRelatedTests(graph.repoId, node.id);
    const hasAnyTest = isDirectlyTested || related.testNodes.length > 0;

    if (hasAnyTest) {
      testedCount++;
    } else {
      // Untested symbol — trace callers to evaluate risk
      const trace = traceDependencies(graph.repoId, node.id, 'upstream', 2);
      const callers = trace ? trace.upstream.map((u) => u.node.label) : [];
      const callerCount = callers.length;

      let priority: 'critical' | 'high' | 'medium' | 'low' = 'low';
      if (callerCount >= 3 || node.metadata?.tags?.includes('security') || node.metadata?.tags?.includes('critical')) {
        priority = 'critical';
      } else if (callerCount >= 1 || node.metadata?.isExported) {
        priority = 'high';
      } else {
        priority = 'medium';
      }

      const cleanName = node.label.replace('()', '');

      gaps.push({
        id: `gap-${node.id}`,
        symbolName: node.label,
        type: node.type,
        filePath: node.filePath,
        line: node.line,
        priority,
        callerCount,
        callers: callers.slice(0, 4),
        executionPathDescription:
          callerCount > 0
            ? `Invoked along execution paths by: ${callers.slice(0, 3).join(', ')}`
            : `Exported symbol in ${node.filePath} without incoming caller AST traces`,
        whyItMatters:
          callerCount > 0
            ? `If ${node.label} experiences an unhandled exception or contract shift, ${callerCount} dependent caller(s) will fail transitively.`
            : `Unchecked public module interface risks regression during future refactors.`,
        recommendedTestCases: [
          {
            name: `${cleanName} - Happy Path Execution`,
            scenario: `Assert ${cleanName} completes with valid inputs and expected return shape.`,
            edgeCase: `Pass typical valid arguments.`,
            suggestedAssertion: `expect(result).toBeDefined();`,
          },
          {
            name: `${cleanName} - Edge Case: Null/Empty/Invalid Input`,
            scenario: `Assert ${cleanName} gracefully rejects or handles undefined/null parameters without crashing.`,
            edgeCase: `Pass null, undefined, or empty structures.`,
            suggestedAssertion: `expect(() => ${cleanName}(null as any)).toThrow();`,
          },
          {
            name: `${cleanName} - Caller Integration Boundary`,
            scenario: `Verify contract with upstream callers: ${callers.slice(0, 2).join(', ') || 'dependents'}.`,
            edgeCase: `Simulate caller failure propagation.`,
            suggestedAssertion: `expect(callerHandler()).resolves.toMatchObject(...);`,
          },
        ],
        concreteTestCodeTemplate: `import { describe, it, expect } from 'vitest';
// import { ${cleanName} } from '../${node.filePath.replace(/\.(ts|tsx|js|jsx)$/, '')}';

describe('${cleanName}', () => {
  it('handles valid parameters as expected', () => {
    // const result = ${cleanName}(...);
    // expect(result).toBeDefined();
  });

  it('handles empty or malformed inputs without crashing', () => {
    // expect(() => ${cleanName}(undefined as any)).toThrow();
  });
});`,
      });
    }
  }

  // Sort gaps by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  gaps.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const coveragePercent =
    testableNodes.length > 0
      ? Math.round((testedCount / testableNodes.length) * 100)
      : 0;

  return {
    repoId: graph.repoId,
    repoName: graph.repoName,
    timestamp: new Date().toISOString(),
    coverageEstimate: {
      totalTestableSymbols: testableNodes.length,
      testedSymbols: testedCount,
      untestedSymbols: gaps.length,
      estimatedCoveragePercent: coveragePercent,
      isCoverageEstimated: true,
    },
    criticalGaps: gaps.slice(0, 10),
    aiReasoned: false,
  };
}
