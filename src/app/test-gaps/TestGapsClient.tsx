'use client';

import React, { useState, useEffect } from 'react';
import { useActiveRepo } from '@/lib/repositories/active-repo-client';
import Link from 'next/link';
import {
  TestTube2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Copy,
  Check,
  Zap,
  ArrowRight,
  ExternalLink,
  Sparkles,
  FileCode,
  FolderGit2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { TestGapAnalysisResult, TestGapItem } from '@/lib/gaps/test-gap-engine';

export function TestGapsClient() {
  const { activeRepo } = useActiveRepo();
  const [data, setData] = useState<TestGapAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadGaps = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/test-gaps?repoId=${encodeURIComponent(activeRepo.repoId)}`);
      if (!res.ok) throw new Error('Failed to retrieve test gap analysis.');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Failed to load test gap data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGaps();
  }, [activeRepo.repoId]);

  const copyTemplate = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Page Header */}
      <div className="bg-white border border-border-default rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-brand-emerald/10 text-brand-deep border border-brand-emerald/20">
              <TestTube2 className="w-3 h-3 text-brand-emerald" />
              Coverage Verification
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-muted text-ink-muted border border-border-subtle font-mono">
              Path Analysis
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink-primary tracking-tight">
            Test Gap & Failure Path Finder
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl">
            Audit critical functions and paths lacking test assertions. Trace upstream callers and generate copyable test fixtures for immediate remediation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <div className="flex items-center gap-2 rounded-lg border border-border-default bg-surface-secondary px-3 py-1.5 text-xs text-ink-secondary">
            <FolderGit2 className="w-3.5 h-3.5 text-ink-muted" />
            <span className="font-mono font-medium">{activeRepo.repoName}</span>
          </div>
        </div>
      </div>

      {error && (
        <Alert type="error" title="Analysis Error">
          {error}
        </Alert>
      )}

      {/* Metrics Row */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-border-default shadow-xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-ink-faint block mb-1">
              Coverage Estimate
            </span>
            <span className="text-2xl font-semibold font-mono text-ink-primary">
              {data.coverageEstimate.estimatedCoveragePercent}%
            </span>
            <span className="text-[10px] text-ink-muted block mt-0.5">AST path estimate</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-border-default shadow-xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-brand-deep block mb-1">
              Tested Symbols
            </span>
            <span className="text-2xl font-semibold font-mono text-brand-deep">
              {data.coverageEstimate.testedSymbols}
            </span>
            <span className="text-[10px] text-ink-muted block mt-0.5">Verified by tests</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-border-default shadow-xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-rose-600 block mb-1">
              Untested Symbols
            </span>
            <span className="text-2xl font-semibold font-mono text-rose-600">
              {data.coverageEstimate.untestedSymbols}
            </span>
            <span className="text-[10px] text-ink-muted block mt-0.5">Missing automated tests</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-border-default shadow-xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-600 block mb-1">
              Critical Test Gaps
            </span>
            <span className="text-2xl font-semibold font-mono text-amber-600">
              {data.criticalGaps.filter((g) => g.priority === 'critical' || g.priority === 'high').length}
            </span>
            <span className="text-[10px] text-ink-muted block mt-0.5">High-fan-in callers</span>
          </div>
        </div>
      )}

      {/* Gaps List */}
      {isLoading ? (
        <section className="bg-white rounded-xl border border-border-default p-8 text-center text-xs text-ink-muted animate-pulse">
          Analyzing execution paths and test suite assertions...
        </section>
      ) : data?.criticalGaps.length === 0 ? (
        <section className="bg-white rounded-xl border border-border-default p-8 text-center text-xs text-ink-secondary">
          <CheckCircle2 className="w-8 h-8 text-brand-deep mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-ink-primary">Excellent Test Coverage</h3>
          <p className="text-xs text-ink-muted mt-0.5">
            All high-fan-in components and public exported interfaces have matching test suites.
          </p>
        </section>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-primary">
              Prioritized Untested Execution Paths
            </h2>
            <span className="text-xs text-ink-muted">
              Ranked by caller count and blast radius
            </span>
          </div>

          <div className="space-y-3">
            {data?.criticalGaps.map((gap) => (
              <div
                key={gap.id}
                className="bg-white rounded-xl border border-border-default p-5 shadow-xs hover:border-border-strong transition-all space-y-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={
                        gap.priority === 'critical'
                          ? 'error'
                          : gap.priority === 'high'
                          ? 'warning'
                          : 'info'
                      }
                      size="sm"
                    >
                      {gap.priority}
                    </Badge>
                    <h3 className="text-xs sm:text-sm font-semibold text-ink-primary font-mono">
                      {gap.symbolName}
                    </h3>
                    <span className="text-xs text-ink-faint font-mono">
                      {gap.filePath}{gap.line ? `:${gap.line}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/impact?targetNodeId=${encodeURIComponent(gap.id.replace('gap-', ''))}`}
                      className="text-xs font-medium text-brand-deep hover:underline flex items-center gap-1"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Trace Blast Radius &rarr;
                    </Link>
                  </div>
                </div>

                <div className="p-3 bg-surface-secondary rounded-lg border border-border-subtle text-xs space-y-1">
                  <div className="text-ink-secondary">
                    <strong className="text-ink-primary font-medium">Execution Flow: </strong>
                    {gap.executionPathDescription}
                  </div>
                  <div className="text-amber-800">
                    <strong className="text-amber-950 font-medium">Why It Matters: </strong>
                    {gap.whyItMatters}
                  </div>
                </div>

                {/* Recommended Test Scenarios */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-ink-faint">
                    Recommended Test Scenarios
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {gap.recommendedTestCases.map((tc, idx) => (
                      <div key={idx} className="p-3 bg-surface-secondary rounded-lg border border-border-subtle text-xs space-y-1">
                        <div className="font-semibold text-ink-primary">{tc.name}</div>
                        <div className="text-ink-muted text-[11px]">{tc.scenario}</div>
                        <div className="text-[10px] font-mono text-brand-deep bg-white p-1 rounded border border-border-subtle mt-1 truncate">
                          {tc.suggestedAssertion}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Copyable Test Fixture Code */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted">
                    <span>Generated Test Suite Template</span>
                    <button
                      type="button"
                      onClick={() => copyTemplate(gap.id, gap.concreteTestCodeTemplate)}
                      className="flex items-center gap-1 text-brand-deep hover:underline font-medium"
                    >
                      {copiedId === gap.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-brand-deep" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Template</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 bg-surface-secondary text-ink-primary text-xs rounded-lg font-mono overflow-x-auto border border-border-default">
                    <code>{gap.concreteTestCodeTemplate}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}