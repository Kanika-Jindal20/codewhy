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
import { isNeo4jConfigured } from '@/lib/neo4j/config';
import {
  getGraphFromNeo4j,
  getNeighborhoodFromNeo4j,
  searchGraphInNeo4j,
  saveGraphToNeo4j,
} from '@/lib/neo4j/neo4j-graph-service';
import { verifyNeo4jConnection } from '@/lib/neo4j/driver';

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

    // Check if client is requesting health/connection verification
    if (sp.get('action') === 'health') {
      const health = await verifyNeo4jConnection();
      return NextResponse.json({
        neo4j: health,
        isConfigured: isNeo4jConfigured(),
      });
    }

    // Try Neo4j first if configured
    let neo4jActive = false;
    if (isNeo4jConfigured()) {
      const health = await verifyNeo4jConnection();
      neo4jActive = health.connected;
    }

    const localGraph = getRepositoryGraph(repoId) ?? SAMPLE_REPO_ECOMMERCE;

    // --- Meta query: no nodeId or search → return repo overview ---
    if (!nodeId && !searchQuery) {
      if (neo4jActive) {
        const neo4jGraph = await getGraphFromNeo4j(repoId);
        if (neo4jGraph && neo4jGraph.nodes.length > 0) {
          const result: GraphQueryResult = {
            nodes: [],
            edges: [],
            totalNodes: neo4jGraph.nodes.length,
            truncated: false,
            queryType: 'meta',
          };
          return NextResponse.json(
            {
              ...result,
              neo4jConnected: true,
              meta: {
                repoId: neo4jGraph.repoId,
                repoName: neo4jGraph.repoName,
                updatedAt: neo4jGraph.updatedAt,
                nodeCount: neo4jGraph.nodes.length,
                edgeCount: neo4jGraph.edges.length,
                nodeTypeBreakdown: countByType(neo4jGraph.nodes.map(n => n.type)),
                edgeTypeBreakdown: countByType(neo4jGraph.edges.map(e => e.type)),
                suggestedSeedNodeId: getMostConnectedNode(neo4jGraph)?.id ?? null,
              },
            },
            { status: 200 }
          );
        }
      }

      // Local fallback
      const result: GraphQueryResult = {
        nodes: [],
        edges: [],
        totalNodes: localGraph.nodes.length,
        truncated: false,
        queryType: 'meta',
      };
      return NextResponse.json(
        {
          ...result,
          neo4jConnected: neo4jActive,
          meta: {
            repoId: localGraph.repoId,
            repoName: localGraph.repoName,
            updatedAt: localGraph.updatedAt,
            nodeCount: localGraph.nodes.length,
            edgeCount: localGraph.edges.length,
            nodeTypeBreakdown: countByType(localGraph.nodes.map(n => n.type)),
            edgeTypeBreakdown: countByType(localGraph.edges.map(e => e.type)),
            suggestedSeedNodeId: getMostConnectedNode(localGraph)?.id ?? null,
          },
        },
        { status: 200 }
      );
    }

    // --- Search query ---
    if (searchQuery && !nodeId) {
      if (neo4jActive) {
        const neo4jNodes = await searchGraphInNeo4j(repoId, searchQuery, limit);
        if (neo4jNodes) {
          const result: GraphQueryResult = {
            nodes: neo4jNodes,
            edges: [],
            totalNodes: neo4jNodes.length,
            truncated: neo4jNodes.length >= limit,
            queryType: 'search',
          };
          return NextResponse.json(
            {
              ...result,
              neo4jConnected: true,
              searchMeta: neo4jNodes.map(n => ({
                nodeId: n.id,
                score: 1.0,
                matchReason: `Matched in Neo4j index (${n.label})`,
              })),
            },
            { status: 200 }
          );
        }
      }

      // Fallback search
      const results = searchGraph(localGraph, searchQuery, limit);
      const nodes = results.map(r => r.node);
      const nodeSet = new Set(nodes.map(n => n.id));
      const edges = deduplicateEdges(
        localGraph.edges.filter(e => nodeSet.has(e.source) && nodeSet.has(e.target))
      );

      const result: GraphQueryResult = {
        nodes,
        edges,
        totalNodes: localGraph.nodes.length,
        truncated: results.length >= limit,
        queryType: 'search',
      };
      return NextResponse.json(
        {
          ...result,
          neo4jConnected: false,
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
      if (neo4jActive) {
        const neo4jNeighborhood = await getNeighborhoodFromNeo4j(repoId, nodeId, hops, limit);
        if (neo4jNeighborhood && neo4jNeighborhood.nodes.length > 0) {
          const result: GraphQueryResult = {
            nodes: neo4jNeighborhood.nodes,
            edges: neo4jNeighborhood.edges,
            totalNodes: neo4jNeighborhood.nodes.length,
            truncated: neo4jNeighborhood.truncated,
            queryType: 'neighborhood',
          };
          return NextResponse.json(
            {
              ...result,
              neo4jConnected: true,
            },
            { status: 200 }
          );
        }
      }

      // Fallback neighborhood
      const nodeExists = localGraph.nodes.some(n => n.id === nodeId);
      if (!nodeExists) {
        return NextResponse.json(
          {
            error: `Node '${nodeId}' not found in repository '${localGraph.repoId}'.`,
            availableNodeIds: localGraph.nodes.map(n => ({ id: n.id, label: n.label })),
          },
          { status: 404 }
        );
      }

      const { nodes, edges, truncated } = getNeighborhood(localGraph, nodeId, hops, limit);
      const result: GraphQueryResult = {
        nodes,
        edges,
        totalNodes: localGraph.nodes.length,
        truncated,
        queryType: 'neighborhood',
      };
      return NextResponse.json(
        {
          ...result,
          neo4jConnected: false,
        },
        { status: 200 }
      );
    }

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

/**
 * POST /api/graph
 * Allows syncing or indexing a repository graph directly into Neo4j.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, repoId = DEFAULT_REPO_ID, graph } = body;

    if (action === 'seed' || action === 'sync') {
      const targetGraph = graph || getRepositoryGraph(repoId) || SAMPLE_REPO_ECOMMERCE;
      const result = await saveGraphToNeo4j(targetGraph);
      return NextResponse.json({
        action,
        repoId: targetGraph.repoId,
        ...result,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to process graph action.', details: message }, { status: 500 });
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
