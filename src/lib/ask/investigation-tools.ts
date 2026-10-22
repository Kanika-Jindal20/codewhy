import { getRepositoryGraph, getActiveRepositoryGraph } from '@/lib/graph/graph-store';
import { GraphNode, GraphEdge, KnowledgeGraph } from '@/types/graph';
import { EvidenceSource } from '@/types/evidence';

export interface CodeSearchResult {
  nodeId: string;
  label: string;
  type: string;
  filePath: string;
  line?: number;
  description?: string;
  score: number;
  snippet?: string;
}

export interface SymbolDetailsResult {
  node: GraphNode;
  incomingEdges: GraphEdge[];
  outgoingEdges: GraphEdge[];
  directCallers: GraphNode[];
  directCallees: GraphNode[];
  tests: GraphNode[];
}

export interface DependencyTraceResult {
  centerNode: GraphNode;
  upstream: Array<{ node: GraphNode; depth: number; path: string[] }>;
  downstream: Array<{ node: GraphNode; depth: number; path: string[] }>;
  circularPaths: string[][];
}

export interface RelatedTestsResult {
  targetNode?: GraphNode;
  testNodes: GraphNode[];
  testFilePaths: string[];
}

export interface FileInspectionResult {
  filePath: string;
  lines: string[];
  startLine: number;
  endLine: number;
  totalLines: number;
  symbolsInFile: GraphNode[];
}

export interface CommitHistoryResult {
  filePath?: string;
  commits: Array<{
    hash: string;
    message: string;
    author: string;
    timestamp: string;
  }>;
}

/**
 * Tool 1: searchCode
 * Searches symbols, file paths, and snippets across the repository graph.
 */
