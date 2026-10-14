import { describe, it, expect } from 'vitest';
import { traverseImpactPaths } from '@/lib/impact/graph-traversal';
import { 
  mineCoChangeCorrelations, 
  identifyPastRegressions, 
  findRelatedTests, 
  findRelatedConfigs 
} from '@/lib/impact/heuristics-engine';
import { analyzeChangeImpact } from '@/lib/impact/impact-service';
import { SAMPLE_REPO_ECOMMERCE } from '@/lib/graph/graph-store';
import { KnowledgeGraph } from '@/types/graph';

describe('Graph Traversal for Impact Analysis', () => {
  it('correctly finds direct dependents of a target component', () => {
    // node-auth-jwt is imported directly by authMiddleware.ts
    const result = traverseImpactPaths(SAMPLE_REPO_ECOMMERCE, 'node-auth-jwt', 4);

    expect(result.targetNode.id).toBe('node-auth-jwt');
    const directDependentIds = result.directDependents.map(d => d.id);
    expect(directDependentIds).toContain('node-middleware-auth');
  });

  it('correctly discovers transitive reverse consumers across multiple hops', () => {
    // Flow: checkoutController -> authMiddleware -> jwt.ts
    // Therefore, checkoutController is a transitive consumer of jwt.ts
    const result = traverseImpactPaths(SAMPLE_REPO_ECOMMERCE, 'node-auth-jwt', 4);

    const transitiveIds = result.transitiveConsumers.map(t => t.node.id);
    expect(transitiveIds).toContain('node-controller-checkout');

    const checkoutPath = result.transitiveConsumers.find(t => t.node.id === 'node-controller-checkout')?.path;
    expect(checkoutPath).toBeDefined();
    expect(checkoutPath?.hops).toBe(2);
    expect(checkoutPath?.description).toContain('checkoutController.ts ➔ consumes ➔ authMiddleware.ts');
  });

  it('safely handles cyclical graphs without infinite recursion', () => {
    const cyclicGraph: KnowledgeGraph = {
      repoId: 'cyclic-test',
      repoName: 'cyclic-repo',
      updatedAt: '2026-10-14T00:00:00Z',
      nodes: [
        { id: 'A', label: 'A.ts', type: 'file', filePath: 'A.ts' },
        { id: 'B', label: 'B.ts', type: 'file', filePath: 'B.ts' },
        { id: 'C', label: 'C.ts', type: 'file', filePath: 'C.ts' },
      ],
      edges: [
        { id: 'e1', source: 'B', target: 'A', type: 'imports' },
        { id: 'e2', source: 'C', target: 'B', type: 'imports' },
        { id: 'e3', source: 'A', target: 'C', type: 'imports' }, // Cycle: A -> C -> B -> A
      ]
    };

    // Traversal on A should terminate safely without call stack overflow
    const result = traverseImpactPaths(cyclicGraph, 'A', 5);
    expect(result.directDependents.map(d => d.id)).toContain('B');
    expect(result.transitiveConsumers.length).toBeGreaterThan(0);
  });

  it('respects maxDepth limits', () => {
    const result = traverseImpactPaths(SAMPLE_REPO_ECOMMERCE, 'node-auth-jwt', 1);
    // At depth 1, no transitive consumers beyond direct should be expanded
    const hops = result.transitiveConsumers.map(t => t.path.hops);
    for (const h of hops) {
      expect(h).toBeLessThanOrEqual(1);
    }
  });
});

describe('Heuristics Engine', () => {
  it('mines co-change correlations from commit history', () => {
    const correlations = mineCoChangeCorrelations('src/auth/jwt.ts');
    expect(correlations.length).toBeGreaterThan(0);
    // authMiddleware.ts and jwt.test.ts are frequently committed with jwt.ts
    const paths = correlations.map(c => c.relatedFilePath);
    expect(paths).toContain('src/middleware/authMiddleware.ts');
  });

  it('identifies past bugfixes and regressions touching the target', () => {
    const regressions = identifyPastRegressions('src/auth/jwt.ts');
    expect(regressions.length).toBeGreaterThanOrEqual(1);
    expect(regressions[0].commitHash).toBeDefined();
    expect(regressions[0].evidence.confidenceScore).toBeGreaterThan(0.9);
  });

  it('matches related tests for a component', () => {
    const targetNode = SAMPLE_REPO_ECOMMERCE.nodes.find(n => n.id === 'node-auth-jwt')!;
    const tests = findRelatedTests(targetNode, SAMPLE_REPO_ECOMMERCE);
    expect(tests.length).toBeGreaterThan(0);
    expect(tests.map(t => t.id)).toContain('node-test-auth');
  });

  it('matches related config files', () => {
    const targetNode = SAMPLE_REPO_ECOMMERCE.nodes.find(n => n.id === 'node-auth-jwt')!;
    const configs = findRelatedConfigs(targetNode, SAMPLE_REPO_ECOMMERCE);
    expect(configs.length).toBeGreaterThan(0);
    expect(configs.map(c => c.id)).toContain('node-config-env');
  });
});

describe('Impact Analysis Service', () => {
  it('produces an evidence-grounded impact analysis for breaking changes', () => {
    const result = analyzeChangeImpact(SAMPLE_REPO_ECOMMERCE, {
      repoId: 'repo-commerce-core',
      targetNodeId: 'node-auth-jwt',
      changeCategory: 'breaking_interface',
      proposedChangeDescription: 'Change verifySessionToken() to return a Promise<Result<UserSession>> and accept options',
    });

    expect(result.selectedComponent.id).toBe('node-auth-jwt');
    expect(result.summary.totalAffected).toBeGreaterThan(0);
    expect(result.summary.directCount).toBeGreaterThan(0);

    // Direct dependent should have High severity due to breaking interface
    const directDep = result.affectedComponents.find(c => c.isDirect);
    expect(directDep).toBeDefined();
    expect(directDep?.severity).toBe('high');
    expect(directDep?.severityReason).toContain('breaking interface change');

    // Risks and limitations must be documented
    expect(result.potentialRisks.length).toBeGreaterThan(0);
    expect(result.manualVerificationAreas.length).toBeGreaterThan(0);
    expect(result.limitations.length).toBeGreaterThan(0);

    // Three-way separation must be explicit
    expect(result.separation.staticAnalysis.length).toBeGreaterThan(0);
    expect(result.separation.heuristicSuggestions.length).toBeGreaterThan(0);
    expect(result.separation.aiInterpretations.length).toBeGreaterThan(0);
  });
});
