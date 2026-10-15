'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { EngineeringDecisionReport } from '@/types/report';
import { SAMPLE_REPORT_JWT_REFACTOR, SAMPLE_REPORT_MINIMAL } from '@/lib/reports/sample-report-data';
import { ExportPdfModal } from '@/components/reports/ExportPdfModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

export const ReportsClient: React.FC = () => {
  const [reports] = useState<EngineeringDecisionReport[]>([
    SAMPLE_REPORT_JWT_REFACTOR,
    SAMPLE_REPORT_MINIMAL,
  ]);
  const [selectedReport, setSelectedReport] = useState<EngineeringDecisionReport>(SAMPLE_REPORT_JWT_REFACTOR);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleOpenExport = (report: EngineeringDecisionReport) => {
    setSelectedReport(report);
    setIsExportModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="bg-app-panel border border-app-border rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-2 rounded-lg bg-accent-primary/20 text-accent-primary border border-accent-primary/30">
                <FileText className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                Engineering Decision Reports
              </h1>
              <Badge variant="purple" size="sm">Feature 12</Badge>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed max-w-2xl">
              Turn code investigations, pre-change blast radius evaluations, and architecture reviews into publication-grade, traceable PDF reports with clickable source evidence.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={() => handleOpenExport(selectedReport)}
              icon={<Download className="w-4 h-4" />}
            >
              Export Selected Report (PDF)
            </Button>
          </div>
        </div>

        {/* Quick Highlights Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-app-border text-xs">
          <div className="flex items-center gap-2 text-text-secondary">
            <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
            <span>Grounded in AST imports & verified Git history</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <ShieldCheck className="w-4 h-4 text-status-info shrink-0" />
            <span>Non-causality standards & uncertainty disclosures</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <FileText className="w-4 h-4 text-accent-secondary shrink-0" />
            <span>Clean, vector-rendered multi-page engineering format</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Report Selection + Interactive Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Report List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted font-mono">
              Available Decision Reports
            </h2>
            <span className="text-[11px] font-mono text-text-muted">{reports.length} audits</span>
          </div>

          <div className="space-y-3">
            {reports.map((rep) => {
              const isSelected = rep.id === selectedReport.id;
              const hasImpact = Boolean(rep.impactAnalysis);
              const hasGaps = Boolean(rep.knowledgeGaps);

              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReport(rep)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-app-surface border-accent-primary ring-1 ring-accent-primary shadow-lg'
                      : 'bg-app-panel border-app-border hover:border-app-border/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-app-bg text-text-muted border border-app-border">
                      {rep.repository.repoName}
                    </span>
                    <Badge
                      variant={
                        rep.executiveSummary?.riskAssessmentLevel === 'critical' ||
                        rep.executiveSummary?.riskAssessmentLevel === 'elevated'
                          ? 'warning'
                          : 'success'
                      }
                      size="sm"
                    >
                      {(rep.executiveSummary?.riskAssessmentLevel || 'moderate').toUpperCase()} RISK
                    </Badge>
                  </div>

                  <h3 className="text-xs font-bold text-text-primary line-clamp-2 mb-2 font-mono">
                    {rep.title}
                  </h3>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {hasImpact && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-accent-primary/10 text-accent-primary rounded">
                        Blast Radius
                      </span>
                    )}
                    {hasGaps && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-status-warning/10 text-status-warning rounded">
                        Knowledge Gaps
                      </span>
                    )}
                    {rep.evidence?.length > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-app-surface text-text-muted rounded">
                        {rep.evidence.length} Evidence Links
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-app-border/60 text-[11px] text-text-muted">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3" />
                      {new Date(rep.generatedAt).toLocaleDateString()}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenExport(rep);
                      }}
                      className="text-accent-primary hover:underline font-semibold flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Export PDF
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick link to trigger fresh analyses */}
          <div className="bg-app-panel border border-app-border rounded-lg p-4 text-xs space-y-2">
            <div className="font-semibold text-text-primary flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-accent-primary" />
              Generate Fresh Audit
            </div>
            <p className="text-text-muted text-[11px] leading-relaxed">
              Run impact analysis on any component to automatically populate a formal decision report.
            </p>
            <Link
              href="/impact"
              className="text-accent-primary hover:underline font-semibold inline-flex items-center gap-1 text-[11px]"
            >
              Launch Impact Workspace <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Right Column: Selected Report Live Preview (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-app-panel border border-app-border rounded-lg p-6 space-y-6">
            {/* Report Header preview */}
            <div className="border-b border-app-border pb-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-accent-primary font-bold">
                  Document Preview
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenExport(selectedReport)}
                  icon={<Download className="w-3.5 h-3.5" />}
                >
                  Export to PDF
                </Button>
              </div>

              <h2 className="text-lg font-bold text-text-primary mb-2 font-mono">
                {selectedReport.title}
              </h2>

              <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted font-mono">
                <span>Repo: <strong className="text-text-secondary">{selectedReport.repository.repoName}</strong></span>
                {selectedReport.repository.analyzedCommit && (
                  <span>Commit: <strong className="text-accent-secondary">{selectedReport.repository.analyzedCommit.slice(0, 10)}</strong></span>
                )}
                {selectedReport.repository.analyzedBranch && (
                  <span>Branch: <strong className="text-text-secondary">{selectedReport.repository.analyzedBranch}</strong></span>
                )}
                <span>Auditor: <strong className="text-text-secondary">{selectedReport.author || 'CodeWhy Grounded Engine'}</strong></span>
              </div>
            </div>

            {/* Executive Summary */}
            {selectedReport.executiveSummary && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted font-mono">
                  1. Executive Summary
                </h3>
                <div className="p-3.5 bg-app-surface/60 border-l-4 border-accent-primary rounded-r-lg space-y-1.5">
                  <div className="font-semibold text-text-primary text-xs">
                    {selectedReport.executiveSummary.headline}
                  </div>
                  <p className="text-text-secondary text-xs leading-relaxed">
                    {selectedReport.executiveSummary.overview}
                  </p>
                </div>

                {selectedReport.executiveSummary.criticalTakeaways?.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-semibold text-text-secondary">Key Takeaways:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-xs text-text-muted">
                      {selectedReport.executiveSummary.criticalTakeaways.map((t, idx) => (
                        <li key={idx} className="leading-relaxed">{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Scope / Problem statement */}
            {selectedReport.proposedChange && (
              <div className="space-y-2 border-t border-app-border/60 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted font-mono">
                  2. Engineering Problem Statement & Scope
                </h3>
                <div className="p-3 rounded-lg bg-app-surface/40 border border-app-border text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted font-mono text-[11px]">Target:</span>
                    <span className="font-mono font-semibold text-text-primary">
                      {selectedReport.proposedChange.targetSymbolOrFile}
                    </span>
                    <Badge variant="purple" size="sm">
                      {selectedReport.proposedChange.changeCategory}
                    </Badge>
                  </div>
                  <p className="text-text-secondary leading-relaxed">
                    {selectedReport.proposedChange.questionOrDescription}
                  </p>
                </div>
              </div>
            )}

            {/* Audited Findings */}
            {selectedReport.findings?.length > 0 && (
              <div className="space-y-2 border-t border-app-border/60 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted font-mono">
                  3. Audited Findings & Architectural Reasoning ({selectedReport.findings.length})
                </h3>
                <div className="space-y-2">
                  {selectedReport.findings.map((f) => (
                    <div
                      key={f.id}
                      className="p-3 rounded-lg bg-app-surface/40 border border-app-border text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text-primary font-mono">{f.title}</span>
                        <Badge
                          variant={f.severity === 'critical' || f.severity === 'high' ? 'error' : 'default'}
                          size="sm"
                        >
                          {f.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-text-secondary leading-relaxed text-[11px]">
                        {f.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence References */}
            {selectedReport.evidence?.length > 0 && (
              <div className="space-y-2 border-t border-app-border/60 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted font-mono">
                  Traceable Evidence Grounding ({selectedReport.evidence.length})
                </h3>
                <div className="space-y-1.5">
                  {selectedReport.evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between p-2.5 rounded bg-app-surface/30 border border-app-border text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-text-primary truncate">{ev.title}</div>
                        <div className="text-[11px] font-mono text-text-muted truncate">
                          {ev.filePath ? `${ev.filePath}:${ev.startLine || 1}` : ev.commitHash?.slice(0, 10)}
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
                            className="text-accent-primary hover:underline"
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

      {/* Export PDF Modal */}
      <ExportPdfModal
        report={selectedReport}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
};
