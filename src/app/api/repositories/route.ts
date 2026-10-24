import { NextRequest, NextResponse } from 'next/server';
import {
  lookupPublicGitHubRepository,
  RepositoryLookupError,
} from '@/lib/repositories/github';
import {
  RepositoryLookupErrorResponse,
  RepositoryLookupRequest,
  RepositoryLookupResponse,
} from '@/types/repository';

function errorResponse(
  code: RepositoryLookupErrorResponse['error']['code'],
  message: string,
  status: number
) {
  const body: RepositoryLookupErrorResponse = { error: { code, message } };
  return NextResponse.json(body, { status });
}

function isRepositoryLookupRequest(value: unknown): value is RepositoryLookupRequest {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as Record<string, unknown>).url === 'string' &&
    Boolean((value as Record<string, unknown>).url)
  );
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse(
      'INVALID_REPOSITORY_URL',
      'Request body must be valid JSON containing a repository URL.',
      400
    );
  }

  if (!isRepositoryLookupRequest(body)) {
    return errorResponse(
      'INVALID_REPOSITORY_URL',
      'Request body must include a repository URL string.',
      400
    );
  }

  try {
    const repository = await lookupPublicGitHubRepository(body.url);
    const response: RepositoryLookupResponse = { repository };
    return NextResponse.json(response, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof RepositoryLookupError) {
      return errorResponse(err.code, err.message, err.status);
    }

    console.error('[/api/repositories] Metadata lookup error:', err);
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred during repository lookup.',
      500
    );
  }
}

export async function GET(req: NextRequest) {
  const { getAllRepositories, setActiveRepositoryId, getActiveRepositoryId } = await import('@/lib/graph/graph-store');
  const { isNeo4jConfigured } = await import('@/lib/neo4j/config');
  const { verifyNeo4jConnection } = await import('@/lib/neo4j/driver');

  // Check active repo cookie or header
  const cookieRepoId = req.cookies.get('codewhy_active_repo_id')?.value || req.headers.get('x-active-repo-id');
  if (cookieRepoId) {
    try {
      setActiveRepositoryId(cookieRepoId);
    } catch {}
  }

  let neo4jHealth: { connected: boolean; serverInfo?: string; error?: string } = {
    connected: false,
    error: 'Neo4j is not configured.',
  };

  if (isNeo4jConfigured()) {
    neo4jHealth = await verifyNeo4jConnection();
  }

  const repos = getAllRepositories();

  return NextResponse.json({
    repositories: repos,
    activeRepoId: getActiveRepositoryId(),
    neo4j: {
      isConfigured: isNeo4jConfigured(),
      connected: neo4jHealth.connected,
      serverInfo: neo4jHealth.serverInfo,
      error: neo4jHealth.error,
    },
  }, { status: 200 });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const repoId = body?.repoId;
    if (!repoId || typeof repoId !== 'string') {
      return NextResponse.json({ error: 'repoId is required.' }, { status: 400 });
    }
    const { setActiveRepositoryId, getRepositoryGraph } = await import('@/lib/graph/graph-store');
    const graph = getRepositoryGraph(repoId);
    if (!graph) {
      return NextResponse.json({ error: `Repository '${repoId}' not found.` }, { status: 404 });
    }
    setActiveRepositoryId(repoId);

    const res = NextResponse.json({ success: true, activeRepoId: repoId }, { status: 200 });
    res.cookies.set('codewhy_active_repo_id', repoId, {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Failed to switch active repository.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let repoId = searchParams.get('repoId');
    if (!repoId) {
      const body = await req.json().catch(() => ({}));
      repoId = body?.repoId;
    }
    if (!repoId || typeof repoId !== 'string') {
      return NextResponse.json({ error: 'repoId is required to delete.' }, { status: 400 });
    }
    const { deleteRepository } = await import('@/lib/graph/graph-store');
    const result = deleteRepository(repoId);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to delete repository.' }, { status: 400 });
    }
    return NextResponse.json({ success: true, deletedRepoId: repoId }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete repository.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