export function searchCode(
  repoId: string,
  query: string,
  limit: number = 10
): CodeSearchResult[] {
  const graph = getRepositoryGraph(repoId) || getActiveRepositoryGraph();
  if (!graph || !query || !query.trim()) return [];

  const rawQuery = query.trim().toLowerCase();
  const queryTokens = rawQuery
    .split(/[^a-zA-Z0-9_]+/)
    .filter(t => t.length > 1);

  const results: CodeSearchResult[] = [];

  for (const node of graph.nodes) {
    let score = 0;
    const labelLower = node.label.toLowerCase();
    const pathLower = (node.filePath || '').toLowerCase();
    const descLower = (node.description || '').toLowerCase();
    const snippet = node.evidence?.[0]?.snippet || '';
    const snippetLower = snippet.toLowerCase();

    // Exact label match
    if (labelLower === rawQuery || labelLower === `${rawQuery}()`) {
      score += 100;
    } else if (labelLower.includes(rawQuery)) {
      score += 50;
    }

    // Path match
    if (pathLower.endsWith(rawQuery) || pathLower.includes(`/${rawQuery}`)) {
      score += 40;
    } else if (pathLower.includes(rawQuery)) {
      score += 20;
    }

    // Token matching
    for (const token of queryTokens) {
      if (labelLower.includes(token)) score += 15;
      if (pathLower.includes(token)) score += 10;
      if (descLower.includes(token)) score += 5;
      if (snippetLower.includes(token)) score += 8;
    }

    if (score > 0) {
      results.push({
        nodeId: node.id,
        label: node.label,
        type: node.type,
        filePath: node.filePath || '',
        line: node.line,
        description: node.description,
        score,
        snippet: snippet.slice(0, 300),
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Tool 2: getSymbolDetails
 * Retrieves full AST details, callers, callees, and test links for a symbol.
 */
export function getSymbolDetails(
  repoId: string,
  symbolIdOrName: string
): SymbolDetailsResult | null {
  const graph = getRepositoryGraph(repoId) || getActiveRepositoryGraph();
  if (!graph || !symbolIdOrName) return null;

  const target = graph.nodes.find(
    n =>
      n.id === symbolIdOrName ||
      n.label.toLowerCase() === symbolIdOrName.toLowerCase() ||
      n.label.toLowerCase() === `${symbolIdOrName.toLowerCase()}()` ||
      n.filePath.toLowerCase().endsWith(symbolIdOrName.toLowerCase())
  );

  if (!target) return null;

  const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));

  // Incoming edges (callers, importers)
  const incomingEdges = graph.edges.filter(e => e.target === target.id);
  const outgoingEdges = graph.edges.filter(e => e.source === target.id);

  const directCallers = incomingEdges
    .map(e => nodeMap.get(e.source))
    .filter((n): n is GraphNode => Boolean(n));

  const directCallees = outgoingEdges
    .map(e => nodeMap.get(e.target))
    .filter((n): n is GraphNode => Boolean(n));

  // Find linked tests
  const tests = incomingEdges
    .filter(e => e.type === 'tests')
    .map(e => nodeMap.get(e.source))
    .filter((n): n is GraphNode => Boolean(n));

  return {
    node: target,
    incomingEdges,
    outgoingEdges,
    directCallers,
    directCallees,
    tests,
  };
}

/**
 * Tool 3: traceDependencies
 * Multi-hop dependency traversal (upstream callers or downstream dependencies) with cycle detection.
 */
export function traceDependencies(
  repoId: string,
  symbolId: string,
  direction: 'upstream' | 'downstream' | 'both' = 'both',
  maxDepth: number = 3
): DependencyTraceResult | null {
  const graph = getRepositoryGraph(repoId) || getActiveRepositoryGraph();
  if (!graph) return null;

  const centerNode = graph.nodes.find(
    n => n.id === symbolId || n.label.toLowerCase().includes(symbolId.toLowerCase())
  );
  if (!centerNode) return null;

  const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));
  const upstreamResults: Array<{ node: GraphNode; depth: number; path: string[] }> = [];
  const downstreamResults: Array<{ node: GraphNode; depth: number; path: string[] }> = [];
  const circularPaths: string[][] = [];

  // Upstream traversal (who depends on center)
  if (direction === 'upstream' || direction === 'both') {
    const visited = new Set<string>();
    const queue: Array<{ id: string; depth: number; path: string[] }> = [
      { id: centerNode.id, depth: 0, path: [centerNode.label] },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth >= maxDepth) continue;

      const incoming = graph.edges.filter(e => e.target === current.id);
      for (const edge of incoming) {
        const caller = nodeMap.get(edge.source);
        if (!caller) continue;

        if (current.path.includes(caller.label)) {
          circularPaths.push([...current.path, caller.label]);
          continue;
        }

        if (!visited.has(caller.id)) {
          visited.add(caller.id);
          const nextDepth = current.depth + 1;
          const nextPath = [...current.path, caller.label];
          upstreamResults.push({ node: caller, depth: nextDepth, path: nextPath });
          queue.push({ id: caller.id, depth: nextDepth, path: nextPath });
        }
      }
    }
  }

  // Downstream traversal (what center depends on)
  if (direction === 'downstream' || direction === 'both') {
    const visited = new Set<string>();
    const queue: Array<{ id: string; depth: number; path: string[] }> = [
      { id: centerNode.id, depth: 0, path: [centerNode.label] },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth >= maxDepth) continue;

      const outgoing = graph.edges.filter(e => e.source === current.id);
      for (const edge of outgoing) {
        const callee = nodeMap.get(edge.target);
        if (!callee) continue;

        if (current.path.includes(callee.label)) {
          circularPaths.push([...current.path, callee.label]);
          continue;
        }

        if (!visited.has(callee.id)) {
          visited.add(callee.id);
          const nextDepth = current.depth + 1;
          const nextPath = [...current.path, callee.label];
          downstreamResults.push({ node: callee, depth: nextDepth, path: nextPath });
          queue.push({ id: callee.id, depth: nextDepth, path: nextPath });
        }
      }
    }
  }

  return {
    centerNode,
    upstream: upstreamResults,
    downstream: downstreamResults,
    circularPaths,
  };
}

/**
 * Tool 4: findRelatedTests
 * Discovers automated test suites asserting the given component.
 */
