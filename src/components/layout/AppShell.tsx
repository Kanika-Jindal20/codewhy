'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeRepoName, setActiveRepoName] = useState<string>('acme/commerce-core');

  useEffect(() => {
    async function loadActiveRepo() {
      try {
        const res = await fetch('/api/repositories');
        if (res.ok) {
          const data = await res.json();
          const active = data.repositories?.find((r: any) => r.isActive) || data.repositories?.[0];
          if (active?.repoName) {
            setActiveRepoName(active.repoName);
          }
        }
      } catch {
        // Fallback
      }
    }
    loadActiveRepo();
  }, []);

  return (
    <div className="flex flex-1 min-h-screen overflow-hidden bg-app-bg text-text-primary">
      {/* Desktop & Mobile Drawer Sidebar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          currentRepo={activeRepoName}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-app-bg">
          {children}
        </main>
      </div>
    </div>
  );
}
