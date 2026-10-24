'use client';

import React, { useState, useEffect } from 'react';
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
    <div className="font-['Inter',sans-serif] max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#14213D] via-[#1F2E4D] to-[#2B3E68] text-white rounded-3xl p-7 sm:p-9 shadow-elevated border border-slate-700/50">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 rounded-full bg-[#3B82F6]/25 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-12 w-72 h-72 rounded-full bg-[#8B5CF6]/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/20 p-1 flex items-center justify-center shrink-0 shadow-lg">
              <div className="w-full h-full rounded-xl bg-gradient-to-tr from-[#3B82F6] via-[#6366F1] to-[#8B5CF6] text-white flex items-center justify-center shadow-glowBlue">
                <Zap className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Pre-Change Intelligence
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-xs font-medium text-slate-300">
                  Target Workspace: <code className="font-semibold text-white font-mono bg-white/10 px-2 py-0.5 rounded">{activeRepo.repoName}</code>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                What-If Change Simulator
              </h1>

              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Describe a proposed refactor, interface alteration, or dependency update in plain English. The simulator models the blast radius across verified AST callers, identifies required tests, predicts risks, and generates a concrete change plan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Input Formulation Card */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Describe Proposed Code Change
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Refactor verifySessionToken() to asynchronously validate key rotations..."
            className="w-full p-4 text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
            disabled={isSimulating}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Proposed Approach / Migration Strategy
            </label>
            <input
              type="text"
              value={approach}
              onChange={(e) => setApproach(e.target.value)}
              className="w-full px-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSimulating}
            />
          </div>

          <div className="flex items-end justify-end">
            <Button
              variant="primary"
              size="md"
              disabled={isSimulating || !description.trim()}
              onClick={() => handleSimulate()}
              icon={isSimulating ? undefined : <Play className="w-4 h-4 fill-white" />}
              className="bg-[#3B82F6] hover:bg-[#2563EB] shadow-glowBlue text-white font-bold px-6 w-full sm:w-auto"
            >
              {isSimulating ? 'Simulating Blast Radius...' : 'Run Simulation'}
            </Button>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div>
          <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Sample Change Proposals
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_CHANGES.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setDescription(s);
                  handleSimulate(s);
                }}
                disabled={isSimulating}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors text-left font-medium"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <Alert variant="error" title="Simulation Error">
            {error}
          </Alert>
        )}
      </section>

      {/* Simulation Running Skeleton */}
      {isSimulating && (
        <section className="bg-white rounded-2xl border border-blue-200 p-8 shadow-sm text-center space-y-4 animate-pulse">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Sparkles className="w-7 h-7 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Modeling Change Propagation Across AST Graph
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tracing direct callers, multi-hop transitive dependencies, and affected test suites...
            </p>
          </div>
        </section>
      )}

      {/* Simulation Results */}
      {result && !isSimulating && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                  Simulation Blast Radius Summary
                </h2>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {result.aiReasoned ? 'Sarvam AI Reasoned' : 'Deterministic AST Propagation'}
              </span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
              {result.executiveSummary}
            </p>
          </section>

          {/* Three Column Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Direct Callers */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Verified Direct Callers
                </span>
                <span className="text-xs font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  {result.verifiedDirectDependents.length}
                </span>
              </div>
              <div className="space-y-2">
                {result.verifiedDirectDependents.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No direct callers found.</p>
                ) : (
                  result.verifiedDirectDependents.map((dep) => (
                    <div key={dep.id} className="text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                      <div className="font-bold text-slate-800 flex items-center justify-between">
                        <span>{dep.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono uppercase">{dep.type}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 truncate">{dep.filePath}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Transitive Blast Radius */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Transitive Consumers
                </span>
                <span className="text-xs font-black bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                  {result.transitiveBlastRadius.length}
                </span>
              </div>
              <div className="space-y-2">
                {result.transitiveBlastRadius.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No multi-hop transitive dependencies detected.</p>
                ) : (
                  result.transitiveBlastRadius.map((tr) => (
                    <div key={tr.id} className="text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                      <div className="font-bold text-slate-800 flex items-center justify-between">
                        <span>{tr.label}</span>
                        <span className="text-[10px] text-purple-600 font-bold">{tr.depth} hops</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        Path: {tr.path.join(' → ')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Test Suites to Execute */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Test Suites to Run
                </span>
                <span className="text-xs font-black bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                  {result.testsToExecute.length}
                </span>
              </div>
              <div className="space-y-2">
                {result.testsToExecute.length === 0 ? (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-1">
                    <span className="font-bold block">No Tests Found</span>
                    <span>Zero test files assert the target components. You must author new tests before refactoring.</span>
                  </div>
                ) : (
                  result.testsToExecute.map((t) => (
                    <div key={t.id} className="text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <TestTube2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>{t.label}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 truncate">{t.filePath}</div>
                      <div className="text-[10px] text-slate-400">Asserts: {t.assertsComponent}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Step-by-Step Change Plan */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
              Recommended Step-by-Step Migration Plan
            </h2>
            <div className="space-y-3">
              {result.stepByStepChangePlan.map((step) => (
                <div
                  key={step.stepNumber}
                  className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    {step.stepNumber}
                  </div>
                  <div className="space-y-1 flex-1">
                    <h3 className="text-xs font-bold text-slate-900">{step.title}</h3>
                    <p className="text-xs text-slate-600">{step.action}</p>
                    <div className="text-[11px] text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 font-medium inline-block mt-1">
                      Verification: {step.verification}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Assumptions & Integrity Notice */}
          <section className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-xs text-slate-500 space-y-1">
            <span className="font-bold uppercase text-[10px] text-slate-400 block">
              Integrity & Verification Disclosure
            </span>
            {result.assumptionsAndLimitations.map((item, idx) => (
              <p key={idx}>• {item}</p>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}
