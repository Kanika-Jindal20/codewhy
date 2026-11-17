'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GitBranch,
  RefreshCw,
  FolderGit2,
  Menu,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  currentRepo?: string;
  branch?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onToggleMobileMenu?: () => void;
  onOpenCommandPalette?: () => void;
}

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Overview',
  '/repos': 'Repositories',
  '/repositories': 'Repositories',
  '/architecture': 'Architecture Explorer',
  '/graph': 'Knowledge Graph',
  '/impact': 'Impact Analysis',
  '/ask': 'Ask Why',
  '/investigator': 'Autonomous Investigator',
  '/simulator': 'Change Simulator',
  '/pr-reviewer': 'PR Reviewer',
  '/architecture-health': 'Architecture Health',
  '/test-gaps': 'Test Gaps',
  '/gaps': 'Knowledge Gaps',
  '/timeline': 'Decision Timeline',
  '/investigations': 'Investigations',
  '/reports': 'Reports',
};

export const Header: React.FC<HeaderProps> = ({
  currentRepo = 'acme/commerce-core',
  branch = 'main',
  onRefresh,
  isRefreshing = false,
  onToggleMobileMenu,
  onOpenCommandPalette,
}) => {
  const pathname = usePathname();
  const currentTitle = ROUTE_LABELS[pathname] || 'Intelligence';

  return (
    <header className="h-14 px-4 sm:px-6 bg-white border-b border-[#EDEDED] flex items-center justify-between shrink-0 z-10 sticky top-0">
      {/* Left: Mobile Menu + Breadcrumb Hierarchy */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 -ml-1 rounded-[6px] text-[#707070] hover:text-[#171717] hover:bg-[#F4F4F5] transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Clean Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs">
          <Link
            href="/repos"
            className="text-[#707070] hover:text-[#171717] font-medium transition-colors truncate max-w-[120px] sm:max-w-none"
          >
            {currentRepo}
          </Link>
          <span className="text-[#DFDFDF]">/</span>
          <span className="font-semibold text-[#171717] truncate">{currentTitle}</span>
        </div>

        {/* Branch pill */}
        <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-[#707070] bg-[#F4F4F5] border border-[#EDEDED] px-2 py-0.5 rounded-[4px]">
          <GitBranch className="w-3 h-3 text-[#9A9A9A]" />
          <span>{branch}</span>
        </div>

        {/* AST Verified status indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-medium text-[#065F46] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] animate-pulse" />
          <span>AST Grounded</span>
        </div>
      </div>

      {/* Right: Search / Command Palette Trigger & Actions */}
      <div className="flex items-center gap-2">
        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] bg-[#FAFAFA] hover:bg-[#F4F4F5] border border-[#EDEDED] hover:border-[#DFDFDF] text-xs text-[#707070] transition-colors shadow-2xs"
          title="Open Command Palette (Cmd+K)"
        >
          <Search className="w-3.5 h-3.5 text-[#9A9A9A]" />
          <span className="hidden sm:inline">Search or jump to...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1 py-0.2 text-[10px] font-mono text-[#707070] bg-white border border-[#DFDFDF] rounded-[3px]">
            ⌘K
          </kbd>
        </button>

        {/* Functional Graph Sync Button */}
        {onRefresh && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            icon={
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#171717] ${
                  isRefreshing ? 'animate-spin text-[#3ECF8E]' : ''
                }`}
              />
            }
          >
            <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Sync Graph'}</span>
          </Button>
        )}
      </div>
    </header>
  );
};
