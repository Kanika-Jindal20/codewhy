import React from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { KnowledgeGraphClient } from './KnowledgeGraphClient';
import { getActiveRepositoryGraph, getRepositoryGraph } from '@/lib/graph/graph-store';
import { getMostConnectedNode } from '@/lib/graph/graph-query';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Knowledge Graph — CodeWhy',
  description:
    'Explore codebase entity relationships, call hierarchies, and architectural decisions with interactive visual graphs.',
};

export default async function KnowledgeGraphPage(props: {
  searchParams?: Promise<{ repoId?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const cookieStore = await cookies();
  const cookieRepoId = cookieStore.get('codewhy_active_repo_id')?.value;
  const targetRepoId = searchParams?.repoId || cookieRepoId;
  const activeGraph = targetRepoId ? getRepositoryGraph(targetRepoId) || getActiveRepositoryGraph() : getActiveRepositoryGraph();

  const repoId = activeGraph.repoId;
  const repoName = activeGraph.repoName;
  const suggestedSeed = getMostConnectedNode(activeGraph);
  const suggestedSeedNodeId = suggestedSeed?.id ?? (activeGraph.nodes[0]?.id || null);
  const totalNodes = activeGraph.nodes.length;
  const totalEdges = activeGraph.edges.length;

  return (
    <KnowledgeGraphClient
      repoId={repoId}
      repoName={repoName}
      suggestedSeedNodeId={suggestedSeedNodeId}
      totalNodes={totalNodes}
      totalEdges={totalEdges}
    />
  );
}
