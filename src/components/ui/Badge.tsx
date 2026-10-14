import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'purple';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  icon,
  className = '',
}) => {
  const sizeStyles = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';
  
  const variantStyles = {
    default: 'bg-app-surface text-text-secondary border-app-border',
    success: 'bg-status-success/15 text-status-success border-status-success/30',
    warning: 'bg-status-warning/15 text-status-warning border-status-warning/30',
    error: 'bg-status-error/15 text-status-error border-status-error/30',
    info: 'bg-status-info/15 text-status-info border-status-info/30',
    purple: 'bg-accent-secondary/15 text-accent-secondary border-accent-secondary/30',
    outline: 'bg-transparent text-text-muted border-app-border',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-md font-mono ${sizeStyles} ${variantStyles} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
};
