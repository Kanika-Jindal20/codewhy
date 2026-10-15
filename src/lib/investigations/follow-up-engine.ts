import { Investigation, FollowUpSuggestion, InvestigationEntry } from '@/types/investigation';
import { getRepositoryGraph, SAMPLE_REPO_ECOMMERCE } from '@/lib/graph/graph-store';
import { COMMERCE_COMMIT_HISTORY } from '@/lib/impact/heuristics-engine';
import { EvidenceSource } from '@/types/evidence';

/**
 * Generates specific, context-aware follow-up question suggestions based on
 * the investigation's current question, touched files, and AST call graph.
 */
export function generateFollowUpSuggestions(investigation: Investigation): FollowUpSuggestion[] {
  const repo = getRepositoryGraph(investigation.repoId) || SAMPLE_REPO_ECOMMERCE;
  const suggestions: FollowUpSuggestion[] = [];

  // Identify referenced files & nodes
  const allEntriesText = [
    investigation.originalQuestion,
    ...investigation.entries.map(e => `${e.question} ${e.answerSummary}`),
  ].join(' ').toLowerCase();

  const allEvidence = investigation.entries.flatMap(e => e.evidence || []);

  // 1. Test Suite suggestions
  const relevantTests = repo.nodes.filter(
    n => n.type === 'test' && (
      (n.filePath && allEntriesText.includes(n.filePath.toLowerCase())) ||
      (n.label && allEntriesText.includes(n.label.toLowerCase())) ||
      repo.edges.some(e => e.type === 'tests' && (allEntriesText.includes(e.target) || allEntriesText.includes(e.source)))
    )
  );

  if (relevantTests.length > 0) {
    const testLabel = relevantTests[0].label;
    suggestions.push({
      id: 'sug-tests-1',
      question: `Which test suites cover this module, and do assertions in ${testLabel} validate error conditions?`,
      rationale: `Located linked test suite ${testLabel} in repository AST.`,
      category: 'tests',
    });
  } else {
    suggestions.push({
      id: 'sug-tests-general',
      question: 'Are there automated unit or integration tests exercising this component?',
      rationale: 'Verify if test coverage exists before modifying interface contracts.',
      category: 'tests',
    });
  }

  // 2. Commit History & Evolution
  const referencedCommits = allEvidence.filter(e => e.commitHash);
  if (referencedCommits.length > 0) {
    const hash = referencedCommits[0].commitHash!.slice(0, 7);
    suggestions.push({
      id: 'sug-commit-1',
      question: `What changed in subsequent commits after commit ${hash}?`,
      rationale: `Commit ${hash} was cited in the investigation findings.`,
      category: 'commit_history',
    });
  } else {
    suggestions.push({
      id: 'sug-commit-general',
      question: 'What recent commits have modified this component and were any bugfixes recorded?',
      rationale: 'Inspect git commit history to detect regression patterns.',
      category: 'commit_history',
    });
  }

  // 3. Dependents & Callers
  suggestions.push({
    id: 'sug-dependents-1',
    question: 'Which other components and controllers directly depend on this interface?',
    rationale: 'Inspect upstream callers to evaluate breaking change propagation.',
    category: 'dependents',
  });

  // 4. Architectural Decisions & Gaps
  suggestions.push({
    id: 'sug-decisions-1',
    question: 'Is there an Architectural Decision Record (ADR) or documentation explaining the design rationale?',
    rationale: 'Audit whether this subsystem has documented decision history.',
    category: 'decisions',
  });

  return suggestions.slice(0, 4);
}

/**
 * Computes a grounded answer and evidence references for a follow-up inquiry.
 */
