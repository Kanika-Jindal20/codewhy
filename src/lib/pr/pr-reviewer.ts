import { KnowledgeGraph, GraphNode } from '@/types/graph';
import { getRepositoryGraph, getActiveRepositoryGraph } from '@/lib/graph/graph-store';
import { traceDependencies, findRelatedTests } from '@/lib/ask/investigation-tools';
import { querySarvamAI, isSarvamConfigured } from '@/lib/sarvam/sarvam-client';
import { parseRepositoryUrl } from '@/lib/repositories/github';

export interface PullRequestReviewRequest {
  repoId: string;
  prUrl?: string;
  prNumber?: number;
  changedFiles?: Array<{
    filename: string;
    status: 'added' | 'modified' | 'removed' | 'renamed';
    additions?: number;
    deletions?: number;
    patch?: string;
  }>;
  authToken?: string;
}

export interface PullRequestRiskReview {
  reviewId: string;
  repoId: string;
  repoName: string;
  prTitle?: string;
  prAuthor?: string;
  prUrl?: string;
  timestamp: string;
  overallRiskLevel: 'critical' | 'high' | 'medium' | 'low';
  totalFilesChanged: number;
  downstreamComponentsAffected: number;
  untestedChangesCount: number;
  fileRisks: Array<{
    filename: string;
    status: string;
    nodeId?: string;
    riskLevel: 'critical' | 'high' | 'medium' | 'low';
    directCallersCount: number;
    directCallers: string[];
    hasTests: boolean;
    reason: string;
  }>;
  prioritizedFindings: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    targetFile: string;
    recommendation: string;
  }>;
  reviewSummary: string;
  aiReasoned: boolean;
}

/**
 * Reviews a GitHub PR against the indexed architecture knowledge graph.
 */
