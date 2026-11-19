import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import { ConfidenceLevel } from '@/types/evidence';

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  score?: number;
  className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  level,
  score,
  className = '',
}) => {
  const config = {
    high: {
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
      label: 'High evidence',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    medium: {
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
      label: 'Partial evidence',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    low: {
      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />,
      label: 'Limited evidence',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    insufficient_evidence: {
      icon: <HelpCircle className="w-3.5 h-3.5 text-slate-500" />,
      label: 'Insufficient Evidence',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  }[level];

  const scoreTitle = score !== undefined ? 'Heuristic evidence-quality label; this score is not a calibrated probability.' : undefined;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border font-mono ${config.badgeClass} ${className}`}
      title={scoreTitle}
    >
      {config.icon}
      <span>{config.label}</span>
      {score !== undefined && <span className="text-[9px] opacity-75">heuristic</span>}
    </span>
  );
};
