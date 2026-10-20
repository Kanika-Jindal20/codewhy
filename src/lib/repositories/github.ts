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

export interface FetchedCommit {
  hash: string;
  message: string;
  author: string;
  timestamp: string;
  filesChanged?: string[];
}

/**
 * Fetches actual source files from a GitHub repository for real AST analysis.
 */
export async function fetchGitHubRepositorySourceFiles(
  owner: string,
  name: string,
  branch: string = 'main',
  maxFiles: number = 40
): Promise<{
  files: Array<{ filePath: string; content: string }>;
  commits: FetchedCommit[];
  defaultBranch: string;
}> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'CodeWhy-Intelligence-Platform',
  };
  if (process.env.GITHUB_TOKEN?.trim()) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN.trim()}`;
  }

  // 1. Fetch Git Tree recursively
  const treeUrl = `${GITHUB_API_ORIGIN}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
  const treeRes = await fetch(treeUrl, { headers, cache: 'no-store' });
  if (!treeRes.ok) {
    throw new Error(`Failed to fetch file tree from GitHub (${treeRes.status}: ${treeRes.statusText})`);
  }

  const treeData = (await treeRes.json()) as { tree?: Array<{ path: string; type: string; size?: number }> };
  if (!Array.isArray(treeData.tree)) {
    throw new Error('Invalid file tree returned by GitHub.');
  }

  // Filter valid code files, excluding heavy artifacts
  const codeFiles = treeData.tree
    .filter(item => {
      if (item.type !== 'blob') return false;
      const p = item.path.toLowerCase();
      if (p.includes('node_modules/') || p.includes('.git/') || p.includes('.next/') || p.includes('dist/') || p.includes('build/')) return false;
      if (p.endsWith('package-lock.json') || p.endsWith('yarn.lock') || p.endsWith('pnpm-lock.yaml')) return false;
      if (p.endsWith('.min.js') || p.endsWith('.min.css')) return false;
      return /\.(ts|tsx|js|jsx|json)$/i.test(p);
    })
    .slice(0, maxFiles);

  // 2. Fetch content for each selected file
  const files: Array<{ filePath: string; content: string }> = [];
  await Promise.all(
    codeFiles.map(async file => {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/${encodeURIComponent(branch)}/${file.path}`;
        const rawRes = await fetch(rawUrl, {
          headers: process.env.GITHUB_TOKEN ? { Authorization: headers['Authorization'] } : {},
          cache: 'no-store',
        });
        if (rawRes.ok) {
          const content = await rawRes.text();
          if (content.length < 200_000) {
            files.push({ filePath: file.path, content });
          }
        }
      } catch {
        // Skip inaccessible file
      }
    })
  );

  // 3. Fetch recent commits
  const commits: FetchedCommit[] = [];
  try {
    const commitsUrl = `${GITHUB_API_ORIGIN}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/commits?per_page=10`;
    const commitsRes = await fetch(commitsUrl, { headers, cache: 'no-store' });
    if (commitsRes.ok) {
      const commitList = (await commitsRes.json()) as any[];
      if (Array.isArray(commitList)) {
        for (const c of commitList) {
          commits.push({
            hash: c.sha?.slice(0, 7) || 'unknown',
            message: c.commit?.message?.split('\n')[0] || 'Commit',
            author: `${c.commit?.author?.name || 'Developer'} <${c.commit?.author?.email || ''}>`,
            timestamp: c.commit?.author?.date || new Date().toISOString(),
          });
        }
      }
    }
  } catch {
    // Non-fatal if commit history unavailable
  }

  return { files, commits, defaultBranch: branch };
}

/**
 * Scans local workspace repository files directly from disk.
 */
export function scanLocalWorkspaceFiles(maxFiles: number = 60): Array<{ filePath: string; content: string }> {
  const fs = require('fs');
  const path = require('path');
  const rootDir = process.cwd();
  const results: Array<{ filePath: string; content: string }> = [];

  function walk(dir: string) {
    if (results.length >= maxFiles) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (results.length >= maxFiles) break;
        const full = path.join(dir, entry.name);
        const rel = path.relative(rootDir, full).replace(/\\/g, '/');

        if (entry.isDirectory()) {
          if (['node_modules', '.next', '.git', 'dist', 'build', 'coverage', '.gemini'].includes(entry.name)) continue;
          walk(full);
        } else if (entry.isFile()) {
          if (/\.(ts|tsx|js|jsx|json)$/i.test(entry.name) && !entry.name.endsWith('.lock') && !entry.name.includes('.min.')) {
            try {
              const stat = fs.statSync(full);
              if (stat.size < 150_000) {
                const content = fs.readFileSync(full, 'utf8');
                results.push({ filePath: rel, content });
              }
            } catch {
              // Ignore unreadable
            }
          }
        }
      }
    } catch {
      // Ignore directory read error
    }
  }

  walk(path.join(rootDir, 'src'));
  return results;
}
