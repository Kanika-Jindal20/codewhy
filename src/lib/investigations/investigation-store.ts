import {
  Investigation,
  CreateInvestigationInput,
  UpdateInvestigationInput,
  InvestigationFilterParams,
  SubmitFollowUpInput,
} from '@/types/investigation';
import { SAMPLE_REPO_ECOMMERCE } from '@/lib/graph/graph-store';
import { detectEvidenceStaleness } from './staleness-detector';
import { answerFollowUpQuestion } from './follow-up-engine';
import { readDataFile, writeDataFile } from '@/lib/storage/json-store';

export const CURRENT_USER_ID = 'user-dev-current';
export const CURRENT_USER_NAME = 'Current Developer';

// Pre-seeded real-world engineering investigations
const INITIAL_INVESTIGATIONS: Investigation[] = [
  {
    id: 'inv-jwt-01',
    title: 'RS256 Token Verification Migration & Gateway Interception',
    repoId: 'repo-commerce-core',
    repoName: 'acme/commerce-core',
    ownerId: CURRENT_USER_ID,
    ownerName: CURRENT_USER_NAME,
    visibility: 'team',
    status: 'active',
    createdAt: '2026-10-10T09:00:00Z',
    updatedAt: '2026-10-14T18:30:00Z',
    originalQuestion: 'What are the architectural dependencies and potential breakages if verifySessionToken() is updated to support rotated RS256 keys?',
    sourceContext: {
      type: 'impact_analysis',
      targetId: 'node-auth-jwt',
      targetPath: 'src/auth/jwt.ts',
      reportId: 'rep-jwt-rotation-2026',
    },
    entries: [
      {
        id: 'entry-jwt-1',
        question: 'What are the architectural dependencies and potential breakages if verifySessionToken() is updated to support rotated RS256 keys?',
        answerSummary: 'verifySessionToken() is directly imported by authMiddleware.ts and transitively protects checkoutController.ts. Changing its signature from synchronous to asynchronous Promise return impacts Express middleware hydration.',
        detailedFindings: [
          'Direct dependent: src/middleware/authMiddleware.ts invokes verifySessionToken() on every authenticated request.',
          'Downstream impact: checkoutController.ts relies on session claims populated by authMiddleware.',
          'Historical regression: Commit 7a8f9c introduced RS256 support, which was later hotfixed in commit 8f4c21a.',
        ],
        evidence: [
          {
            id: 'ev-store-jwt-impl',
            type: 'file_span',
            title: 'verifySessionToken implementation',
            filePath: 'src/auth/jwt.ts',
            startLine: 34,
            endLine: 62,
            confidenceScore: 1.0,
            snippet: 'export function verifySessionToken(token: string, secret: string): TokenPayload',
          },
          {
            id: 'ev-store-jwt-commit',
            type: 'commit',
            title: 'Commit 7a8f9c - Security hardening',
            filePath: 'src/auth/jwt.ts',
            commitHash: '7a8f9c2d1b',
            author: 'Alex Chen <alex@acme.dev>',
            timestamp: '2026-08-12T10:15:00Z',
            confidenceScore: 0.95,
          },
        ],
        timestamp: '2026-10-10T09:05:00Z',
        author: CURRENT_USER_NAME,
      },
    ],
    tags: ['security', 'auth', 'jwt', 'breaking_change'],
    relatedLinks: [
      { type: 'impact', label: 'View Pre-Change Impact Analysis', href: '/impact?targetNodeId=node-auth-jwt' },
      { type: 'architecture', label: 'Inspect in Architecture Graph', href: '/architecture?nodeId=node-auth-jwt' },
      { type: 'report', label: 'Download Decision Report (PDF)', href: '/api/reports/pdf?sample=commerce-jwt' },
    ],
  },
  {
    id: 'inv-payment-02',
    title: 'Order State Machine Race Conditions in Payment Service',
    repoId: 'repo-commerce-core',
    repoName: 'acme/commerce-core',
    ownerId: CURRENT_USER_ID,
    ownerName: CURRENT_USER_NAME,
    visibility: 'team',
    status: 'active',
    createdAt: '2026-10-12T14:15:00Z',
    updatedAt: '2026-10-12T16:45:00Z',
    originalQuestion: 'How does paymentService.processPaymentTransaction() synchronize order statuses with orderService.ts during concurrent checkouts?',
    sourceContext: {
      type: 'architecture_node',
      targetId: 'node-service-payment',
      targetPath: 'src/services/paymentService.ts',
    },
    entries: [
      {
        id: 'entry-pay-1',
        question: 'How does paymentService.processPaymentTransaction() synchronize order statuses with orderService.ts during concurrent checkouts?',
        answerSummary: 'paymentService executes an RPC call to orderService.updateOrderStatus(orderId, "PAID") after Stripe webhook confirmation. Idempotency keys are checked to prevent duplicate captures.',
        detailedFindings: [
          'State transition happens in paymentService.ts:112 synchronously after capture.',
          'Missing database transaction wrapper could allow inventory deduction without payment capture in network partition scenarios.',
        ],
        evidence: [
          {
            id: 'ev-store-pay-impl',
            type: 'file_span',
            title: 'Payment service core implementation',
            filePath: 'src/services/paymentService.ts',
            startLine: 1,
            endLine: 310,
            confidenceScore: 1.0,
          },
        ],
        timestamp: '2026-10-12T14:20:00Z',
        author: CURRENT_USER_NAME,
      },
    ],
    tags: ['billing', 'orders', 'payments'],
    relatedLinks: [
      { type: 'architecture', label: 'Inspect paymentService in Graph', href: '/architecture?nodeId=node-service-payment' },
    ],
  },
  {
    id: 'inv-legacy-03',
    title: 'Historical HS256 Monolith Deprecation Audit',
    repoId: 'repo-commerce-core',
    repoName: 'acme/commerce-core',
    ownerId: CURRENT_USER_ID,
    ownerName: CURRENT_USER_NAME,
    visibility: 'team',
    status: 'archived',
    createdAt: '2026-07-01T11:00:00Z',
    updatedAt: '2026-07-05T17:00:00Z',
    originalQuestion: 'What legacy microservices still transmit HS256 shared secret bearer tokens?',
    sourceContext: {
      type: 'knowledge_gap',
      targetPath: 'config/gateway.config.json',
    },
    entries: [
      {
        id: 'entry-leg-1',
        question: 'What legacy microservices still transmit HS256 shared secret bearer tokens?',
        answerSummary: 'All internal gateway routes were successfully migrated to RS256 as of commit 7a8f9c. HS256 secret deprecation is complete.',
        detailedFindings: ['Gateway configuration config/gateway.config.json no longer references HS256 verification keys.'],
        evidence: [],
        timestamp: '2026-07-01T11:10:00Z',
        author: CURRENT_USER_NAME,
      },
    ],
    tags: ['legacy', 'deprecated', 'audit'],
    relatedLinks: [],
  },
  // Private investigation owned by another user for authorization tests
  {
    id: 'inv-private-other',
    title: 'Confidential Infrastructure Secret Audit',
    repoId: 'repo-commerce-core',
    repoName: 'acme/commerce-core',
    ownerId: 'user-alice-other',
    ownerName: 'Alice Engineer',
    visibility: 'private',
    status: 'active',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:00:00Z',
    originalQuestion: 'Are database credentials stored in any config files?',
    entries: [
      {
        id: 'entry-priv-1',
        question: 'Are database credentials stored in any config files?',
        answerSummary: 'No secrets detected; all credentials pulled from vault.',
        evidence: [],
        timestamp: '2026-10-01T08:05:00Z',
        author: 'Alice Engineer',
      },
    ],
    tags: ['confidential', 'security'],
    relatedLinks: [],
  },
];

