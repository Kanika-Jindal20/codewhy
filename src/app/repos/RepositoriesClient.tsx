'use client';

import React, { useState } from 'react';
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
  primaryLanguage: string;
  description: string;
}

export function RepositoriesClient() {
  const [repos] = useState<RegisteredRepo[]>([
    {
      repoId: 'repo-commerce-core',
      repoName: 'acme/commerce-core',
      updatedAt: '2026-10-15T18:30:00Z',
      nodeCount: 24,
      edgeCount: 32,
      primaryLanguage: 'TypeScript',
      description: 'Core e-commerce session management, token verification, and checkout routing pipelines.',
    },
  ]);

  const [lookupUrl, setLookupUrl] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Neo4j Indexing State
  const [isIndexingNeo4j, setIsIndexingNeo4j] = useState(false);
  const [neo4jIndexStatus, setNeo4jIndexStatus] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  const handleIndexIntoNeo4j = async (targetRepoId: string) => {
    setIsIndexingNeo4j(true);
    setNeo4jIndexStatus(null);
    try {
      const res = await fetch('/api/repositories/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId: targetRepoId, useSample: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNeo4jIndexStatus({
          success: true,
          message: `Indexed into Neo4j: ${data.nodesIndexed} code nodes, ${data.edgesIndexed} relationships.`,
        });
      } else {
        setNeo4jIndexStatus({
          success: false,
          error: data.error || 'Neo4j connection inactive. Set NEO4J_URI in .env.',
        });
      }
    } catch (err: unknown) {
      setNeo4jIndexStatus({
        success: false,
        error: err instanceof Error ? err.message : 'Network error indexing into Neo4j.',
      });
    } finally {
      setIsIndexingNeo4j(false);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: lookupUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to lookup repository');
      }
      setLookupResult(data.repository);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Error checking repository');
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
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
                Manage indexed codebases, explore verified entity graphs, or inspect public GitHub repositories.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3.5 py-2 rounded-xl bg-white/20 backdrop-blur-sm text-white border border-white/30 flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              1 Active Repository Indexed
            </span>
          </div>
        </div>
      </header>

      {/* Active Repositories List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#172033]">
              Active Indexed Repositories
            </h2>
            <p className="text-xs text-text-secondary">
              Fully parsed AST knowledge graph ready for architectural reasoning.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {repos.map((repo) => (
            <div
              key={repo.repoId}
              className="bg-white border border-app-border rounded-3xl p-6 sm:p-8 transition-all hover:shadow-card shadow-xs space-y-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="space-y-3.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] text-white flex items-center justify-center shadow-xs">
                      <FolderGit2 className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#172033]">
                        {repo.repoName}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          AST Verified & Indexed
                        </span>
                        <span className="text-slate-400 text-xs">·</span>
                        <span className="text-xs text-text-muted font-mono">
                          ID: {repo.repoId}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                    {repo.description}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-app-border">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                        <GitBranch className="w-3.5 h-3.5 text-[#3B82F6]" />
                        Branch
                      </div>
                      <div className="text-xs font-mono font-bold text-[#172033] mt-1">
                        main
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-app-border">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                        <FileCode className="w-3.5 h-3.5 text-[#8B5CF6]" />
                        Language
                      </div>
                      <div className="text-xs font-bold text-[#8B5CF6] mt-1">
                        {repo.primaryLanguage}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-app-border">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                        <Network className="w-3.5 h-3.5 text-teal-600" />
                        Graph Size
                      </div>
                      <div className="text-xs font-bold text-teal-700 mt-1">
                        {repo.nodeCount} nodes · {repo.edgeCount} edges
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F8FAFC] border border-app-border">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Last Sync
                      </div>
                      <div className="text-xs font-mono font-medium text-text-secondary mt-1">
                        {new Date(repo.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {neo4jIndexStatus && (
                    <div className={`p-3.5 rounded-2xl text-xs font-bold border transition-all ${
                      neo4jIndexStatus.success
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-amber-50 border-amber-300 text-amber-900'
                    }`}>
                      {neo4jIndexStatus.success ? '✓ ' : '⚠️ '}
                      {neo4jIndexStatus.message || neo4jIndexStatus.error}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap lg:flex-col items-stretch gap-2.5 shrink-0 pt-2 lg:pt-0 min-w-[190px]">
                  <button
                    onClick={() => handleIndexIntoNeo4j(repo.repoId)}
                    disabled={isIndexingNeo4j}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
                  >
                    {isIndexingNeo4j ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Indexing into Neo4j…</span>
                      </>
                    ) : (
                      <>
                        <Network className="w-3.5 h-3.5" />
                        <span>Index into Neo4j</span>
                      </>
                    )}
                  </button>
                  <Link href="/architecture">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Compass className="w-3.5 h-3.5 text-[#8B5CF6]" />}
                      className="w-full justify-center text-[#8B5CF6] hover:bg-purple-50"
                    >
                      Architecture Graph
                    </Button>
                  </Link>
                  <Link href="/impact">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Zap className="w-3.5 h-3.5" />}
                      className="w-full justify-center"
                    >
                      Impact Blast Radius
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Connect / Lookup Repository Section */}
      <section className="bg-white border border-app-border rounded-3xl p-6 sm:p-8 space-y-4 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#3B82F6]" />
            <h2 className="text-base font-bold text-[#172033]">
              Connect & Inspect GitHub Repository
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Look up any public GitHub repository to inspect its metadata, branch structure, and AST readiness.
          </p>
        </div>

        {/* Quick demo links */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Try Example:</span>
          {[
            'expressjs/express',
            'facebook/react',
            'vercel/next.js',
          ].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setLookupUrl(`https://github.com/${example}`)}
              className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-app-border text-[#3B82F6] hover:bg-[#EBF2FF] hover:border-blue-300 transition-colors"
            >
              {example}
            </button>
          ))}
        </div>

        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={lookupUrl}
              onChange={(e) => setLookupUrl(e.target.value)}
              placeholder="e.g. https://github.com/expressjs/express or owner/repo"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-app-border bg-[#F8FAFC] text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[#3B82F6] focus:bg-white focus:ring-2 focus:ring-[#3B82F6]/15 transition-all"
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
        </form>

        {lookupError && (
          <Alert type="error" title="Lookup Error">
            {lookupError}
          </Alert>
        )}

        {lookupResult && (
          <div className="mt-4 p-5 rounded-2xl border border-blue-200 bg-[#EBF2FF]/30 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-[#3B82F6] flex items-center justify-center">
                  <FolderGit2 className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <span className="font-bold text-sm text-[#172033] block">
                    {lookupResult.fullName || lookupResult.name}
                  </span>
                  <span className="text-[11px] text-text-muted font-mono">
                    Public GitHub Repository
                  </span>
                </div>
              </div>
              {lookupResult.url && (
                <a
                  href={lookupResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-[#3B82F6] hover:underline flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-2xs"
                >
                  Open in GitHub <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {lookupResult.description && (
              <p className="text-xs text-text-secondary leading-relaxed bg-white p-3 rounded-xl border border-app-border">
                {lookupResult.description}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-xs text-text-secondary pt-1 font-mono">
              <span className="px-2.5 py-1 rounded-md bg-white border border-app-border">
                Default Branch: <strong className="text-[#172033]">{lookupResult.defaultBranch || 'main'}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-app-border">
                Language: <strong className="text-[#8B5CF6]">{lookupResult.language || 'Multi-language'}</strong>
              </span>
              {lookupResult.stars !== undefined && (
                <span className="px-2.5 py-1 rounded-md bg-white border border-app-border">
                  Stars: <strong className="text-amber-600">{lookupResult.stars}</strong>
                </span>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
