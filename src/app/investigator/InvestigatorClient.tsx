'use client';

import React, { useState } from 'react';
import { useActiveRepo } from '@/lib/repositories/active-repo-client';
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
  'Investigate single points of failure in this codebase.',
  'Audit authentication and security authorization boundaries.',
  'Find high-coupling components lacking regression tests.',
  'Trace failure propagation paths and downstream dependencies.',
];

export function InvestigatorClient() {
  const { activeRepo } = useActiveRepo();
  const [goal, setGoal] = useState<string>(GOAL_SUGGESTIONS[0]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<AutonomousInvestigationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Page Header */}
      <div className="bg-white border border-border-default rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-brand-emerald/10 text-brand-deep border border-brand-emerald/20">
              <Bot className="w-3 h-3 text-brand-emerald" />
              Autonomous Agent
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-muted text-ink-muted border border-border-subtle font-mono">
              Zero Hallucinations
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink-primary tracking-tight">
            Autonomous Engineering Investigator
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl">
            Provide a high-level investigation goal. The agent audits AST fan-in/fan-out, correlates churn, and traces failure paths to verify risks.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <div className="flex items-center gap-2 rounded-lg border border-border-default bg-surface-secondary px-3 py-1.5 text-xs text-ink-secondary">
            <FolderGit2 className="w-3.5 h-3.5 text-ink-muted" />
            <span className="font-mono font-medium">{activeRepo.repoName}</span>
          </div>
        </div>
      </div>

      {/* Investigation Goal Control Card */}
      <section className="bg-white rounded-xl border border-border-default p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-primary mb-2">
            Investigation Objective
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Enter broad goal: e.g. Investigate the riskiest parts of this repository..."
                className="w-full px-3.5 py-2 text-xs text-ink-primary bg-surface-secondary border border-border-default rounded-lg focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/30 focus:bg-white transition-all font-sans"
                disabled={isRunning}
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              disabled={isRunning || !goal.trim()}
              onClick={() => handleRunInvestigation()}
              icon={isRunning ? undefined : <Play className="w-3.5 h-3.5" />}
              isLoading={isRunning}
              className="shrink-0"
            >
              Execute Audit
            </Button>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-ink-faint mb-2">
            Quick Goals
          </div>
          <div className="flex flex-wrap gap-1.5">
            {GOAL_SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setGoal(s);
                  handleRunInvestigation(s);
                }}
                disabled={isRunning}
                className="text-xs px-2.5 py-1 rounded-md border border-border-subtle bg-surface-secondary text-ink-secondary hover:text-ink-primary hover:border-brand-emerald hover:bg-brand-emerald/5 transition-colors text-left"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <Alert type="error" title="Investigation Error">
            {error}
          </Alert>
        )}
      </section>

      {/* Investigation In Progress State */}
      {isRunning && (
        <section className="bg-white rounded-xl border border-border-default p-8 shadow-xs text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-lg bg-brand-emerald/10 text-brand-deep flex items-center justify-center">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink-primary">
              Autonomous Investigation In Progress
            </h3>
            <p className="text-xs text-ink-muted max-w-md mx-auto mt-0.5">
              Traversing graph topology, identifying architectural hubs, verifying test links, and synthesizing evidence...
            </p>
          </div>
        </section>
      )}

      {/* Investigation Results */}
      {result && !isRunning && (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-border-default shadow-xs">
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-faint block mb-1">
                Audited Symbols
              </span>
              <span className="text-2xl font-semibold font-mono text-ink-primary">
                {result.metrics.totalComponentsAudited}
              </span>
              <span className="text-[11px] text-ink-muted block mt-0.5">Full AST scope</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-border-default shadow-xs">
              <span className="text-[11px] font-mono uppercase tracking-wider text-rose-600 block mb-1">
                Risk Hotspots
              </span>
              <span className="text-2xl font-semibold font-mono text-rose-600">
                {result.metrics.highRiskComponentsFound}
              </span>
              <span className="text-[11px] text-ink-muted block mt-0.5">Flagged for attention</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-border-default shadow-xs">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-600 block mb-1">
                Untested Hubs
              </span>
              <span className="text-2xl font-semibold font-mono text-amber-600">
                {result.metrics.untestedCriticalComponents}
              </span>
              <span className="text-[11px] text-ink-muted block mt-0.5">Missing test assertions</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-border-default shadow-xs">
              <span className="text-[11px] font-mono uppercase tracking-wider text-purple-600 block mb-1">
                Coupling Hubs
              </span>
              <span className="text-2xl font-semibold font-mono text-purple-600">
                {result.metrics.couplingHubs}
              </span>
              <span className="text-[11px] text-ink-muted block mt-0.5">Fan-in &ge; 3 callers</span>
            </div>
          </div>

          {/* Executive Summary Card */}
          <section className="bg-white rounded-xl border border-border-default p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-deep" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-primary">
                  Executive Investigation Summary
                </h2>
              </div>
              <Badge variant={result.aiReasoned ? 'success' : 'outline'} size="sm">
                {result.aiReasoned ? 'Sarvam AI Grounded' : 'Deterministic AST'}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed font-normal whitespace-pre-line">
              {result.executiveSummary}
            </p>
          </section>

          {/* Completed Steps Card */}
          <section className="bg-surface-secondary rounded-xl border border-border-default p-4 space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-ink-faint">
              Autonomous Execution Trace
            </div>
            <div className="space-y-1 text-xs text-ink-secondary">
              {result.completedSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-deep shrink-0" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
            {result.unresolvedQuestions.length > 0 && (
              <div className="mt-2.5 pt-2.5 border-t border-border-subtle text-xs text-amber-700">
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
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-primary">
                Ranked Findings & Architectural Risk Hotspots
              </h2>
              <span className="text-xs text-ink-muted">
                {result.findings.length} findings prioritized
              </span>
            </div>

            <div className="space-y-3">
              {result.findings.map((finding) => (
                <div
                  key={finding.id}
                  className="bg-white rounded-xl border border-border-default p-5 shadow-xs hover:border-border-strong transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={finding.severity === 'critical' ? 'error' : finding.severity === 'high' ? 'warning' : 'info'}
                        size="sm"
                      >
                        {finding.severity}
                      </Badge>
                      <h3 className="text-xs sm:text-sm font-semibold text-ink-primary font-mono">{finding.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/impact?targetNodeId=${encodeURIComponent(finding.id.replace('finding-', ''))}`}
                        className="text-xs font-medium text-brand-deep hover:underline flex items-center gap-1"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Impact Analysis &rarr;
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-surface-secondary p-3 rounded-lg border border-border-subtle">
                    <div>
                      <span className="text-ink-faint block text-[10px] font-mono uppercase">Component</span>
                      <span className="font-mono font-medium text-ink-primary">{finding.component}</span>
                    </div>
                    <div>
                      <span className="text-ink-faint block text-[10px] font-mono uppercase">File Path</span>
                      <span className="font-mono text-ink-muted truncate block">{finding.filePath}</span>
                    </div>
                    <div>
                      <span className="text-ink-faint block text-[10px] font-mono uppercase">Downstream Reach</span>
                      <span className="font-mono font-medium text-ink-primary">{finding.factors.dependencyReach} consumers</span>
                    </div>
                    <div>
                      <span className="text-ink-faint block text-[10px] font-mono uppercase">Test Status</span>
                      <span className={finding.factors.hasTests ? 'text-brand-deep font-medium' : 'text-rose-600 font-medium'}>
                        {finding.factors.hasTests ? 'Covered' : 'Untested'}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-ink-muted bg-surface-secondary p-3 rounded-lg border border-border-subtle">
                    <span className="font-medium text-ink-primary block mb-0.5">Evidence & Reach:</span>
                    {finding.evidence}
                  </div>

                  <div className="text-xs text-ink-secondary bg-brand-emerald/5 p-3 rounded-lg border border-brand-emerald/20 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-deep shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium block text-ink-primary">Recommended Action:</span>
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