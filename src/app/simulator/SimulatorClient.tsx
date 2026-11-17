'use client';

import React, { useState } from 'react';
import { useActiveRepo } from '@/lib/repositories/active-repo-client';
import Link from 'next/link';
import {
  Zap,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  TestTube2,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Compass,
  FileCode,
  Layers,
  HelpCircle,
  ExternalLink,
  FolderGit2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { ChangeSimulationResult } from '@/lib/simulator/change-simulator';

const SAMPLE_CHANGES = [
  'Refactor verifySessionToken() to asynchronously validate key rotations and return Promise<Result<UserSession>>.',
  'Deprecate synchronous tax calculation and replace with asynchronous tax rate lookup API.',
  'Split monolithic billing manager into payment provider and invoice generator sub-modules.',
];

export function SimulatorClient() {
  const { activeRepo } = useActiveRepo();
  const [description, setDescription] = useState<string>(SAMPLE_CHANGES[0]);
  const [approach, setApproach] = useState<string>('Approach A: Phased migration with backward-compatible facade');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [result, setResult] = useState<ChangeSimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async (customDesc = description) => {
    setIsSimulating(true);
    setError(null);
    try {
      const res = await fetch('/api/simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoId: activeRepo.repoId,
          changeDescription: customDesc,
          proposedApproach: approach,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to simulate proposed change.');
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during simulation.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Page Header */}
      <div className="bg-white border border-border-default rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-brand-emerald/10 text-brand-deep border border-brand-emerald/20">
              <Zap className="w-3 h-3 text-brand-emerald" />
              Pre-Commit Simulator
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-muted text-ink-muted border border-border-subtle font-mono">
              AST Propagation
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink-primary tracking-tight">
            What-If Change Simulator
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl">
            Describe a proposed refactor, interface change, or dependency update. The simulator models blast radius across AST callers and generates a concrete migration plan.
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
            Describe Proposed Code Change
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Refactor verifySessionToken() to asynchronously validate key rotations..."
            className="w-full p-3.5 text-xs text-ink-primary bg-surface-secondary border border-border-default rounded-lg focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/30 focus:bg-white transition-all font-sans leading-relaxed"
            disabled={isSimulating}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-faint mb-1.5">
              Proposed Approach / Migration Strategy
            </label>
            <input
              type="text"
              value={approach}
              onChange={(e) => setApproach(e.target.value)}
              className="w-full px-3 py-1.5 text-xs text-ink-primary bg-surface-secondary border border-border-default rounded-md focus:outline-none focus:border-brand-emerald font-sans"
              disabled={isSimulating}
            />
          </div>

          <div className="flex items-end justify-end">
            <Button
              variant="primary"
              size="sm"
              disabled={isSimulating || !description.trim()}
              onClick={() => handleSimulate()}
              icon={isSimulating ? undefined : <Play className="w-3.5 h-3.5" />}
              isLoading={isSimulating}
              className="w-full sm:w-auto"
            >
              Run Simulation
            </Button>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-ink-faint mb-2">
            Sample Proposals
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_CHANGES.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setDescription(s);
                  handleSimulate(s);
                }}
                disabled={isSimulating}
                className="text-xs px-2.5 py-1 rounded-md border border-border-subtle bg-surface-secondary text-ink-secondary hover:text-ink-primary hover:border-brand-emerald hover:bg-brand-emerald/5 transition-colors text-left"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <Alert type="error" title="Simulation Error">
            {error}
          </Alert>
        )}
      </section>

      {/* Simulation Running Skeleton */}
      {isSimulating && (
        <section className="bg-white rounded-xl border border-border-default p-8 shadow-xs text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-lg bg-brand-emerald/10 text-brand-deep flex items-center justify-center">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink-primary">
              Modeling Change Propagation Across AST Graph
            </h3>
            <p className="text-xs text-ink-muted max-w-md mx-auto mt-0.5">
              Tracing direct callers, multi-hop transitive dependencies, and affected test suites...
            </p>
          </div>
        </section>
      )}

      {/* Simulation Results */}
      {result && !isSimulating && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <section className="bg-white rounded-xl border border-border-default p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-deep" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-primary">
                  Simulation Blast Radius Summary
                </h2>
              </div>
              <Badge variant={result.aiReasoned ? 'success' : 'outline'} size="sm">
                {result.aiReasoned ? 'Sarvam AI Reasoned' : 'Deterministic AST'}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed font-normal whitespace-pre-line">
              {result.executiveSummary}
            </p>
          </section>

          {/* Three Column Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Direct Callers */}
            <div className="bg-white rounded-xl border border-border-default p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <span className="text-xs font-semibold text-ink-primary">
                  Verified Direct Callers
                </span>
                <span className="text-xs font-mono font-semibold bg-surface-muted text-ink-primary px-2 py-0.5 rounded border border-border-subtle">
                  {result.verifiedDirectDependents.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {result.verifiedDirectDependents.length === 0 ? (
                  <p className="text-xs text-ink-faint italic">No direct callers found.</p>
                ) : (
                  result.verifiedDirectDependents.map((dep) => (
                    <div key={dep.id} className="text-xs p-2.5 bg-surface-secondary rounded-lg border border-border-subtle space-y-0.5">
                      <div className="font-mono font-medium text-ink-primary flex items-center justify-between">
                        <span>{dep.label}</span>
                        <span className="text-[10px] text-ink-faint font-mono uppercase">{dep.type}</span>
                      </div>
                      <div className="text-[11px] font-mono text-ink-muted truncate">{dep.filePath}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Transitive Blast Radius */}
            <div className="bg-white rounded-xl border border-border-default p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <span className="text-xs font-semibold text-ink-primary">
                  Transitive Consumers
                </span>
                <span className="text-xs font-mono font-semibold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                  {result.transitiveBlastRadius.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {result.transitiveBlastRadius.length === 0 ? (
                  <p className="text-xs text-ink-faint italic">No multi-hop transitive dependencies detected.</p>
                ) : (
                  result.transitiveBlastRadius.map((tr) => (
                    <div key={tr.id} className="text-xs p-2.5 bg-surface-secondary rounded-lg border border-border-subtle space-y-0.5">
                      <div className="font-mono font-medium text-ink-primary flex items-center justify-between">
                        <span>{tr.label}</span>
                        <span className="text-[10px] font-mono text-purple-600 font-semibold">{tr.depth} hops</span>
                      </div>
                      <div className="text-[10px] text-ink-muted font-mono truncate">
                        Path: {tr.path.join(' → ')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Test Suites to Execute */}
            <div className="bg-white rounded-xl border border-border-default p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <span className="text-xs font-semibold text-ink-primary">
                  Test Suites to Run
                </span>
                <span className="text-xs font-mono font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                  {result.testsToExecute.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {result.testsToExecute.length === 0 ? (
                  <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
                    <span className="font-medium block">No Tests Found</span>
                    <span className="text-[11px] text-amber-700">Zero test files assert the target components. You must author new tests before refactoring.</span>
                  </div>
                ) : (
                  result.testsToExecute.map((t) => (
                    <div key={t.id} className="text-xs p-2.5 bg-surface-secondary rounded-lg border border-border-subtle space-y-0.5">
                      <div className="font-mono font-medium text-ink-primary flex items-center gap-1.5">
                        <TestTube2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>{t.label}</span>
                      </div>
                      <div className="text-[11px] font-mono text-ink-muted truncate">{t.filePath}</div>
                      <div className="text-[10px] font-mono text-ink-faint">Asserts: {t.assertsComponent}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Step-by-Step Change Plan */}
          <section className="bg-white rounded-xl border border-border-default p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-primary">
              Recommended Migration Sequence
            </h2>
            <div className="space-y-2.5">
              {result.stepByStepChangePlan.map((step) => (
                <div
                  key={step.stepNumber}
                  className="flex items-start gap-3.5 p-3.5 rounded-lg border border-border-subtle bg-surface-secondary"
                >
                  <div className="w-6 h-6 rounded-md bg-ink-primary text-white flex items-center justify-center font-mono font-semibold text-xs shrink-0">
                    {step.stepNumber}
                  </div>
                  <div className="space-y-1 flex-1">
                    <h3 className="text-xs font-semibold text-ink-primary">{step.title}</h3>
                    <p className="text-xs text-ink-muted font-sans">{step.action}</p>
                    <div className="text-[11px] font-mono text-brand-deep bg-brand-emerald/10 px-2 py-0.5 rounded border border-brand-emerald/20 font-medium inline-block mt-1">
                      Verification: {step.verification}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Assumptions & Integrity Notice */}
          <section className="bg-surface-secondary rounded-xl border border-border-subtle p-4 text-xs text-ink-muted space-y-1">
            <span className="font-mono uppercase text-[10px] text-ink-faint block mb-1">
              Integrity & Verification Disclosure
            </span>
            {result.assumptionsAndLimitations.map((item, idx) => (
              <p key={idx} className="leading-relaxed">• {item}</p>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}