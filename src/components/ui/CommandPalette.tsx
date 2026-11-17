'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import {
  Search,
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
  FileText,
  RefreshCw,
  ArrowRight,
  CornerDownLeft,
} from 'lucide-react';

interface CommandItem {
  id: string;
  name: string;
  description: string;
  category: 'Workspace' | 'Intelligence' | 'Governance' | 'Actions';
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  action?: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncGraph?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSyncGraph,
}) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    // Workspace
    { id: 'nav-overview', name: 'Overview Dashboard', description: 'Codebase HUD, metrics, and AST status', category: 'Workspace', icon: LayoutDashboard, href: '/' },
    { id: 'nav-repos', name: 'Repositories', description: 'Switch workspace or connect real GitHub repositories', category: 'Workspace', icon: GitFork, href: '/repos' },
    { id: 'nav-arch', name: 'Architecture Explorer', description: 'Subsystem layers, dependency flows, and boundaries', category: 'Workspace', icon: Compass, href: '/architecture' },
    { id: 'nav-graph', name: 'Knowledge Graph', description: 'Interactive force-directed SVG entity graph', category: 'Workspace', icon: Network, href: '/graph' },

    // Intelligence
    { id: 'nav-impact', name: 'Impact Analysis', description: 'Pre-change blast radius and caller chains', category: 'Intelligence', icon: Zap, href: '/impact' },
    { id: 'nav-ask', name: 'Ask Why', description: 'Plain-English explanations with AST evidence citations', category: 'Intelligence', icon: HelpCircle, href: '/ask' },
    { id: 'nav-investigator', name: 'Autonomous Investigator', description: 'Goal-driven codebase risk auditing agent', category: 'Intelligence', icon: Bot, href: '/investigator' },
    { id: 'nav-simulator', name: 'Change Simulator', description: 'What-if refactor simulation and migration plans', category: 'Intelligence', icon: Sparkles, href: '/simulator' },
    { id: 'nav-pr', name: 'PR Risk Reviewer', description: 'Audit pull request diffs against knowledge graph', category: 'Intelligence', icon: GitPullRequest, href: '/pr-reviewer' },

    // Governance
    { id: 'nav-health', name: 'Architecture Health', description: 'Explainable composite health score (/100)', category: 'Governance', icon: Activity, href: '/architecture-health' },
    { id: 'nav-test-gaps', name: 'Test Gaps', description: 'Identify untested execution paths with test fixtures', category: 'Governance', icon: TestTube2, href: '/test-gaps' },
    { id: 'nav-gaps', name: 'Knowledge Gaps', description: 'Missing ADRs, documentation debt, and blind spots', category: 'Governance', icon: AlertTriangle, href: '/gaps' },
    { id: 'nav-timeline', name: 'Decision Timeline', description: 'Chronological history of architectural pivots', category: 'Governance', icon: History, href: '/timeline' },
    { id: 'nav-investigations', name: 'Investigation History', description: 'Preserved research context and follow-up threads', category: 'Governance', icon: Search, href: '/investigations' },
    { id: 'nav-reports', name: 'Decision Reports', description: 'Generate publication-grade PDF documentation', category: 'Governance', icon: FileText, href: '/reports' },

    // Actions
    {
      id: 'act-sync',
      name: 'Sync Graph & Revalidate AST',
      description: 'Trigger active workspace synchronization',
      category: 'Actions',
      icon: RefreshCw,
      action: () => {
        if (onSyncGraph) onSyncGraph();
      },
    },
  ];

  const filtered = commands.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.name.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const executeItem = useCallback(
    (item: CommandItem) => {
      onClose();
      if (item.action) {
        item.action();
      } else if (item.href) {
        router.push(item.href);
      }
    },
    [onClose, router]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        executeItem(filtered[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/30 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-[12px] border border-[#DFDFDF] shadow-modal overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[#EDEDED] gap-3">
          <Search className="w-4 h-4 text-[#707070] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, views, or jump to route..."
            className="flex-1 bg-transparent text-sm text-[#171717] placeholder:text-[#9A9A9A] focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-[#707070] bg-[#F4F4F5] border border-[#EDEDED] rounded-[4px]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[360px] overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#707070]">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-[8px] cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#F4F4F5] text-[#171717]' : 'text-[#212121] hover:bg-[#FAFAFA]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-white border-[#DFDFDF] text-[#171717]'
                          : 'bg-[#FAFAFA] border-[#EDEDED] text-[#707070]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[#171717] truncate flex items-center gap-2">
                        <span>{item.name}</span>
                        <span className="text-[10px] text-[#9A9A9A] font-normal uppercase tracking-wider">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#707070] truncate">{item.description}</div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-1 text-[11px] text-[#707070] shrink-0 font-mono">
                      <span>Jump</span>
                      <CornerDownLeft className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2 border-t border-[#EDEDED] bg-[#FAFAFA] flex items-center justify-between text-[11px] text-[#707070]">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-[#171717]">
            <Logo className="w-3.5 h-3.5 text-[#3ECF8E]" />
            <span>CodeWhy Intelligence</span>
          </div>
        </div>
      </div>
    </div>
  );
};
