'use client';

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  History, 
  GitCommit, 
  Bookmark, 
  Check, 
  Info, 
  ShieldCheck, 
  FileText 
} from 'lucide-react';
import { ImpactAnalysisResult } from '@/types/impact';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface RisksAndChecklistProps {
  result: ImpactAnalysisResult;
  onSaveInvestigation?: () => void;
}

export const RisksAndChecklist: React.FC<RisksAndChecklistProps> = ({
  result,
  onSaveInvestigation,
}) => {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    if (onSaveInvestigation) onSaveInvestigation();
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column: Potential Risks & Past Regressions */}
      <div className="space-y-6">
        {/* Potential Risks */}
        <div className="bg-white border border-border-default rounded-xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-subtle">
            <h3 className="text-sm font-semibold text-ink-primary flex items-center gap-2">
              <span className="p-1 rounded bg-rose-50 text-rose-600">
                <AlertTriangle className="w-3.5 h-3.5" />
              </span>
              Potential Risks & Breakage Vectors
            </h3>
            <span className="text-[10px] font-mono text-ink-faint px-2 py-0.5 rounded bg-surface-secondary border border-border-subtle">
              Evidence Grounded
            </span>
          </div>

          <div className="space-y-2.5">
            {result.potentialRisks.map((riskItem, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-surface-secondary border border-border-subtle hover:bg-white hover:border-border-default transition-all"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-medium text-ink-primary">
                    {riskItem.risk}
                  </span>
                  <Badge
                    variant={riskItem.level === 'high' ? 'error' : riskItem.level === 'medium' ? 'warning' : 'info'}
                    size="sm"
                  >
                    {riskItem.level.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  {riskItem.rationale}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Historical Regressions */}
        <div className="bg-white border border-border-default rounded-xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-subtle">
            <h3 className="text-sm font-semibold text-ink-primary flex items-center gap-2">
              <span className="p-1 rounded bg-purple-50 text-purple-600">
                <History className="w-3.5 h-3.5" />
              </span>
              Historical Regressions in Area
            </h3>
            <span className="text-xs text-ink-faint font-mono">
              {result.pastRegressions.length} verified fixes
            </span>
          </div>

          {result.pastRegressions.length === 0 ? (
            <div className="p-5 text-center text-xs text-ink-faint border border-dashed border-border-default rounded-lg bg-surface-secondary">
              No historical bugfixes or regressions recorded for this file.
            </div>
          ) : (
            <div className="space-y-2">
              {result.pastRegressions.map((reg) => (
                <div
                  key={reg.id}
                  className="p-3 rounded-lg bg-white border border-border-subtle text-xs"
                >
                  <div className="flex items-center justify-between font-mono text-xs mb-1">
                    <span className="px-1.5 py-0.5 rounded bg-surface-muted text-brand-deep border border-border-subtle font-mono">
                      {reg.commitHash.substring(0, 7)}
                    </span>
                    <span className="text-[11px] text-ink-faint">
                      {new Date(reg.date).toLocaleDateString()} by {reg.author.split(' ')[0]}
                    </span>
                  </div>
                  <div className="font-medium text-ink-primary mb-0.5">
                    {reg.summary}
                  </div>
                  <p className="text-ink-muted text-[11px]">
                    {reg.relevanceExplanation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Historical Co-changes & Analysis Limitations */}
      <div className="space-y-6">
        {/* Historical Co-changes */}
        <div className="bg-white border border-border-default rounded-xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-subtle">
            <h3 className="text-sm font-semibold text-ink-primary flex items-center gap-2">
              <span className="p-1 rounded bg-surface-muted text-ink-secondary">
                <GitCommit className="w-3.5 h-3.5" />
              </span>
              Coupled Files (Git Co-Change History)
            </h3>
            <span className="text-xs text-ink-faint font-mono">
              {result.coChangedFiles.length} files
            </span>
          </div>

          {result.coChangedFiles.length === 0 ? (
            <div className="p-5 text-center text-xs text-ink-faint border border-dashed border-border-default rounded-lg bg-surface-secondary">
              No co-change coupling detected in Git history.
            </div>
          ) : (
            <div className="space-y-2">
              {result.coChangedFiles.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary border border-border-subtle text-xs hover:bg-white transition-all"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-mono font-medium text-ink-primary truncate">
                      {item.relatedFilePath}
                    </div>
                    <div className="text-[11px] text-ink-muted italic truncate mt-0.5">
                      {item.evidence.commitMessage}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="purple" size="sm">
                      {item.coChangeCount} {item.coChangeCount === 1 ? 'co-commit' : 'co-commits'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manual Verification Checklist */}
        <div className="bg-white border border-border-default rounded-xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-subtle">
            <h3 className="text-sm font-semibold text-ink-primary flex items-center gap-2">
              <span className="p-1 rounded bg-brand-emerald/10 text-brand-deep">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
              Pre-Release Verification Checklist
            </h3>
          </div>

          <div className="space-y-3">
            {result.manualVerificationAreas.map((area, idx) => (
              <div key={idx} className="border-l-2 border-brand-emerald bg-surface-secondary rounded-r-lg p-3 border border-l-0 border-border-subtle">
                <div className="text-xs font-semibold text-ink-primary mb-1.5">
                  {area.area}
                </div>
                <ul className="space-y-1 text-xs text-ink-muted">
                  {area.checklist.map((item, cIdx) => (
                    <li key={cIdx} className="flex items-start gap-1.5">
                      <span className="text-brand-deep font-bold">•</span>
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Limitations & Save Action */}
        <div className="bg-white border border-border-default rounded-xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-ink-primary flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-brand-deep" />
              Documented Analysis Boundaries
            </h4>
          </div>
          <ul className="space-y-1.5 text-xs text-ink-muted mb-4">
            {result.limitations.map((lim, i) => (
              <li key={i} className="flex items-start gap-2 bg-surface-secondary p-2 rounded border border-border-subtle">
                <span className="text-amber-600 font-bold">•</span>
                <span className="leading-snug">{lim}</span>
              </li>
            ))}
          </ul>

          <div className="pt-3.5 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-ink-muted">
              Persist this blast radius evaluation for audit trails & PR reviews
            </span>
            <Button
              variant={saved ? 'secondary' : 'primary'}
              size="sm"
              icon={saved ? <Check className="w-3.5 h-3.5 text-brand-deep" /> : <Bookmark className="w-3.5 h-3.5" />}
              onClick={handleSave}
              className="shrink-0"
            >
              {saved ? 'Investigation Saved' : 'Save to History'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};