export function findRelatedTests(
  repoId: string,
  symbolIdOrPath: string
): RelatedTestsResult {
  const graph = getRepositoryGraph(repoId) || getActiveRepositoryGraph();
  if (!graph) return { testNodes: [], testFilePaths: [] };

  const target = graph.nodes.find(
    n =>
      n.id === symbolIdOrPath ||
      n.filePath.toLowerCase().includes(symbolIdOrPath.toLowerCase()) ||
      n.label.toLowerCase().includes(symbolIdOrPath.toLowerCase())
  );

  const testNodes: GraphNode[] = [];
  const testFilePaths = new Set<string>();

  if (target) {
    // 1. Direct 'tests' edges
    const incomingTests = graph.edges.filter(
      e => e.target === target.id && e.type === 'tests'
    );
    const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));
    for (const edge of incomingTests) {
      const testNode = nodeMap.get(edge.source);
      if (testNode) {
        testNodes.push(testNode);
        if (testNode.filePath) testFilePaths.add(testNode.filePath);
      }
    }

    // 2. Name convention heuristic
    const baseName = target.filePath.split('/').pop()?.replace(/\.[^.]+$/, '') || target.label;
    for (const node of graph.nodes) {
      if (node.type === 'test' && node.filePath) {
        if (node.filePath.toLowerCase().includes(baseName.toLowerCase())) {
          if (!testNodes.some(tn => tn.id === node.id)) {
            testNodes.push(node);
            testFilePaths.add(node.filePath);
          }
        }
      }
    }
  }

  return {
    targetNode: target,
    testNodes,
    testFilePaths: Array.from(testFilePaths),
  };
}

/**
 * Tool 5: inspectFile
 * Reads snippet and symbols inside a specific file path.
 */
export function inspectFile(
  repoId: string,
  filePath: string,
  startLine: number = 1,
  endLine: number = 80
): FileInspectionResult | null {
  const graph = getRepositoryGraph(repoId) || getActiveRepositoryGraph();
  if (!graph || !filePath) return null;

  const normTarget = filePath.replace(/\\/g, '/').toLowerCase();
  const fileNode = graph.nodes.find(
    n => n.type === 'file' && (n.filePath.toLowerCase() === normTarget || n.filePath.toLowerCase().endsWith(normTarget))
  );

  const snippet = fileNode?.evidence?.[0]?.snippet || '';
  const lines = snippet.split('\n');
  const symbolsInFile = graph.nodes.filter(
    n => n.id !== fileNode?.id && n.filePath.toLowerCase() === (fileNode?.filePath || normTarget).toLowerCase()
  );

  return {
    filePath: fileNode?.filePath || filePath,
    lines: lines.slice(startLine - 1, endLine),
    startLine,
    endLine: Math.min(lines.length, endLine),
    totalLines: fileNode?.metadata?.loc || lines.length,
    symbolsInFile,
  };
}

/**
 * Tool 6: getCommitHistory
 * Retrieves commit history associated with a file or the whole repository.
 */
export function getCommitHistory(
  repoId: string,
  filePath?: string
): CommitHistoryResult {
  const graph = getRepositoryGraph(repoId) || getActiveRepositoryGraph();
  if (!graph) return { commits: [] };

  const commits: CommitHistoryResult['commits'] = [];
  const commitNodes = graph.nodes.filter(n => n.type === 'commit');

  if (commitNodes.length > 0) {
    for (const cn of commitNodes) {
      commits.push({
        hash: cn.metadata?.signature || cn.label.replace('Commit ', ''),
        message: cn.description || '',
        author: 'Repository Committer',
        timestamp: graph.updatedAt,
      });
    }
  } else {
    // Gather from evidence attached to nodes
    const seenHashes = new Set<string>();
    for (const node of graph.nodes) {
      if (filePath && node.filePath !== filePath) continue;
      for (const ev of node.evidence || []) {
        if (ev.commitHash && !seenHashes.has(ev.commitHash)) {
          seenHashes.add(ev.commitHash);
          commits.push({
            hash: ev.commitHash,
            message: ev.commitMessage || ev.title || 'Commit',
            author: ev.author || 'Contributor',
            timestamp: ev.timestamp || graph.updatedAt,
          });
        }
      }
    }
  }

  return {
    filePath,
    commits: commits.slice(0, 10),
  };
}
