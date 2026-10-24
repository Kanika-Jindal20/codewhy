import React from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { ArchitectureViewClient } from './ArchitectureViewClient';
import { getActiveRepositoryGraph, getRepositoryGraph } from '@/lib/graph/graph-store';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Architecture Explorer — CodeWhy',
  description:
    'Interactively explore repository structure, architectural layers, and subsystem dependencies with full evidence provenance.',
};

export default async function ArchitecturePage(props: {
  searchParams?: Promise<{ repoId?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const cookieStore = await cookies();
  const cookieRepoId = cookieStore.get('codewhy_active_repo_id')?.value;
  const targetRepoId = searchParams?.repoId || cookieRepoId;
  const activeGraph = targetRepoId ? getRepositoryGraph(targetRepoId) || getActiveRepositoryGraph() : getActiveRepositoryGraph();

  return (
    <ArchitectureViewClient
      repoId={activeGraph.repoId}
      repoName={activeGraph.repoName}
      graph={activeGraph}
    />
  );
}
