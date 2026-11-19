'use client';

import React, { useState } from 'react';
import {
  FileText,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CheckSquare,
  Square,
  ShieldCheck,
} from 'lucide-react';
import { EngineeringDecisionReport, ReportSectionSelection, DEFAULT_SECTION_SELECTION } from '@/types/report';
import { Button } from '@/components/ui/Button';

interface ExportPdfModalProps {
  report: EngineeringDecisionReport;
  isOpen: boolean;
  onClose: () => void;
}

interface SectionOption {
  key: keyof ReportSectionSelection;
  label: string;
  isAvailable: boolean;
  itemCountDescription?: string;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  const [customTitle, setCustomTitle] = useState(report.title);
  const [sections, setSections] = useState<ReportSectionSelection>({ ...DEFAULT_SECTION_SELECTION });
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadSuccessTime, setDownloadSuccessTime] = useState<string | null>(null);

  if (!isOpen) return null;

  // Determine section availability
  const sectionOptions: SectionOption[] = [
    {
      key: 'includeExecutiveSummary',
      label: 'Executive Summary & Key Takeaways',
      isAvailable: Boolean(report.executiveSummary),
      itemCountDescription: report.executiveSummary ? `${report.executiveSummary.criticalTakeaways.length} takeaways` : undefined,
    },
    {
      key: 'includeProposedChange',
      label: 'Engineering Problem Statement & Scope',
      isAvailable: Boolean(report.proposedChange),
      itemCountDescription: report.proposedChange ? report.proposedChange.targetSymbolOrFile : undefined,
    },
    {
      key: 'includeFindings',
      label: 'Audited Findings & Architectural Reasoning',
      isAvailable: Boolean(report.findings && report.findings.length > 0),
      itemCountDescription: report.findings ? `${report.findings.length} findings` : undefined,
    },
    {
      key: 'includeArchitectureContext',
      label: 'Architecture & Dependency Context',
      isAvailable: Boolean(report.architectureContext),
      itemCountDescription: report.architectureContext ? `${report.architectureContext.connectedNodes?.length || 0} symbols` : undefined,
    },
    {
      key: 'includeImpactAnalysis',
      label: 'Pre-Change Blast Radius & Downstream Impact',
      isAvailable: Boolean(report.impactAnalysis),
      itemCountDescription: report.impactAnalysis ? `${report.impactAnalysis.summary.totalAffected} affected` : undefined,
    },
    {
      key: 'includeDecisionTimeline',
      label: 'Historical Engineering Decision Timeline',
      isAvailable: Boolean(report.decisionTimeline && report.decisionTimeline.length > 0),
      itemCountDescription: report.decisionTimeline ? `${report.decisionTimeline.length} decisions` : undefined,
    },
    {
      key: 'includeKnowledgeGaps',
      label: 'Knowledge & Documentation Gaps',
      isAvailable: Boolean(report.knowledgeGaps),
      itemCountDescription: report.knowledgeGaps?.debtScore ? `Debt Score ${report.knowledgeGaps.debtScore.overallScore}` : undefined,
    },
    {
      key: 'includeEvidenceReferences',
      label: 'Traceable Evidence & Verified Grounding',
      isAvailable: Boolean(report.evidence && report.evidence.length > 0),
      itemCountDescription: report.evidence ? `${report.evidence.length} citations` : undefined,
    },
    {
      key: 'includeUncertainties',
      label: 'Conflicting Signals & Identified Uncertainties',
      isAvailable: Boolean(report.uncertainties && report.uncertainties.length > 0),
      itemCountDescription: report.uncertainties ? `${report.uncertainties.length} items` : undefined,
    },
    {
      key: 'includeLimitationsAndNextSteps',
      label: 'Analysis Caveats & Verification Checklist',
      isAvailable: Boolean(report.limitations),
      itemCountDescription: report.limitations?.recommendedChecklist ? `${report.limitations.recommendedChecklist.length} checks` : undefined,
    },
  ];

  const toggleSection = (key: keyof ReportSectionSelection) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGeneratePdf = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    setDownloadSuccessTime(null);

    try {
      const response = await fetch('/api/reports/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report,
          customTitle: customTitle.trim() || report.title,
          sections,
        }),
      });

      if (!response.ok) {
        let errText = 'Failed to generate PDF document.';
        try {
          const errData = await response.json();
          if (errData.error) errText = errData.error;
        } catch {
          // Response was not JSON
        }
        throw new Error(errText);
      }

      // Download file to client
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Extract filename from header or construct fallback
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'CodeWhy-Engineering-Decision-Report.pdf';
      if (contentDisposition && contentDisposition.includes('filename=')) {
        const matches = contentDisposition.match(/filename="?([^"]+)"?/);
        if (matches && matches[1]) filename = matches[1];
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Only show success state AFTER the file download is successfully triggered
      setDownloadSuccessTime(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Unknown generation failure');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-pdf-modal-title"
    >
      <div className="bg-white border border-app-border rounded-2xl shadow-xl max-w-xl w-full flex flex-col max-h-[90vh] overflow-hidden text-text-primary">
        {/* Header */}
        <div className="px-6 py-4 border-b border-app-border flex items-center justify-between shrink-0 bg-app-panel">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-app-subtleBlue text-accent-primary border border-accent-primary/20">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <h2 id="export-pdf-modal-title" className="text-sm font-semibold text-text-primary tracking-tight">
                Export Engineering Decision Report (PDF)
              </h2>
              <span className="text-[11px] text-text-muted">
                Publication-grade, traceable architectural documentation
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-app-surface transition-colors"
            aria-label="Close export dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Title customization */}
          <div>
            <label htmlFor="report-custom-title" className="block text-xs font-semibold text-text-primary mb-1.5">
              Document Title
            </label>
            <input
              id="report-custom-title"
              type="text"
              value={customTitle}
              onChange={e => setCustomTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-app-border rounded-lg text-xs font-sans text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-colors shadow-2xs"
              placeholder="Enter report title…"
            />
          </div>

          {/* Section Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-primary">
                Select Report Sections
              </span>
              <span className="text-[11px] text-text-muted">
                Empty sections are omitted automatically
              </span>
            </div>

            <div className="space-y-1 bg-app-surface/50 border border-app-border rounded-xl p-2.5 max-h-56 overflow-y-auto">
              {sectionOptions.map(opt => {
                const isChecked = sections[opt.key] && opt.isAvailable;
                return (
                  <div
                    key={opt.key}
                    onClick={() => opt.isAvailable && toggleSection(opt.key)}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                      !opt.isAvailable
                        ? 'opacity-40 cursor-not-allowed text-text-muted'
                        : isChecked
                        ? 'bg-app-subtleBlue text-text-primary cursor-pointer'
                        : 'hover:bg-white text-text-secondary cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-accent-primary shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-text-muted shrink-0" />
                      )}
                      <span className="font-medium truncate">{opt.label}</span>
                    </div>

                    <div className="shrink-0 text-[10px] font-mono">
                      {opt.isAvailable ? (
                        <span className="text-accent-secondary">{opt.itemCountDescription || 'Available'}</span>
                      ) : (
                        <span className="text-text-muted">Not in this audit</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quality Standards Guarantee Banner */}
          <div className="p-3.5 bg-app-surface border border-app-border rounded-xl text-[11px] text-text-muted space-y-1">
            <div className="flex items-center gap-1.5 text-status-success font-semibold text-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Grounded Evidence & Non-Causality Guarantee</span>
            </div>
            <p className="leading-relaxed text-text-secondary">
              Exported document features running headers, page numbering, clickable remote source links, and clear differentiation between verified AST links and statistical co-change suggestions.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-status-error/10 border border-status-error/30 text-status-error flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-semibold">Export Failed</div>
                <div className="text-[11px] text-status-error/90">{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Success Message (only shown AFTER file is downloaded) */}
          {downloadSuccessTime && (
            <div className="p-3.5 rounded-xl bg-status-success/10 border border-status-success/30 text-status-success flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">PDF Downloaded Successfully</div>
                <div className="text-[11px] text-status-success/90">
                  Engineering decision report was generated and saved at {downloadSuccessTime}.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-app-border flex items-center justify-between bg-app-panel shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleGeneratePdf}
            isLoading={isGenerating}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            {isGenerating ? 'Generating PDF Document…' : 'Generate & Download PDF'}
          </Button>
        </div>
      </div>
    </div>
  );
};
