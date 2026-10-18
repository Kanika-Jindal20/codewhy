import React from 'react';
import type { Metadata } from 'next';
import { ArchitectureExplorerClient } from '@/app/architecture/ArchitectureExplorerClient';

export const metadata: Metadata = {
  title: 'Knowledge Graph — CodeWhy',
  description:
    'Explore codebase entity relationships, call hierarchies, and architectural decisions with interactive visual graphs.',
};

export default function KnowledgeGraphPage() {
  const repoId = 'repo-commerce-core';
  const repoName = 'acme/commerce-core';
  const suggestedSeedNodeId = 'node-middleware-auth';
  const totalNodes = 10;
  const totalEdges = 9;

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
