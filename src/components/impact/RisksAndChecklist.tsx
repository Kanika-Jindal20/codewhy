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
        <div className="bg-white border border-app-border rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-app-border">
            <h3 className="text-sm font-bold text-[#25324B] flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                <AlertTriangle className="w-4 h-4 stroke-[2]" />
              </span>
              Potential Risks & Breakage Vectors
            </h3>
            <span className="text-[10px] font-semibold text-[#4169E1] bg-[#E5EDFF] px-2 py-0.5 rounded-full border border-[#C9D9FF]">
              Evidence Grounded
            </span>
          </div>

          <div className="space-y-3">
            {result.potentialRisks.map((riskItem, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#F8FAFC] border border-app-border shadow-2xs hover:bg-white hover:border-[#C9D9FF] transition-all"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-[#25324B]">
                    {riskItem.risk}
                  </span>
                  <Badge
                    variant={riskItem.level === 'high' ? 'error' : riskItem.level === 'medium' ? 'warning' : 'info'}
                    size="sm"
                  >
                    {riskItem.level.toUpperCase()}
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
        <div className="bg-white border border-app-border rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-app-border">
            <h3 className="text-sm font-bold text-[#25324B] flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#EEE9FF] text-[#5546B8] border border-[#D9D1FC]">
                <History className="w-4 h-4 stroke-[2]" />
              </span>
              Historical Regressions in Area
            </h3>
            <span className="text-xs text-text-muted font-mono font-semibold">
              {result.pastRegressions.length} verified fixes
            </span>
          </div>

          {result.pastRegressions.length === 0 ? (
            <div className="p-4 text-center text-xs text-text-muted border border-dashed border-app-border rounded-lg bg-white">
              No historical bugfixes or regressions recorded for this file.
            </div>
          ) : (
            <div className="space-y-2.5">
              {result.pastRegressions.map((reg) => (
                <div
                  key={reg.id}
                  className="p-3.5 rounded-lg bg-white border border-app-border text-xs shadow-2xs"
                >
                  <div className="flex items-center justify-between font-mono text-xs mb-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-app-subtleBlue text-accent-primary border border-accent-primary/20">
                      {reg.commitHash.substring(0, 7)}
                    </span>
                    <span className="text-[11px] text-text-muted">
                      {new Date(reg.date).toLocaleDateString()} by {reg.author.split(' ')[0]}
                    </span>
                  </div>
                  <div className="font-semibold text-text-primary mb-1">
                    {reg.summary}
                  </div>
                  <p className="text-text-secondary text-[11px]">
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
        <div className="bg-white border border-app-border rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-app-border">
            <h3 className="text-sm font-bold text-[#25324B] flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#E5EDFF] text-[#4169E1] border border-[#C9D9FF]">
                <GitCommit className="w-4 h-4 stroke-[2]" />
              </span>
              Coupled Files (Git Co-Change History)
            </h3>
            <span className="text-xs text-text-muted font-mono font-semibold">
              {result.coChangedFiles.length} files
            </span>
          </div>

          {result.coChangedFiles.length === 0 ? (
            <div className="p-5 text-center text-xs text-text-muted border border-dashed border-app-border rounded-xl bg-[#F8FAFC]">
              No co-change coupling detected in Git history.
            </div>
          ) : (
            <div className="space-y-2.5">
              {result.coChangedFiles.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFC] border border-app-border text-xs shadow-2xs hover:bg-white transition-all"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-mono font-bold text-[#25324B] truncate">
                      {item.relatedFilePath}
                    </div>
                    <div className="text-[11px] text-text-secondary italic truncate mt-0.5">
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
        <div className="bg-white border border-app-border rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-app-border">
            <h3 className="text-sm font-bold text-[#25324B] flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#DDF6EA] text-[#1E7E50] border border-[#B7EDD2]">
                <ShieldCheck className="w-4 h-4 stroke-[2]" />
              </span>
              Pre-Release Verification Checklist
            </h3>
          </div>

          <div className="space-y-3.5">
            {result.manualVerificationAreas.map((area, idx) => (
              <div key={idx} className="border-l-3 border-[#4169E1] bg-[#E5EDFF]/40 rounded-r-xl p-3.5 border border-l-0 border-[#C9D9FF]">
                <div className="text-xs font-bold text-[#1E293B] mb-1.5">
                  {area.area}
                </div>
                <ul className="space-y-1.5 text-xs text-text-secondary">
                  {area.checklist.map((item, cIdx) => (
                    <li key={cIdx} className="flex items-start gap-2">
                      <span className="text-[#4169E1] font-bold">•</span>
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Limitations & Save Action */}
        <div className="bg-white border border-app-border rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-[#25324B] flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#4169E1]" />
              Documented Analysis Boundaries
            </h4>
          </div>
          <ul className="space-y-2 text-xs text-text-secondary mb-5">
            {result.limitations.map((lim, i) => (
              <li key={i} className="flex items-start gap-2 bg-[#F8FAFC] p-2.5 rounded-lg border border-app-border">
                <span className="text-[#D97706] font-bold">•</span>
                <span className="leading-snug">{lim}</span>
              </li>
            ))}
          </ul>

          <div className="pt-4 border-t border-app-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-text-secondary">
              Persist this blast radius evaluation for audit trails & PR reviews
            </span>
            <Button
              variant={saved ? 'secondary' : 'primary'}
              size="sm"
              icon={saved ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Bookmark className="w-3.5 h-3.5" />}
              onClick={handleSave}
              className="shadow-2xs shrink-0"
            >
              {saved ? 'Investigation Saved' : 'Save to History'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
