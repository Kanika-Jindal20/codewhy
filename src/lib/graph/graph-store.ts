import { KnowledgeGraph } from '@/types/graph';
import { readDataFile, writeDataFile } from '@/lib/storage/json-store';
import { SAMPLE_REPO_ECOMMERCE } from './sample-repo';

export { SAMPLE_REPO_ECOMMERCE };

// Registered repositories store with file persistence
const persistedRepos = readDataFile<Record<string, KnowledgeGraph>>('repositories.json', {});
const persistedActive = readDataFile<{ activeRepoId?: string }>('active-repo.json', {});
const repositories: Map<string, KnowledgeGraph> = new Map([
  [SAMPLE_REPO_ECOMMERCE.repoId, SAMPLE_REPO_ECOMMERCE],
  ...Object.entries(persistedRepos),
]);

let activeRepoId: string = persistedActive.activeRepoId && repositories.has(persistedActive.activeRepoId)
  ? persistedActive.activeRepoId
  : Object.keys(persistedRepos)[0] || SAMPLE_REPO_ECOMMERCE.repoId;

export function getActiveRepositoryId(): string {
  return activeRepoId;
}

export function setActiveRepositoryId(id: string): void {
  if (repositories.has(id)) {
    activeRepoId = id;
    writeDataFile('active-repo.json', { activeRepoId });
  }
}

export function getActiveRepositoryGraph(): KnowledgeGraph {
  return repositories.get(activeRepoId) || SAMPLE_REPO_ECOMMERCE;
}

export function getRepositoryGraph(repoId?: string): KnowledgeGraph | undefined {
  if (!repoId) return getActiveRepositoryGraph();
  return repositories.get(repoId);
}

export function getAllRepositories(): { 
  repoId: string; 
  repoName: string; 
  updatedAt: string; 
  nodeCount: number;
  edgeCount: number;
  isDemo?: boolean;
  isActive?: boolean;
}[] {
  return Array.from(repositories.values()).map(r => ({
    repoId: r.repoId,
    repoName: r.repoName,
    updatedAt: r.updatedAt,
    nodeCount: r.nodes.length,
    edgeCount: r.edges.length,
    isDemo: Boolean(r.isDemo),
    isActive: r.repoId === activeRepoId,
  }));
}

export function registerRepositoryGraph(graph: KnowledgeGraph): void {
  repositories.set(graph.repoId, graph);
  activeRepoId = graph.repoId;
  const toPersist: Record<string, KnowledgeGraph> = {};
  for (const [id, g] of repositories.entries()) {
    if (id !== SAMPLE_REPO_ECOMMERCE.repoId) {
      toPersist[id] = g;
    }
  }
  writeDataFile('repositories.json', toPersist);
  writeDataFile('active-repo.json', { activeRepoId });
}

export function deleteRepository(repoId: string): { success: boolean; error?: string } {
  if (repoId === SAMPLE_REPO_ECOMMERCE.repoId) {
    return { success: false, error: 'Cannot delete the built-in demo repository.' };
  }
  if (!repositories.has(repoId)) {
    return { success: false, error: `Repository '${repoId}' not found.` };
  }
  repositories.delete(repoId);

  // If deleted repo was active, switch to first remaining non-demo or sample
  if (activeRepoId === repoId) {
    const remaining = Array.from(repositories.keys());
    activeRepoId = remaining.find(id => id !== SAMPLE_REPO_ECOMMERCE.repoId) || SAMPLE_REPO_ECOMMERCE.repoId;
  }

  const toPersist: Record<string, KnowledgeGraph> = {};
  for (const [id, g] of repositories.entries()) {
    if (id !== SAMPLE_REPO_ECOMMERCE.repoId) {
      toPersist[id] = g;
    }
  }
  writeDataFile('repositories.json', toPersist);
  writeDataFile('active-repo.json', { activeRepoId });

  return { success: true };
}
