import { EngineeringDecisionReport } from '@/types/report';
import { SAMPLE_REPO_ECOMMERCE } from '@/lib/graph/graph-store';

/**
 * High-fidelity, real-world sample engineering decision report based on
 * the acme/commerce-core repository.
 */
export const SAMPLE_REPORT_JWT_REFACTOR: EngineeringDecisionReport = {
  id: 'rep-jwt-rotation-2026',
  title: 'Architectural Audit: RS256 Key Rotation Migration in auth/jwt.ts',
  generatedAt: '2026-10-15T18:30:00Z',
  author: 'Engineering Architecture Board (CodeWhy Automated Audit)',
  version: '1.2.0',
  repository: {
    repoId: 'repo-commerce-core',
    repoName: 'acme/commerce-core',
    repoUrl: 'https://github.com/acme/commerce-core',
    analyzedCommit: '7a8f9c2d1b44e59021',
    analyzedBranch: 'main',
    primaryLanguage: 'TypeScript',
  },
  executiveSummary: {
    headline: 'High-Impact Security Hardening: Token Verification Refactored to RS256 with Downstream Blast Radius on Auth Middleware and Checkout Endpoints',
    overview: 'This investigation audits the proposed migration of session token verification from legacy HS256 shared secrets to asymmetric RS256 key pairs with automated JWKS key rotation. Downstream consumers across checkout and order services rely on token hydration invariants.',
    criticalTakeaways: [
      'Token verification signature change directly propagates to authMiddleware.ts and checkoutController.ts.',
      'Unit test coverage in jwt.test.ts verifies cryptographic expiry and tampering, but e2e checkout suite must be updated for rotated public keys.',
      'No documented ADR currently exists for key rotation failure fallbacks — recommended to resolve gap before production rollout.',
    ],
    riskAssessmentLevel: 'elevated',
  },
  proposedChange: {
    targetSymbolOrFile: 'src/auth/jwt.ts -> verifySessionToken()',
    changeCategory: 'breaking_interface',
    questionOrDescription: 'What is the blast radius and architectural risk of updating verifySessionToken signature to support asymmetric key rotation from auth.config.ts?',
    rationale: 'Mitigates single-point-of-failure symmetric key disclosure across distributed microservices by delegating signature verification to JWKS public key rotation.',
  },
  findings: [
    {
      id: 'f-1',
      title: 'Direct Consumer Signature Coupling',
      category: 'interface_coupling',
      severity: 'high',
      explanation: 'src/middleware/authMiddleware.ts imports verifySessionToken directly and expects a synchronous TokenPayload return type. Asynchronous JWKS retrieval introduces an async boundary across express middleware.',
      supportingEvidenceIds: ['ev-edge-mw-jwt', 'ev-verify-token'],
    },
    {
      id: 'f-2',
      title: 'Transitive Checkout Blast Radius',
      category: 'runtime_propagation',
      severity: 'high',
      explanation: 'checkoutController.ts mounts authMiddleware and invokes paymentService. Any unhandled rejection during key rotation will abort ongoing payment transactions.',
      supportingEvidenceIds: ['ev-edge-ctrl-mw', 'ev-checkout-ctrl'],
    },
    {
      id: 'f-3',
      title: 'Undocumented Fallback Protocol',
      category: 'knowledge_gap',
      severity: 'medium',
      explanation: 'Commit 7a8f9c touched token verification logic without linking an Architectural Decision Record explaining key cache invalidation behavior.',
      supportingEvidenceIds: ['ev-jwt-commit'],
    },
  ],
  architectureContext: {
    focalNode: SAMPLE_REPO_ECOMMERCE.nodes[0], // jwt.ts
    connectedNodes: [
      SAMPLE_REPO_ECOMMERCE.nodes[1], // verifySessionToken()
      SAMPLE_REPO_ECOMMERCE.nodes[2], // authMiddleware.ts
      SAMPLE_REPO_ECOMMERCE.nodes[4], // checkoutController.ts
      SAMPLE_REPO_ECOMMERCE.nodes[6], // jwt.test.ts
      SAMPLE_REPO_ECOMMERCE.nodes[8], // auth.config.ts
    ],
    edges: SAMPLE_REPO_ECOMMERCE.edges.slice(0, 5),
    directCallersCount: 2,
    transitiveConsumersCount: 3,
    architecturalRoleDescription: 'Core security foundation module responsible for cryptographic assertion, JWT claim extraction, and HTTP-only cookie parsing.',
  },
  impactAnalysis: {
    summary: {
      totalAffected: 5,
      directCount: 2,
      transitiveCount: 2,
      testCount: 1,
      configCount: 1,
      coChangeCount: 2,
    },
    affectedComponents: [
      {
        node: SAMPLE_REPO_ECOMMERCE.nodes[2], // authMiddleware.ts
        impactKind: 'direct_dependent',
        severity: 'high',
        severityReason: 'Direct import of verifySessionToken function signature',
        paths: [],
        evidence: [],
        recommendedChecks: ['Ensure authMiddleware correctly awaits async token verification', 'Validate HTTP 401 error response payload format'],
        isDirect: true,
      },
      {
        node: SAMPLE_REPO_ECOMMERCE.nodes[4], // checkoutController.ts
        impactKind: 'transitive_consumer',
        severity: 'high',
        severityReason: '2-hop consumer routing payment requests through authMiddleware',
        paths: [],
        evidence: [],
        recommendedChecks: ['Run e2e checkout integration suite against rotated keys'],
        isDirect: false,
      },
    ],
    dependencyPaths: [],
    relatedTests: [
      {
        node: SAMPLE_REPO_ECOMMERCE.nodes[6], // jwt.test.ts
        impactKind: 'test_suite',
        severity: 'medium',
        severityReason: 'Direct unit test suite asserting token verification claims',
        paths: [],
        evidence: [],
        recommendedChecks: ['Add test cases for key cache expiration and rotation failure'],
        isDirect: true,
      },
    ],
    pastRegressions: [
      {
        id: 'reg-1',
        commitHash: '7a8f9c2d1b',
        summary: 'refactor(auth): migrate token verification to support rotated RS256 keys',
        date: '2026-08-12',
        author: 'Alex Chen <alex@acme.dev>',
        relevanceExplanation: 'Historical commit that previously introduced token validation regressions during high traffic.',
        evidence: {
          id: 'ev-jwt-commit',
          type: 'commit',
          title: 'Security hardening commit',
          commitHash: '7a8f9c2d1b',
          confidenceScore: 0.95,
        },
      },
    ],
    potentialRisks: [
      {
        risk: 'Cold Start Latency Spike',
        level: 'high',
        rationale: 'Initial fetch of JWKS key set upon container cold start can add up to 250ms to the first checkout API call if not pre-warmed.',
      },
      {
        risk: 'Clock Skew Verification Failures',
        level: 'medium',
        rationale: 'RS256 token timestamps without standard 30-second leeway will prematurely reject distributed client requests.',
      },
    ],
  },
  decisionTimeline: [
    {
      id: 'dec-1',
      date: '2025-11-04T10:00:00Z',
      commitHash: '3d2a1b4c',
      author: 'Sarah Jenkins',
      title: 'Initial HS256 Stateless Token Design',
      rationale: 'Adopted shared symmetric secret for simplicity across single-region monolithic deployment.',
      status: 'superseded',
    },
    {
      id: 'dec-2',
      date: '2026-08-12T14:30:00Z',
      commitHash: '7a8f9c2d1b',
      author: 'Alex Chen',
      title: 'Key Rotation Capability Added',
      rationale: 'Introduced asymmetric public key cache to prepare for multi-region checkout federation.',
      status: 'active',
    },
  ],
  knowledgeGaps: {
    debtScore: {
      overallScore: 38,
      tier: 'moderate',
      tierLabel: 'Moderate Architectural Debt',
      formula: 'Sum(Weights) / 80 * 100',
      formulaExplanation: 'Debt calculated transparently from verified undocumented decisions and missing contract tests.',
      totalFindingsCount: 2,
      severityBreakdown: { critical: 0, high: 1, medium: 1, low: 0 },
      categoryBreakdown: {
        undocumented_architectural_decision: 1,
        unexplained_dependency: 1,
        undocumented_public_api: 0,
        complex_undocumented_module: 0,
        high_churn_sparse_docs: 0,
        stale_todo_marker: 0,
        entrypoint_guidance_gap: 0,
      },
      contributingFactors: [],
    },
    keyGaps: [
      {
        id: 'gap-jwt-adr',
        repoId: 'repo-commerce-core',
        targetComponent: 'src/auth/jwt.ts',
        filePath: 'src/auth/jwt.ts',
        category: 'undocumented_architectural_decision',
        title: 'Missing ADR for JWKS Key Rotation Fallback',
        description: 'Key rotation was introduced in commit 7a8f9c without documenting failure mode fallback behavior.',
        evidence: [],
        ruleId: 'RULE_UNDOC_DECISION',
        ruleName: 'Undocumented Architectural Decision',
        developerImpact: 'Engineers on-call cannot confirm if fallback to secondary key is intentional or a security bypass.',
        suggestedImprovement: 'Author docs/adr/0014-jwks-rotation-fallback.md',
        severity: 'high',
        severityPoints: 10,
        status: 'unresolved',
        detectedAt: '2026-10-14T00:00:00Z',
      },
    ],
    summaryNote: '2 architectural documentation gaps identified across the auth subsystem.',
  },
  evidence: [
    {
      id: 'ev-1',
      type: 'file_span',
      title: 'verifySessionToken Export Declaration',
      filePath: 'src/auth/jwt.ts',
      startLine: 34,
      endLine: 62,
      confidenceScore: 1.0,
      url: 'https://github.com/acme/commerce-core/blob/main/src/auth/jwt.ts#L34-L62',
      snippet: 'export function verifySessionToken(token: string, secret: string): TokenPayload',
    },
    {
      id: 'ev-2',
      type: 'ast_relation',
      title: 'authMiddleware Import AST Edge',
      filePath: 'src/middleware/authMiddleware.ts',
      startLine: 3,
      endLine: 3,
      confidenceScore: 1.0,
      url: 'https://github.com/acme/commerce-core/blob/main/src/middleware/authMiddleware.ts#L3',
      snippet: "import { verifySessionToken } from '../auth/jwt'",
    },
    {
      id: 'ev-3',
      type: 'commit',
      title: 'Historical Security Hardening Commit',
      commitHash: '7a8f9c2d1b',
      author: 'Alex Chen <alex@acme.dev>',
      timestamp: '2026-08-12T10:15:00Z',
      confidenceScore: 0.95,
      url: 'https://github.com/acme/commerce-core/commit/7a8f9c2d1b',
      commitMessage: 'refactor(auth): migrate token verification to support rotated RS256 keys',
    },
  ],
  uncertainties: [
    {
      area: 'JWKS Caching Duration',
      divergingSignals: 'gateway.config.json specifies 3600s cache TTL, but auth.config.ts defaults to 600s.',
      confidenceScore: 0.65,
      suggestedClarification: 'Align environment TTL configurations across the API gateway and auth microservice.',
    },
  ],
  limitations: {
    staticAnalysisCaveats: [
      'Dynamic reflection: Runtime eval() or dynamic import() cannot be deterministically resolved by AST alone.',
      'Statistical co-change coupling reflects developer habits, not guaranteed hard architectural dependencies.',
    ],
    recommendedChecklist: [
      'Verify JWKS public key endpoint response time under simulated p99 load (<50ms).',
      'Execute tests/e2e/checkout.e2e.test.ts with simulated stale and invalid signatures.',
      'Publish ADR-0014 documenting fail-closed vs fail-open key rotation policy.',
    ],
    suggestedFollowUpInvestigations: [
      'Run Feature 7 Impact Analysis on auth.config.ts environment variable changes.',
      'Check Knowledge Gaps on gateway routing headers.',
    ],
  },
  confidence: {
    level: 'high',
    score: 0.96,
    reasoning: 'Grounded by static AST call graphs, explicit TypeScript import statements, and Git commit history records.',
    limitations: ['Runtime reflection cannot be statically verified.'],
  },
};

