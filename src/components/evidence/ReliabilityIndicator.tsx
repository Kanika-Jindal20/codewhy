import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReliabilityAssessment, ReliabilityLabel } from '@/types/evidence';

const LABELS: Record<ReliabilityLabel, { title: string; tone: string; Icon: LucideIcon }> = {
  high_evidence: { title: 'High evidence', tone: 'border-status-success/30 bg-status-success/10 text-status-success', Icon: CheckCircle2 },
  limited_evidence: { title: 'Limited evidence', tone: 'border-status-warning/30 bg-status-warning/10 text-status-warning', Icon: AlertTriangle },
  conflicting_evidence: { title: 'Conflicting evidence', tone: 'border-status-warning/30 bg-status-warning/10 text-status-warning', Icon: AlertCircle },
  insufficient_evidence: { title: 'Insufficient evidence', tone: 'border-app-border bg-app-surface text-text-secondary', Icon: HelpCircle },
};

export function ReliabilityIndicator({ assessment }: { assessment: ReliabilityAssessment }) {
  const config = LABELS[assessment.label];
  const Icon = config.Icon;
  return (
    <section className={`rounded-lg border p-4 ${config.tone}`} aria-label={`Answer reliability: ${config.title}`}>
      <div className="flex items-center gap-2 font-semibold text-sm"><Icon className="w-4 h-4" aria-hidden />{config.title}<span className="text-[10px] font-normal text-text-muted">Evidence assessment (heuristic)</span></div>
      <p className="text-xs text-text-secondary mt-2">Why this assessment?</p>
      <ul className="mt-1 space-y-1 text-xs text-text-secondary list-disc pl-5">
        {assessment.reasons.map((reason) => <li key={reason}>{reason}</li>)}
      </ul>
      {assessment.conflictGroups.length > 0 && (
        <p className="mt-2 text-xs text-text-secondary">Conflicting records are shown below together so you can compare their source details and dates.</p>
      )}
    </section>
  );
}
