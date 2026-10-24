import { NextRequest, NextResponse } from 'next/server';
import {
  getRepositoryGraph,
  registerRepositoryGraph,
  SAMPLE_REPO_ECOMMERCE,
} from '@/lib/graph/graph-store';
import { parseSourceFilesToGraph, SourceFileInput, CommitInput } from '@/lib/neo4j/code-parser';
import { saveGraphToNeo4j } from '@/lib/neo4j/neo4j-graph-service';
import { isNeo4jConfigured } from '@/lib/neo4j/config';
import { verifyNeo4jConnection } from '@/lib/neo4j/driver';
import {
  lookupPublicGitHubRepository,
  fetchGitHubRepositorySourceFiles,
  scanLocalWorkspaceFiles,
  scanLocalGitCommits,
} from '@/lib/repositories/github';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      repoId,
      repoName,
      url,
      branch = 'main',
      files,
      token,
      isLocal = false,
      useSample = false,
    } = body;

    const authToken = token || req.headers.get('x-github-token') || undefined;

    let targetRepoId = repoId;
    let targetRepoName = repoName;
    let targetBranch = branch;
    let commitSha: string | undefined;
    let sourceFiles: SourceFileInput[] = [];
    let commits: CommitInput[] = [];
    let totalFilesDiscovered = 0;

    // 1. If a GitHub URL is provided, fetch real source files and commit history
    if (url && typeof url === 'string' && url.includes('github.com')) {
      const meta = await lookupPublicGitHubRepository(url.trim(), authToken);
      targetRepoId = targetRepoId || `repo-${meta.owner}-${meta.name}`.toLowerCase();
      targetRepoName = targetRepoName || `${meta.owner}/${meta.name}`;
      targetBranch = branch || meta.defaultBranch;

      const fetched = await fetchGitHubRepositorySourceFiles(
        meta.owner,
        meta.name,
        targetBranch,
        50,
        authToken
      );
      sourceFiles = fetched.files;
      commits = fetched.commits;
      commitSha = fetched.commitSha;
      totalFilesDiscovered = fetched.totalFilesDiscovered;
    } else if (isLocal || url === 'local' || repoId === 'local' || repoId === 'codewhy') {
      // 2. Scan local codebase directly from workspace
      targetRepoId = 'repo-codewhy';
      targetRepoName = 'codewhy';
      sourceFiles = scanLocalWorkspaceFiles(60);
      totalFilesDiscovered = sourceFiles.length;
      commits = scanLocalGitCommits(10);
      commitSha = commits[0]?.hash;
    } else if (Array.isArray(files) && files.length > 0) {
      // 3. User supplied direct file contents
      sourceFiles = files;
      targetRepoId = targetRepoId || 'repo-custom';
      targetRepoName = targetRepoName || 'custom-repository';
      totalFilesDiscovered = files.length;
    }

    let graphToSave = targetRepoId ? getRepositoryGraph(targetRepoId) : undefined;

    if (sourceFiles.length > 0) {
      graphToSave = parseSourceFilesToGraph(
        targetRepoId!,
        targetRepoName!,
        sourceFiles,
        commits,
        targetBranch,
        commitSha
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
        return NextResponse.json(
          {
            success: false,
            neo4jConnected: true,
            error: saveResult.error || 'Failed to save graph to Neo4j.',
          },
          { status: 500 }
        );
      }

      const res = NextResponse.json(
        {
          success: true,
          neo4jConnected: true,
          repoId: graphToSave!.repoId,
          repoName: graphToSave!.repoName,
          branch: graphToSave!.branch || targetBranch,
          commitSha: graphToSave!.commitSha,
          nodesIndexed: saveResult.nodesIndexed,
          edgesIndexed: saveResult.edgesIndexed,
          filesDiscovered: totalFilesDiscovered,
          filesIndexed: sourceFiles.length,
          message: `Repository '${graphToSave!.repoName}' successfully parsed and indexed into Neo4j graph database (${saveResult.nodesIndexed} nodes, ${saveResult.edgesIndexed} relationships).`,
        },
        { status: 200 }
      );
      res.cookies.set('codewhy_active_repo_id', graphToSave!.repoId, {
        path: '/',
        maxAge: 31536000,
        sameSite: 'lax',
      });
      return res;
    }

    // If Neo4j is not connected, repository is still saved locally and functional in CodeWhy's local AST engine
    const res = NextResponse.json(
      {
        success: true,
        neo4jConnected: false,
        repoId: graphToSave!.repoId,
        repoName: graphToSave!.repoName,
        branch: graphToSave!.branch || targetBranch,
        commitSha: graphToSave!.commitSha,
        nodesIndexed: graphToSave!.nodes.length,
        edgesIndexed: graphToSave!.edges.length,
        filesDiscovered: totalFilesDiscovered,
        filesIndexed: sourceFiles.length,
        message: `Repository '${graphToSave!.repoName}' parsed and indexed in local AST engine (${graphToSave!.nodes.length} nodes, ${graphToSave!.edges.length} relationships). Set NEO4J_URI in .env to sync with Neo4j.`,
      },
      { status: 200 }
    );
    res.cookies.set('codewhy_active_repo_id', graphToSave!.repoId, {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
    });
    return res;
  } catch (error: any) {
    console.error('[/api/repositories/index] Indexing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An error occurred while parsing and indexing the repository.',
      },
      { status: 500 }
    );
  }
}
