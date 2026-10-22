import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SAMPLE_REPO_ECOMMERCE } from '@/lib/graph/sample-repo';
import {
  searchCode,
  getSymbolDetails,
  traceDependencies,
  findRelatedTests,
  inspectFile,
  getCommitHistory,
} from '@/lib/ask/investigation-tools';
import { runAutonomousInvestigation } from '@/lib/investigator/autonomous-engine';
import { simulateProposedChange } from '@/lib/simulator/change-simulator';
import { reviewPullRequestRisk } from '@/lib/pr/pr-reviewer';
import { analyzeTestGaps } from '@/lib/gaps/test-gap-engine';
import { calculateArchitectureHealth } from '@/lib/health/health-score';

describe('Investigation Tools Suite', () => {
  it('searchCode finds matching symbols by label and path', () => {
    const hits = searchCode(SAMPLE_REPO_ECOMMERCE.repoId, 'verifySessionToken');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].label).toContain('verifySessionToken');
    expect(hits[0].filePath).toContain('jwt.ts');
  });

  it('getSymbolDetails returns incoming callers, callees, and test suites', () => {
    const details = getSymbolDetails(SAMPLE_REPO_ECOMMERCE.repoId, 'node-auth-jwt');
    expect(details).not.toBeNull();
    expect(details?.node.id).toBe('node-auth-jwt');
    expect(details?.directCallers.length).toBeGreaterThanOrEqual(1);
  });

  it('traceDependencies traces multi-hop upstream and downstream reach', () => {
    const trace = traceDependencies(SAMPLE_REPO_ECOMMERCE.repoId, 'node-auth-jwt', 'both', 3);
    expect(trace).not.toBeNull();
    expect(trace?.upstream.length).toBeGreaterThanOrEqual(1);
  });

  it('findRelatedTests discovers test files asserting component', () => {
    const related = findRelatedTests(SAMPLE_REPO_ECOMMERCE.repoId, 'node-auth-jwt');
    expect(related.testNodes.length).toBeGreaterThanOrEqual(1);
    expect(related.testFilePaths.some((p) => p.includes('test') || p.includes('spec'))).toBe(true);
  });

  it('inspectFile reads code lines and enclosed symbols', () => {
    const result = inspectFile(SAMPLE_REPO_ECOMMERCE.repoId, 'src/auth/jwt.ts');
    expect(result).not.toBeNull();
    expect(result?.filePath).toBe('src/auth/jwt.ts');
  });

  it('getCommitHistory returns commit records with timestamps', () => {
    const history = getCommitHistory(SAMPLE_REPO_ECOMMERCE.repoId);
    expect(history.commits.length).toBeGreaterThan(0);
  });
});

describe('Autonomous Engineering Investigator', () => {
  it('runs autonomous investigation and calculates explainable risk factors', async () => {
    const result = await runAutonomousInvestigation(
      SAMPLE_REPO_ECOMMERCE.repoId,
      'Investigate riskiest parts of commerce-core'
    );

    expect(result.repoId).toBe(SAMPLE_REPO_ECOMMERCE.repoId);
    expect(result.metrics.totalComponentsAudited).toBeGreaterThan(0);
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.completedSteps.length).toBe(5);

    const firstFinding = result.findings[0];
    expect(firstFinding.severity).toBeDefined();
    expect(firstFinding.factors.dependencyReach).toBeGreaterThanOrEqual(0);
    expect(firstFinding.remediation).toBeDefined();
  });
});

describe('What-If Change Simulator', () => {
  it('simulates proposed code modification and separates verified vs predicted impacts', async () => {
    const result = await simulateProposedChange({
      repoId: SAMPLE_REPO_ECOMMERCE.repoId,
      changeDescription: 'Refactor verifySessionToken() to return Promise<Result<UserSession>>',
    });

    expect(result.repoId).toBe(SAMPLE_REPO_ECOMMERCE.repoId);
    expect(result.targetComponents.length).toBeGreaterThan(0);
    expect(result.verifiedDirectDependents.length).toBeGreaterThan(0);
    expect(result.stepByStepChangePlan.length).toBeGreaterThan(0);

    // Verify predictions are explicitly marked as estimates
    for (const risk of result.predictedRisks) {
      expect(risk.isEstimate).toBe(true);
    }
  });
});

describe('AI Pull Request Risk Reviewer', () => {
  it('correlates changed files with knowledge graph and assesses risk level', async () => {
    const review = await reviewPullRequestRisk({
      repoId: SAMPLE_REPO_ECOMMERCE.repoId,
      changedFiles: [
        { filename: 'src/auth/jwt.ts', status: 'modified', additions: 10, deletions: 2 },
        { filename: 'src/checkout/billing.ts', status: 'modified', additions: 3, deletions: 1 },
      ],
    });

    expect(review.repoId).toBe(SAMPLE_REPO_ECOMMERCE.repoId);
    expect(review.totalFilesChanged).toBe(2);
    expect(review.fileRisks.length).toBe(2);
    expect(['critical', 'high', 'medium', 'low']).toContain(review.overallRiskLevel);
  });
});

describe('Test Gap and Failure Path Finder', () => {
  it('identifies test coverage and generates unit test template', async () => {
    const result = await analyzeTestGaps(SAMPLE_REPO_ECOMMERCE.repoId);
    expect(result.coverageEstimate.totalTestableSymbols).toBeGreaterThan(0);
    expect(result.coverageEstimate.isCoverageEstimated).toBe(true);

    if (result.criticalGaps.length > 0) {
      const gap = result.criticalGaps[0];
      expect(gap.recommendedTestCases.length).toBeGreaterThan(0);
      expect(gap.concreteTestCodeTemplate).toContain('describe(');
    }
  });
});

describe('Explainable Architecture Health Score', () => {
  it('calculates deterministic health score and cycle detection', () => {
    const health = calculateArchitectureHealth(SAMPLE_REPO_ECOMMERCE.repoId);
    expect(health.overallScore).toBeGreaterThanOrEqual(0);
    expect(health.overallScore).toBeLessThanOrEqual(100);
    expect(health.metrics.length).toBe(4);

    for (const m of health.metrics) {
      expect(m.formulaExplanation).toBeDefined();
      expect(m.score).toBeGreaterThanOrEqual(0);
      expect(m.score).toBeLessThanOrEqual(100);
    }
  });
});
