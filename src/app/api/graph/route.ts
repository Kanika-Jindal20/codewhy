import { NextRequest, NextResponse } from 'next/server';
import {
  getRepositoryGraph,
  getAllRepositories,
  SAMPLE_REPO_ECOMMERCE,
} from '@/lib/graph/graph-store';
import {
  getNeighborhood,
  searchGraph,
  getMostConnectedNode,
  deduplicateEdges,
  GRAPH_QUERY_LIMIT,
} from '@/lib/graph/graph-query';
import { GraphQueryResult } from '@/types/architecture';

const DEFAULT_REPO_ID = SAMPLE_REPO_ECOMMERCE.repoId;
const MAX_HOPS = 3;

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const repoId = sp.get('repoId') || DEFAULT_REPO_ID;
    const nodeId = sp.get('nodeId');
    const searchQuery = sp.get('search');
    const hops = Math.min(parseInt(sp.get('hops') ?? '1', 10), MAX_HOPS);
    const limit = Math.min(parseInt(sp.get('limit') ?? '40', 10), GRAPH_QUERY_LIMIT);

    const graph = getRepositoryGraph(repoId) ?? SAMPLE_REPO_ECOMMERCE;

    // --- Meta query: no nodeId or search → return repo overview ---
    if (!nodeId && !searchQuery) {
      const result: GraphQueryResult = {
        nodes: [],
        edges: [],
        totalNodes: graph.nodes.length,
        truncated: false,
        queryType: 'meta',
      };
      return NextResponse.json(
        {
          ...result,
          meta: {
            repoId: graph.repoId,
            repoName: graph.repoName,
            updatedAt: graph.updatedAt,
            nodeCount: graph.nodes.length,
            edgeCount: graph.edges.length,
            nodeTypeBreakdown: countByType(graph.nodes.map(n => n.type)),
            edgeTypeBreakdown: countByType(graph.edges.map(e => e.type)),
            suggestedSeedNodeId: getMostConnectedNode(graph)?.id ?? null,
          },
        },
        { status: 200 }
      );
    }

    // --- Search query ---
    if (searchQuery && !nodeId) {
      const results = searchGraph(graph, searchQuery, limit);
      const nodes = results.map(r => r.node);
      const nodeSet = new Set(nodes.map(n => n.id));
      const edges = deduplicateEdges(
        graph.edges.filter(e => nodeSet.has(e.source) && nodeSet.has(e.target))
      );

      const result: GraphQueryResult = {
        nodes,
        edges,
        totalNodes: graph.nodes.length,
        truncated: results.length >= limit,
        queryType: 'search',
      };
      return NextResponse.json(
        {
          ...result,
          searchMeta: results.map(r => ({
            nodeId: r.node.id,
            score: r.score,
            matchReason: r.matchReason,
          })),
        },
        { status: 200 }
      );
    }

    // --- Neighborhood query ---
    if (nodeId) {
      const nodeExists = graph.nodes.some(n => n.id === nodeId);
      if (!nodeExists) {
        return NextResponse.json(
          {
            error: `Node '${nodeId}' not found in repository '${graph.repoId}'.`,
            availableNodeIds: graph.nodes.map(n => ({ id: n.id, label: n.label })),
          },
          { status: 404 }
        );
      }

      const { nodes, edges, truncated } = getNeighborhood(graph, nodeId, hops, limit);

      const result: GraphQueryResult = {
        nodes,
        edges,
        totalNodes: graph.nodes.length,
        truncated,
        queryType: 'neighborhood',
      };
      return NextResponse.json(result, { status: 200 });
    }

    // Unreachable — but TypeScript needs this
    return NextResponse.json({ error: 'Invalid query parameters.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/graph] Error:', message);
    return NextResponse.json(
      { error: 'Internal server error during graph query.', details: message },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countByType(types: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const t of types) map[t] = (map[t] ?? 0) + 1;
  return map;
}
