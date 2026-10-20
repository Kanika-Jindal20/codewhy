'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink, 
  Zap, 
  Compass,
  FileCode,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SAMPLE_REPORT_JWT_REFACTOR } from '@/lib/reports/sample-report-data';

export function KnowledgeGapsClient() {
  const gapsData = SAMPLE_REPORT_JWT_REFACTOR.knowledgeGaps;
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'high' | 'medium'>('all');

  const [gaps, setGaps] = useState<any[]>([
    {
      id: 'gap-jwt-adr',
      title: 'Missing ADR: JWKS Key Rotation Fallback',
      component: 'src/auth/jwt.ts',
      filePath: 'src/auth/jwt.ts',
      rule: 'Undocumented Architectural Decision',
      severity: 'high' as const,
      description: 'Key rotation was introduced in commit 7a8f9c without documenting failure mode fallback behavior.',
      developerImpact: 'Engineers on-call cannot confirm if fallback to secondary key is intentional or a security bypass.',
      suggestedRemediation: 'Author docs/adr/0014-jwks-rotation-fallback.md documenting expected cache timeout and RS256 rotation failure policy.',
    },
    {
      id: 'gap-gateway-test',
      title: 'Untested Gateway Header Pass-through',
      component: 'config/gateway.config.json',
      filePath: 'config/gateway.config.json',
      rule: 'Untested Contract Dependency',
      severity: 'medium' as const,
      description: 'gateway.config.json references auth header forwarding to internal microservices, but no contract integration test validates headers.',
      developerImpact: 'Changes to auth headers can silently drop claims without triggering test failures during CI.',
      suggestedRemediation: 'Add an integration contract test suite in tests/gateway-auth.test.ts asserting header preservation across routes.',
    },
  ]);

  useEffect(() => {
    fetch('/api/gaps')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.gaps) && data.gaps.length > 0) {
          setGaps(data.gaps);
        }
      })
      .catch(() => {});
  }, []);

  const filteredGaps = filterSeverity === 'all' 
    ? gaps 
    : gaps.filter(g => g.severity === filterSeverity);

  const highCount = gaps.filter(g => g.severity === 'high').length;
  const mediumCount = gaps.filter(g => g.severity === 'medium').length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">

      {/* ── Page Header Banner (Sleek High-Contrast Navy Banner with Amber Accent) ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#14213D] via-[#1E2E4F] to-[#2B3E68] rounded-3xl p-7 sm:p-8 shadow-xl border border-slate-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 shadow-lg text-amber-400">
            <ShieldAlert className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Knowledge Gaps & Technical Debt
              </h1>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Codebase Audit
              </span>
            </div>
            <p className="mt-1 text-slate-300 text-sm leading-relaxed max-w-xl">
              Blind spots, undocumented decisions, and test omissions detected in{' '}
              <span className="font-bold text-white underline decoration-amber-400/60 underline-offset-2">acme/commerce-core</span>.
            </p>
          </div>
        </div>

        <div className="relative z-10 shrink-0">
          <span className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold text-xs border border-white/20 backdrop-blur-sm shadow-sm inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            {gaps.length} Actionable Gaps
          </span>
        </div>
      </div>

      {/* ── Debt Score + Stats Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

        {/* Debt Score Widget (Crisp High-Contrast Typography) */}
        <div className="md:col-span-1 bg-white border border-gray-200 rounded-3xl p-6 shadow-md flex flex-col items-center gap-3">
          {/* Circular Score Badge */}
          <div className="relative flex items-center justify-center w-28 h-28">
            <svg className="absolute inset-0 w-28 h-28" viewBox="0 0 112 112">
              <circle cx="56" cy="56" r="50" fill="none" stroke="#F1F5F9" strokeWidth="8" />
              <circle
                cx="56" cy="56" r="50"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="8"
                strokeDasharray={`${(38 / 100) * 314} 314`}
                strokeLinecap="round"
                transform="rotate(-90 56 56)"
              />
            </svg>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-extrabold text-gray-900 leading-none">38</span>
              <span className="text-xs font-bold text-gray-500 leading-none mt-0.5">/100</span>
            </div>
          </div>
          <div className="text-center space-y-1.5">
            <div className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold uppercase tracking-wider inline-block border border-amber-300">
              Moderate Debt
            </div>
            <p className="text-xs text-gray-600 font-medium leading-snug">
              Calculated from commit history, missing ADR records, and test gaps.
            </p>
          </div>
        </div>

        {/* Stats Mini Cards */}
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Total Gaps — Blue */}
          <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-md flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow">
              <FileText className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-gray-900">{gaps.length}</div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-blue-700">Total Gaps</div>
            <p className="text-xs text-gray-500 font-medium">All open knowledge blind spots</p>
          </div>

          {/* High Severity — Red */}
          <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-md flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shadow">
              <AlertTriangle className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-gray-900">{highCount}</div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-red-700">High Severity</div>
            <p className="text-xs text-gray-500 font-medium">Immediate attention required</p>
          </div>

          {/* Medium Severity — Amber Accent with High Contrast Heading */}
          <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-md flex flex-col gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow">
              <Info className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-gray-900">{mediumCount}</div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-amber-800">Medium Severity</div>
            <p className="text-xs text-gray-500 font-medium">Should be addressed soon</p>
          </div>

        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setFilterSeverity('all')}
          className={`px-5 py-2.5 text-xs font-extrabold rounded-full transition-all shadow-sm ${
            filterSeverity === 'all'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
          }`}
        >
          All Gaps ({gaps.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterSeverity('high')}
          className={`px-5 py-2.5 text-xs font-extrabold rounded-full transition-all shadow-sm ${
            filterSeverity === 'high'
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-red-400'
          }`}
        >
          High Severity ({highCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterSeverity('medium')}
          className={`px-5 py-2.5 text-xs font-extrabold rounded-full transition-all shadow-sm ${
            filterSeverity === 'medium'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-amber-400'
          }`}
        >
          Medium Severity ({mediumCount})
        </button>
      </div>

      {/* ── Gaps List ── */}
      <section className="space-y-5">
        {filteredGaps.length === 0 ? (
          /* Empty State */
          <div className="bg-white border-2 border-green-200 rounded-3xl p-16 shadow-md flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-8 h-8 text-white stroke-[2]" />
            </div>
            <h3 className="text-xl font-extrabold text-gray-900">No gaps detected — well done!</h3>
            <p className="text-gray-600 font-medium max-w-sm text-sm">
              Your codebase has no knowledge gaps matching this filter.
            </p>
          </div>
        ) : (
          filteredGaps.map((gap) => (
            <div
              key={gap.id}
              className={`bg-white rounded-3xl shadow-md overflow-hidden border ${
                gap.severity === 'high'
                  ? 'border-gray-200 border-l-4 border-l-red-500'
                  : 'border-gray-200 border-l-4 border-l-amber-500'
              }`}
            >
              {/* Card Header Area */}
              <div className="px-6 pt-6 pb-4 bg-gray-50/60 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2.5 flex-1">
                    {/* Severity Badge + Title */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      {gap.severity === 'high' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-700 border border-red-300 uppercase tracking-wide">
                          High Severity
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-wide">
                          Medium Severity
                        </span>
                      )}
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-white border border-gray-200 text-gray-700 shadow-xs">
                        {gap.rule}
                      </span>
                    </div>

                    {/* Gap Title in High Contrast Dark Charcoal */}
                    <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">
                      {gap.title}
                    </h3>

                    {/* File Path */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                        <FileCode className="w-3.5 h-3.5 stroke-[2] text-gray-700" />
                      </div>
                      <span className="text-sm font-bold text-gray-800">
                        {gap.filePath}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                    <Link href="/impact">
                      <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all hover:shadow-md w-full sm:w-auto">
                        <Zap className="w-4 h-4" />
                        Check Blast Radius
                      </button>
                    </Link>
                    <Link href="/architecture">
                      <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all hover:shadow-md w-full sm:w-auto">
                        <Compass className="w-4 h-4" />
                        View in Graph
                      </button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="px-6 pb-6 pt-5 grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Developer Impact Box (High Contrast Headings) */}
                <div className="rounded-2xl p-4.5 border border-red-200 bg-red-50/50 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-red-500 text-white flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <span className="text-sm font-extrabold text-gray-900">
                      Why It Matters
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed pl-9 font-medium">
                    {gap.developerImpact}
                  </p>
                </div>

                {/* Remediation Box */}
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4.5 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <span className="text-sm font-extrabold text-gray-900">
                      How to Fix
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed pl-9 font-medium">
                    {gap.suggestedRemediation}
                  </p>
                </div>

              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
