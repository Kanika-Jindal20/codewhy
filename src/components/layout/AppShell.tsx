'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { useActiveRepo, setActiveRepoClient } from '@/lib/repositories/active-repo-client';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { activeRepo } = useActiveRepo();

  // Global Cmd+K / Ctrl+K listener for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Functional Sync Graph action
  const handleSyncGraph = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/graph?repoId=${encodeURIComponent(activeRepo.repoId)}&limit=100`);
      if (res.ok) {
        // Trigger client-side repo refresh event
        setActiveRepoClient({ ...activeRepo });
      }
    } catch (err) {
      console.warn('Sync failed:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [activeRepo]);

  return (
    <div className="flex flex-1 min-h-screen bg-[#FAFAFA] text-[#171717]">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeRepoName={activeRepo.repoName}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentRepo={activeRepo.repoName}
          branch={activeRepo.branch || 'main'}
          onRefresh={handleSyncGraph}
          isRefreshing={isRefreshing}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSyncGraph={handleSyncGraph}
      />
    </div>
  );
}
