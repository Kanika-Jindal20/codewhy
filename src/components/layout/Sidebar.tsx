'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GitFork,
  HelpCircle,
  Network,
  History,
  Zap,
  AlertTriangle,
  Compass,
  Search,
  FileText,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  status: 'active' | 'planned';
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Overview', href: '/', icon: <LayoutDashboard className="w-4 h-4" />, status: 'active' },
  { name: 'Repositories', href: '/repos', icon: <GitFork className="w-4 h-4" />, status: 'planned' },
  { name: 'Ask Why', href: '/ask', icon: <HelpCircle className="w-4 h-4" />, status: 'planned' },
  { name: 'Knowledge Graph', href: '/graph', icon: <Network className="w-4 h-4" />, status: 'planned' },
  { name: 'Decision Timeline', href: '/timeline', icon: <History className="w-4 h-4" />, status: 'planned' },
  { name: 'Impact Analysis', href: '/impact', icon: <Zap className="w-4 h-4" />, status: 'active' },
  { name: 'Knowledge Gaps', href: '/gaps', icon: <AlertTriangle className="w-4 h-4" />, status: 'active' },
  { name: 'Architecture Explorer', href: '/architecture', icon: <Compass className="w-4 h-4" />, status: 'active' },
  { name: 'Investigation History', href: '/investigations', icon: <Search className="w-4 h-4" />, status: 'active' },
  { name: 'Reports', href: '/reports', icon: <FileText className="w-4 h-4" />, status: 'active' },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-app-panel border-r border-app-border flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-app-border flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-primary/20 border border-accent-primary/40 flex items-center justify-center text-accent-primary">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-text-primary block">
              CodeWhy
            </span>
            <span className="text-[10px] text-text-muted block font-mono">
              Engineering Intelligence
            </span>
          </div>
        </Link>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-app-surface border border-app-border text-text-muted">
          v0.1
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-2 mb-2 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
          Intelligence Suite
        </div>

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const isPlanned = item.status === 'planned';

          return (
            <Link
              key={item.name}
              href={isPlanned ? '#' : item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/30 font-semibold'
                  : isPlanned
                  ? 'text-text-muted hover:text-text-secondary cursor-not-allowed opacity-75'
                  : 'text-text-secondary hover:text-text-primary hover:bg-app-surface'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-accent-primary' : 'text-text-muted'}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </div>

              {isPlanned ? (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-app-surface text-text-muted border border-app-border">
                  Planned
                </span>
              ) : isActive ? (
                <ChevronRight className="w-3.5 h-3.5 text-accent-primary" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-app-border text-[11px] text-text-muted flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span>Active Branch:</span>
          <span className="font-mono text-text-secondary">feature/impact</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Environment:</span>
          <span className="font-mono text-status-success">Grounded AST</span>
        </div>
      </div>
    </aside>
  );
};
