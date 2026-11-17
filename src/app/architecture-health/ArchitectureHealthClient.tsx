'use client';

import React, { useState, useEffect } from 'react';
import { useActiveRepo } from '@/lib/repositories/active-repo-client';
import Link from 'next/link';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Compass,
  FileCode,
  ShieldAlert,
  FolderGit2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { ArchitectureHealthReport } from '@/lib/health/health-score';

export function ArchitectureHealthClient() {
  const { activeRepo } = useActiveRepo();
  const [report, setReport] = useState<ArchitectureHealthReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/health-score?repoId=${encodeURIComponent(activeRepo.repoId)}`);
      if (!res.ok) throw new Error('Failed to load architecture health score.');
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while calculating health score.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, [activeRepo.repoId]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Page Header */}
      <div className="bg-white border border-border-default rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-brand-emerald/10 text-brand-deep border border-brand-emerald/20">
              <Activity className="w-3 h-3 text-brand-emerald" />
              Governance & Reliability
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-muted text-ink-muted border border-border-subtle font-mono">
              AST Verified
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink-primary tracking-tight">
            Architecture Health Score
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl">
            A mathematically grounded audit derived strictly from verified AST links, cycle paths, and test coverage. Zero arbitrary numbers; every score explains its formula and contributors.
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
        <Alert type="error" title="Health Score Error">
          {error}
        </Alert>
      )}

      {isLoading ? (
        <section className="bg-white rounded-xl border border-border-default p-8 text-center text-xs text-ink-muted animate-pulse">
          Computing graph metrics, cycle detection, and test coverage ratios...
        </section>
      ) : report && (
        <div className="space-y-6">
          {/* Main Score Hero Card */}
          <section className="bg-white rounded-xl border border-border-default p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-faint">
                Composite Architecture Health
              </span>
              <div className="flex items-baseline justify-center md:justify-start gap-3">
                <span className="text-5xl font-semibold font-mono text-ink-primary tracking-tight">
                  {report.overallScore}
                </span>
                <span className="text-lg font-mono text-ink-faint">/ 100</span>
                <Badge
                  variant={report.overallScore >= 80 ? 'success' : report.overallScore >= 60 ? 'warning' : 'error'}
                  size="sm"
                >
                  {report.tier}
                </Badge>
              </div>
              <p className="text-xs text-ink-muted max-w-xl leading-relaxed">
                {report.summaryExplanation}
              </p>
            </div>

            <div className="flex gap-2.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadHealth()}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Re-calculate
              </Button>
              <Link href="/impact">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Zap className="w-3.5 h-3.5" />}
                >
                  Analyze Impact
                </Button>
              </Link>
            </div>
          </section>

          {/* Metric Cards Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.metrics.map((metric) => (
              <div
                key={metric.id}
                className="bg-white rounded-xl border border-border-default p-5 shadow-xs space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-ink-primary">{metric.name}</h3>
                    <span className="text-[10px] font-mono text-ink-faint">Weight: {(metric.weight * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-semibold font-mono text-ink-primary">{metric.score}</span>
                    <span className="text-xs font-mono text-ink-faint">/100</span>
                  </div>
                </div>

                {/* Formula Bar */}
                <div className="p-2.5 bg-surface-secondary rounded-lg border border-border-subtle text-[11px] space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-ink-faint block">
                    Formula:
                  </span>
                  <code className="text-brand-deep font-mono block">{metric.formulaExplanation}</code>
                </div>

                {/* Contributing Components */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-ink-faint block">
                    Top Contributing Components:
                  </span>
                  {metric.contributingComponents.map((comp) => (
                    <div
                      key={comp.id}
                      className="flex items-center justify-between text-xs p-2 rounded-md bg-surface-secondary border border-border-subtle"
                    >
                      <span className="font-mono text-xs font-medium text-ink-primary truncate max-w-[220px]">
                        {comp.label}
                      </span>
                      <span className="text-[11px] font-mono text-ink-muted">{comp.impact}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Circular Dependencies Panel */}
          <section className="bg-white rounded-xl border border-border-default p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h2 className="text-xs font-semibold text-ink-primary uppercase tracking-wider">
                  Circular Dependency Loops ({report.circularDependencies.length})
                </h2>
              </div>
              <span className="text-[11px] font-mono text-ink-faint">
                {report.circularDependencies.length === 0 ? '✓ Zero Cycles Detected' : 'Requires Decoupling'}
              </span>
            </div>

            {report.circularDependencies.length === 0 ? (
              <div className="p-3 bg-brand-emerald/5 rounded-lg border border-brand-emerald/20 text-xs text-brand-deep flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>No circular dependency cycles found. Graph structure is strictly hierarchical or acyclic.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {report.circularDependencies.map((cycle, idx) => (
                  <div key={idx} className="p-3 bg-rose-50/60 border border-rose-200 rounded-lg text-xs space-y-1">
                    <span className="font-semibold text-rose-900 block text-[11px]">Cycle Loop #{idx + 1}:</span>
                    <div className="font-mono text-rose-700 text-xs">
                      {cycle.join(' → ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Top Bottlenecks and Hubs */}
          <section className="bg-white rounded-xl border border-border-default p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-semibold text-ink-primary uppercase tracking-wider pb-2 border-b border-border-subtle">
              High-Coupling Bottlenecks & Single Points of Failure
            </h2>
            <div className="divide-y divide-border-subtle text-xs">
              {report.topBottlenecks.map((b) => (
                <div key={b.nodeId} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-ink-primary">{b.label}</span>
                      <span className="font-mono text-[11px] text-ink-faint truncate">{b.filePath}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[11px] text-ink-muted">
                      <span>{b.dependentsCount} downstream dependents</span>
                      <span>•</span>
                      <span className={b.hasTests ? 'text-brand-deep font-medium' : 'text-rose-600 font-medium'}>
                        {b.hasTests ? '✓ Tested' : '⚠ Untested'}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/impact?targetNodeId=${encodeURIComponent(b.nodeId)}`}
                    className="text-xs font-medium text-brand-deep hover:underline flex items-center gap-1 shrink-0"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Blast Radius &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}