'use client';

import React from 'react';
import Link from 'next/link';
import { GitBranch, RefreshCw, FolderGit2, Menu, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  currentRepo?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRepo = 'acme/commerce-core',
  onRefresh,
  isRefreshing = false,
  onToggleMobileMenu,
}) => {
  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-app-border flex items-center justify-between shrink-0 z-10 shadow-2xs">
      {/* Left: Mobile hamburger + Repository & Branch selector */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 -ml-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-[#F4F7FF] transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Repository selector */}
        <Link
          href="/repos"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-app-border text-xs hover:border-[#3B82F6]/50 hover:bg-[#EBF2FF]/30 transition-all shadow-2xs group"
        >
          <div className="w-5 h-5 rounded-md bg-blue-500/10 text-[#3B82F6] flex items-center justify-center shrink-0">
            <FolderGit2 className="w-3.5 h-3.5 stroke-[2]" />
          </div>
          <span className="font-bold text-text-primary truncate max-w-[150px] sm:max-w-none group-hover:text-[#3B82F6] transition-colors">
            {currentRepo}
          </span>
        </Link>

        {/* Branch pill */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 font-semibold text-[#8B5CF6]">
          <GitBranch className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0 stroke-[2]" />
          <span className="font-mono text-[11px]">main</span>
        </div>

        {/* Verified sync badge with pulse */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>AST Verified</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5">
        <Link href="/ask" className="hidden sm:inline-flex">
          <Button
            variant="ghost"
            size="sm"
            icon={<HelpCircle className="w-3.5 h-3.5 text-[#8B5CF6]" />}
            className="hover:bg-purple-50 hover:text-[#8B5CF6]"
          >
            Ask Why
          </Button>
        </Link>

        <Button
          variant="outline"
          size="sm"
          icon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#3B82F6]' : 'text-[#3B82F6]'}`} />}
          onClick={onRefresh}
          disabled={isRefreshing}
          className="border-app-border hover:border-[#3B82F6]/40 hover:bg-[#EBF2FF]/50"
        >
          {isRefreshing ? 'Syncing...' : 'Sync Graph'}
        </Button>
      </div>
    </header>
  );
};
