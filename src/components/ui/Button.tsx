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
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary disabled:opacity-50 disabled:cursor-not-allowed select-none';
  
  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 rounded-lg gap-1.5',
    md: 'text-xs sm:text-sm px-3.5 py-2 rounded-lg gap-2',
    lg: 'text-sm px-4 py-2.5 rounded-lg gap-2.5',
  }[size];

  const variantStyles = {
    primary: 'bg-[#3B82F6] hover:bg-[#2563EB] active:bg-[#1D4ED8] text-white border border-transparent shadow-xs hover:shadow transition-all font-semibold',
    secondary: 'bg-white hover:bg-[#F8FAFC] active:bg-[#F1F5F9] text-[#172033] border border-app-border hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all font-semibold',
    outline: 'bg-white hover:bg-[#EBF2FF] active:bg-[#DCE7FC] text-[#172033] hover:text-[#3B82F6] border border-app-border hover:border-[#3B82F6]/40 shadow-2xs transition-all font-semibold',
    danger: 'bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-[#EF4444] border border-rose-200 font-semibold transition-all',
    ghost: 'bg-transparent hover:bg-[#F4F7FF] active:bg-[#EBF2FF] text-text-secondary hover:text-text-primary border-transparent transition-all font-medium',
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
