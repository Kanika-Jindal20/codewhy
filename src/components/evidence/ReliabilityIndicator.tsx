import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReliabilityAssessment, ReliabilityLabel } from '@/types/evidence';

const LABELS: Record<ReliabilityLabel, { title: string; tone: string; Icon: LucideIcon }> = {
  high_evidence: { title: 'High evidence', tone: 'border-brand-emerald/30 bg-brand-emerald/5 text-ink-primary', Icon: CheckCircle2 },
  limited_evidence: { title: 'Limited evidence', tone: 'border-amber-200 bg-amber-50/60 text-ink-primary', Icon: AlertTriangle },
  conflicting_evidence: { title: 'Conflicting evidence', tone: 'border-rose-200 bg-rose-50/60 text-ink-primary', Icon: AlertCircle },
  insufficient_evidence: { title: 'Insufficient evidence', tone: 'border-border-default bg-surface-secondary text-ink-secondary', Icon: HelpCircle },
};

export function ReliabilityIndicator({ assessment }: { assessment: ReliabilityAssessment }) {
  const config = LABELS[assessment.label];
  const Icon = config.Icon;
  return (
    <section className={`rounded-lg border p-4 ${config.tone}`} aria-label={`Answer reliability: ${config.title}`}>
      <div className="flex items-center gap-2 font-medium text-xs">
        <Icon className="w-3.5 h-3.5 text-brand-deep" aria-hidden />
        <span className="font-semibold text-ink-primary">{config.title}</span>
        <span className="text-[10px] text-ink-faint font-mono">Evidence assessment</span>
      </div>
      <p className="text-xs text-ink-muted mt-2 font-medium">Why this assessment?</p>
      <ul className="mt-1 space-y-1 text-xs text-ink-muted list-disc pl-5">
        {assessment.reasons.map((reason) => <li key={reason}>{reason}</li>)}
      </ul>
      {assessment.conflictGroups.length > 0 && (
        <p className="mt-2 text-xs text-ink-muted">Conflicting records are shown below together so you can compare their source details and dates.</p>
      )}
    </section>
  );
}