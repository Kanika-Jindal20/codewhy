import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'default'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'purple'
    | 'teal'
    | 'dark'
    | 'outline'
    | 'mint'
    | 'peach';
  size?: 'xs' | 'sm' | 'md';
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
  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.2 rounded-full font-medium tracking-tight',
    sm: 'text-[11px] px-2 py-0.5 rounded-full font-medium tracking-tight',
    md: 'text-xs px-2.5 py-1 rounded-full font-medium',
  }[size];

  const variantStyles = {
    default: 'bg-[#F4F4F5] text-[#212121] border border-[#EDEDED]',
    success: 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]',
    warning: 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]',
    error: 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]',
    info: 'bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]',
    purple: 'bg-[#F5F3FF] text-[#5B21B6] border border-[#DDD6FE]',
    teal: 'bg-[#F0FDFA] text-[#115E59] border border-[#99F6E4]',
    dark: 'bg-[#1C1C1C] text-[#FAFAFA] border border-[#2E2E2E]',
    outline: 'bg-white text-[#707070] border border-[#EDEDED]',
    mint: 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]',
    peach: 'bg-[#FFF7ED] text-[#9A3412] border border-[#FED7AA]',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 select-none transition-colors ${sizeStyles} ${variantStyles} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
};