/**
 * Minimal sample report used to test that unavailable features produce no
 * empty headings or fabricated findings.
 */
export const SAMPLE_REPORT_MINIMAL: EngineeringDecisionReport = {
  id: 'rep-minimal-001',
  title: 'Targeted Code Review: config/gateway.config.json',
  generatedAt: '2026-10-15T19:00:00Z',
  repository: {
    repoId: 'repo-commerce-core',
    repoName: 'acme/commerce-core',
  },
  executiveSummary: {
    headline: 'Gateway Configuration Audit Confirms Correct Header Pass-Through Schema',
    overview: 'Focused evaluation of gateway routing definitions and auth header specifications.',
    criticalTakeaways: ['Header matching rules are valid syntax.'],
    riskAssessmentLevel: 'low',
  },
  proposedChange: {
    targetSymbolOrFile: 'config/gateway.config.json',
    changeCategory: 'config_alteration',
    questionOrDescription: 'Are gateway headers correctly mapped to authMiddleware expectations?',
  },
  findings: [
    {
      id: 'f-min-1',
      title: 'Valid JSON Configuration Schema',
      category: 'syntax_validation',
      severity: 'info',
      explanation: 'gateway.config.json adheres to schema specification with valid port and route definitions.',
      supportingEvidenceIds: ['ev-min-1'],
    },
  ],
  evidence: [
    {
      id: 'ev-min-1',
      type: 'config_reference',
      title: 'Gateway Config AST',
      filePath: 'config/gateway.config.json',
      startLine: 1,
      endLine: 25,
      confidenceScore: 1.0,
    },
  ],
  limitations: {
    staticAnalysisCaveats: ['Config values verified syntactically without live networking.'],
    recommendedChecklist: ['Verify gateway reload on SIGHUP in staging.'],
    suggestedFollowUpInvestigations: [],
  },
  confidence: {
    level: 'high',
    score: 1.0,
    reasoning: 'Verified against JSON schema validation rules.',
    limitations: [],
  },
};
