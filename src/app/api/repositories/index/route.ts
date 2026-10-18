import { NextRequest, NextResponse } from 'next/server';
import { getRepositoryGraph, registerRepositoryGraph, SAMPLE_REPO_ECOMMERCE } from '@/lib/graph/graph-store';
import { parseSourceFilesToGraph, SourceFileInput } from '@/lib/neo4j/code-parser';
import { saveGraphToNeo4j } from '@/lib/neo4j/neo4j-graph-service';
import { isNeo4jConfigured } from '@/lib/neo4j/config';
import { verifyNeo4jConnection } from '@/lib/neo4j/driver';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repoId, repoName, files, useSample = false } = body;

    const targetRepoId = repoId || SAMPLE_REPO_ECOMMERCE.repoId;
    const targetRepoName = repoName || (repoId ? repoId : SAMPLE_REPO_ECOMMERCE.repoName);

    let graphToSave = getRepositoryGraph(targetRepoId);

    // If source files are provided, parse them through the TypeScript AST code parser
    if (Array.isArray(files) && files.length > 0) {
      graphToSave = parseSourceFilesToGraph(
        targetRepoId,
        targetRepoName,
        files as SourceFileInput[]
      );
      registerRepositoryGraph(graphToSave);
    } else if (!graphToSave || useSample) {
      // Use existing sample graph
      graphToSave = SAMPLE_REPO_ECOMMERCE;
    }

    // Verify Neo4j connection
    const health = await verifyNeo4jConnection();

    if (!health.connected) {
      return NextResponse.json({
        success: false,
        neo4jConnected: false,
        repoId: targetRepoId,
        repoName: targetRepoName,
        nodesIndexed: 0,
        edgesIndexed: 0,
        error: health.error || 'Neo4j database is not connected.',
        help: 'Configure NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD in your .env file.',
        fallbackLocalNodes: graphToSave.nodes.length,
      }, { status: 503 });
    }

    // Save into Neo4j
    const saveResult = await saveGraphToNeo4j(graphToSave);

    if (!saveResult.success) {
      return NextResponse.json({
        success: false,
        neo4jConnected: true,
        error: saveResult.error || 'Failed to save graph to Neo4j.',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      neo4jConnected: true,
      repoId: targetRepoId,
      repoName: targetRepoName,
      nodesIndexed: saveResult.nodesIndexed,
      edgesIndexed: saveResult.edgesIndexed,
      message: `Repository '${targetRepoName}' successfully indexed into Neo4j graph database.`,
    }, { status: 200 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/repositories/index] Indexing failed:', message);
    return NextResponse.json({
      success: false,
      error: 'Failed to index repository into Neo4j.',
      details: message,
    }, { status: 500 });
  }
}
