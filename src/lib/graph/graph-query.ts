import { KnowledgeGraph, GraphNode, GraphEdge } from '@/types/graph';

/** Maximum number of nodes returned in any single query. */
export const GRAPH_QUERY_LIMIT = 80;

// ---------------------------------------------------------------------------
// Edge deduplication
// ---------------------------------------------------------------------------

/**
 * Produces a canonical key for an edge that is invariant to source/target
 * ordering (for undirected relationships like co_changed) and eliminates
 * exact duplicates.
 */
function edgeKey(edge: GraphEdge): string {
  const [a, b] = [edge.source, edge.target].sort();
  return `${a}::${b}::${edge.type}`;
}

/**
 * Remove duplicate edges from an array, keeping the first occurrence of
 * each canonical (source, target, type) triple.
 */
export function deduplicateEdges(edges: GraphEdge[]): GraphEdge[] {
  const seen = new Set<string>();
  const result: GraphEdge[] = [];
  for (const edge of edges) {
    const key = edgeKey(edge);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(edge);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Neighborhood BFS
// ---------------------------------------------------------------------------

export interface NeighborhoodResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  truncated: boolean;
}

/**
 * BFS expansion from a seed node outward up to `hops` edge traversals.
 * Returns the seed + all reachable nodes within the hop limit, capped at
 * `limit` nodes. Edges are deduplicated.
 *
 * Both incoming and outgoing edges are traversed so the view is bidirectional.
 */
export function getNeighborhood(
  graph: KnowledgeGraph,
  seedNodeId: string,
  hops: number = 1,
  limit: number = GRAPH_QUERY_LIMIT,
): NeighborhoodResult {
  // Fast adjacency lookup
  const nodeMap = new Map<string, GraphNode>(graph.nodes.map(n => [n.id, n]));

  // adjacency: nodeId -> list of { neighborId, edge }
  const adjacency = new Map<string, { neighborId: string; edge: GraphEdge }[]>();
  for (const edge of graph.edges) {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, []);
    adjacency.get(edge.source)!.push({ neighborId: edge.target, edge });
    adjacency.get(edge.target)!.push({ neighborId: edge.source, edge });
  }

  const visitedNodes = new Set<string>();
  const collectedEdges: GraphEdge[] = [];
  const queue: { nodeId: string; depth: number }[] = [{ nodeId: seedNodeId, depth: 0 }];
  visitedNodes.add(seedNodeId);

  while (queue.length > 0 && visitedNodes.size < limit) {
    const current = queue.shift()!;
    if (current.depth >= hops) continue;

    const neighbors = adjacency.get(current.nodeId) ?? [];
    for (const { neighborId, edge } of neighbors) {
      collectedEdges.push(edge);
      if (!visitedNodes.has(neighborId) && visitedNodes.size < limit) {
        visitedNodes.add(neighborId);
        queue.push({ nodeId: neighborId, depth: current.depth + 1 });
      }
    }
  }

  const truncated = visitedNodes.size >= limit && queue.length > 0;

  const nodes: GraphNode[] = [];
  for (const id of visitedNodes) {
    const node = nodeMap.get(id);
    if (node) nodes.push(node);
  }

  // Only include edges where both endpoints are in the result set
  const nodeSet = new Set(nodes.map(n => n.id));
  const filteredEdges = collectedEdges.filter(
    e => nodeSet.has(e.source) && nodeSet.has(e.target),
  );

  return { nodes, edges: deduplicateEdges(filteredEdges), truncated };
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface SearchResult {
  node: GraphNode;
  /** 0–1 relevance score, higher is more relevant. */
  score: number;
  /** Human-readable match rationale. */
  matchReason: string;
}

/**
 * Fuzzy-ish search across node labels, file paths, and descriptions.
 * Returns results sorted by descending relevance, capped at `limit`.
 *
 * Matching priority:
 *  1. Exact label match (score 1.0)
 *  2. Label starts-with match (score 0.85)
 *  3. Label substring match (score 0.7)
 *  4. filePath substring match (score 0.55)
 *  5. description substring match (score 0.4)
 */
export function searchGraph(
  graph: KnowledgeGraph,
  query: string,
  limit: number = 20,
): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchResult[] = [];

  for (const node of graph.nodes) {
    const label = node.label.toLowerCase();
    const filePath = node.filePath.toLowerCase();
    const description = (node.description ?? '').toLowerCase();

    let score = 0;
    let matchReason = '';

    if (label === q) {
      score = 1.0;
      matchReason = 'Exact label match';
    } else if (label.startsWith(q)) {
      score = 0.85;
      matchReason = 'Label starts with query';
    } else if (label.includes(q)) {
      score = 0.7;
      matchReason = 'Label contains query';
    } else if (filePath.includes(q)) {
      score = 0.55;
      matchReason = 'File path contains query';
    } else if (description.includes(q)) {
      score = 0.4;
      matchReason = 'Description contains query';
    }

    if (score > 0) results.push({ node, score, matchReason });
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Seed selection
// ---------------------------------------------------------------------------

/**
 * Choose the best seed node for the initial view — the node with the most
 * edges (highest degree), which tends to be the most architecturally central.
 */
export function getMostConnectedNode(graph: KnowledgeGraph): GraphNode | undefined {
  if (graph.nodes.length === 0) return undefined;

  const degree = new Map<string, number>();
  for (const edge of graph.edges) {
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
  }

  let best = graph.nodes[0];
  let bestDeg = degree.get(best.id) ?? 0;
  for (const node of graph.nodes) {
    const d = degree.get(node.id) ?? 0;
    if (d > bestDeg) { best = node; bestDeg = d; }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Edge count helper
// ---------------------------------------------------------------------------

/** Returns the number of edges incident to each node ID. */
export function buildDegreeMap(edges: GraphEdge[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of edges) {
    map.set(e.source, (map.get(e.source) ?? 0) + 1);
    map.set(e.target, (map.get(e.target) ?? 0) + 1);
  }
  return map;
}
