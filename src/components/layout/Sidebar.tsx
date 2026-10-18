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
  FolderGit2,
  X,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { name: 'Overview', href: '/', icon: LayoutDashboard, iconBg: 'bg-blue-500/20', iconColor: 'text-blue-400' },
      { name: 'Repositories', href: '/repos', icon: GitFork, iconBg: 'bg-sky-500/20', iconColor: 'text-sky-400' },
    ],
  },
  {
    label: 'Reasoning & Intelligence',
    items: [
      { name: 'Ask Why', href: '/ask', icon: HelpCircle, iconBg: 'bg-purple-500/20', iconColor: 'text-purple-400' },
      { name: 'Knowledge Graph', href: '/graph', icon: Network, iconBg: 'bg-teal-500/20', iconColor: 'text-teal-400' },
      { name: 'Architecture Explorer', href: '/architecture', icon: Compass, iconBg: 'bg-indigo-500/20', iconColor: 'text-indigo-400' },
      { name: 'Impact Analysis', href: '/impact', icon: Zap, iconBg: 'bg-amber-500/20', iconColor: 'text-amber-400' },
    ],
  },
  {
    label: 'Governance & History',
    items: [
      { name: 'Decision Timeline', href: '/timeline', icon: History, iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-400' },
      { name: 'Knowledge Gaps', href: '/gaps', icon: AlertTriangle, iconBg: 'bg-rose-500/20', iconColor: 'text-rose-400' },
      { name: 'Investigation History', href: '/investigations', icon: Search, iconBg: 'bg-cyan-500/20', iconColor: 'text-cyan-400' },
      { name: 'Reports', href: '/reports', icon: FileText, iconBg: 'bg-fuchsia-500/20', iconColor: 'text-fuchsia-400' },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onClose }) => {
  const pathname = usePathname();

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#14213D] border-r border-[#1F2E4D] select-none text-slate-200 shadow-xl">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-[#1F2E4D] flex items-center justify-between shrink-0 bg-[#0F1A30]">
        <Link href="/" onClick={handleLinkClick} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3B82F6] via-[#6366F1] to-[#8B5CF6] text-white flex items-center justify-center shadow-glowBlue group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-white block leading-tight">
                CodeWhy
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                PRO
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-400 block leading-tight">
              Engineering Intelligence
            </span>
          </div>
        </Link>

        {/* Mobile close button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1.5">
            <div className="px-3 pb-1 text-[11px] font-bold text-slate-400/90 uppercase tracking-wider">
              {group.label}
            </div>

            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group relative ${
                      isActive
                        ? 'bg-blue-600/20 text-white border border-blue-500/40 shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {/* Active left indicator bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-[#3B82F6] shadow-glowBlue" />
                    )}

                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all group-hover:scale-105 ${
                        isActive
                          ? 'bg-[#3B82F6] text-white shadow-xs'
                          : `${item.iconBg} ${item.iconColor}`
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 stroke-[2]" />
                    </div>
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Info / Active Repository Indicator */}
      <div className="p-3.5 border-t border-[#1F2E4D] text-xs bg-[#0F1A30]/80 shrink-0">
        <Link
          href="/repos"
          onClick={handleLinkClick}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30 group-hover:scale-105 transition-transform">
            <FolderGit2 className="w-4 h-4 stroke-[2]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-white text-xs truncate group-hover:text-blue-300 transition-colors">
              acme/commerce-core
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="truncate font-mono">main · Verified</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#0F1A30]/80 backdrop-blur-sm transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div className="relative w-64 max-w-[85vw] h-full z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
