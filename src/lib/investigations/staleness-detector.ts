import { Investigation, StaleEvidenceStatus } from '@/types/investigation';
import { COMMERCE_COMMIT_HISTORY } from '@/lib/impact/heuristics-engine';
import { getRepositoryGraph, SAMPLE_REPO_ECOMMERCE } from '@/lib/graph/graph-store';

/**
 * Detects whether an investigation references commits or file states that have
 * been superseded by subsequent repository changes.
 */
export function detectEvidenceStaleness(investigation: Investigation): StaleEvidenceStatus {
  const repo = getRepositoryGraph(investigation.repoId) || SAMPLE_REPO_ECOMMERCE;
  const staleEvidenceIds: string[] = [];
  const reasons: string[] = [];

  // Flatten all evidence across all entries
  const allEvidence = investigation.entries.flatMap(e => e.evidence || []);

  // Check 1: Referenced Commits that have been superseded by newer commits touching the same file
  for (const ev of allEvidence) {
    if (ev.commitHash) {
      const commitIndex = COMMERCE_COMMIT_HISTORY.findIndex(
        c => c.hash.toLowerCase().startsWith(ev.commitHash!.toLowerCase().slice(0, 7)) ||
             ev.commitHash!.toLowerCase().startsWith(c.hash.toLowerCase())
      );

      // If this commit is found and there are newer commits in the history touching related files
      if (commitIndex > 0) {
        const commitRecord = COMMERCE_COMMIT_HISTORY[commitIndex];
        const newerCommits = COMMERCE_COMMIT_HISTORY.slice(0, commitIndex);
        const relatedNewer = newerCommits.filter(
          c => (ev.filePath && c.filesChanged.includes(ev.filePath)) ||
               commitRecord.filesChanged.some(f => c.filesChanged.includes(f))
        );

        if (relatedNewer.length > 0) {
          staleEvidenceIds.push(ev.id);
          const targetFile = ev.filePath || relatedNewer[0].filesChanged[0];
          reasons.push(
            `Referenced commit ${ev.commitHash.slice(0, 7)} on ${targetFile} was superseded by commit ${relatedNewer[0].hash} ("${relatedNewer[0].message}").`
          );
        }
      }
    }

    // Check 2: File paths no longer in active graph (deleted or renamed)
    if (ev.filePath) {
      const fileExistsInGraph = repo.nodes.some(
        n => n.filePath === ev.filePath || n.filePath.startsWith(ev.filePath!)
      );
      if (!fileExistsInGraph && !ev.filePath.startsWith('http')) {
        staleEvidenceIds.push(ev.id);
        reasons.push(`File "${ev.filePath}" could not be located in current repository index.`);
      }
    }
  }

  // Check 3: Investigation age vs repository last updated
  const repoUpdated = new Date(repo.updatedAt).getTime();
  const investigationUpdated = new Date(investigation.updatedAt).getTime();
  if (repoUpdated > investigationUpdated + 86400000 && staleEvidenceIds.length === 0) {
    // If repo was updated more than a day after investigation was last edited
    const latestCommit = COMMERCE_COMMIT_HISTORY[0];
    return {
      isStale: true,
      reason: `Repository was modified on ${new Date(repo.updatedAt).toLocaleDateString()} (latest commit ${latestCommit.hash}). Re-verification recommended.`,
      staleEvidenceIds: [],
      checkedAt: new Date().toISOString(),
    };
  }

  if (staleEvidenceIds.length > 0) {
    return {
      isStale: true,
      reason: reasons[0] || 'One or more referenced code artifacts have evolved in subsequent commits.',
      staleEvidenceIds: Array.from(new Set(staleEvidenceIds)),
      checkedAt: new Date().toISOString(),
    };
  }

  return {
    isStale: false,
    staleEvidenceIds: [],
    checkedAt: new Date().toISOString(),
  };
}
