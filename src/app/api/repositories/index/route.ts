import { NextRequest, NextResponse } from 'next/server';
import {
  getRepositoryGraph,
  registerRepositoryGraph,
  SAMPLE_REPO_ECOMMERCE,
} from '@/lib/graph/graph-store';
import { parseSourceFilesToGraph, SourceFileInput } from '@/lib/neo4j/code-parser';
import { saveGraphToNeo4j } from '@/lib/neo4j/neo4j-graph-service';
import { isNeo4jConfigured } from '@/lib/neo4j/config';
import { verifyNeo4jConnection } from '@/lib/neo4j/driver';
import {
  lookupPublicGitHubRepository,
  fetchGitHubRepositorySourceFiles,
  scanLocalWorkspaceFiles,
} from '@/lib/repositories/github';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repoId, repoName, url, branch, files, isLocal = false, useSample = false } = body;

    let targetRepoId = repoId;
    let targetRepoName = repoName;
    let sourceFiles: SourceFileInput[] = [];
    let commits: Array<{ hash: string; message: string; author: string; timestamp: string }> = [];

    // 1. If a GitHub URL is provided, fetch real source files and commit history
    if (url && typeof url === 'string' && url.includes('github.com')) {
      const meta = await lookupPublicGitHubRepository(url.trim());
      targetRepoId = targetRepoId || `repo-${meta.owner}-${meta.name}`.toLowerCase();
      targetRepoName = targetRepoName || `${meta.owner}/${meta.name}`;

      const fetched = await fetchGitHubRepositorySourceFiles(
        meta.owner,
        meta.name,
        branch || meta.defaultBranch
      );
      sourceFiles = fetched.files;
      commits = fetched.commits;
    } else if (isLocal || url === 'local' || repoId === 'local' || repoId === 'codewhy') {
      // 2. Scan local codebase directly from workspace
      targetRepoId = 'repo-codewhy';
      targetRepoName = 'codewhy';
      sourceFiles = scanLocalWorkspaceFiles(50);
    } else if (Array.isArray(files) && files.length > 0) {
      // 3. User supplied direct file contents
      sourceFiles = files;
      targetRepoId = targetRepoId || 'repo-custom';
      targetRepoName = targetRepoName || 'custom-repository';
    }

    let graphToSave = targetRepoId ? getRepositoryGraph(targetRepoId) : undefined;

    if (sourceFiles.length > 0) {
      graphToSave = parseSourceFilesToGraph(
        targetRepoId!,
        targetRepoName!,
        sourceFiles,
        commits
      );
      registerRepositoryGraph(graphToSave);
    } else if (useSample || !graphToSave) {
      targetRepoId = SAMPLE_REPO_ECOMMERCE.repoId;
      targetRepoName = SAMPLE_REPO_ECOMMERCE.repoName;
      graphToSave = SAMPLE_REPO_ECOMMERCE;
      registerRepositoryGraph(graphToSave);
    }

    // 4. Verify Neo4j connection
    let neo4jConnected = false;
    let neo4jError: string | undefined;

    if (isNeo4jConfigured()) {
      const health = await verifyNeo4jConnection();
      neo4jConnected = health.connected;
      neo4jError = health.error;
    }

    if (neo4jConnected) {
      const saveResult = await saveGraphToNeo4j(graphToSave!);
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
        repoId: graphToSave!.repoId,
        repoName: graphToSave!.repoName,
        nodesIndexed: saveResult.nodesIndexed,
        edgesIndexed: saveResult.edgesIndexed,
        message: `Repository '${graphToSave!.repoName}' successfully parsed and indexed into Neo4j graph database.`,
      }, { status: 200 });
    }

    // If Neo4j is not connected, repository is still saved locally and functional
    return NextResponse.json({
      success: true,
      neo4jConnected: false,
      repoId: graphToSave!.repoId,
      repoName: graphToSave!.repoName,
      nodesIndexed: graphToSave!.nodes.length,
      edgesIndexed: graphToSave!.edges.length,
      message: `Repository '${graphToSave!.repoName}' parsed and indexed in local persistent storage (${graphToSave!.nodes.length} nodes, ${graphToSave!.edges.length} relationships).`,
      neo4jHelp: neo4jError || 'Neo4j is not configured. Add NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD in .env to enable graph database persistence.',
    }, { status: 200 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/repositories/index] Indexing failed:', message);
    return NextResponse.json({
      success: false,
      error: 'Failed to index repository.',
      details: message,
    }, { status: 500 });
  }
}