// In-memory store initialized with deep copy of sample data
class InvestigationRepository {
  private investigations: Map<string, Investigation>;

  constructor() {
    this.investigations = new Map();
    for (const inv of INITIAL_INVESTIGATIONS) {
      this.investigations.set(inv.id, JSON.parse(JSON.stringify(inv)));
    }
  }

  public persist(): void {
    writeDataFile('investigations.json', Array.from(this.investigations.values()));
  }

  public resetToDefault(): void {
    this.investigations.clear();
    for (const inv of INITIAL_INVESTIGATIONS) {
      this.investigations.set(inv.id, JSON.parse(JSON.stringify(inv)));
    }
    this.persist();
  }

  // Check read access: Public and Team are readable by all; Private is readable ONLY by owner
  private checkReadAccess(inv: Investigation, requesterId: string): boolean {
    if (inv.visibility === 'public' || inv.visibility === 'team') return true;
    return inv.ownerId === requesterId;
  }

  // Check write access: Only owner can modify/delete
  private checkWriteAccess(inv: Investigation, requesterId: string): boolean {
    return inv.ownerId === requesterId;
  }

  public list(requesterId: string, params: InvestigationFilterParams = {}): Investigation[] {
    const list = Array.from(this.investigations.values());

    return list
      .filter(inv => this.checkReadAccess(inv, requesterId))
      .filter(inv => {
        if (params.status && params.status !== 'all' && inv.status !== params.status) return false;
        if (params.repoId && inv.repoId !== params.repoId) return false;
        if (params.tag && !inv.tags.includes(params.tag)) return false;

        if (params.search) {
          const s = params.search.toLowerCase();
          const matchTitle = inv.title.toLowerCase().includes(s);
          const matchQ = inv.originalQuestion.toLowerCase().includes(s);
          const matchEntries = inv.entries.some(
            e => e.question.toLowerCase().includes(s) || e.answerSummary.toLowerCase().includes(s)
          );
          if (!matchTitle && !matchQ && !matchEntries) return false;
        }

        return true;
      })
      .map(inv => {
        // Compute staleness status
        const staleness = detectEvidenceStaleness(inv);
        return { ...inv, staleEvidenceStatus: staleness };
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getById(id: string, requesterId: string): Investigation | null {
    const inv = this.investigations.get(id);
    if (!inv) return null;

    if (!this.checkReadAccess(inv, requesterId)) {
      throw new Error('Forbidden: You do not have access to this private investigation.');
    }

    const staleness = detectEvidenceStaleness(inv);
    return { ...inv, staleEvidenceStatus: staleness };
  }

  public create(input: CreateInvestigationInput, requesterId: string, requesterName: string): Investigation {
    const now = new Date().toISOString();
    const id = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const newEntry = {
      id: `entry-${Date.now()}-1`,
      question: input.originalQuestion,
      answerSummary: input.initialAnswerSummary,
      detailedFindings: input.detailedFindings || [],
      evidence: input.evidence || [],
      timestamp: now,
      author: requesterName,
    };

    const newInv: Investigation = {
      id,
      title: input.title.trim() || 'Untitled Investigation',
      repoId: input.repoId,
      repoName: input.repoName || input.repoId,
      ownerId: requesterId,
      ownerName: requesterName,
      visibility: input.visibility || 'team',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      originalQuestion: input.originalQuestion,
      sourceContext: input.sourceContext,
      entries: [newEntry],
      tags: input.tags || ['investigation'],
      relatedLinks: [],
    };

    if (input.sourceContext?.type === 'impact_analysis' && input.sourceContext.targetId) {
      newInv.relatedLinks.push({
        type: 'impact',
        label: 'View Pre-Change Impact Analysis',
        href: `/impact?targetNodeId=${input.sourceContext.targetId}`,
      });
    }

    this.investigations.set(id, newInv);
    this.persist();
    return newInv;
  }

  public update(id: string, input: UpdateInvestigationInput, requesterId: string): Investigation {
    const inv = this.investigations.get(id);
    if (!inv) throw new Error(`Investigation '${id}' not found.`);

    if (!this.checkWriteAccess(inv, requesterId)) {
      throw new Error('Forbidden: Only the owner can modify this investigation.');
    }

    if (input.title !== undefined) inv.title = input.title.trim();
    if (input.status !== undefined) inv.status = input.status;
    if (input.visibility !== undefined) inv.visibility = input.visibility;
    if (input.tags !== undefined) inv.tags = input.tags;

    inv.updatedAt = new Date().toISOString();
    this.persist();
    return inv;
  }

  public delete(id: string, requesterId: string): boolean {
    const inv = this.investigations.get(id);
    if (!inv) return false;

    if (!this.checkWriteAccess(inv, requesterId)) {
      throw new Error('Forbidden: Only the owner can delete this investigation.');
    }

    const deleted = this.investigations.delete(id);
    if (deleted) this.persist();
    return deleted;
  }

  public appendFollowUp(
    id: string,
    input: SubmitFollowUpInput,
    requesterId: string,
    requesterName: string
  ): Investigation {
    const inv = this.investigations.get(id);
    if (!inv) throw new Error(`Investigation '${id}' not found.`);

    if (!this.checkReadAccess(inv, requesterId)) {
      throw new Error('Forbidden: Access denied to this private investigation.');
    }

    // Compute grounded answer using the repository knowledge graph
    const { answerSummary, detailedFindings, evidence } = answerFollowUpQuestion(
      inv,
      input.question
    );

    const now = new Date().toISOString();
    const entry = {
      id: `entry-${Date.now()}-${inv.entries.length + 1}`,
      question: input.question.trim(),
      answerSummary,
      detailedFindings,
      evidence,
      timestamp: now,
      author: requesterName,
    };

    inv.entries.push(entry);
    this.persist();
    inv.updatedAt = now;

    return { ...inv, staleEvidenceStatus: detectEvidenceStaleness(inv) };
  }
}

// Global singleton instance
export const investigationStore = new InvestigationRepository();
