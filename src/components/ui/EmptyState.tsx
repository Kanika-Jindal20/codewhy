import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
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
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-[12px] border border-dashed border-[#DFDFDF] bg-white ${className}`}
    >
      {icon && (
        <div className="w-12 h-12 rounded-[10px] bg-[#F4F4F5] border border-[#EDEDED] flex items-center justify-center text-[#707070] mb-3.5 shadow-2xs">
          {icon}
        </div>
      )}
      <h3 className="text-sm sm:text-base font-semibold text-[#171717] tracking-tight">{title}</h3>
      {description && (
        <p className="text-xs sm:text-sm text-[#707070] max-w-sm mt-1 mb-5 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <Button size="sm" variant="secondary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};
