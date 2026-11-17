import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse rounded-[8px] bg-[#EDEDED] ${className}`}
      aria-hidden="true"
    />
  );
};
