'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Bot,
  Play,
  RotateCcw,
  ShieldAlert,
  FolderGit2,
  FileCode,
  Layers,
  ChevronRight,
  ExternalLink,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { AutonomousInvestigationResult } from '@/lib/investigator/autonomous-engine';

const GOAL_SUGGESTIONS = [
  'Investigate the riskiest parts and single points of failure in this codebase.',
  'Audit authentication and security authorization boundaries.',
  'Find high-coupling components that lack automated regression tests.',
  'Trace failure propagation paths and downstream dependencies.',
];

export function InvestigatorClient() {
  const [activeRepo, setActiveRepo] = useState<{ repoId: string; repoName: string }>({
    repoId: 'commerce-core',
    repoName: 'acme/commerce-core',
  });
  const [goal, setGoal] = useState<string>(GOAL_SUGGESTIONS[0]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<AutonomousInvestigationResult | null>(null);
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

  const handleRunInvestigation = async (selectedGoal = goal) => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/investigator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId: activeRepo.repoId, goal: selectedGoal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete autonomous investigation.');
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during autonomous investigation.');
    } finally {
      setIsRunning(false);
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
                <Bot className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Autonomous Engine
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-xs font-medium text-slate-300">
                  Workspace: <code className="font-semibold text-white font-mono bg-white/10 px-2 py-0.5 rounded">{activeRepo.repoName}</code>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Autonomous Engineering Investigator
              </h1>

              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Provide a high-level engineering investigation goal. The autonomous agent plans the audit, scans AST fan-in/fan-out, correlates commit churn, traces dependency paths, and outputs verifiable findings with zero hallucinations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Investigation Goal Control Card */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Investigation Objective
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Enter broad goal: e.g. Investigate the riskiest parts of this repository..."
                className="w-full px-4 py-3 text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
                disabled={isRunning}
              />
            </div>
            <Button
              variant="primary"
              size="md"
              disabled={isRunning || !goal.trim()}
              onClick={() => handleRunInvestigation()}
              icon={isRunning ? undefined : <Play className="w-4 h-4 fill-white" />}
              className="bg-[#3B82F6] hover:bg-[#2563EB] shadow-glowBlue text-white font-bold px-6 shrink-0"
            >
              {isRunning ? 'Investigating Codebase...' : 'Execute Audit'}
            </Button>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div>
          <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Quick Goals
          </div>
          <div className="flex flex-wrap gap-2">
            {GOAL_SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setGoal(s);
                  handleRunInvestigation(s);
                }}
                disabled={isRunning}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors text-left font-medium"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <Alert variant="error" title="Investigation Error">
            {error}
          </Alert>
        )}
      </section>

      {/* Investigation In Progress State */}
      {isRunning && (
        <section className="bg-white rounded-2xl border border-blue-200 p-8 shadow-sm text-center space-y-4 animate-pulse">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Sparkles className="w-7 h-7 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Autonomous Investigation In Progress
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Scanning graph topology, identifying architectural hubs, verifying test links, and synthesizing evidence...
            </p>
          </div>
        </section>
      )}

      {/* Investigation Results */}
      {result && !isRunning && (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Audited Symbols
              </span>
              <span className="text-2xl font-black text-slate-900">
                {result.metrics.totalComponentsAudited}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">Full AST scope</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500 block mb-1">
                Risk Hotspots
              </span>
              <span className="text-2xl font-black text-rose-600">
                {result.metrics.highRiskComponentsFound}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">Flagged for attention</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 block mb-1">
                Untested Hubs
              </span>
              <span className="text-2xl font-black text-amber-600">
                {result.metrics.untestedCriticalComponents}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">No test suite assertion</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-500 block mb-1">
                Coupling Hubs
              </span>
              <span className="text-2xl font-black text-indigo-600">
                {result.metrics.couplingHubs}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">Fan-in ≥ 3 components</span>
            </div>
          </div>

          {/* Executive Summary Card */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                  Executive Investigation Summary
                </h2>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {result.aiReasoned ? 'Sarvam AI 105B Grounded' : 'Deterministic AST Heuristics'}
              </span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
              {result.executiveSummary}
            </p>
          </section>

          {/* Completed Steps Card */}
          <section className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-2">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Autonomous Execution Trace
            </div>
            <div className="space-y-1.5 text-xs text-slate-600">
              {result.completedSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
            {result.unresolvedQuestions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-amber-700">
                {result.unresolvedQuestions.map((q, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                    <span>{q}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Ranked Findings List */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Ranked Findings & Architectural Risk Hotspots
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {result.findings.length} findings prioritized by risk score
              </span>
            </div>

            <div className="space-y-3">
              {result.findings.map((finding) => (
                <div
                  key={finding.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                          finding.severity === 'critical'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : finding.severity === 'high'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {finding.severity}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{finding.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/impact?targetNodeId=${encodeURIComponent(finding.id.replace('finding-', ''))}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Impact Analysis
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Component</span>
                      <span className="font-semibold text-slate-800">{finding.component}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">File Path</span>
                      <span className="font-mono text-slate-700 truncate block">{finding.filePath}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Downstream Reach</span>
                      <span className="font-bold text-slate-800">{finding.factors.dependencyReach} consumers</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Test Status</span>
                      <span className={finding.factors.hasTests ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-bold'}>
                        {finding.factors.hasTests ? 'Covered' : 'Untested'}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 bg-slate-50/50 p-3 rounded-xl border border-slate-200/60">
                    <span className="font-bold text-slate-900 block mb-0.5">Evidence & Reach:</span>
                    {finding.evidence}
                  </div>

                  <div className="text-xs text-blue-800 bg-blue-50/60 p-3 rounded-xl border border-blue-100 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-blue-950">Recommended Action:</span>
                      {finding.remediation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
