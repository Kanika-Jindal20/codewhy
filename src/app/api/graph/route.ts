import { NextRequest, NextResponse } from 'next/server';
import {
  getRepositoryGraph,
  getActiveRepositoryGraph,
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

const MAX_HOPS = 3;

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const rawRepoId = sp.get('repoId')?.trim() || req.cookies.get('codewhy_active_repo_id')?.value || req.headers.get('x-active-repo-id')?.trim();
    const nodeId = sp.get('nodeId')?.trim();
    const searchQuery = sp.get('search')?.trim();
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
      try {
        const health = await verifyNeo4jConnection();
        neo4jActive = Boolean(health?.connected);
      } catch {
        neo4jActive = false;
      }
    }

    // Resolve repository graph with robust active fallback
    const localGraph = (rawRepoId ? getRepositoryGraph(rawRepoId) : undefined) || getActiveRepositoryGraph();
    const repoId = localGraph.repoId;

    // --- Search query ---
    if (searchQuery && !nodeId) {
      if (neo4jActive) {
        try {
          const neo4jNodes = await searchGraphInNeo4j(repoId, searchQuery, limit);
          if (neo4jNodes && neo4jNodes.length > 0) {
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
        } catch (neo4jErr) {
          console.warn('[/api/graph] Neo4j search error, falling back:', neo4jErr);
        }
      }

      // Fallback local search
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

    // --- Neighborhood query or Initial Seed query ---
    // If nodeId is not specified or not found in current repo, fall back safely to most connected seed node
    let targetNodeId = nodeId;
    const targetNodeExists = targetNodeId ? localGraph.nodes.some(n => n.id === targetNodeId) : false;

    if (!targetNodeExists) {
      const seed = getMostConnectedNode(localGraph);
      targetNodeId = seed?.id || localGraph.nodes[0]?.id;
    }

    if (!targetNodeId || localGraph.nodes.length === 0) {
      return NextResponse.json(
        {
          nodes: [],
          edges: [],
          totalNodes: 0,
          truncated: false,
          queryType: 'neighborhood',
          neo4jConnected: neo4jActive,
        },
        { status: 200 }
      );
    }

    // Try Neo4j neighborhood
    if (neo4jActive) {
      try {
        const neo4jNeighborhood = await getNeighborhoodFromNeo4j(repoId, targetNodeId, hops, limit);
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
      } catch (neo4jErr) {
        console.warn('[/api/graph] Neo4j neighborhood error, falling back:', neo4jErr);
      }
    }

    // Local graph neighborhood traversal
    const { nodes, edges, truncated } = getNeighborhood(localGraph, targetNodeId, hops, limit);
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
    const { action, repoId, graph } = body;

    if (action === 'seed' || action === 'sync') {
      const targetGraph = graph || (repoId ? getRepositoryGraph(repoId) : undefined) || getActiveRepositoryGraph();
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
