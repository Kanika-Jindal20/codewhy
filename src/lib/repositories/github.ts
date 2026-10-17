import {
  RepositoryLookupErrorCode,
  RepositoryMetadata,
} from '@/types/repository';

const GITHUB_API_ORIGIN = 'https://api.github.com';

export class RepositoryLookupError extends Error {
  constructor(
    public readonly code: RepositoryLookupErrorCode,
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'RepositoryLookupError';
  }
}

interface GitHubRepositoryResponse {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  default_branch: string;
  private: boolean;
  owner: {
    login: string;
  };
}

function invalidRepositoryUrl(): RepositoryLookupError {
  return new RepositoryLookupError(
    'INVALID_REPOSITORY_URL',
    'Enter a valid public GitHub repository URL.',
    400
  );
}

function parseRepositoryUrl(input: string): { owner: string; name: string } {
  if (input !== input.trim()) {
    throw invalidRepositoryUrl();
  }

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw invalidRepositoryUrl();
  }

  const authority = /^https:\/\/([^/?#]*)/i.exec(input)?.[1];
  if (
    url.protocol !== 'https:' ||
    url.host !== 'github.com' ||
    !authority ||
    authority.includes(':') ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw invalidRepositoryUrl();
  }

  const match = /^\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)\/?$/.exec(url.pathname);
  if (!match) {
    throw invalidRepositoryUrl();
  }

  const owner = match[1];
  const name = match[2].replace(/\.git$/i, '');
  if (!name || name === '.' || name === '..') {
    throw invalidRepositoryUrl();
  }

  return { owner, name };
}

function isGitHubRepositoryResponse(value: unknown): value is GitHubRepositoryResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  const repository = value as Record<string, unknown>;
  if (
    !repository.owner ||
    typeof repository.owner !== 'object' ||
    Array.isArray(repository.owner)
  ) {
    return false;
  }
  const owner = repository.owner as Record<string, unknown>;

  return (
    typeof repository.id === 'number' &&
    Number.isSafeInteger(repository.id) &&
    repository.id > 0 &&
    typeof owner.login === 'string' &&
    owner.login.length > 0 &&
    typeof repository.name === 'string' &&
    repository.name.length > 0 &&
    typeof repository.html_url === 'string' &&
    isPublicGitHubRepositoryUrl(repository.html_url, owner.login, repository.name) &&
    (typeof repository.description === 'string' || repository.description === null) &&
    (typeof repository.language === 'string' || repository.language === null) &&
    typeof repository.default_branch === 'string' &&
    repository.default_branch.length > 0 &&
    typeof repository.private === 'boolean'
  );
}

function isPublicGitHubRepositoryUrl(
  value: string,
  owner: string,
  name: string
): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.host === 'github.com' &&
      !url.port &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      url.pathname.replace(/\/$/, '') === `/${owner}/${name}`
    );
  } catch {
    return false;
  }
}

function getUpstreamError(response: Response): RepositoryLookupError {
  if (response.status === 404) {
    return new RepositoryLookupError(
      'REPOSITORY_NOT_FOUND',
      'Repository not found or not publicly accessible.',
      404
    );
  }

  const isRateLimited =
    response.status === 429 ||
    (response.status === 403 &&
      (response.headers.get('x-ratelimit-remaining') === '0' ||
        response.headers.has('retry-after')));
  if (isRateLimited) {
    return new RepositoryLookupError(
      'GITHUB_RATE_LIMITED',
      'GitHub API rate limit exceeded. Please try again later.',
      429
    );
  }

  return new RepositoryLookupError(
    'GITHUB_UNAVAILABLE',
    'GitHub could not complete the repository lookup.',
    502
  );
}

export async function lookupPublicGitHubRepository(
  repositoryUrl: string
): Promise<RepositoryMetadata> {
  const { owner, name } = parseRepositoryUrl(repositoryUrl);
  const endpoint = new URL(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
    GITHUB_API_ORIGIN
  );

  let response: Response;
  try {
    response = await fetch(endpoint, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
      redirect: 'error',
    });
  } catch {
    throw new RepositoryLookupError(
      'GITHUB_UNAVAILABLE',
      'Could not connect to GitHub.',
      502
    );
  }

  if (!response.ok) {
    throw getUpstreamError(response);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new RepositoryLookupError(
      'GITHUB_UNAVAILABLE',
      'GitHub returned an invalid repository response.',
      502
    );
  }

  if (!isGitHubRepositoryResponse(payload)) {
    throw new RepositoryLookupError(
      'GITHUB_UNAVAILABLE',
      'GitHub returned an invalid repository response.',
      502
    );
  }

  if (payload.private) {
    throw new RepositoryLookupError(
      'REPOSITORY_NOT_FOUND',
      'Repository not found or not publicly accessible.',
      404
    );
  }

  return {
    githubRepositoryId: payload.id,
    owner: payload.owner.login,
    name: payload.name,
    url: payload.html_url,
    description: payload.description,
    primaryLanguage: payload.language,
    defaultBranch: payload.default_branch,
  };
}
