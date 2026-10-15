'use client';

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { BreadcrumbEntry } from '@/types/architecture';
import { NODE_TYPE_COLORS } from '@/types/architecture';

interface NavigationBreadcrumbProps {
  trail: BreadcrumbEntry[];
  onNavigate: (entry: BreadcrumbEntry, index: number) => void;
}

export const NavigationBreadcrumb: React.FC<NavigationBreadcrumbProps> = ({
  trail,
  onNavigate,
}) => {
  if (trail.length === 0) {
    return (
      <nav
        aria-label="Architecture navigation trail"
        className="flex items-center gap-1.5 text-xs text-text-muted px-1"
      >
        <Home className="w-3 h-3" aria-hidden />
        <span>No node selected</span>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Architecture navigation trail"
      className="flex items-center gap-0.5 text-xs overflow-x-auto max-w-full"
    >
      <span className="flex items-center shrink-0 text-text-muted pr-1">
        <Home className="w-3 h-3" aria-hidden />
      </span>

      {trail.map((entry, idx) => {
        const isLast = idx === trail.length - 1;
        const color = NODE_TYPE_COLORS[entry.type];
        return (
          <React.Fragment key={`${entry.nodeId}-${idx}`}>
            {idx > 0 && (
              <ChevronRight className="w-3 h-3 text-text-muted shrink-0" aria-hidden />
            )}
            <button
              onClick={() => onNavigate(entry, idx)}
              disabled={isLast}
              className={`flex items-center gap-1 px-2 py-1 rounded font-mono shrink-0 transition-colors ${
                isLast
                  ? 'text-text-primary font-semibold cursor-default'
                  : 'text-text-secondary hover:text-text-primary hover:bg-app-surface cursor-pointer'
              }`}
              title={entry.filePath}
              aria-current={isLast ? 'page' : undefined}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              <span className="text-[11px] truncate max-w-[140px]">{entry.label}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};
