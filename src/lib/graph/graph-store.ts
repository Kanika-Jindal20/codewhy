import { KnowledgeGraph } from '@/types/graph';
import { readDataFile, writeDataFile } from '@/lib/storage/json-store';
import { SAMPLE_REPO_ECOMMERCE } from './sample-repo';

export { SAMPLE_REPO_ECOMMERCE };

// In-memory repositories cache with persistent backing
const repositories: Map<string, KnowledgeGraph> = new Map([
  [SAMPLE_REPO_ECOMMERCE.repoId, SAMPLE_REPO_ECOMMERCE],
]);

let activeRepoId: string = SAMPLE_REPO_ECOMMERCE.repoId;

/**
 * Re-synchronizes in-memory map from persistent storage (/tmp or data/)
 * to handle serverless cross-invocation synchronization.
 */
function refreshStoreFromDisk(): void {
  try {
    const persistedRepos = readDataFile<Record<string, KnowledgeGraph>>('repositories.json', {});
    for (const [id, g] of Object.entries(persistedRepos)) {
      if (g && g.repoId) {
        repositories.set(id, g);
      }
    }
    const persistedActive = readDataFile<{ activeRepoId?: string }>('active-repo.json', {});
    if (persistedActive.activeRepoId && repositories.has(persistedActive.activeRepoId)) {
      activeRepoId = persistedActive.activeRepoId;
    }
  } catch {
    // Fail safe
  }
}

// Initial sync
refreshStoreFromDisk();

export function getActiveRepositoryId(): string {
  refreshStoreFromDisk();
  return activeRepoId;
}

export function setActiveRepositoryId(id: string): void {
  refreshStoreFromDisk();
  if (repositories.has(id)) {
    activeRepoId = id;
    writeDataFile('active-repo.json', { activeRepoId });
  }
}

export function getActiveRepositoryGraph(): KnowledgeGraph {
  refreshStoreFromDisk();
  return repositories.get(activeRepoId) || SAMPLE_REPO_ECOMMERCE;
}

export function getRepositoryGraph(repoId?: string): KnowledgeGraph | undefined {
  refreshStoreFromDisk();
  if (!repoId) return getActiveRepositoryGraph();
  return repositories.get(repoId) || (repoId === SAMPLE_REPO_ECOMMERCE.repoId ? SAMPLE_REPO_ECOMMERCE : undefined);
}

export function getAllRepositories(): { 
  repoId: string; 
  repoName: string; 
  updatedAt: string; 
  nodeCount: number;
  edgeCount: number;
  isDemo?: boolean;
  isActive?: boolean;
  branch?: string;
  commitSha?: string;
  primaryLanguage?: string;
}[] {
  refreshStoreFromDisk();
  return Array.from(repositories.values()).map(r => ({
    repoId: r.repoId,
    repoName: r.repoName,
    updatedAt: r.updatedAt,
    nodeCount: r.nodes.length,
    edgeCount: r.edges.length,
    isDemo: Boolean(r.isDemo),
    isActive: r.repoId === activeRepoId,
    branch: r.branch || 'main',
    commitSha: r.commitSha,
    primaryLanguage: r.primaryLanguage || 'TypeScript',
  }));
}

export function registerRepositoryGraph(graph: KnowledgeGraph): void {
  refreshStoreFromDisk();
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
  refreshStoreFromDisk();
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
