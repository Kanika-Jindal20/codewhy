'use client';

import React from 'react';
import { GitBranch, RefreshCw, FolderGit2, CheckCircle2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  currentRepo?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRepo = 'acme/commerce-core',
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <header className="h-16 px-6 bg-app-panel border-b border-app-border flex items-center justify-between shrink-0">
      {/* Left: Repository Selector and Branch */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-app-surface border border-app-border text-xs">
          <FolderGit2 className="w-4 h-4 text-accent-primary" />
          <span className="font-semibold text-text-primary">{currentRepo}</span>
          <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-text-muted font-mono bg-app-bg px-2.5 py-1 rounded border border-app-border/60">
          <GitBranch className="w-3.5 h-3.5 text-accent-secondary" />
          <span>main</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-status-success font-medium">
          <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
          <span>Indexed & Grounded</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          icon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Refreshing AST...' : 'Sync Graph'}
        </Button>

        <div className="text-[11px] font-mono text-text-muted border-l border-app-border pl-3">
          Evidence Confidence: <span className="text-status-success font-semibold">100% Traceable</span>
        </div>
      </div>
    </header>
  );
};
