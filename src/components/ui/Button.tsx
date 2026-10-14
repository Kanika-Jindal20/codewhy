import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-app-bg disabled:opacity-50 disabled:cursor-not-allowed select-none';
  
  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 rounded-md gap-1.5',
    md: 'text-sm px-3.5 py-2 rounded-lg gap-2',
    lg: 'text-base px-4 py-2.5 rounded-lg gap-2.5',
  }[size];

  const variantStyles = {
    primary: 'bg-accent-primary hover:bg-[#5274e6] active:bg-[#4364d4] text-white shadow-sm border border-transparent',
    secondary: 'bg-app-surface hover:bg-[#1f2b45] active:bg-[#162035] text-text-primary border border-app-border',
    outline: 'bg-transparent hover:bg-app-surface active:bg-app-panel text-text-secondary hover:text-text-primary border border-app-border',
    danger: 'bg-status-error/15 hover:bg-status-error/25 text-status-error border border-status-error/30',
    ghost: 'bg-transparent hover:bg-app-surface text-text-secondary hover:text-text-primary border-transparent',
  }[variant];

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
};
