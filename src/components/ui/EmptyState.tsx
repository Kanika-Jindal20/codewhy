import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-app-border bg-app-panel ${className}`}>
      <div className="w-11 h-11 mb-3.5 rounded-xl bg-app-subtleBlue text-accent-primary flex items-center justify-center border border-accent-primary/20">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1.5 tracking-tight">{title}</h3>
      <p className="text-xs sm:text-sm text-text-secondary max-w-md mb-5 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
