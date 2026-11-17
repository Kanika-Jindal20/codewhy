'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import {
  LayoutDashboard,
  GitFork,
  Compass,
  Network,
  Zap,
  HelpCircle,
  Bot,
  Sparkles,
  GitPullRequest,
  Activity,
  TestTube2,
  AlertTriangle,
  History,
  Search,
  FileText,
  X,
  Database,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  activeRepoName?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { name: 'Overview', href: '/', icon: LayoutDashboard },
      { name: 'Repositories', href: '/repos', icon: GitFork },
      { name: 'Architecture Explorer', href: '/architecture', icon: Compass },
      { name: 'Knowledge Graph', href: '/graph', icon: Network },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { name: 'Impact Analysis', href: '/impact', icon: Zap },
      { name: 'Ask Why', href: '/ask', icon: HelpCircle },
      { name: 'Autonomous Investigator', href: '/investigator', icon: Bot, badge: 'Agent' },
      { name: 'Change Simulator', href: '/simulator', icon: Sparkles },
      { name: 'PR Reviewer', href: '/pr-reviewer', icon: GitPullRequest },
    ],
  },
  {
    label: 'Governance',
    items: [
      { name: 'Architecture Health', href: '/architecture-health', icon: Activity },
      { name: 'Test Gaps', href: '/test-gaps', icon: TestTube2 },
      { name: 'Knowledge Gaps', href: '/gaps', icon: AlertTriangle },
      { name: 'Decision Timeline', href: '/timeline', icon: History },
      { name: 'Investigations', href: '/investigations', icon: Search },
      { name: 'Reports', href: '/reports', icon: FileText },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen = false,
  onClose,
  activeRepoName = 'acme/commerce-core',
}) => {
  const pathname = usePathname();

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#EDEDED] select-none text-[#171717]">
      {/* Brand Header */}
      <div className="h-14 px-4 border-b border-[#EDEDED] flex items-center justify-between shrink-0">
        <Link
          href="/"
          onClick={handleLinkClick}
          className="flex items-center gap-2.5 group transition-opacity hover:opacity-90"
        >
          <Logo className="w-6 h-6 text-[#3ECF8E] shrink-0" />
          <span className="font-semibold text-sm tracking-tight text-[#171717]">CodeWhy</span>
        </Link>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 rounded-[6px] text-[#707070] hover:text-[#171717] hover:bg-[#F4F4F5] transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Active Workspace Switcher Pill */}
      <div className="p-3 border-b border-[#EDEDED] bg-[#FAFAFA]">
        <Link
          href="/repos"
          onClick={handleLinkClick}
          className="flex items-center justify-between p-2 rounded-[8px] bg-white border border-[#EDEDED] hover:border-[#DFDFDF] hover:shadow-2xs transition-all text-xs group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-[5px] bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] flex items-center justify-center shrink-0">
              <GitFork className="w-3 h-3 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-medium text-[#707070] uppercase tracking-wider block leading-none mb-0.5">
                Workspace
              </span>
              <span className="font-semibold text-[#171717] truncate block leading-tight text-xs">
                {activeRepoName}
              </span>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#9A9A9A] group-hover:text-[#171717] transition-colors shrink-0" />
        </Link>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 py-3 px-2.5 space-y-5 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-0.5">
            <div className="px-2.5 pb-1 text-[11px] font-medium text-[#9A9A9A] uppercase tracking-wider">
              {group.label}
            </div>

            <div className="space-y-0.5">
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
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-xs font-medium transition-all group relative ${
                      isActive
                        ? 'bg-[#F4F4F5] text-[#171717] font-semibold'
                        : 'text-[#707070] hover:text-[#171717] hover:bg-[#FAFAFA]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Active emerald left indicator pill */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3.5 rounded-r-[2px] bg-[#3ECF8E]" />
                      )}

                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-[#171717]'
                            : 'text-[#9A9A9A] group-hover:text-[#171717]'
                        }`}
                      />

                      <span className="truncate">{item.name}</span>
                    </div>

                    {item.badge && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Footer Status Section */}
      <div className="p-3 border-t border-[#EDEDED] bg-[#FAFAFA]">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3ECF8E] animate-pulse shrink-0" />
            <span className="text-[11px] font-medium text-[#707070]">AST Engine Active</span>
          </div>
          <span className="text-[10px] font-mono text-[#9A9A9A]">v1.0</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden animate-in fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-68 z-50 md:hidden transform transition-transform duration-200 ease-out shadow-modal ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile navigation"
      >
        {sidebarContent}
      </aside>
    </>
  );
};
