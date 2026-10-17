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
