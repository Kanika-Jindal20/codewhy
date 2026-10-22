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
    'Enter a valid GitHub repository URL.',
    400
  );
}

export function parseRepositoryUrl(input: string): { owner: string; name: string } {
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
      'Repository not found or not accessible. If private, configure GITHUB_TOKEN.',
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
      'GitHub API rate limit exceeded. Please try again later or provide a token.',
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
  repositoryUrl: string,
  authToken?: string
): Promise<RepositoryMetadata> {
  const { owner, name } = parseRepositoryUrl(repositoryUrl);
  const endpoint = new URL(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
    GITHUB_API_ORIGIN
  );

  const token = authToken?.trim() || process.env.GITHUB_TOKEN?.trim();
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'CodeWhy-Intelligence-Platform',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      headers,
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

  // If private and no token was provided, reject for lookupPublicGitHubRepository
  if (payload.private && !token) {
    throw new RepositoryLookupError(
      'REPOSITORY_NOT_FOUND',
      'Repository not found or not publicly accessible. Authenticated token required for private repositories.',
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
 * Lists available branches from a GitHub repository.
 */
export async function fetchGitHubBranches(
  owner: string,
  name: string,
  authToken?: string
): Promise<string[]> {
  const token = authToken?.trim() || process.env.GITHUB_TOKEN?.trim();
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'CodeWhy-Intelligence-Platform',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const url = `${GITHUB_API_ORIGIN}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/branches?per_page=30`;
    const res = await fetch(url, { headers, cache: 'no-store' });
    if (!res.ok) return ['main'];
    const data = (await res.json()) as Array<{ name: string }>;
    if (Array.isArray(data)) {
      return data.map(b => b.name);
    }
  } catch {
    // fallback
  }
  return ['main'];
}

/**
 * Fetches actual source files and commit history from a GitHub repository for real AST analysis.
 */
export async function fetchGitHubRepositorySourceFiles(
  owner: string,
  name: string,
  branch: string = 'main',
  maxFiles: number = 50,
  authToken?: string
): Promise<{
  files: Array<{ filePath: string; content: string }>;
  commits: FetchedCommit[];
  defaultBranch: string;
  commitSha?: string;
  totalFilesDiscovered: number;
}> {
  const token = authToken?.trim() || process.env.GITHUB_TOKEN?.trim();
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'CodeWhy-Intelligence-Platform',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 1. Fetch Git Tree recursively
  const treeUrl = `${GITHUB_API_ORIGIN}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
  const treeRes = await fetch(treeUrl, { headers, cache: 'no-store' });
  if (!treeRes.ok) {
    throw new Error(`Failed to fetch file tree from GitHub (${treeRes.status}: ${treeRes.statusText})`);
  }

  const treeData = (await treeRes.json()) as { tree?: Array<{ path: string; type: string; size?: number; sha?: string }> };
  if (!Array.isArray(treeData.tree)) {
    throw new Error('Invalid file tree returned by GitHub.');
  }

  const totalFilesDiscovered = treeData.tree.filter(item => item.type === 'blob').length;

  // Filter valid code files across TS, JS, Python, Go, and configs
  const codeFiles = treeData.tree
    .filter(item => {
      if (item.type !== 'blob') return false;
      const p = item.path.toLowerCase();
      if (
        p.includes('node_modules/') ||
        p.includes('.git/') ||
        p.includes('.next/') ||
        p.includes('dist/') ||
        p.includes('build/') ||
        p.includes('vendor/')
      ) {
        return false;
      }
      if (p.endsWith('package-lock.json') || p.endsWith('yarn.lock') || p.endsWith('pnpm-lock.yaml')) return false;
      if (p.endsWith('.min.js') || p.endsWith('.min.css')) return false;
      return /\.(ts|tsx|js|jsx|json|py|go|ya?ml)$/i.test(p);
    })
    .slice(0, maxFiles);

  // 2. Fetch content for each selected file
  const files: Array<{ filePath: string; content: string }> = [];
  await Promise.all(
    codeFiles.map(async file => {
      try {
        // Use raw content endpoint
        const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/${encodeURIComponent(branch)}/${file.path}`;
        const rawRes = await fetch(rawUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
        });
        if (rawRes.ok) {
          const content = await rawRes.text();
          if (content.length < 250_000) {
            files.push({ filePath: file.path, content });
          }
        } else {
          // Fallback to GitHub API contents
          const apiContentUrl = `${GITHUB_API_ORIGIN}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/contents/${encodeURIComponent(file.path)}?ref=${encodeURIComponent(branch)}`;
          const apiRes = await fetch(apiContentUrl, {
            headers: {
              ...headers,
              Accept: 'application/vnd.github.raw',
            },
            cache: 'no-store',
          });
          if (apiRes.ok) {
            const content = await apiRes.text();
            if (content.length < 250_000) {
              files.push({ filePath: file.path, content });
            }
          }
        }
      } catch {
        // Skip inaccessible file
      }
    })
  );

  // 3. Fetch recent commits with file diffs
  const commits: FetchedCommit[] = [];
  let latestCommitSha: string | undefined;

  try {
    const commitsUrl = `${GITHUB_API_ORIGIN}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/commits?sha=${encodeURIComponent(branch)}&per_page=10`;
    const commitsRes = await fetch(commitsUrl, { headers, cache: 'no-store' });
    if (commitsRes.ok) {
      const commitList = (await commitsRes.json()) as any[];
      if (Array.isArray(commitList) && commitList.length > 0) {
        latestCommitSha = commitList[0].sha;
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

  return {
    files,
    commits,
    defaultBranch: branch,
    commitSha: latestCommitSha,
    totalFilesDiscovered,
  };
}

/**
 * Scans local workspace repository files directly from disk.
 */
export function scanLocalWorkspaceFiles(maxFiles: number = 80): Array<{ filePath: string; content: string }> {
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
          if (['node_modules', '.next', '.git', 'dist', 'build', 'coverage', '.gemini', 'tmp'].includes(entry.name)) continue;
          walk(full);
        } else if (entry.isFile()) {
          if (/\.(ts|tsx|js|jsx|json|py|go|ya?ml)$/i.test(entry.name) && !entry.name.endsWith('.lock') && !entry.name.includes('.min.')) {
            try {
              const stat = fs.statSync(full);
              if (stat.size < 200_000) {
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

/**
 * Scans local git commits from workspace directly.
 */
export function scanLocalGitCommits(maxCommits: number = 10): Array<{
  hash: string;
  message: string;
  author: string;
  timestamp: string;
  filesChanged?: string[];
}> {
  try {
    const cp = require('child_process');
    const out = cp.execSync(
      `git log -n ${maxCommits} --name-only --format=COMMIT_SEP%H@@@%s@@@%an@@@%cI`,
      { encoding: 'utf8', cwd: process.cwd(), timeout: 5000 }
    );
    const rawChunks = out.split('COMMIT_SEP').filter(Boolean);
    const commits: Array<{
      hash: string;
      message: string;
      author: string;
      timestamp: string;
      filesChanged?: string[];
    }> = [];

    for (const chunk of rawChunks) {
      const lines = chunk.trim().split(/\r?\n/);
      const meta = lines[0]?.split('@@@');
      if (meta && meta.length >= 4) {
        const hash = meta[0].trim();
        const message = meta[1].trim();
        const author = meta[2].trim();
        const timestamp = meta[3].trim();
        const filesChanged = lines.slice(1).map((l: string) => l.trim()).filter(Boolean);
        commits.push({ hash, message, author, timestamp, filesChanged });
      }
    }
    return commits;
  } catch {
    return [];
  }
}
