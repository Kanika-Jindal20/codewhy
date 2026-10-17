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
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />,
      label: 'High evidence',
      badgeClass: 'bg-status-success/10 text-status-success border-status-success/30',
    },
    medium: {
      icon: <AlertTriangle className="w-3.5 h-3.5 text-status-warning" />,
      label: 'Partial evidence',
      badgeClass: 'bg-status-warning/10 text-status-warning border-status-warning/30',
    },
    low: {
      icon: <AlertCircle className="w-3.5 h-3.5 text-status-error" />,
      label: 'Limited evidence',
      badgeClass: 'bg-status-error/10 text-status-error border-status-error/30',
    },
    insufficient_evidence: {
      icon: <HelpCircle className="w-3.5 h-3.5 text-text-muted" />,
      label: 'Insufficient Evidence',
      badgeClass: 'bg-app-surface text-text-muted border-app-border',
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
