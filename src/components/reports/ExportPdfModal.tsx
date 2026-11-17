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

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

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

      setDownloadSuccessTime(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Unknown generation failure');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-pdf-modal-title"
    >
      <div className="bg-white border border-border-default rounded-xl shadow-xl max-w-lg w-full flex flex-col max-h-[90vh] overflow-hidden text-ink-primary">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border-default flex items-center justify-between shrink-0 bg-surface-secondary">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-brand-emerald/10 text-brand-deep">
              <FileText className="w-3.5 h-3.5" />
            </span>
            <div>
              <h2 id="export-pdf-modal-title" className="text-xs font-semibold text-ink-primary">
                Export Engineering Decision Report (PDF)
              </h2>
              <span className="text-[10px] text-ink-muted">
                Publication-grade, traceable documentation
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-ink-muted hover:text-ink-primary hover:bg-surface-muted transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Title customization */}
          <div>
            <label htmlFor="report-custom-title" className="block text-xs font-semibold text-ink-primary mb-1">
              Document Title
            </label>
            <input
              id="report-custom-title"
              type="text"
              value={customTitle}
              onChange={e => setCustomTitle(e.target.value)}
              className="w-full px-3 py-1.5 bg-surface-secondary border border-border-default rounded-md text-xs font-sans text-ink-primary placeholder:text-ink-faint focus:outline-none focus:border-brand-emerald"
              placeholder="Enter report title…"
            />
          </div>

          {/* Section Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-ink-primary">
                Report Sections
              </span>
              <span className="text-[10px] text-ink-muted">
                Empty sections are omitted
              </span>
            </div>

            <div className="space-y-1 bg-surface-secondary border border-border-default rounded-lg p-2 max-h-52 overflow-y-auto">
              {sectionOptions.map(opt => {
                const isChecked = sections[opt.key] && opt.isAvailable;
                return (
                  <div
                    key={opt.key}
                    onClick={() => opt.isAvailable && toggleSection(opt.key)}
                    className={`flex items-center justify-between p-1.5 rounded text-xs transition-colors ${
                      !opt.isAvailable
                        ? 'opacity-40 cursor-not-allowed text-ink-faint'
                        : isChecked
                        ? 'bg-white text-ink-primary cursor-pointer border border-border-subtle'
                        : 'hover:bg-white text-ink-muted cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-brand-deep shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-ink-faint shrink-0" />
                      )}
                      <span className="font-normal truncate">{opt.label}</span>
                    </div>

                    <div className="shrink-0 text-[10px] font-mono text-ink-faint">
                      {opt.isAvailable ? (
                        opt.itemCountDescription || 'Available'
                      ) : (
                        'N/A'
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guarantee Banner */}
          <div className="p-3 bg-surface-secondary border border-border-subtle rounded-lg text-[11px] text-ink-muted space-y-0.5">
            <div className="flex items-center gap-1.5 text-brand-deep font-semibold text-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Grounded Evidence &amp; Verification Guarantee</span>
            </div>
            <p className="leading-relaxed">
              Exported document features running headers, page numbering, clickable remote source links, and clear differentiation between verified AST links and heuristics.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold">Export Failed</div>
                <div className="text-[11px]">{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {downloadSuccessTime && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-brand-deep" />
              <div className="text-xs">
                <div className="font-semibold">PDF Downloaded Successfully</div>
                <div className="text-[11px]">
                  Generated and saved at {downloadSuccessTime}.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-border-default flex items-center justify-between bg-surface-secondary shrink-0">
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
            {isGenerating ? 'Generating PDF…' : 'Download PDF'}
          </Button>
        </div>
      </div>
    </div>
  );
};