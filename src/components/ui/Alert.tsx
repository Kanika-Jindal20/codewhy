import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface AlertProps {
  type?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  className = '',
}) => {
  const styles = {
    info: {
      border: 'border-[#D3E0F6]',
      bg: 'bg-app-subtleBlue',
      text: 'text-[#1D3B7A]',
      icon: <Info className="w-5 h-5 text-accent-primary shrink-0 mt-0.5 stroke-[1.75]" />,
    },
    warning: {
      border: 'border-amber-200',
      bg: 'bg-amber-50/70',
      text: 'text-amber-950',
      icon: <AlertTriangle className="w-5 h-5 text-status-warning shrink-0 mt-0.5 stroke-[1.75]" />,
    },
    error: {
      border: 'border-rose-200',
      bg: 'bg-rose-50/70',
      text: 'text-rose-950',
      icon: <AlertCircle className="w-5 h-5 text-status-error shrink-0 mt-0.5 stroke-[1.75]" />,
    },
    success: {
      border: 'border-emerald-200',
      bg: 'bg-emerald-50/70',
      text: 'text-emerald-950',
      icon: <CheckCircle2 className="w-5 h-5 text-status-success shrink-0 mt-0.5 stroke-[1.75]" />,
    },
  }[type];

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${styles.bg} ${styles.border} ${className}`}>
      {styles.icon}
      <div className="flex-1 text-sm">
        {title && <h4 className={`font-semibold mb-1 ${styles.text}`}>{title}</h4>}
        <div className="text-text-secondary">{children}</div>
      </div>
    </div>
  );
};
