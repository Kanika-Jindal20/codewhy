'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { TestGapAnalysisResult, TestGapItem } from '@/lib/gaps/test-gap-engine';

export function TestGapsClient() {
  const [activeRepo, setActiveRepo] = useState<{ repoId: string; repoName: string }>({
    repoId: 'commerce-core',
    repoName: 'acme/commerce-core',
  });
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
    async function loadActive() {
      try {
        const res = await fetch('/api/repositories');
        if (res.ok) {
          const repoData = await res.json();
          const active = repoData.repositories?.find((r: any) => r.isActive) || repoData.repositories?.[0];
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

  useEffect(() => {
    loadGaps();
  }, [activeRepo.repoId]);

  const copyTemplate = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
                <TestTube2 className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Reliability & Coverage Audit
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-xs font-medium text-slate-300">
                  Target Repo: <code className="font-semibold text-white font-mono bg-white/10 px-2 py-0.5 rounded">{activeRepo.repoName}</code>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Test Gap & Failure Path Finder
              </h1>

              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Identifies critical functions and execution paths that lack automated tests. Traces upstream caller chains to show why an untested function matters, and generates copyable test fixtures for immediate remediation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <Alert variant="error" title="Analysis Error">
          {error}
        </Alert>
      )}

      {/* Metrics Row */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Coverage Estimate
            </span>
            <span className="text-2xl font-black text-blue-600">
              {data.coverageEstimate.estimatedCoveragePercent}%
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Static AST estimate</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Tested Symbols
            </span>
            <span className="text-2xl font-black text-emerald-600">
              {data.coverageEstimate.testedSymbols}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Verified by tests</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Untested Symbols
            </span>
            <span className="text-2xl font-black text-rose-600">
              {data.coverageEstimate.untestedSymbols}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Lacking automated tests</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Critical Test Gaps
            </span>
            <span className="text-2xl font-black text-amber-600">
              {data.criticalGaps.filter((g) => g.priority === 'critical' || g.priority === 'high').length}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">High-coupling callers</span>
          </div>
        </div>
      )}

      {/* Gaps List */}
      {isLoading ? (
        <section className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 animate-pulse">
          Analyzing execution paths and test suite assertions...
        </section>
      ) : data?.criticalGaps.length === 0 ? (
        <section className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-600">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">Excellent Test Coverage</h3>
          <p className="text-xs text-slate-500 mt-1">
            All high-fan-in components and public exported interfaces have matching test suites.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Prioritized Untested Execution Paths
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Ranked by caller count and blast radius
            </span>
          </div>

          <div className="space-y-4">
            {data?.criticalGaps.map((gap) => (
              <div
                key={gap.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                        gap.priority === 'critical'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : gap.priority === 'high'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {gap.priority}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 font-mono">
                      {gap.symbolName}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {gap.filePath}{gap.line ? `:${gap.line}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/impact?targetNodeId=${encodeURIComponent(gap.id.replace('gap-', ''))}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Trace Blast Radius
                    </Link>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="text-slate-700 font-medium">
                    <span className="font-bold text-slate-900">Execution Flow: </span>
                    {gap.executionPathDescription}
                  </div>
                  <div className="text-rose-700 font-medium">
                    <span className="font-bold text-rose-950">Why It Matters: </span>
                    {gap.whyItMatters}
                  </div>
                </div>

                {/* Recommended Test Scenarios */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Recommended Test Scenarios
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {gap.recommendedTestCases.map((tc, idx) => (
                      <div key={idx} className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/70 text-xs space-y-1">
                        <div className="font-bold text-blue-900">{tc.name}</div>
                        <div className="text-slate-600 text-[11px]">{tc.scenario}</div>
                        <div className="text-[10px] font-mono text-blue-800 bg-white/70 p-1 rounded mt-1">
                          {tc.suggestedAssertion}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Copyable Test Fixture Code */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>Generated Test Suite Template</span>
                    <button
                      type="button"
                      onClick={() => copyTemplate(gap.id, gap.concreteTestCodeTemplate)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold"
                    >
                      {copiedId === gap.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Template</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 bg-[#0F172A] text-slate-200 text-xs rounded-xl font-mono overflow-x-auto border border-slate-800">
                    {gap.concreteTestCodeTemplate}
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
