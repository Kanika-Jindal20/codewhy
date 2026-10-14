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
      border: 'border-status-info/30',
      bg: 'bg-status-info/10',
      text: 'text-status-info',
      icon: <Info className="w-5 h-5 text-status-info shrink-0 mt-0.5" />,
    },
    warning: {
      border: 'border-status-warning/30',
      bg: 'bg-status-warning/10',
      text: 'text-status-warning',
      icon: <AlertTriangle className="w-5 h-5 text-status-warning shrink-0 mt-0.5" />,
    },
    error: {
      border: 'border-status-error/30',
      bg: 'bg-status-error/10',
      text: 'text-status-error',
      icon: <AlertCircle className="w-5 h-5 text-status-error shrink-0 mt-0.5" />,
    },
    success: {
      border: 'border-status-success/30',
      bg: 'bg-status-success/10',
      text: 'text-status-success',
      icon: <CheckCircle2 className="w-5 h-5 text-status-success shrink-0 mt-0.5" />,
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
