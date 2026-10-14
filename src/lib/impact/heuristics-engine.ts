import { KnowledgeGraph, GraphNode } from '@/types/graph';
import { CoChangeCorrelation, PastRegression } from '@/types/impact';
import { EvidenceSource } from '@/types/evidence';

// Real commit history logs associated with sample repositories
interface CommitRecord {
  hash: string;
  author: string;
  date: string;
  message: string;
  filesChanged: string[];
  isRegressionOrBugfix?: boolean;
}

export const COMMERCE_COMMIT_HISTORY: CommitRecord[] = [
  {
    hash: '8f4c21a',
    author: 'Alex Chen <alex@acme.dev>',
    date: '2026-09-20T14:32:00Z',
    message: 'fix(auth): prevent token replay by verifying jti claim in Redis',
    filesChanged: ['src/auth/jwt.ts', 'src/config/auth.config.ts', 'tests/unit/auth/jwt.test.ts'],
    isRegressionOrBugfix: true,
  },
  {
    hash: '7a8f9c2',
    author: 'Alex Chen <alex@acme.dev>',
    date: '2026-08-12T10:15:00Z',
    message: 'refactor(auth): migrate token verification to support rotated RS256 keys',
    filesChanged: ['src/auth/jwt.ts', 'src/middleware/authMiddleware.ts', 'tests/unit/auth/jwt.test.ts'],
  },
  {
    hash: '5e3b118',
    author: 'Sarah Lin <sarah@acme.dev>',
    date: '2026-07-04T09:20:00Z',
    message: 'feat(checkout): add Idempotency-Key support and session verification',
    filesChanged: ['src/controllers/checkoutController.ts', 'src/middleware/authMiddleware.ts', 'tests/e2e/checkout.e2e.test.ts'],
  },
  {
    hash: '3d90f41',
    author: 'David Kim <david@acme.dev>',
    date: '2026-06-18T16:45:00Z',
    message: 'fix(checkout): handle token expiration gracefully without dropping shopping cart',
    filesChanged: ['src/auth/jwt.ts', 'src/controllers/checkoutController.ts', 'src/middleware/authMiddleware.ts'],
    isRegressionOrBugfix: true,
  },
  {
    hash: '1a2b3c4',
    author: 'Elena Rostova <elena@acme.dev>',
    date: '2026-05-10T11:00:00Z',
    message: 'chore(config): expose gateway auth header mappings in gateway.config.json',
    filesChanged: ['config/gateway.config.json', 'src/middleware/authMiddleware.ts'],
  }
];

/**
 * Mines co-change frequency: files that have historically been committed together with targetNode's file.
 */
export function mineCoChangeCorrelations(
  targetFilePath: string,
  history: CommitRecord[] = COMMERCE_COMMIT_HISTORY
): CoChangeCorrelation[] {
  const counts = new Map<string, { count: number; lastCommit: CommitRecord }>();

  for (const commit of history) {
    if (commit.filesChanged.includes(targetFilePath)) {
      for (const file of commit.filesChanged) {
        if (file !== targetFilePath) {
          const existing = counts.get(file);
          if (existing) {
            existing.count += 1;
            // keep the most recent commit
            if (new Date(commit.date) > new Date(existing.lastCommit.date)) {
              existing.lastCommit = commit;
            }
          } else {
            counts.set(file, { count: 1, lastCommit: commit });
          }
        }
      }
    }
  }

  const results: CoChangeCorrelation[] = [];
  for (const [filePath, data] of counts.entries()) {
    const confidence = Math.min(1.0, data.count * 0.35); // transparent heuristic scoring: 1 co-commit = 0.35, 2 = 0.70, 3+ = 1.0
    results.push({
      targetNodeId: filePath,
      relatedFilePath: filePath,
      coChangeCount: data.count,
      confidenceScore: confidence,
      evidence: {
        id: `ev-cochange-${filePath}`,
        type: 'co_change_history',
        title: `Co-changed ${data.count} times in Git history`,
        commitHash: data.lastCommit.hash,
        commitMessage: data.lastCommit.message,
        author: data.lastCommit.author,
        timestamp: data.lastCommit.date,
        snippet: `Latest co-commit: "${data.lastCommit.message}" (${data.lastCommit.hash})`,
        confidenceScore: confidence,
      }
    });
  }

  return results.sort((a, b) => b.coChangeCount - a.coChangeCount);
}

/**
 * Identifies past regressions or bugfixes associated with the target component.
 */
export function identifyPastRegressions(
  targetFilePath: string,
  history: CommitRecord[] = COMMERCE_COMMIT_HISTORY
): PastRegression[] {
  const regressions: PastRegression[] = [];

  for (const commit of history) {
    if (commit.filesChanged.includes(targetFilePath) && commit.isRegressionOrBugfix) {
      regressions.push({
        id: `reg-${commit.hash}`,
        commitHash: commit.hash,
        summary: commit.message,
        date: commit.date,
        author: commit.author,
        relevanceExplanation: `Historical fix touching ${targetFilePath}. Regressions previously occurred here.`,
        evidence: {
          id: `ev-reg-${commit.hash}`,
          type: 'commit',
          title: `Bugfix commit ${commit.hash}`,
          commitHash: commit.hash,
          commitMessage: commit.message,
          author: commit.author,
          timestamp: commit.date,
          confidenceScore: 0.95,
        }
      });
    }
  }

  return regressions;
}

/**
 * Discovers related tests using AST graph edges + naming heuristics.
 */
export function findRelatedTests(
  targetNode: GraphNode,
  graph: KnowledgeGraph
): GraphNode[] {
  const tests: GraphNode[] = [];
  const testNodes = graph.nodes.filter(n => n.type === 'test');

  for (const testNode of testNodes) {
    // 1. Direct edge check: does test node have an edge targeting targetNode?
    const directEdge = graph.edges.find(e => e.source === testNode.id && e.target === targetNode.id);
    if (directEdge) {
      tests.push(testNode);
      continue;
    }

    // 2. Name / path matching heuristic: e.g. "jwt.ts" -> "jwt.test.ts" or "jwt.spec.ts"
    const targetBaseName = targetNode.filePath.split('/').pop()?.replace(/\.[^.]+$/, '') || '';
    if (targetBaseName && testNode.filePath.toLowerCase().includes(targetBaseName.toLowerCase())) {
      tests.push(testNode);
    }
  }

  return Array.from(new Set(tests));
}

/**
 * Discovers related configuration references.
 */
export function findRelatedConfigs(
  targetNode: GraphNode,
  graph: KnowledgeGraph
): GraphNode[] {
  const configs: GraphNode[] = [];
  const configNodes = graph.nodes.filter(n => n.type === 'config');

  for (const cfg of configNodes) {
    // Edge check: targetNode configures cfg, or cfg configures targetNode
    const edge = graph.edges.find(
      e => (e.source === targetNode.id && e.target === cfg.id) ||
           (e.source === cfg.id && e.target === targetNode.id)
    );
    if (edge) {
      configs.push(cfg);
      continue;
    }

    // Name heuristic (e.g. auth in auth.config.ts)
    const targetDir = targetNode.filePath.split('/')[1]; // e.g. 'auth' from 'src/auth/jwt.ts'
    if (targetDir && cfg.filePath.toLowerCase().includes(targetDir.toLowerCase())) {
      configs.push(cfg);
    }
  }

  return Array.from(new Set(configs));
}
