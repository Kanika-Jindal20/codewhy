'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GitPullRequest,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink,
  FileCode,
  Zap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { PullRequestRiskReview } from '@/lib/pr/pr-reviewer';

export function PrReviewerClient() {
  const [activeRepo, setActiveRepo] = useState<{ repoId: string; repoName: string }>({
    repoId: 'commerce-core',
    repoName: 'acme/commerce-core',
  });
  const [prUrl, setPrUrl] = useState<string>('https://github.com/acme/commerce-core/pull/42');
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [review, setReview] = useState<PullRequestRiskReview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadActive() {
      try {
        const res = await fetch('/api/repositories');
        if (res.ok) {
          const data = await res.json();
          const active = data.repositories?.find((r: any) => r.isActive) || data.repositories?.[0];
          if (active) {
            setActiveRepo({ repoId: active.repoId, repoName: active.repoName });
          }
        }
      } catch {
        // Fallback
      }
    }
    loadActive();
  }, []);

  const handleReview = async () => {
    setIsReviewing(true);
    setError(null);
    try {
      const res = await fetch('/api/pr-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoId: activeRepo.repoId,
          prUrl: prUrl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to review pull request.');
      setReview(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during PR review.');
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="font-['Inter',sans-serif] max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#14213D] via-[#1E2E4F] to-[#2B3E68] text-white rounded-3xl p-7 sm:p-9 shadow-elevated border border-slate-700/50">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 rounded-full bg-[#3B82F6]/25 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-12 w-72 h-72 rounded-full bg-[#8B5CF6]/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/20 p-1 flex items-center justify-center shrink-0 shadow-lg">
              <div className="w-full h-full rounded-xl bg-gradient-to-tr from-[#3B82F6] via-[#6366F1] to-[#8B5CF6] text-white flex items-center justify-center shadow-glowBlue">
                <GitPullRequest className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Pre-Merge Intelligence
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-xs font-medium text-slate-300">
                  Target Repo: <code className="font-semibold text-white font-mono bg-white/10 px-2 py-0.5 rounded">{activeRepo.repoName}</code>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                AI Pull Request Risk Reviewer
              </h1>

              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Connect a GitHub Pull Request URL or diff. The reviewer cross-references changed files with the indexed dependency graph, flags breaking contracts, identifies downstream consumers, and locates missing test coverage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Input Formulation Card */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            GitHub Pull Request URL
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={prUrl}
                onChange={(e) => setPrUrl(e.target.value)}
                placeholder="https://github.com/owner/repo/pull/123"
                className="w-full px-4 py-3 text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner font-mono"
                disabled={isReviewing}
              />
            </div>
            <Button
              variant="primary"
              size="md"
              disabled={isReviewing || !prUrl.trim()}
              onClick={() => handleReview()}
              icon={isReviewing ? undefined : <Play className="w-4 h-4 fill-white" />}
              className="bg-[#3B82F6] hover:bg-[#2563EB] shadow-glowBlue text-white font-bold px-6 shrink-0"
            >
              {isReviewing ? 'Analyzing PR...' : 'Audit Pull Request'}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="error" title="PR Review Error">
            {error}
          </Alert>
        )}
      </section>

      {/* Review Running Skeleton */}
      {isReviewing && (
        <section className="bg-white rounded-2xl border border-blue-200 p-8 shadow-sm text-center space-y-4 animate-pulse">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Sparkles className="w-7 h-7 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Correlating Pull Request Changes With Knowledge Graph
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Scanning modified files, mapping AST callers, and auditing test verification...
            </p>
          </div>
        </section>
      )}

      {/* Review Results */}
      {review && !isReviewing && (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Risk Tier
              </span>
              <span
                className={`text-2xl font-black uppercase ${
                  review.overallRiskLevel === 'critical'
                    ? 'text-rose-600'
                    : review.overallRiskLevel === 'high'
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {review.overallRiskLevel}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">Overall PR assessment</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Files Changed
              </span>
              <span className="text-2xl font-black text-slate-900">
                {review.totalFilesChanged}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">In this PR</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Downstream Reach
              </span>
              <span className="text-2xl font-black text-purple-600">
                {review.downstreamComponentsAffected}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">Callers in blast radius</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Untested Changes
              </span>
              <span className="text-2xl font-black text-rose-600">
                {review.untestedChangesCount}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">Files lacking tests</span>
            </div>
          </div>

          {/* Review Summary */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                  Architectural PR Risk Summary
                </h2>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {review.aiReasoned ? 'Sarvam AI 105B Grounded' : 'Deterministic AST Graph Heuristics'}
              </span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
              {review.reviewSummary}
            </p>
          </section>

          {/* File-by-File Breakdown Table */}
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Changed Files Impact Matrix
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {review.fileRisks.length} files audited
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {review.fileRisks.map((file, idx) => (
                <div key={idx} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          file.riskLevel === 'critical'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : file.riskLevel === 'high'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {file.riskLevel}
                      </span>
                      <span className="font-mono font-bold text-slate-900">{file.filename}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">({file.status})</span>
                    </div>
                    <p className="text-slate-600">{file.reason}</p>
                    {file.directCallers.length > 0 && (
                      <p className="text-[11px] text-purple-700">
                        Direct callers: {file.directCallers.join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={file.hasTests ? 'text-emerald-600 font-semibold text-[11px]' : 'text-rose-600 font-bold text-[11px]'}>
                      {file.hasTests ? '✓ Verified by Tests' : '⚠ Untested'}
                    </span>
                    {file.nodeId && (
                      <Link
                        href={`/impact?targetNodeId=${encodeURIComponent(file.nodeId)}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 ml-2"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Impact
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Prioritized Findings & Mitigation Checklist */}
          {review.prioritizedFindings.length > 0 && (
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                Prioritized Pre-Merge Recommendations
              </h2>
              <div className="space-y-3">
                {review.prioritizedFindings.map((finding, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <h3 className="text-xs font-bold text-slate-900">{finding.title}</h3>
                    </div>
                    <p className="text-xs text-slate-600">{finding.description}</p>
                    <div className="text-[11px] text-blue-800 bg-blue-50/80 px-3 py-1.5 rounded-lg border border-blue-100 font-medium">
                      Action Required: {finding.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
