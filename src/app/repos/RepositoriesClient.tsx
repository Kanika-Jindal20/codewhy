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
  Loader2,
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

  const handleIndex = async (payload: { url?: string; repoId?: string; isLocal?: boolean; branch?: string; token?: string }) => {
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
    <div className="font-['Inter',sans-serif] max-w-6xl mx-auto space-y-8 pb-16">
      {/* ── Page Header Banner ── */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 sm:p-7 text-white shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_white_0%,_transparent_70%)] pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg">
              <FolderGit2 className="w-7 h-7 text-white stroke-[2.2]" />
            </span>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Repositories & Workspaces
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm border border-white/30 text-white">
                  Codebase Index
                </span>
              </div>
              <p className="text-sm text-blue-100 mt-1 max-w-2xl">
                Manage indexed codebases, explore verified entity graphs, and parse real GitHub or local repositories into Neo4j.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <span className="text-xs font-bold px-3.5 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-white border border-white/30 flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {repos.length} {repos.length === 1 ? 'Repository' : 'Repositories'} Available
            </span>
            <span className={`text-xs font-bold px-3 py-2 rounded-xl backdrop-blur-sm border flex items-center gap-2 shadow-sm ${
              neo4jStatus?.connected 
                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' 
                : 'bg-amber-500/20 text-amber-200 border-amber-400/30'
            }`}>
              <Database className="w-3.5 h-3.5" />
              {neo4jStatus?.connected ? 'Neo4j Connected' : 'Neo4j Inactive'}
            </span>
          </div>
        </div>
      </header>

      {/* Index Status Notification */}
      {indexStatus && (
        <div className={`p-5 rounded-2xl border ${
          indexStatus.success 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-start gap-3">
            {indexStatus.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-bold">{indexStatus.success ? 'Indexing Completed' : 'Indexing Error'}</p>
              <p className="text-xs mt-1 leading-relaxed">{indexStatus.message || indexStatus.error}</p>
              {indexStatus.neo4jHelp && (
                <p className="text-xs mt-2 text-slate-600 font-mono bg-white/70 p-2 rounded-lg border border-slate-200">
                  {indexStatus.neo4jHelp}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active Repositories List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#172033]">
              Configured & Indexed Repositories
            </h2>
            <p className="text-xs text-slate-500">
              Fully parsed AST knowledge graphs ready for architectural reasoning, impact analysis, and Q&amp;A.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadRepositories}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingRepos ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>

        <div className="space-y-4">
          {repos.map((repo) => (
            <div
              key={repo.repoId}
              className={`bg-white border rounded-3xl p-6 sm:p-8 transition-all hover:shadow-card shadow-xs space-y-6 ${
                repo.isActive ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="space-y-3.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] text-white flex items-center justify-center shadow-xs">
                      <FolderGit2 className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-[#172033]">
                          {repo.repoName}
                        </h3>
                        {repo.isActive && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-600 text-white">
                            Active Workspace
                          </span>
                        )}
                        {repo.isDemo && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Demo Sample
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          AST Verified
                        </span>
                        <span className="text-slate-400 text-xs">·</span>
                        <span className="text-xs text-slate-500 font-mono">
                          Branch: {repo.branch || 'main'}
                        </span>
                        {repo.commitSha && (
                          <>
                            <span className="text-slate-400 text-xs">·</span>
                            <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                              <GitCommit className="w-3 h-3 text-slate-400" />
                              {repo.commitSha.slice(0, 7)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {repo.description && (
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {repo.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <Network className="w-3.5 h-3.5 text-[#3B82F6]" />
                        AST Nodes
                      </div>
                      <div className="text-xs font-mono font-bold text-[#172033] mt-1">
                        {repo.nodeCount} entities
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <Share2 className="w-3.5 h-3.5 text-[#8B5CF6]" />
                        Relationships
                      </div>
                      <div className="text-xs font-mono font-bold text-[#8B5CF6] mt-1">
                        {repo.edgeCount || 0} edges
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Updated
                      </div>
                      <div className="text-xs font-bold text-slate-700 mt-1">
                        {new Date(repo.updatedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <FileCode className="w-3.5 h-3.5 text-emerald-600" />
                        Language
                      </div>
                      <div className="text-xs font-bold text-emerald-700 mt-1">
                        {repo.primaryLanguage || 'TypeScript'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 pt-2 lg:pt-0">
                  {!repo.isActive ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleActivateRepo(repo.repoId)}
                      className="font-bold bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Set as Active
                    </Button>
                  ) : (
                    <div className="text-xs font-bold text-blue-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
                      <CheckCircle2 className="w-4 h-4" /> Selected Active
                    </div>
                  )}

                  <Link href={`/architecture?repoId=${repo.repoId}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Compass className="w-3.5 h-3.5" />}
                      className="w-full justify-center text-xs font-semibold"
                    >
                      Architecture
                    </Button>
                  </Link>

                  <Link href={`/impact?repoId=${repo.repoId}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Zap className="w-3.5 h-3.5" />}
                      className="w-full justify-center text-xs font-semibold"
                    >
                      Impact Analysis
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleIndex({ repoId: repo.repoId, branch: repo.branch || 'main' })}
                    isLoading={isIndexing}
                    icon={<RefreshCw className="w-3.5 h-3.5 text-blue-600" />}
                    className="w-full justify-center text-xs font-semibold"
                  >
                    Re-index
                  </Button>

                  {!repo.isDemo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRepo(repo.repoId, repo.repoName)}
                      isLoading={deletingRepoId === repo.repoId}
                      icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                      className="w-full justify-center text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-200"
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
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#3B82F6]" />
              <h2 className="text-base font-bold text-[#172033]">
                Connect &amp; Index Real Repository
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Parse real TypeScript, JavaScript, Python, or Go files from GitHub repositories or index your local workspace codebase.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleIndex({ isLocal: true })}
            isLoading={isIndexing}
            icon={<Boxes className="w-3.5 h-3.5 text-blue-600" />}
            className="font-bold text-xs"
          >
            Index Local Workspace (codewhy)
          </Button>
        </div>

        {/* Quick demo links */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Try Example:</span>
          {[
            'expressjs/express',
            'facebook/react',
            'vercel/next.js',
          ].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setLookupUrl(`https://github.com/${example}`);
                setCustomBranch('main');
              }}
              className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-slate-200 text-[#3B82F6] hover:bg-[#EBF2FF] hover:border-blue-300 transition-colors"
            >
              {example}
            </button>
          ))}
        </div>

        <form onSubmit={handleLookup} className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={lookupUrl}
                onChange={(e) => setLookupUrl(e.target.value)}
                placeholder="e.g. https://github.com/expressjs/express or owner/repo"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-[#F8FAFC] text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#3B82F6] focus:bg-white focus:ring-2 focus:ring-[#3B82F6]/15 transition-all"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLookingUp}
              disabled={!lookupUrl.trim()}
              className="shadow-xs font-bold"
            >
              Inspect Repository
            </Button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              onClick={() => setShowTokenInput(!showTokenInput)}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              <Key className="w-3.5 h-3.5" />
              {showTokenInput ? 'Hide Private Repository Token' : 'Add Private Repository Token (Optional)'}
            </button>
          </div>

          {showTokenInput && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <label className="block text-[11px] font-bold uppercase text-slate-500">
                GitHub Personal Access Token (for private repositories)
              </label>
              <input
                type="password"
                value={customToken}
                onChange={(e) => setCustomToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx (never logged or exposed)"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
              />
              <span className="text-[10px] text-slate-400 block">
                Token is sent securely over HTTPS directly to GitHub and never stored in frontend code.
              </span>
            </div>
          )}
        </form>

        {lookupError && (
          <Alert variant="error" title="Lookup Error">
            {lookupError}
          </Alert>
        )}

        {lookupResult && (
          <div className="mt-4 p-5 rounded-2xl border border-blue-200 bg-[#EBF2FF]/30 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-[#3B82F6] flex items-center justify-center">
                  <FolderGit2 className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <span className="font-bold text-sm text-[#172033] block">
                    {lookupResult.name}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Owner: {lookupResult.owner} · Default Branch: {lookupResult.defaultBranch || 'main'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {lookupResult.url && (
                  <a
                    href={lookupResult.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-[#3B82F6] hover:underline flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-2xs"
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
                  className="font-bold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Index &amp; Parse into Platform
                </Button>
              </div>
            </div>

            {lookupResult.description && (
              <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                {lookupResult.description}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-xs text-slate-600 pt-1 font-mono">
              <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                <span>Branch:</span>
                <input
                  type="text"
                  value={customBranch}
                  onChange={(e) => setCustomBranch(e.target.value)}
                  className="font-bold text-slate-900 border-b border-blue-500 outline-none w-24 px-1"
                />
              </div>
              <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200">
                Language: <strong className="text-[#8B5CF6]">{lookupResult.primaryLanguage || 'Multi-language'}</strong>
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
