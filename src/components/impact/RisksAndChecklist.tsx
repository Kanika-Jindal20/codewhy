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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left Column: Potential Risks & Past Regressions */}
      <div className="space-y-4">
        {/* Potential Risks */}
        <div className="bg-app-panel border border-app-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-status-warning" />
              Potential Risks & Breakage Vectors
            </h3>
            <Badge variant="outline" size="sm">Evidence-Grounded</Badge>
          </div>

          <div className="space-y-3">
            {result.potentialRisks.map((riskItem, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-app-surface/50 border border-app-border"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-text-primary">
                    {riskItem.risk}
                  </span>
                  <Badge
                    variant={riskItem.level === 'high' ? 'error' : riskItem.level === 'medium' ? 'warning' : 'info'}
                    size="sm"
                  >
                    {riskItem.level}
                  </Badge>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {riskItem.rationale}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Historical Regressions */}
        <div className="bg-app-panel border border-app-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <History className="w-4 h-4 text-accent-secondary" />
              Relevant Past Regressions in this Area
            </h3>
            <span className="text-xs text-text-muted font-mono">
              {result.pastRegressions.length} historical fixes
            </span>
          </div>

          {result.pastRegressions.length === 0 ? (
            <div className="p-4 text-center text-xs text-text-muted border border-dashed border-app-border rounded">
              No historical bugfixes or regressions recorded for this file.
            </div>
          ) : (
            <div className="space-y-2.5">
              {result.pastRegressions.map((reg) => (
                <div
                  key={reg.id}
                  className="p-3 rounded-lg bg-app-surface/50 border border-app-border text-xs"
                >
                  <div className="flex items-center justify-between font-mono text-xs mb-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-accent-secondary/15 text-accent-secondary border border-accent-secondary/30">
                      {reg.commitHash.substring(0, 7)}
                    </span>
                    <span className="text-[11px] text-text-muted">
                      {new Date(reg.date).toLocaleDateString()} by {reg.author.split(' ')[0]}
                    </span>
                  </div>
                  <div className="font-semibold text-text-primary mb-1">
                    {reg.summary}
                  </div>
                  <p className="text-text-muted text-[11px]">
                    {reg.relevanceExplanation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Historical Co-changes & Analysis Limitations */}
      <div className="space-y-4">
        {/* Historical Co-changes */}
        <div className="bg-app-panel border border-app-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-status-info" />
              Frequently Changed Together (Git History)
            </h3>
            <span className="text-xs text-text-muted font-mono">
              {result.coChangedFiles.length} files
            </span>
          </div>

          {result.coChangedFiles.length === 0 ? (
            <div className="p-4 text-center text-xs text-text-muted border border-dashed border-app-border rounded">
              No co-change coupling detected in Git history.
            </div>
          ) : (
            <div className="space-y-2">
              {result.coChangedFiles.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-app-surface/50 border border-app-border text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-mono font-medium text-text-primary truncate">
                      {item.relatedFilePath}
                    </div>
                    <div className="text-[10px] text-text-muted italic truncate">
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
        <div className="bg-app-panel border border-app-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-status-success" />
              Manual Verification Checklist
            </h3>
          </div>

          <div className="space-y-3">
            {result.manualVerificationAreas.map((area, idx) => (
              <div key={idx} className="border-l-2 border-accent-primary/60 pl-3 py-1">
                <div className="text-xs font-semibold text-text-primary mb-1">
                  {area.area}
                </div>
                <ul className="space-y-1 text-xs text-text-secondary">
                  {area.checklist.map((item, cIdx) => (
                    <li key={cIdx} className="flex items-start gap-1.5">
                      <span className="text-accent-primary">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Limitations & Save Action */}
        <div className="bg-app-panel border border-app-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 text-text-muted" />
              Documented Analysis Limitations
            </h4>
          </div>
          <ul className="space-y-1.5 text-[11px] text-text-muted mb-4 font-mono">
            {result.limitations.map((lim, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-status-warning">•</span>
                <span>{lim}</span>
              </li>
            ))}
          </ul>

          <div className="pt-3 border-t border-app-border flex items-center justify-between">
            <span className="text-xs text-text-muted">
              Preserve this impact assessment for code reviews
            </span>
            <Button
              variant={saved ? 'secondary' : 'outline'}
              size="sm"
              icon={saved ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Bookmark className="w-3.5 h-3.5" />}
              onClick={handleSave}
            >
              {saved ? 'Investigation Saved' : 'Save Investigation'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
