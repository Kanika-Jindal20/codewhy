import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export interface AlertProps {
  type?: 'info' | 'warning' | 'error' | 'success';
  variant?: 'info' | 'warning' | 'error' | 'success' | 'destructive' | string;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type,
  variant,
  title,
  children,
  onClose,
  className = '',
}) => {
  const normalizedVariant = variant === 'destructive' ? 'error' : variant;
  const effectiveType = (type || normalizedVariant || 'info') as 'info' | 'warning' | 'error' | 'success';

  const styles = {
    info: {
      border: 'border-[#DFDFDF]',
      bg: 'bg-[#FAFAFA]',
      titleCol: 'text-[#171717]',
      textCol: 'text-[#707070]',
      icon: <Info className="w-4 h-4 text-[#054CFF] shrink-0 mt-0.5 stroke-[2]" />,
    },
    warning: {
      border: 'border-[#FDE68A]',
      bg: 'bg-[#FFFBEB]',
      titleCol: 'text-[#92400E]',
      textCol: 'text-[#B45309]',
      icon: <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5 stroke-[2]" />,
    },
    error: {
      border: 'border-[#FECACA]',
      bg: 'bg-[#FEF2F2]',
      titleCol: 'text-[#991B1B]',
      textCol: 'text-[#B91C1C]',
      icon: <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5 stroke-[2]" />,
    },
    success: {
      border: 'border-[#A7F3D0]',
      bg: 'bg-[#ECFDF5]',
      titleCol: 'text-[#065F46]',
      textCol: 'text-[#047857]',
      icon: <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5 stroke-[2]" />,
    },
  }[effectiveType];

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 p-3.5 sm:p-4 rounded-[10px] border text-xs sm:text-sm ${styles.bg} ${styles.border} ${className}`}
    >
      {styles.icon}
      <div className="flex-1 min-w-0 pr-2">
        {title && <h4 className={`font-semibold mb-0.5 text-xs sm:text-sm ${styles.titleCol}`}>{title}</h4>}
        <div className={`leading-relaxed text-xs sm:text-sm ${styles.textCol}`}>{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="p-1 rounded-[6px] text-ink-muted hover:text-ink-primary hover:bg-black/5 transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
