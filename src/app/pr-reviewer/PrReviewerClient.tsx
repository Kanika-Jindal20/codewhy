'use client';

import React, { useState } from 'react';
import { useActiveRepo } from '@/lib/repositories/active-repo-client';
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
  FolderGit2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { PullRequestRiskReview } from '@/lib/pr/pr-reviewer';

export function PrReviewerClient() {
  const { activeRepo } = useActiveRepo();
  const [prUrl, setPrUrl] = useState<string>('https://github.com/acme/commerce-core/pull/42');
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [review, setReview] = useState<PullRequestRiskReview | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Page Header */}
      <div className="bg-white border border-border-default rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-brand-emerald/10 text-brand-deep border border-brand-emerald/20">
              <GitPullRequest className="w-3 h-3 text-brand-emerald" />
              Pre-Merge Gate
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-muted text-ink-muted border border-border-subtle font-mono">
              AST Cross-Reference
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink-primary tracking-tight">
            PR Risk Reviewer
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl">
            Audit GitHub Pull Requests against the repository dependency graph. Detect breaking contract changes, unverified callers, and test gaps before merging.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <div className="flex items-center gap-2 rounded-lg border border-border-default bg-surface-secondary px-3 py-1.5 text-xs text-ink-secondary">
            <FolderGit2 className="w-3.5 h-3.5 text-ink-muted" />
            <span className="font-mono font-medium">{activeRepo.repoName}</span>
          </div>
        </div>
      </div>

      {/* Input Formulation Card */}
      <section className="bg-white rounded-xl border border-border-default p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-primary mb-2">
            GitHub Pull Request URL
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={prUrl}
                onChange={(e) => setPrUrl(e.target.value)}
                placeholder="https://github.com/owner/repo/pull/123"
                className="w-full px-3.5 py-2 text-xs text-ink-primary bg-surface-secondary border border-border-default rounded-lg focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/30 focus:bg-white transition-all font-mono"
                disabled={isReviewing}
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              disabled={isReviewing || !prUrl.trim()}
              onClick={() => handleReview()}
              icon={isReviewing ? undefined : <Play className="w-3.5 h-3.5" />}
              isLoading={isReviewing}
              className="shrink-0"
            >
              Audit Pull Request
            </Button>
          </div>
        </div>

        {error && (
          <Alert type="error" title="PR Review Error">
            {error}
          </Alert>
        )}
      </section>

      {/* Review Running Skeleton */}
      {isReviewing && (
        <section className="bg-white rounded-xl border border-border-default p-8 shadow-xs text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-lg bg-brand-emerald/10 text-brand-deep flex items-center justify-center">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink-primary">
              Correlating Pull Request Changes With Knowledge Graph
            </h3>
            <p className="text-xs text-ink-muted max-w-md mx-auto mt-0.5">
              Scanning modified files, mapping AST callers, and auditing test verification...
            </p>
          </div>
        </section>
      )}

      {/* Review Results */}
      {review && !isReviewing && (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-border-default shadow-xs">
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-faint block mb-1">
                Risk Tier
              </span>
              <span
                className={`text-2xl font-semibold font-mono uppercase ${
                  review.overallRiskLevel === 'critical'
                    ? 'text-rose-600'
                    : review.overallRiskLevel === 'high'
                    ? 'text-amber-600'
                    : 'text-brand-deep'
                }`}
              >
                {review.overallRiskLevel}
              </span>
              <span className="text-[11px] text-ink-muted block mt-0.5">Overall PR risk score</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-border-default shadow-xs">
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-faint block mb-1">
                Files Changed
              </span>
              <span className="text-2xl font-semibold font-mono text-ink-primary">
                {review.totalFilesChanged}
              </span>
              <span className="text-[11px] text-ink-muted block mt-0.5">In this PR revision</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-border-default shadow-xs">
              <span className="text-[11px] font-mono uppercase tracking-wider text-purple-600 block mb-1">
                Downstream Reach
              </span>
              <span className="text-2xl font-semibold font-mono text-purple-600">
                {review.downstreamComponentsAffected}
              </span>
              <span className="text-[11px] text-ink-muted block mt-0.5">Callers in blast radius</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-border-default shadow-xs">
              <span className="text-[11px] font-mono uppercase tracking-wider text-rose-600 block mb-1">
                Untested Changes
              </span>
              <span className="text-2xl font-semibold font-mono text-rose-600">
                {review.untestedChangesCount}
              </span>
              <span className="text-[11px] text-ink-muted block mt-0.5">Files lacking tests</span>
            </div>
          </div>

          {/* Review Summary */}
          <section className="bg-white rounded-xl border border-border-default p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-deep" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-primary">
                  Architectural PR Risk Summary
                </h2>
              </div>
              <Badge variant={review.aiReasoned ? 'success' : 'outline'} size="sm">
                {review.aiReasoned ? 'Sarvam AI Grounded' : 'Deterministic AST'}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed font-normal whitespace-pre-line">
              {review.reviewSummary}
            </p>
          </section>

          {/* File-by-File Breakdown Table */}
          <section className="bg-white rounded-xl border border-border-default overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 border-b border-border-subtle flex items-center justify-between bg-surface-secondary">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-primary">
                Changed Files Impact Matrix
              </h2>
              <span className="text-[11px] font-mono text-ink-faint">
                {review.fileRisks.length} files audited
              </span>
            </div>

            <div className="divide-y divide-border-subtle text-xs">
              {review.fileRisks.map((file, idx) => (
                <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-secondary transition-colors">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={
                          file.riskLevel === 'critical'
                            ? 'error'
                            : file.riskLevel === 'high'
                            ? 'warning'
                            : 'success'
                        }
                        size="sm"
                      >
                        {file.riskLevel}
                      </Badge>
                      <span className="font-mono font-medium text-ink-primary">{file.filename}</span>
                      <span className="text-[10px] font-mono uppercase text-ink-faint">({file.status})</span>
                    </div>
                    <p className="text-xs text-ink-muted">{file.reason}</p>
                    {file.directCallers.length > 0 && (
                      <p className="text-[11px] font-mono text-purple-700">
                        Direct callers: {file.directCallers.join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={file.hasTests ? 'text-brand-deep font-medium text-xs' : 'text-rose-600 font-medium text-xs'}>
                      {file.hasTests ? '✓ Tested' : '⚠ Untested'}
                    </span>
                    {file.nodeId && (
                      <Link
                        href={`/impact?targetNodeId=${encodeURIComponent(file.nodeId)}`}
                        className="text-xs font-medium text-brand-deep hover:underline flex items-center gap-1 ml-1"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Impact &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Prioritized Findings & Mitigation Checklist */}
          {review.prioritizedFindings.length > 0 && (
            <section className="bg-white rounded-xl border border-border-default p-5 sm:p-6 shadow-xs space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-primary">
                Prioritized Pre-Merge Recommendations
              </h2>
              <div className="space-y-2.5">
                {review.prioritizedFindings.map((finding, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg border border-border-subtle bg-surface-secondary space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <h3 className="text-xs font-semibold text-ink-primary">{finding.title}</h3>
                    </div>
                    <p className="text-xs text-ink-muted">{finding.description}</p>
                    <div className="text-[11px] text-ink-secondary bg-white px-2.5 py-1 rounded border border-border-subtle font-medium mt-1">
                      <strong className="text-ink-primary">Action:</strong> {finding.recommendation}
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