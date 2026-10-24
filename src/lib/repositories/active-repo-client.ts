'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ActiveRepoInfo {
  repoId: string;
  repoName: string;
  branch?: string;
  isDemo?: boolean;
}

export const DEFAULT_ACTIVE_REPO: ActiveRepoInfo = {
  repoId: 'repo-commerce-core',
  repoName: 'acme/commerce-core',
  branch: 'main',
  isDemo: true,
};

const STORAGE_KEY = 'codewhy_active_repo';
const REPO_CHANGED_EVENT = 'codewhy:repo-changed';

/**
 * Reads the active repository from localStorage and document.cookie.
 */
export function getActiveRepoClient(): ActiveRepoInfo {
  if (typeof window === 'undefined') {
    return DEFAULT_ACTIVE_REPO;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.repoId && parsed.repoName) {
        return parsed;
      }
    }
  } catch {
    // Fallback to default
  }
  return DEFAULT_ACTIVE_REPO;
}

/**
 * Sets the active repository in localStorage, sets the active cookie for SSR/APIs,
 * and notifies all listeners across components.
 */
export function setActiveRepoClient(repo: ActiveRepoInfo): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(repo));
    // Set cookie so Next.js server components and API routes can read active repo on Vercel
    document.cookie = `codewhy_active_repo_id=${encodeURIComponent(repo.repoId)}; path=/; max-age=31536000; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent(REPO_CHANGED_EVENT, { detail: repo }));
  } catch (err) {
    console.warn('[ActiveRepo] Failed to store active repo:', err);
  }
}

/**
 * React hook that subscribes to repository changes across tabs and pages.
 */
export function useActiveRepo(): {
  activeRepo: ActiveRepoInfo;
  setActiveRepo: (repo: ActiveRepoInfo) => void;
  isLoading: boolean;
} {
  const [activeRepo, setActiveRepoState] = useState<ActiveRepoInfo>(DEFAULT_ACTIVE_REPO);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and sync with API/localStorage
  useEffect(() => {
    const local = getActiveRepoClient();
    setActiveRepoState(local);
    setIsLoading(false);

    // Sync with backend on mount
    fetch('/api/repositories')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.repositories)) {
          const serverActive = data.repositories.find((r: any) => r.isActive);
          // If local was default but server has an active non-default repo, or vice versa
          if (serverActive && serverActive.repoId !== local.repoId) {
            // If local exists in server repositories, sync server to local
            const matchedLocal = data.repositories.find((r: any) => r.repoId === local.repoId);
            if (matchedLocal) {
              fetch('/api/repositories', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repoId: local.repoId }),
              }).catch(() => {});
            } else {
              // Local is invalid/deleted, sync to server active
              const updated: ActiveRepoInfo = {
                repoId: serverActive.repoId,
                repoName: serverActive.repoName,
                branch: serverActive.branch || 'main',
                isDemo: serverActive.isDemo,
              };
              setActiveRepoState(updated);
              setActiveRepoClient(updated);
            }
          }
        }
      })
      .catch(() => {});

    // Listen to custom event
    const handleRepoChange = (e: Event) => {
      const customEvent = e as CustomEvent<ActiveRepoInfo>;
      if (customEvent.detail) {
        setActiveRepoState(customEvent.detail);
      }
    };

    // Listen to storage events from other browser tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.repoId) {
            setActiveRepoState(parsed);
          }
        } catch {}
      }
    };

    window.addEventListener(REPO_CHANGED_EVENT, handleRepoChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(REPO_CHANGED_EVENT, handleRepoChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const setActiveRepo = useCallback((repo: ActiveRepoInfo) => {
    setActiveRepoState(repo);
    setActiveRepoClient(repo);
    // Notify backend
    fetch('/api/repositories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoId: repo.repoId }),
    }).catch(() => {});
  }, []);

  return { activeRepo, setActiveRepo, isLoading };
}
