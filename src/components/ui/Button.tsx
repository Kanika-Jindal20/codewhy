import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'emerald-outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/30 focus:border-[#3ECF8E] disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.985]';

  const sizeStyles = {
    xs: 'text-[11px] px-2 py-1 rounded-[6px] gap-1',
    sm: 'text-xs px-2.5 py-1.5 rounded-[6px] gap-1.5 font-medium',
    md: 'text-xs sm:text-sm px-3.5 py-2 rounded-[8px] gap-2 font-medium',
    lg: 'text-sm px-4.5 py-2.5 rounded-[8px] gap-2.5 font-medium',
  }[size];

  const variantStyles = {
    primary:
      'bg-[#3ECF8E] hover:bg-[#24B47E] text-[#171717] border border-transparent shadow-xs hover:shadow font-semibold',
    secondary:
      'bg-white hover:bg-[#FAFAFA] active:bg-[#F4F4F5] text-[#171717] border border-[#DFDFDF] hover:border-[#C7C7C7] shadow-2xs font-medium',
    outline:
      'bg-transparent hover:bg-[#F4F4F5] active:bg-[#EDEDED] text-[#212121] border border-[#EDEDED] hover:border-[#DFDFDF] font-medium',
    danger:
      'bg-white hover:bg-[#FEF2F2] active:bg-[#FEE2E2] text-[#EF4444] border border-[#FECACA] hover:border-[#F87171] font-medium',
    ghost:
      'bg-transparent hover:bg-[#F4F4F5] active:bg-[#EDEDED] text-[#707070] hover:text-[#171717] border-transparent font-medium',
    'emerald-outline':
      'bg-white hover:bg-[#ECFDF5] text-[#24B47E] border border-[#3ECF8E]/50 hover:border-[#3ECF8E] font-medium shadow-2xs',
  }[variant];

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${widthStyle} ${className}`}
      {...props}
    >
      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : icon}
      {children}
    </button>
  );
};
