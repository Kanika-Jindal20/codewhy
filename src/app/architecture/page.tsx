import React from 'react';
import type { Metadata } from 'next';
import { ArchitectureExplorerClient } from './ArchitectureExplorerClient';

export const metadata: Metadata = {
  title: 'Architecture Explorer — CodeWhy',
  description:
    'Interactively explore repository structure, component relationships, and architectural decisions with full evidence provenance.',
};

/**
 * Server component: fetches graph metadata (no PII, safe to render on server)
 * and passes the suggested seed node ID to the client shell.
 */
export default async function ArchitecturePage() {
  // Fetch meta (repo overview — no neighborhood data yet)
  let repoId = 'repo-commerce-core';
  let repoName = 'acme/commerce-core';
  let suggestedSeedNodeId: string | null = null;
  let totalNodes = 0;
  let totalEdges = 0;

  try {
    // In production this would call the real API; here we use localhost.
    // The client will make its own fetch after hydration.
    const res = await fetch(
      `http://localhost:3000/api/graph?repoId=${encodeURIComponent(repoId)}`,
      { cache: 'no-store' }
    );
    if (res.ok) {
      const data = await res.json();
      repoId = data.meta?.repoId ?? repoId;
      repoName = data.meta?.repoName ?? repoName;
      suggestedSeedNodeId = data.meta?.suggestedSeedNodeId ?? null;
      totalNodes = data.meta?.nodeCount ?? 0;
      totalEdges = data.meta?.edgeCount ?? 0;
    }
  } catch {
    // Server-side fetch may fail in dev/build; client will load independently
    // Fall back to defaults derived from the static graph store
    suggestedSeedNodeId = 'node-middleware-auth'; // most connected node
    totalNodes = 10;
    totalEdges = 9;
  }

  return (
    <ArchitectureExplorerClient
      repoId={repoId}
      repoName={repoName}
      suggestedSeedNodeId={suggestedSeedNodeId}
      totalNodes={totalNodes}
      totalEdges={totalEdges}
    />
  );
}
