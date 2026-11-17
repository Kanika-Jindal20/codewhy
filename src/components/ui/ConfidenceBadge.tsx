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
      icon: <CheckCircle2 className="w-3 h-3 text-[#10B981]" />,
      label: 'High evidence',
      badgeClass: 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]',
    },
    medium: {
      icon: <AlertTriangle className="w-3 h-3 text-[#F59E0B]" />,
      label: 'Partial evidence',
      badgeClass: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
    },
    low: {
      icon: <AlertCircle className="w-3 h-3 text-[#EF4444]" />,
      label: 'Limited evidence',
      badgeClass: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]',
    },
    insufficient_evidence: {
      icon: <HelpCircle className="w-3 h-3 text-[#707070]" />,
      label: 'Insufficient',
      badgeClass: 'bg-[#F4F4F5] text-[#707070] border-[#EDEDED]',
    },
  }[level] || {
    icon: <HelpCircle className="w-3 h-3 text-[#707070]" />,
    label: 'Heuristic',
    badgeClass: 'bg-[#F4F4F5] text-[#707070] border-[#EDEDED]',
  };

  const percentage = score !== undefined ? `${Math.round(score * 100)}%` : undefined;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${config.badgeClass} ${className}`}
      title={score !== undefined ? `Confidence score: ${score}` : undefined}
    >
      {config.icon}
      <span>{config.label}</span>
      {percentage && <span className="font-mono text-[10px] opacity-75">{percentage}</span>}
    </span>
  );
};
