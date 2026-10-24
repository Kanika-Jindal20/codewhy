'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  FolderGit2,
  GitBranch,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Zap,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Network,
  Code2,
  TrendingUp,
  Star,
} from 'lucide-react';
import { EngineeringDecisionReport } from '@/types/report';
import { SAMPLE_REPORT_JWT_REFACTOR, SAMPLE_REPORT_MINIMAL } from '@/lib/reports/sample-report-data';
import { ExportPdfModal } from '@/components/reports/ExportPdfModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { useActiveRepo } from '@/lib/repositories/active-repo-client';

export const ReportsClient: React.FC = () => {
  const { activeRepo } = useActiveRepo();
  const [reports, setReports] = useState<EngineeringDecisionReport[]>([
    SAMPLE_REPORT_JWT_REFACTOR,
    SAMPLE_REPORT_MINIMAL,
  ]);
  const [selectedReport, setSelectedReport] = useState<EngineeringDecisionReport>(SAMPLE_REPORT_JWT_REFACTOR);

  useEffect(() => {
    async function loadReports() {
      try {
        const res = await fetch(`/api/reports?repoId=${encodeURIComponent(activeRepo.repoId)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.reports) && data.reports.length > 0) {
            setReports(data.reports);
            setSelectedReport(data.reports[0]);
          }
        }
      } catch (err) {
        console.warn('Could not load dynamic reports:', err);
      }
    }
    loadReports();
  }, [activeRepo.repoId]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleOpenExport = (report: EngineeringDecisionReport) => {
    setSelectedReport(report);
    setIsExportModalOpen(true);
  };

  const getRiskBadgeStyle = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-700 border border-red-200';
      case 'elevated':
        return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'moderate':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      default:
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-700 border border-red-200';
      case 'high':
        return 'bg-rose-100 text-rose-700 border border-rose-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border border-amber-200';
      default:
        return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 font-['Inter',sans-serif]">

      {/* ── Top Header Banner (Blue Theme) ── */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-7 sm:p-8 shadow-lg overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 -left-8 w-48 h-48 rounded-full bg-white/10" />
        </div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-white/20 border border-white/30 shadow-lg shrink-0">
              <FileText className="w-7 h-7 text-white stroke-[2]" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
                Engineering Decision Reports
              </h1>
              <p className="text-sm text-blue-100 leading-relaxed max-w-2xl mt-1.5 font-medium">
                Turn code investigations, pre-change blast radius evaluations, and architecture reviews into
                publication-grade, traceable PDF reports with clickable source evidence.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleOpenExport(selectedReport)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-blue-600 font-bold text-sm shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all border border-blue-100"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Grid: Report Selection + Interactive Preview ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left Column: Report List (4 cols) ── */}
        <div className="lg:col-span-4 space-y-3">
          {/* Section label */}
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-500">
              Available Audits
            </h2>
            <span className="text-sm font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
              {reports.length} reports
            </span>
          </div>

          <div className="space-y-3">
            {reports.map((rep) => {
              const isSelected = rep.id === selectedReport.id;
              const hasImpact = Boolean(rep.impactAnalysis);
              const hasGaps = Boolean(rep.knowledgeGaps);
              const riskLevel = rep.executiveSummary?.riskAssessmentLevel || 'moderate';

              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReport(rep)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all shadow-sm hover:shadow-lg ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-600 ring-4 ring-blue-500/10'
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
                  }`}
                >
                  {/* Repo badge + Risk badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-semibold truncate max-w-[140px]">
                      {rep.repository.repoName}
                    </span>
                    <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${getRiskBadgeStyle(riskLevel)}`}>
                      {riskLevel.toUpperCase()} RISK
                    </span>
                  </div>

                  {/* Report Title */}
                  <h3 className="text-sm font-bold text-slate-800 line-clamp-2 mb-3 leading-snug">
                    {rep.title}
                  </h3>

                  {/* Feature tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {hasImpact && (
                      <span className="text-xs font-bold px-2.5 py-1 bg-red-100 text-red-700 rounded-full border border-red-200">
                        🔥 Blast Radius
                      </span>
                    )}
                    {hasGaps && (
                      <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full border border-amber-200">
                        ⚠️ Knowledge Gaps
                      </span>
                    )}
                    {rep.evidence?.length > 0 && (
                      <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                        🏛 Architecture
                      </span>
                    )}
                  </div>

                  {/* Footer: date + export */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 mt-1">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 font-mono font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(rep.generatedAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenExport(rep);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export PDF
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick link to trigger fresh analyses */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Zap className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="font-extrabold text-slate-800 text-sm">Generate Fresh Audit</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Run impact analysis on any component to automatically populate a formal decision report.
            </p>
            <Link
              href="/impact"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
            >
              Launch Impact Workspace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ── Right Column: Selected Report Live Preview (8 cols) ── */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-lg border-t-4 border-t-blue-600">

            {/* Report Header Preview */}
            <div className="px-7 pt-7 pb-5 border-b border-slate-100">
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-xs font-extrabold uppercase tracking-widest text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full border border-blue-200">
                  📄 Document Preview
                </span>
                <button
                  onClick={() => handleOpenExport(selectedReport)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4 stroke-[2]" />
                  Export to PDF
                </button>
              </div>

              <h2 className="text-xl font-extrabold text-slate-800 mb-4 leading-snug">
                {selectedReport.title}
              </h2>

              {/* Repository stat chips */}
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-blue-100 text-blue-700 border border-blue-200 font-semibold">
                  <FolderGit2 className="w-3.5 h-3.5" />
                  {selectedReport.repository.repoName}
                </span>
                {selectedReport.repository.analyzedBranch && (
                  <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                    <GitBranch className="w-3.5 h-3.5" />
                    {selectedReport.repository.analyzedBranch}
                  </span>
                )}
                {selectedReport.repository.analyzedCommit && (
                  <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-violet-100 text-violet-700 border border-violet-200 font-mono font-semibold">
                    <Code2 className="w-3.5 h-3.5" />
                    {selectedReport.repository.analyzedCommit.slice(0, 10)}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-teal-100 text-teal-700 border border-teal-200 font-semibold">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(selectedReport.generatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="px-7 py-6 space-y-6">

              {/* ── 1. Executive Summary ── */}
              {selectedReport.executiveSummary && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                      <Star className="w-4 h-4 stroke-[2]" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">
                      1. Executive Summary
                    </h3>
                  </div>

                  <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/50 border-2 border-blue-200 border-l-4 border-l-blue-600 rounded-2xl space-y-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-sm font-extrabold text-slate-800">
                        {selectedReport.executiveSummary.headline}
                      </span>
                      {selectedReport.executiveSummary.riskAssessmentLevel && (
                        <span className={`text-sm font-extrabold px-3 py-1.5 rounded-full ${getRiskBadgeStyle(selectedReport.executiveSummary.riskAssessmentLevel)}`}>
                          {selectedReport.executiveSummary.riskAssessmentLevel.toUpperCase()} RISK
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {selectedReport.executiveSummary.overview}
                    </p>
                  </div>

                  {selectedReport.executiveSummary.criticalTakeaways?.length > 0 && (
                    <div className="space-y-2 pl-1">
                      <span className="text-sm font-extrabold text-slate-700">Key Takeaways:</span>
                      <ul className="space-y-2">
                        {selectedReport.executiveSummary.criticalTakeaways.map((t, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="text-sm text-slate-700 leading-relaxed">{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* ── 2. Engineering Problem Statement & Scope ── */}
              {selectedReport.proposedChange && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                      <Network className="w-4 h-4 stroke-[2]" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">
                      2. Engineering Problem Statement &amp; Scope
                    </h3>
                  </div>
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200 border-l-4 border-l-blue-600 space-y-3 shadow-sm">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-sm text-slate-500 font-semibold">Target:</span>
                      <span className="font-mono font-bold text-sm text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        {selectedReport.proposedChange.targetSymbolOrFile}
                      </span>
                      <span className="text-sm font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 border border-violet-200">
                        {selectedReport.proposedChange.changeCategory}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {selectedReport.proposedChange.questionOrDescription}
                    </p>
                  </div>
                </div>
              )}

              {/* ── 3. Audited Findings & Architectural Reasoning ── */}
              {selectedReport.findings?.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shrink-0">
                        <AlertTriangle className="w-4 h-4 stroke-[2]" />
                      </div>
                      <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">
                        3. Audited Findings &amp; Architectural Reasoning
                      </h3>
                    </div>
                    <span className="text-sm font-extrabold px-3 py-1.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                      {selectedReport.findings.length} findings
                    </span>
                  </div>
                  <div className="space-y-3">
                    {selectedReport.findings.map((f) => (
                      <div
                        key={f.id}
                        className="p-4 rounded-2xl bg-gradient-to-br from-red-50 to-slate-50 border-2 border-red-100 border-l-4 border-l-red-500 space-y-2 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <span className="font-bold text-sm text-slate-800 font-mono">{f.title}</span>
                          <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${getSeverityStyle(f.severity)}`}>
                            {f.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {f.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 4. Traceable Evidence Grounding ── */}
              {selectedReport.evidence?.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
                        <ShieldCheck className="w-4 h-4 stroke-[2]" />
                      </div>
                      <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">
                        4. Traceable Evidence Grounding
                      </h3>
                    </div>
                    <span className="text-sm font-extrabold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                      {selectedReport.evidence.length} sources
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selectedReport.evidence.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border-2 border-emerald-100 border-l-4 border-l-emerald-500 shadow-sm"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-slate-800 truncate">{ev.title}</div>
                          <div className="text-xs font-mono text-slate-500 truncate mt-1">
                            {ev.filePath ? `${ev.filePath}:${ev.startLine || 1}` : ev.commitHash?.slice(0, 10)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                            {Math.round(ev.confidenceScore * 100)}% verified
                          </span>
                          {ev.url && (
                            <a
                              href={ev.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Export PDF Modal */}
      <ExportPdfModal
        report={selectedReport}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
};
