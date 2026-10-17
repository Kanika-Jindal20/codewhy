import { KnowledgeGraph, GraphNode, GraphEdge } from '@/types/graph';
import { EvidenceSource } from '@/types/evidence';

// Illustrative synthetic repository data for the demo workspace.
// These records are labelled as demo data in user-facing feature screens.

export const SAMPLE_REPO_ECOMMERCE: KnowledgeGraph = {
  repoId: 'repo-commerce-core',
  repoName: 'acme/commerce-core',
  updatedAt: '2026-10-14T18:30:00Z',
  // These records are illustrative fixtures; never present them as imported GitHub evidence.
  isDemo: true,
  nodes: [
    {
      id: 'node-auth-jwt',
      label: 'jwt.ts',
      type: 'file',
      filePath: 'src/auth/jwt.ts',
      description: 'JWT signing, verification, and HTTP-only cookie parsing',
      metadata: { language: 'typescript', loc: 142, isExported: true, tags: ['security', 'auth', 'core'] },
      evidence: [
        {
          id: 'ev-jwt-file',
          type: 'file_span',
          title: 'src/auth/jwt.ts implementation',
          filePath: 'src/auth/jwt.ts',
          startLine: 1,
          endLine: 142,
          snippet: 'export function verifySessionToken(token: string, secret: string): TokenPayload',
          confidenceScore: 1.0,
        },
        {
          id: 'ev-jwt-commit',
          type: 'commit',
          title: 'Commit 7a8f9c - Security hardening',
          commitHash: '7a8f9c2d1b',
          commitMessage: 'refactor(auth): migrate token verification to support rotated RS256 keys',
          author: 'Alex Chen <alex@acme.dev>',
          timestamp: '2026-08-12T10:15:00Z',
          confidenceScore: 0.95,
        }
      ]
    },
    {
      id: 'node-func-verify-token',
      label: 'verifySessionToken()',
      type: 'function',
      filePath: 'src/auth/jwt.ts',
      line: 34,
      description: 'Validates cryptographic signature, expiry, and audience claims',
      metadata: { signature: '(token: string, secret: string) => TokenPayload', isExported: true },
      evidence: [
        {
          id: 'ev-verify-token',
          type: 'ast_relation',
          title: 'Exported AST signature',
          filePath: 'src/auth/jwt.ts',
          startLine: 34,
          endLine: 62,
          confidenceScore: 1.0,
        }
      ]
    },
    {
      id: 'node-middleware-auth',
      label: 'authMiddleware.ts',
      type: 'file',
      filePath: 'src/middleware/authMiddleware.ts',
      description: 'HTTP request interceptor for API authentication and session hydration',
      metadata: { language: 'typescript', loc: 86, isExported: true, tags: ['middleware', 'api'] },
      evidence: [
        {
          id: 'ev-mw-file',
          type: 'file_span',
          title: 'Auth middleware',
          filePath: 'src/middleware/authMiddleware.ts',
          startLine: 1,
          endLine: 86,
          confidenceScore: 1.0,
        }
      ]
    },
    {
      id: 'node-service-payment',
      label: 'paymentService.ts',
      type: 'file',
      filePath: 'src/services/paymentService.ts',
      description: 'Stripe and PayPal checkout transactions, idempotent capture, and refunds',
      metadata: { language: 'typescript', loc: 310, isExported: true, tags: ['billing', 'critical'] },
      evidence: [
        {
          id: 'ev-payment-file',
          type: 'file_span',
          title: 'Payment service core',
          filePath: 'src/services/paymentService.ts',
          startLine: 1,
          endLine: 310,
          confidenceScore: 1.0,
        }
      ]
    },
    {
      id: 'node-controller-checkout',
      label: 'checkoutController.ts',
      type: 'file',
      filePath: 'src/controllers/checkoutController.ts',
      description: 'Handles POST /api/checkout and dispatches order confirmation events',
      metadata: { language: 'typescript', loc: 195, isExported: true },
      evidence: [
        {
          id: 'ev-checkout-ctrl',
          type: 'file_span',
          title: 'Checkout controller endpoints',
          filePath: 'src/controllers/checkoutController.ts',
          startLine: 1,
          endLine: 195,
          confidenceScore: 1.0,
        }
      ]
    },
    {
      id: 'node-service-orders',
      label: 'orderService.ts',
      type: 'file',
      filePath: 'src/services/orderService.ts',
      description: 'Order state machine, inventory reservations, and billing status',
      metadata: { language: 'typescript', loc: 240, isExported: true },
      evidence: [
        {
          id: 'ev-order-service',
          type: 'file_span',
          title: 'Order state service',
          filePath: 'src/services/orderService.ts',
          startLine: 1,
          endLine: 240,
          confidenceScore: 1.0,
        }
      ]
    },
    {
      id: 'node-test-auth',
      label: 'jwt.test.ts',
      type: 'test',
      filePath: 'tests/unit/auth/jwt.test.ts',
      description: 'Unit test suite for token signing, expiry, and tampering',
      metadata: { language: 'typescript', loc: 110, tags: ['test', 'unit'] },
      evidence: [
        {
          id: 'ev-jwt-test',
          type: 'test_coverage',
          title: 'Jest/Vitest JWT test suite',
          filePath: 'tests/unit/auth/jwt.test.ts',
          startLine: 1,
          endLine: 110,
          confidenceScore: 1.0,
        }
      ]
    },
    {
      id: 'node-test-checkout',
      label: 'checkout.e2e.test.ts',
      type: 'test',
      filePath: 'tests/e2e/checkout.e2e.test.ts',
      description: 'Full lifecycle checkout end-to-end integration test',
      metadata: { language: 'typescript', loc: 175, tags: ['test', 'e2e'] },
      evidence: [
        {
          id: 'ev-checkout-e2e',
          type: 'test_coverage',
          title: 'E2E checkout test',
          filePath: 'tests/e2e/checkout.e2e.test.ts',
          startLine: 1,
          endLine: 175,
          confidenceScore: 1.0,
        }
      ]
    },
    {
      id: 'node-config-env',
      label: 'auth.config.ts',
      type: 'config',
      filePath: 'src/config/auth.config.ts',
      description: 'Loads JWT_SECRET, TOKEN_EXPIRY_SECONDS, and AUDIENCE from environment',
      metadata: { language: 'typescript', loc: 45, tags: ['config', 'secrets'] },
      evidence: [
        {
          id: 'ev-auth-config',
          type: 'config_reference',
          title: 'Auth environment schema',
          filePath: 'src/config/auth.config.ts',
          startLine: 1,
          endLine: 45,
          confidenceScore: 1.0,
        }
      ]
    },
    {
      id: 'node-config-gateway',
      label: 'gateway.config.json',
      type: 'config',
      filePath: 'config/gateway.config.json',
      description: 'API gateway route matching and JWT header pass-through definitions',
      metadata: { language: 'json', loc: 60, tags: ['config', 'routes'] },
      evidence: [
        {
          id: 'ev-gw-config',
          type: 'config_reference',
          title: 'Gateway routing config',
          filePath: 'config/gateway.config.json',
          startLine: 1,
          endLine: 60,
          confidenceScore: 1.0,
        }
      ]
    }
  ],
  edges: [
    // jwt.ts -> verifySessionToken()
    {
      id: 'edge-jwt-contains-func',
      source: 'node-auth-jwt',
      target: 'node-func-verify-token',
      type: 'calls',
      label: 'declares & exports',
      evidence: [{
        id: 'ev-edge-jwt-func',
        type: 'ast_relation',
        title: 'Export declaration in AST',
        filePath: 'src/auth/jwt.ts',
        confidenceScore: 1.0,
      }]
    },
    // authMiddleware.ts -> jwt.ts
    {
      id: 'edge-mw-imports-jwt',
      source: 'node-middleware-auth',
      target: 'node-auth-jwt',
      type: 'imports',
      label: 'imports verifySessionToken',
      evidence: [{
        id: 'ev-edge-mw-jwt',
        type: 'ast_relation',
        title: "import { verifySessionToken } from '../auth/jwt'",
        filePath: 'src/middleware/authMiddleware.ts',
        startLine: 3,
        endLine: 3,
        confidenceScore: 1.0,
      }]
    },
    // checkoutController.ts -> authMiddleware.ts
    {
      id: 'edge-ctrl-uses-mw',
      source: 'node-controller-checkout',
      target: 'node-middleware-auth',
      type: 'calls',
      label: 'routes through authMiddleware',
      evidence: [{
        id: 'ev-edge-ctrl-mw',
        type: 'ast_relation',
        title: "router.use('/checkout', authMiddleware)",
        filePath: 'src/controllers/checkoutController.ts',
        startLine: 24,
        endLine: 24,
        confidenceScore: 1.0,
      }]
    },
    // checkoutController.ts -> paymentService.ts
    {
      id: 'edge-ctrl-imports-payment',
      source: 'node-controller-checkout',
      target: 'node-service-payment',
      type: 'calls',
      label: 'calls processPaymentTransaction()',
      evidence: [{
        id: 'ev-edge-ctrl-payment',
        type: 'ast_relation',
        title: 'paymentService.processPaymentTransaction(req.body)',
        filePath: 'src/controllers/checkoutController.ts',
        startLine: 68,
        endLine: 68,
        confidenceScore: 1.0,
      }]
    },
    // paymentService.ts -> orderService.ts
    {
      id: 'edge-payment-updates-order',
      source: 'node-service-payment',
      target: 'node-service-orders',
      type: 'calls',
      label: 'calls updateOrderStatus()',
      evidence: [{
        id: 'ev-edge-pay-order',
        type: 'ast_relation',
        title: 'orderService.updateOrderStatus(orderId, "PAID")',
        filePath: 'src/services/paymentService.ts',
        startLine: 112,
        endLine: 112,
        confidenceScore: 1.0,
      }]
    },
    // jwt.test.ts -> jwt.ts
    {
      id: 'edge-test-tests-jwt',
      source: 'node-test-auth',
      target: 'node-auth-jwt',
      type: 'tests',
      label: 'unit tests jwt.ts',
      evidence: [{
        id: 'ev-edge-test-jwt',
        type: 'test_coverage',
        title: 'describe("JWT Verification")',
        filePath: 'tests/unit/auth/jwt.test.ts',
        startLine: 5,
        endLine: 5,
        confidenceScore: 1.0,
      }]
    },
    // checkout.e2e.test.ts -> checkoutController.ts
    {
      id: 'edge-e2e-tests-checkout',
      source: 'node-test-checkout',
      target: 'node-controller-checkout',
      type: 'tests',
      label: 'e2e tests /api/checkout',
      evidence: [{
        id: 'ev-edge-e2e-checkout',
        type: 'test_coverage',
        title: 'request(app).post("/api/checkout")',
        filePath: 'tests/e2e/checkout.e2e.test.ts',
        startLine: 28,
        endLine: 28,
        confidenceScore: 1.0,
      }]
    },
    // jwt.ts -> auth.config.ts
    {
      id: 'edge-jwt-uses-config',
      source: 'node-auth-jwt',
      target: 'node-config-env',
      type: 'configures',
      label: 'reads JWT_SECRET from auth.config.ts',
      evidence: [{
        id: 'ev-edge-jwt-cfg',
        type: 'ast_relation',
        title: "import { authConfig } from '../config/auth.config'",
        filePath: 'src/auth/jwt.ts',
        startLine: 5,
        endLine: 5,
        confidenceScore: 1.0,
      }]
    },
    // authMiddleware.ts -> gateway.config.json
    {
      id: 'edge-mw-uses-gw-config',
      source: 'node-middleware-auth',
      target: 'node-config-gateway',
      type: 'configures',
      label: 'references gateway auth headers',
      evidence: [{
        id: 'ev-edge-mw-gw',
        type: 'config_reference',
        title: 'gateway.config.json header specification',
        filePath: 'config/gateway.config.json',
        startLine: 12,
        endLine: 14,
        confidenceScore: 0.95,
      }]
    }
  ]
};

// Registered repositories store
const repositories: Map<string, KnowledgeGraph> = new Map([
  [SAMPLE_REPO_ECOMMERCE.repoId, SAMPLE_REPO_ECOMMERCE]
]);

export function getRepositoryGraph(repoId: string): KnowledgeGraph | undefined {
  return repositories.get(repoId);
}

export function getAllRepositories(): { repoId: string; repoName: string; updatedAt: string; nodeCount: number }[] {
  return Array.from(repositories.values()).map(r => ({
    repoId: r.repoId,
    repoName: r.repoName,
    updatedAt: r.updatedAt,
    nodeCount: r.nodes.length,
  }));
}

export function registerRepositoryGraph(graph: KnowledgeGraph): void {
  repositories.set(graph.repoId, graph);
}
