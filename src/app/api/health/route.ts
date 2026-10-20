import { NextResponse } from 'next/server';
import { isNeo4jConfigured } from '@/lib/neo4j/config';
import { verifyNeo4jConnection } from '@/lib/neo4j/driver';
import { isSarvamConfigured, getSarvamModel, getSarvamEndpoint } from '@/lib/sarvam/sarvam-client';
import { getAllRepositories, getActiveRepositoryGraph } from '@/lib/graph/graph-store';

export async function GET() {
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
  const activeGraph = getActiveRepositoryGraph();

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
      sarvamAI: {
        configured: sarvamConfigured,
        model: sarvamModel,
        endpoint: sarvamEndpoint,
        help: sarvamConfigured
          ? 'Sarvam AI 105B reasoning engine active.'
          : 'Set SARVAM_API_KEY in .env to activate real-time 105B LLM architectural reasoning.',
      },
      github: {
        tokenConfigured: Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim().length > 0),
      },
      repositories: {
        totalIndexed: repos.length,
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
