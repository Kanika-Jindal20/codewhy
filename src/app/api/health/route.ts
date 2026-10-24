import { NextRequest, NextResponse } from 'next/server';
import { isNeo4jConfigured } from '@/lib/neo4j/config';
import { verifyNeo4jConnection } from '@/lib/neo4j/driver';
import { isSarvamConfigured, getSarvamModel, getSarvamEndpoint } from '@/lib/sarvam/sarvam-client';
import { getAllRepositories, getActiveRepositoryGraph, getRepositoryGraph } from '@/lib/graph/graph-store';

export async function GET(req: NextRequest) {
  const timestamp = new Date().toISOString();
  let neo4jHealth: {
    connected: boolean;
    serverInfo?: string;
    database?: string;
    error?: string;
  } = {
    connected: false,
    error: 'Neo4j is not configured in environment.',
  };

  if (isNeo4jConfigured()) {
    try {
      neo4jHealth = await verifyNeo4jConnection();
    } catch (err: unknown) {
      neo4jHealth = {
        connected: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  const sarvamConfigured = isSarvamConfigured();
  const sarvamModel = getSarvamModel();
  const sarvamEndpoint = getSarvamEndpoint();

  const repos = getAllRepositories();
  const cookieRepoId = req.cookies.get('codewhy_active_repo_id')?.value;
  const activeGraph = cookieRepoId ? getRepositoryGraph(cookieRepoId) || getActiveRepositoryGraph() : getActiveRepositoryGraph();

  const status = {
    status: 'healthy',
    timestamp,
    services: {
      neo4j: {
        configured: isNeo4jConfigured(),
        connected: neo4jHealth.connected,
        serverInfo: neo4jHealth.serverInfo,
        database: neo4jHealth.database,
        error: neo4jHealth.error,
      },
      sarvam: {
        configured: sarvamConfigured,
        model: sarvamModel,
        endpoint: sarvamEndpoint,
      },
    },
    workspaces: {
      totalRepositories: repos.length,
      repositories: repos,
      active: {
        activeRepoId: activeGraph.repoId,
        activeRepoName: activeGraph.repoName,
        activeNodeCount: activeGraph.nodes.length,
        activeEdgeCount: activeGraph.edges.length,
        isDemo: Boolean(activeGraph.isDemo),
      },
    },
  };

  return NextResponse.json(status, { status: 200 });
}
