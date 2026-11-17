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

  const getRiskBadgeVariant = (level?: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return 'error';
      case 'elevated':
        return 'warning';
      case 'moderate':
        return 'success';
      default:
        return 'outline';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Header Banner */}
      <div className="bg-white border border-border-default rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-brand-emerald/10 text-brand-deep border border-brand-emerald/20">
              <FileText className="w-3 h-3 text-brand-emerald" />
              Publishable Audits
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-muted text-ink-muted border border-border-subtle font-mono">
              PDF Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink-primary tracking-tight">
            Engineering Decision Reports
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl">
            Convert code investigations, blast radius simulations, and architecture audits into publication-grade, traceable PDF reports with clickable source evidence.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <Button
            onClick={() => handleOpenExport(selectedReport)}
            variant="primary"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* Main Grid: Report Selection + Interactive Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Report List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-primary">
              Available Audits
            </h2>
            <span className="text-[11px] font-mono text-ink-faint">
              {reports.length} reports
            </span>
          </div>

          <div className="space-y-2.5">
            {reports.map((rep) => {
              const isSelected = rep.id === selectedReport.id;
              const hasImpact = Boolean(rep.impactAnalysis);
              const hasGaps = Boolean(rep.knowledgeGaps);
              const riskLevel = rep.executiveSummary?.riskAssessmentLevel || 'moderate';

              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReport(rep)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-brand-emerald/5 border-brand-emerald ring-1 ring-brand-emerald/30 shadow-xs'
                      : 'bg-white border-border-subtle hover:border-border-default hover:bg-surface-secondary'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono text-ink-muted truncate max-w-[150px]">
                      {rep.repository.repoName}
                    </span>
                    <Badge variant={getRiskBadgeVariant(riskLevel)} size="sm">
                      {riskLevel.toUpperCase()}
                    </Badge>
                  </div>

                  <h3 className="text-xs font-semibold text-ink-primary line-clamp-2 mb-2">
                    {rep.title}
                  </h3>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {hasImpact && (
                      <Badge variant="purple" size="sm">Blast Radius</Badge>
                    )}
                    {hasGaps && (
                      <Badge variant="warning" size="sm">Debt Audit</Badge>
                    )}
                    {rep.evidence?.length > 0 && (
                      <Badge variant="info" size="sm">AST Citations</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-[11px]">
                    <span className="text-ink-faint font-mono">
                      {new Date(rep.generatedAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenExport(rep);
                      }}
                      className="text-brand-deep font-medium hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      PDF
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick link */}
          <div className="bg-surface-secondary border border-border-default rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-deep" />
              <span className="font-semibold text-ink-primary text-xs">Generate Fresh Audit</span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Run impact analysis on any component to automatically populate a formal decision report.
            </p>
            <Link
              href="/impact"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-deep hover:underline pt-1"
            >
              Launch Impact Workspace &rarr;
            </Link>
          </div>
        </div>

        {/* Right Column: Selected Report Live Preview */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-border-default rounded-xl overflow-hidden shadow-xs">
            {/* Report Header Preview */}
            <div className="p-5 sm:p-6 border-b border-border-subtle bg-surface-secondary/40">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-ink-faint">
                  Document Preview
                </span>
                <Button
                  onClick={() => handleOpenExport(selectedReport)}
                  variant="outline"
                  size="xs"
                  icon={<Download className="w-3 h-3" />}
                >
                  Export to PDF
                </Button>
              </div>

              <h2 className="text-base font-semibold text-ink-primary mb-3 leading-snug">
                {selectedReport.title}
              </h2>

              <div className="flex flex-wrap gap-2 text-xs font-mono text-ink-muted">
                <span className="bg-white px-2 py-0.5 rounded border border-border-subtle">
                  {selectedReport.repository.repoName}
                </span>
                {selectedReport.repository.analyzedBranch && (
                  <span className="bg-white px-2 py-0.5 rounded border border-border-subtle">
                    {selectedReport.repository.analyzedBranch}
                  </span>
                )}
                {selectedReport.repository.analyzedCommit && (
                  <span className="bg-white px-2 py-0.5 rounded border border-border-subtle">
                    {selectedReport.repository.analyzedCommit.slice(0, 7)}
                  </span>
                )}
                <span className="bg-white px-2 py-0.5 rounded border border-border-subtle">
                  {new Date(selectedReport.generatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
              {/* 1. Executive Summary */}
              {selectedReport.executiveSummary && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-semibold text-ink-primary uppercase tracking-wider">
                    1. Executive Summary
                  </h3>

                  <div className="p-4 bg-surface-secondary border border-border-subtle rounded-lg space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-ink-primary">
                        {selectedReport.executiveSummary.headline}
                      </span>
                      {selectedReport.executiveSummary.riskAssessmentLevel && (
                        <Badge variant={getRiskBadgeVariant(selectedReport.executiveSummary.riskAssessmentLevel)} size="sm">
                          {selectedReport.executiveSummary.riskAssessmentLevel.toUpperCase()} RISK
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      {selectedReport.executiveSummary.overview}
                    </p>
                  </div>

                  {selectedReport.executiveSummary.criticalTakeaways?.length > 0 && (
                    <ul className="space-y-1.5 pl-1 text-xs text-ink-secondary">
                      {selectedReport.executiveSummary.criticalTakeaways.map((t, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-brand-deep font-bold">•</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* 2. Engineering Problem Statement & Scope */}
              {selectedReport.proposedChange && (
                <div className="space-y-2.5 pt-3 border-t border-border-subtle">
                  <h3 className="text-xs font-semibold text-ink-primary uppercase tracking-wider">
                    2. Engineering Problem Statement &amp; Scope
                  </h3>
                  <div className="p-4 rounded-lg bg-surface-secondary border border-border-subtle space-y-2">
                    <div className="flex items-center flex-wrap gap-2 text-xs">
                      <span className="font-mono text-ink-primary bg-white px-2 py-0.5 rounded border border-border-subtle">
                        {selectedReport.proposedChange.targetSymbolOrFile}
                      </span>
                      <Badge variant="purple" size="sm">
                        {selectedReport.proposedChange.changeCategory}
                      </Badge>
                    </div>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      {selectedReport.proposedChange.questionOrDescription}
                    </p>
                  </div>
                </div>
              )}

              {/* 3. Audited Findings & Architectural Reasoning */}
              {selectedReport.findings?.length > 0 && (
                <div className="space-y-2.5 pt-3 border-t border-border-subtle">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-ink-primary uppercase tracking-wider">
                      3. Audited Findings &amp; Architectural Reasoning
                    </h3>
                    <span className="text-[11px] font-mono text-ink-faint">
                      {selectedReport.findings.length} findings
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selectedReport.findings.map((f) => (
                      <div
                        key={f.id}
                        className="p-3.5 rounded-lg bg-surface-secondary border border-border-subtle space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-mono font-medium text-xs text-ink-primary">{f.title}</span>
                          <Badge variant={getRiskBadgeVariant(f.severity)} size="sm">
                            {f.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-ink-muted leading-relaxed">
                          {f.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Traceable Evidence Grounding */}
              {selectedReport.evidence?.length > 0 && (
                <div className="space-y-2.5 pt-3 border-t border-border-subtle">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-ink-primary uppercase tracking-wider">
                      4. Traceable Evidence Grounding
                    </h3>
                    <span className="text-[11px] font-mono text-ink-faint">
                      {selectedReport.evidence.length} sources
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {selectedReport.evidence.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary border border-border-subtle text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-mono font-medium text-ink-primary truncate">{ev.title}</div>
                          <div className="text-[10px] font-mono text-ink-muted truncate mt-0.5">
                            {ev.filePath ? `${ev.filePath}:${ev.startLine || 1}` : ev.commitHash?.slice(0, 7)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="success" size="sm">
                            {Math.round(ev.confidenceScore * 100)}% verified
                          </Badge>
                          {ev.url && (
                            <a
                              href={ev.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-deep hover:underline"
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