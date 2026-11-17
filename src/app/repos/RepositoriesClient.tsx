'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderGit2,
  GitBranch,
  Search,
  ExternalLink,
  CheckCircle2,
  Zap,
  Compass,
  Clock,
  AlertCircle,
  FileCode,
  Network,
  Share2,
  Boxes,
  ArrowRight,
  Sparkles,
  Database,
  RefreshCw,
  Trash2,
  GitCommit,
  Key,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { setActiveRepoClient } from '@/lib/repositories/active-repo-client';

interface RegisteredRepo {
  repoId: string;
  repoName: string;
  updatedAt: string;
  nodeCount: number;
  edgeCount: number;
  primaryLanguage?: string;
  description?: string;
  isDemo?: boolean;
  isActive?: boolean;
  branch?: string;
  commitSha?: string;
}

export function RepositoriesClient() {
  const [repos, setRepos] = useState<RegisteredRepo[]>([]);
  const [neo4jStatus, setNeo4jStatus] = useState<{
    isConfigured: boolean;
    connected: boolean;
    serverInfo?: string;
    error?: string;
  } | null>(null);

  const [isLoadingRepos, setIsLoadingRepos] = useState(true);

  const [lookupUrl, setLookupUrl] = useState('');
  const [customBranch, setCustomBranch] = useState('');
  const [customToken, setCustomToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Indexing State
  const [isIndexing, setIsIndexing] = useState(false);
  const [deletingRepoId, setDeletingRepoId] = useState<string | null>(null);
  const [indexStatus, setIndexStatus] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
    neo4jConnected?: boolean;
    neo4jHelp?: string;
  } | null>(null);

  const loadRepositories = async () => {
    try {
      setIsLoadingRepos(true);
      const res = await fetch('/api/repositories');
      if (res.ok) {
        const data = await res.json();
        setRepos(data.repositories || []);
        setNeo4jStatus(data.neo4j || null);
      }
    } catch (err) {
      console.warn('Failed to load repositories:', err);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  useEffect(() => {
    loadRepositories();
  }, []);

  const handleIndex = async (payload: {
    url?: string;
    repoId?: string;
    isLocal?: boolean;
    branch?: string;
    token?: string;
  }) => {
    setIsIndexing(true);
    setIndexStatus(null);
    try {
      const res = await fetch('/api/repositories/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIndexStatus({
          success: true,
          message: data.message,
          neo4jConnected: data.neo4jConnected,
          neo4jHelp: data.neo4jHelp,
        });
        if (data.repoId && data.repoName) {
          setActiveRepoClient({
            repoId: data.repoId,
            repoName: data.repoName,
            branch: data.branch || 'main',
            isDemo: false,
          });
        }
        await loadRepositories();
      } else {
        setIndexStatus({
          success: false,
          error: data.error || data.details || 'Failed to index repository.',
        });
      }
    } catch (err: unknown) {
      setIndexStatus({
        success: false,
        error: err instanceof Error ? err.message : 'Network error indexing repository.',
      });
    } finally {
      setIsIndexing(false);
    }
  };

  const handleDeleteRepo = async (repoId: string, repoName: string) => {
    if (!window.confirm(`Are you sure you want to delete repository "${repoName}" from CodeWhy?`)) {
      return;
    }
    setDeletingRepoId(repoId);
    try {
      const res = await fetch(`/api/repositories?repoId=${encodeURIComponent(repoId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.repoId && data.repoName) {
          setActiveRepoClient({
            repoId: data.repoId,
            repoName: data.repoName,
            branch: data.branch || 'main',
            isDemo: false,
          });
        }
        await loadRepositories();
      } else {
        alert(data.error || 'Failed to delete repository.');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Network error deleting repository.');
    } finally {
      setDeletingRepoId(null);
    }
  };

  const handleActivateRepo = async (repoId: string) => {
    try {
      const res = await fetch('/api/repositories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId }),
      });
      if (res.ok) {
        const found = repos.find((r) => r.repoId === repoId);
        if (found) {
          setActiveRepoClient({
            repoId: found.repoId,
            repoName: found.repoName,
            branch: found.branch || 'main',
            isDemo: Boolean(found.isDemo),
          });
        }
        await loadRepositories();
      }
    } catch (err) {
      console.error('Failed to switch repository:', err);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupUrl.trim() || isLookingUp) return;

    setIsLookingUp(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const res = await fetch('/api/repositories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customToken ? { 'x-github-token': customToken.trim() } : {}),
        },
        body: JSON.stringify({ url: lookupUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to lookup repository');
      }
      setLookupResult(data.repository);
      setCustomBranch(data.repository.defaultBranch || 'main');
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Error checking repository');
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      {/* ── Page Header Banner (Clean Minimal SaaS Header) ── */}
      <header className="bg-white rounded-[12px] border border-[#EDEDED] p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#707070]">
              Workspaces &amp; Indexes
            </span>
            <span className="text-[#DFDFDF]">/</span>
            <span className="text-[11px] font-medium text-[#171717]">
              {repos.length} {repos.length === 1 ? 'Repository' : 'Repositories'} Available
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#171717] tracking-tight">
            Repository Management
          </h1>
          <p className="text-xs sm:text-sm text-[#707070] max-w-xl">
            Manage parsed AST knowledge graphs, switch active workspaces, and connect real GitHub or local repositories.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <Badge
            variant={neo4jStatus?.connected ? 'success' : 'default'}
            size="sm"
            icon={<Database className="w-3.5 h-3.5" />}
          >
            {neo4jStatus?.connected ? 'Neo4j Connected' : 'Neo4j Inactive (In-Memory)'}
          </Badge>

          <Button
            variant="secondary"
            size="sm"
            onClick={loadRepositories}
            disabled={isLoadingRepos}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingRepos ? 'animate-spin text-[#3ECF8E]' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </header>

      {/* Index Status Notification */}
      {indexStatus && (
        <Alert
          type={indexStatus.success ? 'success' : 'error'}
          title={indexStatus.success ? 'Indexing Completed' : 'Indexing Error'}
        >
          <p>{indexStatus.message || indexStatus.error}</p>
          {indexStatus.neo4jHelp && (
            <p className="mt-1.5 font-mono text-xs opacity-90">{indexStatus.neo4jHelp}</p>
          )}
        </Alert>
      )}

      {/* Active Repositories List */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#707070]">
            Indexed Repositories
          </h2>
          <span className="text-xs text-[#707070]">Ready for AST reasoning</span>
        </div>

        <div className="space-y-3">
          {repos.map((repo) => (
            <div
              key={repo.repoId}
              className={`bg-white border rounded-[12px] p-5 sm:p-6 transition-all shadow-2xs space-y-4 ${
                repo.isActive
                  ? 'border-[#3ECF8E] ring-2 ring-[#3ECF8E]/10'
                  : 'border-[#EDEDED] hover:border-[#DFDFDF]'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                <div className="space-y-2.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-base sm:text-lg font-semibold text-[#171717]">{repo.repoName}</h3>
                    {repo.isActive && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] animate-pulse" />
                        Active Workspace
                      </span>
                    )}
                    {repo.isDemo && (
                      <Badge variant="warning" size="xs">
                        Demo Sample
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs text-[#707070]">
                    <span className="font-mono text-[11px]">branch: {repo.branch || 'main'}</span>
                    {repo.commitSha && (
                      <>
                        <span className="text-[#DFDFDF]">·</span>
                        <span className="font-mono text-[11px] flex items-center gap-1">
                          <GitCommit className="w-3 h-3 text-[#9A9A9A]" />
                          {repo.commitSha.slice(0, 7)}
                        </span>
                      </>
                    )}
                    <span className="text-[#DFDFDF]">·</span>
                    <span className="text-[11px]">Updated {new Date(repo.updatedAt).toLocaleDateString()}</span>
                  </div>

                  {repo.description && (
                    <p className="text-xs text-[#707070] leading-relaxed max-w-xl">
                      {repo.description}
                    </p>
                  )}

                  {/* Metadata Counters */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                    <div className="px-2.5 py-1 rounded-[6px] bg-[#FAFAFA] border border-[#EDEDED] font-mono text-[11px]">
                      <span className="text-[#707070]">AST Nodes:</span>{' '}
                      <strong className="text-[#171717]">{repo.nodeCount}</strong>
                    </div>
                    <div className="px-2.5 py-1 rounded-[6px] bg-[#FAFAFA] border border-[#EDEDED] font-mono text-[11px]">
                      <span className="text-[#707070]">Relationships:</span>{' '}
                      <strong className="text-[#171717]">{repo.edgeCount || 0}</strong>
                    </div>
                    <div className="px-2.5 py-1 rounded-[6px] bg-[#FAFAFA] border border-[#EDEDED] font-mono text-[11px]">
                      <span className="text-[#707070]">Language:</span>{' '}
                      <strong className="text-[#171717]">{repo.primaryLanguage || 'TypeScript'}</strong>
                    </div>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex flex-wrap lg:flex-col gap-2 shrink-0 pt-2 lg:pt-0">
                  {!repo.isActive ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleActivateRepo(repo.repoId)}
                    >
                      Set as Active
                    </Button>
                  ) : (
                    <div className="text-xs font-medium text-[#065F46] flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#ECFDF5] border border-[#A7F3D0]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" /> Selected Active
                    </div>
                  )}

                  <Link href={`/architecture?repoId=${repo.repoId}`}>
                    <Button variant="secondary" size="sm" icon={<Compass className="w-3.5 h-3.5" />} className="w-full">
                      Architecture
                    </Button>
                  </Link>

                  <Link href={`/impact?repoId=${repo.repoId}`}>
                    <Button variant="secondary" size="sm" icon={<Zap className="w-3.5 h-3.5" />} className="w-full">
                      Impact Analysis
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleIndex({ repoId: repo.repoId, branch: repo.branch || 'main' })}
                    isLoading={isIndexing}
                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                    className="w-full"
                  >
                    Re-index
                  </Button>

                  {!repo.isDemo && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteRepo(repo.repoId, repo.repoName)}
                      isLoading={deletingRepoId === repo.repoId}
                      icon={<Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />}
                      className="w-full"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Connect GitHub or Local Workspace */}
      <section className="bg-white border border-[#EDEDED] rounded-[12px] p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#3ECF8E]" />
              <h2 className="text-sm font-semibold text-[#171717]">
                Connect &amp; Parse Real Repository
              </h2>
            </div>
            <p className="text-xs text-[#707070] mt-0.5">
              Parse TypeScript, JavaScript, Python, or Go files from GitHub or index your local workspace codebase.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleIndex({ isLocal: true })}
            isLoading={isIndexing}
            icon={<Boxes className="w-3.5 h-3.5 text-[#171717]" />}
          >
            Index Local Workspace (codewhy)
          </Button>
        </div>

        {/* Example quick links */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] uppercase tracking-wider text-[#9A9A9A]">Quick Examples:</span>
          {['expressjs/express', 'facebook/react', 'vercel/next.js'].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setLookupUrl(`https://github.com/${example}`);
                setCustomBranch('main');
              }}
              className="font-mono text-[11px] px-2 py-0.5 rounded-[4px] bg-[#FAFAFA] border border-[#EDEDED] text-[#171717] hover:border-[#C7C7C7] transition-colors"
            >
              {example}
            </button>
          ))}
        </div>

        <form onSubmit={handleLookup} className="space-y-3 pt-1">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#9A9A9A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={lookupUrl}
                onChange={(e) => setLookupUrl(e.target.value)}
                placeholder="e.g. https://github.com/expressjs/express or owner/repo"
                className="w-full pl-9 pr-3 py-2 text-xs text-[#171717] bg-[#FAFAFA] border border-[#DFDFDF] rounded-[8px] focus:outline-none focus:border-[#3ECF8E] focus:bg-white focus:ring-1 focus:ring-[#3ECF8E]"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLookingUp}
              disabled={!lookupUrl.trim()}
            >
              Inspect Repository
            </Button>
          </div>

          <div className="flex items-center justify-between text-xs text-[#707070]">
            <button
              type="button"
              onClick={() => setShowTokenInput(!showTokenInput)}
              className="hover:text-[#171717] font-medium flex items-center gap-1"
            >
              <Key className="w-3.5 h-3.5" />
              {showTokenInput ? 'Hide Private Access Token' : 'Add GitHub Access Token (Optional for private repos)'}
            </button>
          </div>

          {showTokenInput && (
            <div className="p-3 bg-[#FAFAFA] border border-[#EDEDED] rounded-[8px] space-y-1.5">
              <label className="block text-[11px] font-medium text-[#707070]">
                GitHub Personal Access Token
              </label>
              <input
                type="password"
                value={customToken}
                onChange={(e) => setCustomToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full px-2.5 py-1.5 text-xs rounded-[6px] border border-[#DFDFDF] bg-white font-mono"
              />
              <span className="text-[10px] text-[#9A9A9A] block">
                Token is sent securely over HTTPS and never persisted to logs.
              </span>
            </div>
          )}
        </form>

        {lookupError && <Alert type="error" title="Lookup Error">{lookupError}</Alert>}

        {lookupResult && (
          <div className="mt-3 p-4 rounded-[10px] border border-[#DFDFDF] bg-[#FAFAFA] space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-sm text-[#171717] block">{lookupResult.name}</span>
                <span className="text-[11px] text-[#707070] font-mono">
                  Owner: {lookupResult.owner} · Branch: {lookupResult.defaultBranch || 'main'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {lookupResult.url && (
                  <a
                    href={lookupResult.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-[#707070] hover:text-[#171717] flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-[6px] border border-[#EDEDED]"
                  >
                    GitHub <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isIndexing}
                  onClick={() =>
                    handleIndex({
                      url: lookupResult.url,
                      branch: customBranch || lookupResult.defaultBranch,
                      token: customToken || undefined,
                    })
                  }
                >
                  Index &amp; Parse into Platform
                </Button>
              </div>
            </div>

            {lookupResult.description && (
              <p className="text-xs text-[#707070] bg-white p-2.5 rounded-[6px] border border-[#EDEDED]">
                {lookupResult.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs font-mono text-[#707070]">
              <span>
                Language: <strong className="text-[#171717]">{lookupResult.primaryLanguage || 'Multi-language'}</strong>
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