export async function reviewPullRequestRisk(
  request: PullRequestReviewRequest
): Promise<PullRequestRiskReview> {
  const graph = getRepositoryGraph(request.repoId) || getActiveRepositoryGraph();
  let changedFiles = request.changedFiles || [];
  let prTitle = 'Manual PR Review';
  let prAuthor = 'Developer';

  // 1. If PR URL is provided, fetch actual PR metadata and changed files from GitHub
  if (request.prUrl && request.prUrl.includes('github.com')) {
    try {
      const match = /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i.exec(request.prUrl);
      if (match) {
        const owner = match[1];
        const name = match[2];
        const prNum = match[3];

        const token = request.authToken || process.env.GITHUB_TOKEN?.trim();
        const headers: Record<string, string> = {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'CodeWhy-Intelligence-Platform',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Fetch PR Details
        const prRes = await fetch(`https://api.github.com/repos/${owner}/${name}/pulls/${prNum}`, { headers });
        if (prRes.ok) {
          const prData = await prRes.json();
          prTitle = prData.title || prTitle;
          prAuthor = prData.user?.login || prAuthor;
        }

        // Fetch Changed Files
        const filesRes = await fetch(`https://api.github.com/repos/${owner}/${name}/pulls/${prNum}/files?per_page=50`, { headers });
        if (filesRes.ok) {
          const filesData = await filesRes.json();
          if (Array.isArray(filesData)) {
            changedFiles = filesData.map((f: any) => ({
              filename: f.filename,
              status: f.status,
              additions: f.additions,
              deletions: f.deletions,
              patch: f.patch,
            }));
          }
        }
      }
    } catch (fetchErr) {
      console.warn('[PR Reviewer] Could not fetch remote PR details, using fallback:', fetchErr);
    }
  }

  // Fallback sample files if nothing provided
  if (changedFiles.length === 0) {
    changedFiles = [
      { filename: 'src/services/billing.ts', status: 'modified', additions: 15, deletions: 4 },
      { filename: 'src/utils/tax.ts', status: 'modified', additions: 5, deletions: 2 },
    ];
  }

  // 2. Correlate with Knowledge Graph
  const fileRisks: PullRequestRiskReview['fileRisks'] = [];
  const prioritizedFindings: PullRequestRiskReview['prioritizedFindings'] = [];
  let totalAffectedDownstream = 0;
  let untestedCount = 0;

  for (const file of changedFiles) {
    const norm = file.filename.replace(/\\/g, '/');
    const matchedNode = graph.nodes.find(
      (n) => n.filePath.toLowerCase().endsWith(norm.toLowerCase()) || norm.toLowerCase().endsWith(n.filePath.toLowerCase())
    );

    let callersCount = 0;
    let callersList: string[] = [];
    let hasTests = false;

    if (matchedNode) {
      const trace = traceDependencies(graph.repoId, matchedNode.id, 'upstream', 2);
      if (trace) {
        callersCount = trace.upstream.length;
        callersList = trace.upstream.map((u) => u.node.label);
        totalAffectedDownstream += callersCount;
      }

      const tests = findRelatedTests(graph.repoId, matchedNode.id);
      hasTests = tests.testNodes.length > 0;
    } else {
      // Heuristic test detection by path
      hasTests = norm.includes('test') || norm.includes('spec');
    }

    if (!hasTests && !norm.includes('test')) untestedCount++;

    let riskLevel: 'critical' | 'high' | 'medium' | 'low' = 'low';
    let reason = 'Low impact isolated changes.';

    if (callersCount >= 3 && !hasTests) {
      riskLevel = 'critical';
      reason = `Modifies high-coupling module with ${callersCount} downstream callers and zero detected tests.`;
    } else if (callersCount >= 2 || !hasTests) {
      riskLevel = 'high';
      reason = !hasTests
        ? 'No matching test suite detected for this component.'
        : `Affects ${callersCount} downstream callers in the dependency graph.`;
    } else if (callersCount === 1) {
      riskLevel = 'medium';
      reason = `Directly imported by ${callersList[0]}.`;
    }

    fileRisks.push({
      filename: file.filename,
      status: file.status,
      nodeId: matchedNode?.id,
      riskLevel,
      directCallersCount: callersCount,
      directCallers: callersList.slice(0, 4),
      hasTests,
      reason,
    });

    if (riskLevel === 'critical' || riskLevel === 'high') {
      prioritizedFindings.push({
        severity: riskLevel,
        title: `${riskLevel.toUpperCase()}: Risky modification to ${file.filename}`,
        description: reason,
        targetFile: file.filename,
        recommendation: !hasTests
          ? `Author automated test coverage for ${file.filename} before merging.`
          : `Run regression tests on callers: ${callersList.slice(0, 3).join(', ')}.`,
      });
    }
  }

  // 3. Overall Risk Calculation
  let overallRiskLevel: 'critical' | 'high' | 'medium' | 'low' = 'low';
  if (fileRisks.some((f) => f.riskLevel === 'critical')) {
    overallRiskLevel = 'critical';
  } else if (fileRisks.some((f) => f.riskLevel === 'high')) {
    overallRiskLevel = 'high';
  } else if (fileRisks.some((f) => f.riskLevel === 'medium')) {
    overallRiskLevel = 'medium';
  }

  // 4. Synthesize with Sarvam AI or Deterministic Rules
  let reviewSummary = `Pull Request Risk Audit for '${prTitle}': Audited ${changedFiles.length} changed file(s). Found ${totalAffectedDownstream} downstream dependencies and ${untestedCount} untested modification(s). Overall architectural risk tier: ${overallRiskLevel.toUpperCase()}.`;
  let aiReasoned = false;

  if (isSarvamConfigured()) {
    try {
      const aiRes = await querySarvamAI({
        question: `Review this Pull Request for architectural risks, breaking changes, and test gaps: "${prTitle}". Changed files: ${changedFiles.map((f) => `${f.filename} (${f.status})`).join(', ')}.`,
        questionKind: 'change_impact',
        evidence: fileRisks.map((f, idx) => ({
          id: `ev-pr-${idx}`,
          type: 'ast_relation',
          title: `PR File: ${f.filename}`,
          filePath: f.filename,
          snippet: f.reason,
          confidenceScore: 1.0,
        })),
        repoName: graph.repoName,
      });

      if (aiRes.success && aiRes.structuredResponse?.answer) {
        reviewSummary = aiRes.structuredResponse.answer;
        aiReasoned = true;
      }
    } catch {
      // Deterministic rules preserved
    }
  }

  return {
    reviewId: `pr-rev-${Date.now()}`,
    repoId: graph.repoId,
    repoName: graph.repoName,
    prTitle,
    prAuthor,
    prUrl: request.prUrl,
    timestamp: new Date().toISOString(),
    overallRiskLevel,
    totalFilesChanged: changedFiles.length,
    downstreamComponentsAffected: totalAffectedDownstream,
    untestedChangesCount: untestedCount,
    fileRisks,
    prioritizedFindings,
    reviewSummary,
    aiReasoned,
  };
}
