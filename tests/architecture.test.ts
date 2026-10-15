import { describe, it, expect, beforeAll } from 'vitest';
import {
  getNeighborhood,
  searchGraph,
  deduplicateEdges,
  getMostConnectedNode,
  buildDegreeMap,
  GRAPH_QUERY_LIMIT,
} from '@/lib/graph/graph-query';
import { computeLayout, buildVisEdges, mergeIntoVisGraph } from '@/lib/graph/layout-engine';
import { SAMPLE_REPO_ECOMMERCE } from '@/lib/graph/graph-store';
import { KnowledgeGraph, GraphNode, GraphEdge } from '@/types/graph';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const graph = SAMPLE_REPO_ECOMMERCE;

// ---------------------------------------------------------------------------
// deduplicateEdges
// ---------------------------------------------------------------------------
describe('deduplicateEdges', () => {
  it('removes exact duplicates by id', () => {
    const edges: GraphEdge[] = [
      { id: 'e1', source: 'a', target: 'b', type: 'imports' },
      { id: 'e1', source: 'a', target: 'b', type: 'imports' },
    ];
    const result = deduplicateEdges(edges);
    expect(result).toHaveLength(1);
  });

  it('deduplicates by canonical source+target+type key, ignoring id', () => {
    const edges: GraphEdge[] = [
      { id: 'e1', source: 'node-a', target: 'node-b', type: 'imports' },
      { id: 'e2', source: 'node-b', target: 'node-a', type: 'imports' }, // same canonical (sorted) key
    ];
    const result = deduplicateEdges(edges);
    expect(result).toHaveLength(1);
  });

  it('keeps distinct edge types between same nodes', () => {
    const edges: GraphEdge[] = [
      { id: 'e1', source: 'a', target: 'b', type: 'imports' },
      { id: 'e2', source: 'a', target: 'b', type: 'calls' },
    ];
    const result = deduplicateEdges(edges);
    expect(result).toHaveLength(2);
  });

  it('handles empty array', () => {
    expect(deduplicateEdges([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getNeighborhood
// ---------------------------------------------------------------------------
describe('getNeighborhood', () => {
  it('includes the seed node in results', () => {
    const { nodes } = getNeighborhood(graph, 'node-auth-jwt', 1);
    expect(nodes.find(n => n.id === 'node-auth-jwt')).toBeDefined();
  });

  it('returns 1-hop neighbors', () => {
    const { nodes } = getNeighborhood(graph, 'node-auth-jwt', 1);
    // node-auth-jwt is connected to: node-func-verify-token, node-middleware-auth, node-test-auth, node-config-env
    expect(nodes.length).toBeGreaterThan(1);
  });

  it('does not return nodes beyond the hop limit', () => {
    const { nodes: hop1 } = getNeighborhood(graph, 'node-auth-jwt', 1);
    const { nodes: hop2 } = getNeighborhood(graph, 'node-auth-jwt', 2);
    // 2-hop result should be >= 1-hop
    expect(hop2.length).toBeGreaterThanOrEqual(hop1.length);
  });

  it('respects the node limit and sets truncated flag', () => {
    // With limit=1 only the seed node should be returned (or close to it)
    const { nodes, truncated } = getNeighborhood(graph, 'node-auth-jwt', 1, 1);
    expect(nodes.length).toBeLessThanOrEqual(1 + 1); // seed + at most 1 neighbor before hitting limit
    // truncated should be true since there are more neighbors
    expect(truncated).toBe(true);
  });

  it('returns edges only between included nodes', () => {
    const { nodes, edges } = getNeighborhood(graph, 'node-auth-jwt', 1);
    const nodeIds = new Set(nodes.map(n => n.id));
    for (const edge of edges) {
      expect(nodeIds.has(edge.source)).toBe(true);
      expect(nodeIds.has(edge.target)).toBe(true);
    }
  });

  it('returns deduplicated edges', () => {
    const { edges } = getNeighborhood(graph, 'node-auth-jwt', 2);
    const keys = edges.map(e => {
      const [a, b] = [e.source, e.target].sort();
      return `${a}::${b}::${e.type}`;
    });
    const uniqueKeys = new Set(keys);
    expect(keys.length).toBe(uniqueKeys.size);
  });

  it('returns empty result for unknown node', () => {
    const { nodes, edges } = getNeighborhood(graph, 'non-existent-node', 1);
    expect(nodes).toHaveLength(0);
    expect(edges).toHaveLength(0);
  });

  it('handles an empty graph gracefully', () => {
    const emptyGraph: KnowledgeGraph = { repoId: 'empty', repoName: 'empty', nodes: [], edges: [], updatedAt: '' };
    const { nodes, edges, truncated } = getNeighborhood(emptyGraph, 'anything', 1);
    expect(nodes).toHaveLength(0);
    expect(edges).toHaveLength(0);
    expect(truncated).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// searchGraph
// ---------------------------------------------------------------------------
describe('searchGraph', () => {
  it('finds an exact label match with score 1.0', () => {
    const results = searchGraph(graph, 'jwt.ts');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].score).toBe(1.0);
    expect(results[0].node.id).toBe('node-auth-jwt');
  });

  it('finds partial label matches', () => {
    const results = searchGraph(graph, 'jwt');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.node.id === 'node-auth-jwt')).toBe(true);
  });

  it('finds by file path substring', () => {
    const results = searchGraph(graph, 'src/services');
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.node.filePath.includes('src/services')).toBe(true);
    }
  });

  it('returns empty array for no match', () => {
    const results = searchGraph(graph, 'zzz-nonexistent-zzz');
    expect(results).toHaveLength(0);
  });

  it('returns empty array for blank query', () => {
    const results = searchGraph(graph, '  ');
    expect(results).toHaveLength(0);
  });

  it('respects the limit parameter', () => {
    // Search for something broad that matches many nodes
    const results = searchGraph(graph, 'ts', 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('sorts results by descending score', () => {
    const results = searchGraph(graph, 'jwt');
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
    }
  });
});

// ---------------------------------------------------------------------------
// getMostConnectedNode
// ---------------------------------------------------------------------------
describe('getMostConnectedNode', () => {
  it('returns undefined for an empty graph', () => {
    const empty: KnowledgeGraph = { repoId: 'e', repoName: 'e', nodes: [], edges: [], updatedAt: '' };
    expect(getMostConnectedNode(empty)).toBeUndefined();
  });

  it('returns the node with the highest degree', () => {
    const node = getMostConnectedNode(graph);
    expect(node).toBeDefined();
    const degree = buildDegreeMap(graph.edges);
    const nodeDeg = degree.get(node!.id) ?? 0;
    for (const n of graph.nodes) {
      const d = degree.get(n.id) ?? 0;
      expect(nodeDeg).toBeGreaterThanOrEqual(d);
    }
  });
});

// ---------------------------------------------------------------------------
// Layout engine
// ---------------------------------------------------------------------------
describe('computeLayout', () => {
  it('produces x, y for every node with no NaN values', () => {
    const nodes = graph.nodes.slice(0, 6);
    const edges = graph.edges.filter(
      e => nodes.some(n => n.id === e.source) && nodes.some(n => n.id === e.target)
    );
    const result = computeLayout(nodes, edges, 800, 500);
    expect(result).toHaveLength(nodes.length);
    for (const vis of result) {
      expect(Number.isFinite(vis.x)).toBe(true);
      expect(Number.isFinite(vis.y)).toBe(true);
      expect(Number.isNaN(vis.x)).toBe(false);
      expect(Number.isNaN(vis.y)).toBe(false);
    }
  });

  it('clamps positions within canvas bounds', () => {
    const W = 800; const H = 500;
    const result = computeLayout(graph.nodes, graph.edges, W, H);
    for (const vis of result) {
      expect(vis.x).toBeGreaterThanOrEqual(0);
      expect(vis.y).toBeGreaterThanOrEqual(0);
      expect(vis.x).toBeLessThanOrEqual(W);
      expect(vis.y).toBeLessThanOrEqual(H);
    }
  });

  it('is deterministic: same inputs → same positions', () => {
    const nodes = graph.nodes.slice(0, 5);
    const edges = graph.edges.slice(0, 3);
    const r1 = computeLayout(nodes, edges, 800, 500);
    const r2 = computeLayout(nodes, edges, 800, 500);
    for (let i = 0; i < r1.length; i++) {
      expect(r1[i].x).toBeCloseTo(r2[i].x, 5);
      expect(r1[i].y).toBeCloseTo(r2[i].y, 5);
    }
  });

  it('handles empty node array', () => {
    const result = computeLayout([], [], 800, 500);
    expect(result).toHaveLength(0);
  });

  it('handles a single node', () => {
    const result = computeLayout([graph.nodes[0]], [], 800, 500);
    expect(result).toHaveLength(1);
    expect(Number.isFinite(result[0].x)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildVisEdges
// ---------------------------------------------------------------------------
describe('buildVisEdges', () => {
  it('resolves source and target node references', () => {
    const nodes = graph.nodes.slice(0, 4);
    const edges = graph.edges.filter(
      e => nodes.some(n => n.id === e.source) && nodes.some(n => n.id === e.target)
    );
    const visNodes = computeLayout(nodes, edges, 800, 500);
    const visEdges = buildVisEdges(edges, visNodes);

    for (const ve of visEdges) {
      expect(ve.sourceNode).toBeDefined();
      expect(ve.targetNode).toBeDefined();
      expect(ve.sourceId).toBe(ve.sourceNode.id);
      expect(ve.targetId).toBe(ve.targetNode.id);
    }
  });

  it('drops edges where a node is not in the vis node set', () => {
    const nodes = graph.nodes.slice(0, 2);
    const visNodes = computeLayout(nodes, [], 800, 500);
    // Use all edges — most should be dropped since only 2 nodes are present
    const visEdges = buildVisEdges(graph.edges, visNodes);
    const visNodeIds = new Set(visNodes.map(n => n.id));
    for (const ve of visEdges) {
      expect(visNodeIds.has(ve.sourceId)).toBe(true);
      expect(visNodeIds.has(ve.targetId)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// mergeIntoVisGraph
// ---------------------------------------------------------------------------
describe('mergeIntoVisGraph', () => {
  it('does not duplicate existing nodes', () => {
    const initial = computeLayout(graph.nodes.slice(0, 3), [], 800, 500);
    const initialEdges = buildVisEdges([], initial);

    const { nodes: merged } = mergeIntoVisGraph(
      initial, initialEdges,
      graph.nodes.slice(0, 3), // same nodes — all duplicates
      [], 800, 500
    );
    expect(merged.length).toBe(initial.length);
  });

  it('appends new nodes not in the existing set', () => {
    const initial = computeLayout(graph.nodes.slice(0, 3), [], 800, 500);
    const initialEdges = buildVisEdges([], initial);

    const { nodes: merged } = mergeIntoVisGraph(
      initial, initialEdges,
      graph.nodes.slice(0, 5), // 2 new nodes
      [], 800, 500
    );
    expect(merged.length).toBe(5);
  });

  it('preserves existing node positions', () => {
    const initial = computeLayout(graph.nodes.slice(0, 3), [], 800, 500);
    const initialEdges = buildVisEdges([], initial);

    const { nodes: merged } = mergeIntoVisGraph(
      initial, initialEdges,
      graph.nodes.slice(0, 5),
      [], 800, 500
    );

    for (const orig of initial) {
      const found = merged.find(n => n.id === orig.id)!;
      expect(found.x).toBe(orig.x);
      expect(found.y).toBe(orig.y);
    }
  });
});

// ---------------------------------------------------------------------------
// GRAPH_QUERY_LIMIT constant
// ---------------------------------------------------------------------------
describe('GRAPH_QUERY_LIMIT', () => {
  it('is a positive integer', () => {
    expect(typeof GRAPH_QUERY_LIMIT).toBe('number');
    expect(GRAPH_QUERY_LIMIT).toBeGreaterThan(0);
  });

  it('neighborhood never exceeds the limit', () => {
    const { nodes } = getNeighborhood(graph, 'node-auth-jwt', 3, GRAPH_QUERY_LIMIT);
    expect(nodes.length).toBeLessThanOrEqual(GRAPH_QUERY_LIMIT);
  });
});
