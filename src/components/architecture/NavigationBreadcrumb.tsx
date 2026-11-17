'use client';

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { BreadcrumbEntry, NODE_TYPE_COLORS } from '@/types/architecture';

interface NavigationBreadcrumbProps {
  trail: BreadcrumbEntry[];
  onNavigate: (entry: BreadcrumbEntry, index: number) => void;
  onReset?: () => void;
}

export const NavigationBreadcrumb: React.FC<NavigationBreadcrumbProps> = ({
  trail,
  onNavigate,
  onReset,
}) => {
  if (trail.length === 0) {
    return (
      <nav aria-label="Architecture navigation trail" className="flex items-center gap-1.5 text-xs text-[#9A9A9A]">
        <Home className="w-3.5 h-3.5" aria-hidden />
        <span>Root Explorer</span>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Architecture navigation trail"
      className="flex items-center gap-1 text-xs overflow-x-auto max-w-full"
    >
      <button
        onClick={onReset}
        disabled={!onReset}
        className="flex items-center shrink-0 pr-1 text-[#707070] hover:text-[#171717] transition-colors"
        title="Reset trail"
      >
        <Home className="w-3.5 h-3.5" aria-hidden />
      </button>

      {trail.map((entry, idx) => {
        const isLast = idx === trail.length - 1;
        const color = NODE_TYPE_COLORS[entry.type];
        return (
          <React.Fragment key={`${entry.nodeId}-${idx}`}>
            <ChevronRight className="w-3 h-3 text-[#C7C7C7] shrink-0" aria-hidden />
            <button
              onClick={() => onNavigate(entry, idx)}
              disabled={isLast}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] font-mono text-[11px] shrink-0 transition-colors ${
                isLast
                  ? 'text-[#171717] font-semibold bg-[#F4F4F5] border border-[#EDEDED]'
                  : 'text-[#707070] hover:text-[#171717] hover:bg-[#FAFAFA]'
              }`}
              title={entry.filePath}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="truncate max-w-[130px]">{entry.label}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};
