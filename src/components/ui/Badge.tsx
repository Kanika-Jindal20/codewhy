import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'teal' | 'mint' | 'peach' | 'outline';
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
  const sizeStyles = size === 'sm' ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1';
  
  const variantStyles = {
    default: 'bg-white text-text-secondary border-app-border shadow-2xs',
    success: 'bg-[#ECFDF5] text-emerald-800 border-emerald-200 font-semibold',
    warning: 'bg-[#FFFBEB] text-amber-900 border-amber-300 font-semibold',
    error: 'bg-[#FEF2F2] text-rose-800 border-rose-200 font-semibold',
    info: 'bg-[#EBF2FF] text-[#2563EB] border-[#BFDBFE] font-semibold',
    purple: 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE] font-semibold',
    teal: 'bg-[#F0FDFA] text-[#0D9488] border-[#99F6E4] font-semibold',
    mint: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0] font-semibold',
    peach: 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA] font-semibold',
    outline: 'bg-white/80 text-text-secondary border-app-border',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-md ${sizeStyles} ${variantStyles} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
};