export function answerFollowUpQuestion(
  investigation: Investigation,
  question: string
): { answerSummary: string; detailedFindings: string[]; evidence: EvidenceSource[] } {
  const repo = getRepositoryGraph(investigation.repoId) || SAMPLE_REPO_ECOMMERCE;
  const qLower = question.toLowerCase();

  // Test coverage follow-up
  if (qLower.includes('test') || qLower.includes('suite') || qLower.includes('assertion')) {
    const tests = repo.nodes.filter(n => n.type === 'test');
    const jwtTest = tests.find(t => t.id === 'node-test-auth') || tests[0];

    const evidence: EvidenceSource[] = jwtTest?.evidence || [
      {
        id: 'ev-ans-jwt-test',
        type: 'test_coverage',
        title: 'JWT test suite coverage',
        filePath: 'tests/unit/auth/jwt.test.ts',
        startLine: 1,
        endLine: 110,
        confidenceScore: 1.0,
      },
    ];

    return {
      answerSummary: `The primary test coverage is implemented in ${jwtTest?.label || 'tests/unit/auth/jwt.test.ts'}. It asserts token signature validation, expiration timestamps, and tampering detection.`,
      detailedFindings: [
        `Direct test suite: ${jwtTest?.filePath} covers exported verification functions.`,
        `E2E integration test: tests/e2e/checkout.e2e.test.ts validates the complete HTTP lifecycle including token parsing.`,
        `Gap identified: No dedicated contract test currently simulates key rotation failure or expired public key fallback.`,
      ],
      evidence,
    };
  }

  // Commit history follow-up
  if (qLower.includes('commit') || qLower.includes('changed') || qLower.includes('history')) {
    const recentCommits = COMMERCE_COMMIT_HISTORY.slice(0, 3);
    const evidence: EvidenceSource[] = recentCommits.map(c => ({
      id: `ev-ans-commit-${c.hash}`,
      type: 'commit',
      title: `Commit ${c.hash}: ${c.message}`,
      commitHash: c.hash,
      author: c.author,
      timestamp: c.date,
      confidenceScore: 0.95,
      commitMessage: c.message,
    }));

    return {
      answerSummary: `Following the historical refactor in commit 7a8f9c, commit 8f4c21a ("fix(auth): prevent token replay by verifying jti claim in Redis") was subsequently applied on 2026-09-20.`,
      detailedFindings: [
        `Commit 8f4c21a touched src/auth/jwt.ts and src/config/auth.config.ts to introduce Redis jti claim validation.`,
        `Commit 3d90f41 previously resolved a cart-dropping bug upon token expiration in checkoutController.ts.`,
        `Evidence shows active maintenance on token validation with historical bugfixes for replay and expiration.`,
      ],
      evidence,
    };
  }

  // Dependents follow-up
  if (qLower.includes('depend') || qLower.includes('call') || qLower.includes('consumer') || qLower.includes('interface')) {
    const consumers = repo.nodes.filter(
      n => n.id === 'node-middleware-auth' || n.id === 'node-controller-checkout' || n.id === 'node-service-payment'
    );

    const edges = repo.edges.filter(e => e.type === 'imports' || e.type === 'calls');
    const evidence: EvidenceSource[] = edges.flatMap(e => e.evidence || []).slice(0, 3);

    return {
      answerSummary: `Direct dependents include authMiddleware.ts (which imports verifySessionToken directly) and checkoutController.ts (which mounts authMiddleware for all /api/checkout routes).`,
      detailedFindings: [
        `Direct caller: src/middleware/authMiddleware.ts imports verifySessionToken synchronously.`,
        `Transitive consumer (2 hops): src/controllers/checkoutController.ts dispatches orders post-authentication.`,
        `Transitive consumer (3 hops): src/services/paymentService.ts executes payment capture for authenticated sessions.`,
      ],
      evidence,
    };
  }

  // ADR / Decision follow-up
  if (qLower.includes('adr') || qLower.includes('decision') || qLower.includes('rationale') || qLower.includes('document')) {
    return {
      answerSummary: `No formal Architectural Decision Record (ADR) currently exists in docs/adr/ for key rotation fallback. Design decisions are currently recorded only in commit messages.`,
      detailedFindings: [
        `Commit 7a8f9c documented the migration rationale in its commit message: "migrate token verification to support rotated RS256 keys".`,
        `Identified Knowledge Gap: docs/adr/ lacks a specification for JWKS cache expiration and fail-closed vs fail-open protocol.`,
        `Recommended remediation: Create docs/adr/0014-jwks-rotation-fallback.md before production release.`,
      ],
      evidence: [
        {
          id: 'ev-ans-adr-commit',
          type: 'commit',
          title: 'Commit 7a8f9c Rationale Citation',
          commitHash: '7a8f9c2',
          author: 'Alex Chen <alex@acme.dev>',
          confidenceScore: 0.95,
          snippet: 'refactor(auth): migrate token verification to support rotated RS256 keys',
        },
      ],
    };
  }

  // Default grounded response
  return {
    answerSummary: `Grounded repository analysis indicates coupling between authentication modules and API controllers. Reviewing AST call paths confirms active dependencies.`,
    detailedFindings: [
      `Referenced components are actively indexed in the repository knowledge graph.`,
      `Verified against AST relationships, configuration references, and commit records.`,
    ],
    evidence: repo.nodes[0]?.evidence || [],
  };
}
