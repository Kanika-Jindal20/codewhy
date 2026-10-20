import React from 'react';
import type { Metadata } from 'next';
import { ArchitectureViewClient } from './ArchitectureViewClient';
import { getActiveRepositoryGraph, getRepositoryGraph } from '@/lib/graph/graph-store';

export const metadata: Metadata = {
  title: 'Architecture Explorer — CodeWhy',
  description:
    'Interactively explore repository structure, architectural layers, and subsystem dependencies with full evidence provenance.',
};

export default async function ArchitecturePage(props: {
  searchParams?: Promise<{ repoId?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const targetRepoId = searchParams?.repoId;
  const activeGraph = targetRepoId ? getRepositoryGraph(targetRepoId) || getActiveRepositoryGraph() : getActiveRepositoryGraph();

  return (
    <ArchitectureViewClient
      repoId={activeGraph.repoId}
      repoName={activeGraph.repoName}
      graph={activeGraph}
    />
  );
}
