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
    <div className="font-['Inter',sans-serif] max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#14213D] via-[#1E2E4F] to-[#2B3E68] text-white rounded-3xl p-7 sm:p-9 shadow-elevated border border-slate-700/50">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 rounded-full bg-[#3B82F6]/25 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-12 w-72 h-72 rounded-full bg-[#8B5CF6]/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/20 p-1 flex items-center justify-center shrink-0 shadow-lg">
              <div className="w-full h-full rounded-xl bg-gradient-to-tr from-[#3B82F6] via-[#6366F1] to-[#8B5CF6] text-white flex items-center justify-center shadow-glowBlue">
                <Activity className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Explainable Governance
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-xs font-medium text-slate-300">
                  Target Repo: <code className="font-semibold text-white font-mono bg-white/10 px-2 py-0.5 rounded">{activeRepo.repoName}</code>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Explainable Architecture Health Score
              </h1>

              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                A mathematically grounded health audit derived strictly from verified AST links, circular cycle paths, and automated test coverage. Zero arbitrary numbers; every score shows its formula and contributing components.
              </p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <Alert variant="error" title="Health Score Error">
          {error}
        </Alert>
      )}

      {isLoading ? (
        <section className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 animate-pulse">
          Computing graph metrics, cycle detection, and test coverage ratios...
        </section>
      ) : report && (
        <div className="space-y-6">
          {/* Main Score Hero Card */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Composite Architecture Health
              </span>
              <div className="flex items-baseline justify-center md:justify-start gap-3">
                <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight">
                  {report.overallScore}
                </span>
                <span className="text-xl font-bold text-slate-400">/ 100</span>
                <span
                  className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${
                    report.overallScore >= 80
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : report.overallScore >= 60
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {report.tier}
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                {report.summaryExplanation}
              </p>
            </div>

            <div className="flex gap-3 shrink-0">
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
                  className="bg-[#3B82F6] hover:bg-[#2563EB] shadow-glowBlue text-white font-bold"
                >
                  Analyze Impact
                </Button>
              </Link>
            </div>
          </section>

          {/* Metric Cards Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {report.metrics.map((metric) => (
              <div
                key={metric.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-900">{metric.name}</h3>
                    <span className="text-[11px] font-mono text-slate-400">Weight: {(metric.weight * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-slate-900">{metric.score}</span>
                    <span className="text-xs text-slate-400">/100</span>
                  </div>
                </div>

                {/* Formula Bar */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] space-y-1">
                  <span className="font-bold text-slate-500 uppercase block text-[10px]">
                    Calculation Formula:
                  </span>
                  <code className="text-blue-700 font-mono block">{metric.formulaExplanation}</code>
                </div>

                {/* Contributing Components */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Top Contributing Components:
                  </span>
                  {metric.contributingComponents.map((comp) => (
                    <div
                      key={comp.id}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50/60 border border-slate-100"
                    >
                      <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                        {comp.label}
                      </span>
                      <span className="text-[11px] text-slate-500">{comp.impact}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Circular Dependencies Panel */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Circular Dependency Loops ({report.circularDependencies.length})
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                {report.circularDependencies.length === 0 ? '✓ Zero Cycles Detected' : 'Requires Decoupling'}
              </span>
            </div>

            {report.circularDependencies.length === 0 ? (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
                No circular dependency cycles were found. Graph structure is strictly hierarchical or acyclic.
              </div>
            ) : (
              <div className="space-y-2">
                {report.circularDependencies.map((cycle, idx) => (
                  <div key={idx} className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-rose-900 block text-[11px]">Cycle Loop #{idx + 1}:</span>
                    <div className="font-mono text-rose-700 font-medium">
                      {cycle.join(' → ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Top Bottlenecks and Hubs */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              High-Coupling Bottlenecks & Single Points of Failure
            </h2>
            <div className="divide-y divide-slate-100 text-xs">
              {report.topBottlenecks.map((b) => (
                <div key={b.nodeId} className="py-3 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{b.label}</span>
                      <span className="font-mono text-[11px] text-slate-400">{b.filePath}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span>{b.dependentsCount} downstream dependents</span>
                      <span>·</span>
                      <span className={b.hasTests ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-bold'}>
                        {b.hasTests ? '✓ Tested' : '⚠ Untested'}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/impact?targetNodeId=${encodeURIComponent(b.nodeId)}`}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 shrink-0"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Blast Radius
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
