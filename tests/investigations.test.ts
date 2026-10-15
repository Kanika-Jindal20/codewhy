import { describe, it, expect, beforeEach } from 'vitest';
import {
  investigationStore,
  CURRENT_USER_ID,
  CURRENT_USER_NAME,
} from '@/lib/investigations/investigation-store';
import { detectEvidenceStaleness } from '@/lib/investigations/staleness-detector';
import {
  generateFollowUpSuggestions,
  answerFollowUpQuestion,
} from '@/lib/investigations/follow-up-engine';
import {
  GET as listGet,
  POST as createPost,
} from '@/app/api/investigations/route';
import {
  GET as singleGet,
  PATCH as singlePatch,
  DELETE as singleDelete,
} from '@/app/api/investigations/[id]/route';
import { POST as followUpPost } from '@/app/api/investigations/[id]/follow-up/route';
import { NextRequest } from 'next/server';

describe('Feature 13 — Investigation Memory and Follow-up Questions', () => {
  beforeEach(() => {
    investigationStore.resetToDefault();
  });

  describe('Investigation Store & Context Restoration', () => {
    it('lists accessible investigations for the current user', () => {
      const list = investigationStore.list(CURRENT_USER_ID);
      expect(list.length).toBeGreaterThanOrEqual(3);
      expect(list.some(i => i.id === 'inv-jwt-01')).toBe(true);
    });

    it('filters investigations by status and search keywords', () => {
      const activeOnly = investigationStore.list(CURRENT_USER_ID, { status: 'active' });
      for (const inv of activeOnly) {
        expect(inv.status).toBe('active');
      }

      const archivedOnly = investigationStore.list(CURRENT_USER_ID, { status: 'archived' });
      for (const inv of archivedOnly) {
        expect(inv.status).toBe('archived');
      }

      const searchResults = investigationStore.list(CURRENT_USER_ID, { search: 'RS256' });
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults[0].title).toContain('RS256');
    });

    it('creates and restores full investigation context on reopen', () => {
      const created = investigationStore.create(
        {
          title: 'Gateway Header Contract Review',
          repoId: 'repo-commerce-core',
          repoName: 'acme/commerce-core',
          originalQuestion: 'Does gateway.config.json pass the correct Authorization headers?',
          initialAnswerSummary: 'Gateway matches /api routes and proxies Bearer token headers.',
          detailedFindings: ['Header matching verified in gateway.config.json line 12.'],
          evidence: [
            {
              id: 'ev-test-gw',
              type: 'config_reference',
              title: 'Gateway Config',
              filePath: 'config/gateway.config.json',
              startLine: 1,
              endLine: 20,
              confidenceScore: 1.0,
            },
          ],
        },
        CURRENT_USER_ID,
        CURRENT_USER_NAME
      );

      expect(created.id).toBeDefined();

      // Restore
      const restored = investigationStore.getById(created.id, CURRENT_USER_ID);
      expect(restored).not.toBeNull();
      expect(restored?.title).toBe('Gateway Header Contract Review');
      expect(restored?.originalQuestion).toBe('Does gateway.config.json pass the correct Authorization headers?');
      expect(restored?.entries).toHaveLength(1);
      expect(restored?.entries[0].answerSummary).toContain('Gateway matches /api routes');
      expect(restored?.entries[0].evidence).toHaveLength(1);
    });

    it('renames, archives, and deletes investigations', () => {
      const inv = investigationStore.create(
        {
          title: 'Temporary Investigation',
          repoId: 'repo-commerce-core',
          originalQuestion: 'Will this be deleted?',
          initialAnswerSummary: 'Yes, this is a test.',
        },
        CURRENT_USER_ID,
        CURRENT_USER_NAME
      );

      // Rename
      const renamed = investigationStore.update(inv.id, { title: 'Renamed Investigation' }, CURRENT_USER_ID);
      expect(renamed.title).toBe('Renamed Investigation');

      // Archive
      const archived = investigationStore.update(inv.id, { status: 'archived' }, CURRENT_USER_ID);
      expect(archived.status).toBe('archived');

      // Delete
      const deleted = investigationStore.delete(inv.id, CURRENT_USER_ID);
      expect(deleted).toBe(true);

      expect(investigationStore.getById(inv.id, CURRENT_USER_ID)).toBeNull();
    });
  });

  describe('Stale Evidence Detection', () => {
    it('detects when referenced commits were superseded by subsequent commits on the same file', () => {
      const inv = investigationStore.getById('inv-jwt-01', CURRENT_USER_ID);
      expect(inv).not.toBeNull();

      const staleness = detectEvidenceStaleness(inv!);
      // inv-jwt-01 references commit 7a8f9c2d1b on src/auth/jwt.ts,
      // which was superseded by commit 8f4c21a ("fix(auth): prevent token replay in Redis")
      expect(staleness.isStale).toBe(true);
      expect(staleness.staleEvidenceIds.length).toBeGreaterThan(0);
      expect(staleness.reason).toContain('superseded');
    });

    it('returns isStale: false for up-to-date investigations without superseded commits', () => {
      const freshInv = investigationStore.create(
        {
          title: 'Fresh Test Audit',
          repoId: 'repo-commerce-core',
          originalQuestion: 'Is this fresh?',
          initialAnswerSummary: 'Yes, references current files.',
          evidence: [
            {
              id: 'ev-fresh-1',
              type: 'file_span',
              title: 'Current jwt file',
              filePath: 'src/auth/jwt.ts',
              startLine: 1,
              endLine: 20,
              confidenceScore: 1.0,
            },
          ],
        },
        CURRENT_USER_ID,
        CURRENT_USER_NAME
      );

      const staleness = detectEvidenceStaleness(freshInv);
      expect(staleness.isStale).toBe(false);
      expect(staleness.staleEvidenceIds).toHaveLength(0);
    });
  });

  describe('Follow-up Question Generation & Answering', () => {
    it('generates specific next questions based on existing investigation context', () => {
      const inv = investigationStore.getById('inv-jwt-01', CURRENT_USER_ID)!;
      const suggestions = generateFollowUpSuggestions(inv);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.category === 'tests')).toBe(true);
      expect(suggestions.some(s => s.category === 'dependents')).toBe(true);
    });

    it('computes grounded answers and evidence when asking a follow-up inquiry', () => {
      const inv = investigationStore.getById('inv-jwt-01', CURRENT_USER_ID)!;
      const followUp = answerFollowUpQuestion(inv, 'Which tests cover the affected module?');

      expect(followUp.answerSummary).toContain('jwt.test.ts');
      expect(followUp.detailedFindings[0]).toContain('tests/unit/auth/jwt.test.ts');
      expect(followUp.detailedFindings.length).toBeGreaterThan(0);
      expect(followUp.evidence.length).toBeGreaterThan(0);
    });

    it('appends follow-up entries to the investigation thread in chronological order', () => {
      const updated = investigationStore.appendFollowUp(
        'inv-jwt-01',
        { question: 'Which other components call verifySessionToken()?' },
        CURRENT_USER_ID,
        CURRENT_USER_NAME
      );

      expect(updated.entries.length).toBe(2);
      expect(updated.entries[1].question).toBe('Which other components call verifySessionToken()?');
      expect(updated.entries[1].answerSummary).toContain('authMiddleware.ts');
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(updated.entries[0].timestamp).getTime()
      );
    });
  });

  describe('Ownership & Access Control Boundaries', () => {
    it('prevents unauthorized users from reading private investigations', () => {
      // inv-private-other is owned by user-alice-other
      expect(() => {
        investigationStore.getById('inv-private-other', CURRENT_USER_ID);
      }).toThrow(/Forbidden/);
    });

    it('allows the owner to read their own private investigation', () => {
      const inv = investigationStore.getById('inv-private-other', 'user-alice-other');
      expect(inv).not.toBeNull();
      expect(inv?.title).toContain('Confidential');
    });

    it('prevents non-owners from modifying another user private investigation', () => {
      expect(() => {
        investigationStore.update('inv-private-other', { title: 'Hacked Title' }, CURRENT_USER_ID);
      }).toThrow(/Forbidden/);
    });

    it('prevents non-owners from deleting another user private investigation', () => {
      expect(() => {
        investigationStore.delete('inv-private-other', CURRENT_USER_ID);
      }).toThrow(/Forbidden/);
    });
  });

  describe('API Routes', () => {
    it('GET /api/investigations returns accessible investigations list', async () => {
      const req = new NextRequest('http://localhost:3000/api/investigations');
      const res = await listGet(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.investigations).toBeDefined();
      expect(json.investigations.length).toBeGreaterThanOrEqual(3);
    });

    it('POST /api/investigations validates input and creates investigation', async () => {
      // Missing fields
      const invalidReq = new NextRequest('http://localhost:3000/api/investigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Missing question' }),
      });
      const invalidRes = await createPost(invalidReq);
      expect(invalidRes.status).toBe(400);

      // Valid
      const validReq = new NextRequest('http://localhost:3000/api/investigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'API Created Audit',
          repoId: 'repo-commerce-core',
          originalQuestion: 'How does payment webhook validation work?',
          initialAnswerSummary: 'Validates HMAC signature on Stripe payloads.',
        }),
      });
      const validRes = await createPost(validReq);
      expect(validRes.status).toBe(201);
      const created = await validRes.json();
      expect(created.title).toBe('API Created Audit');
    });

    it('GET /api/investigations/[id] returns investigation and suggestions; 403 on private unauthorized', async () => {
      // Authorized
      const req = new NextRequest('http://localhost:3000/api/investigations/inv-jwt-01');
      const res = await singleGet(req, { params: Promise.resolve({ id: 'inv-jwt-01' }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.investigation.id).toBe('inv-jwt-01');
      expect(json.suggestions).toBeDefined();

      // Unauthorized private
      const unauthReq = new NextRequest('http://localhost:3000/api/investigations/inv-private-other');
      const unauthRes = await singleGet(unauthReq, { params: Promise.resolve({ id: 'inv-private-other' }) });
      expect(unauthRes.status).toBe(403);
    });

    it('POST /api/investigations/[id]/follow-up appends inquiry', async () => {
      const req = new NextRequest('http://localhost:3000/api/investigations/inv-jwt-01/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'Which tests cover the affected module?' }),
      });

      const res = await followUpPost(req, { params: Promise.resolve({ id: 'inv-jwt-01' }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.investigation.entries.length).toBe(2);
      expect(json.suggestions.length).toBeGreaterThan(0);
    });

    it('PATCH and DELETE /api/investigations/[id] update and delete records', async () => {
      const patchReq = new NextRequest('http://localhost:3000/api/investigations/inv-jwt-01', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Renamed Title' }),
      });
      const patchRes = await singlePatch(patchReq, { params: Promise.resolve({ id: 'inv-jwt-01' }) });
      expect(patchRes.status).toBe(200);
      const updated = await patchRes.json();
      expect(updated.title).toBe('New Renamed Title');

      const delReq = new NextRequest('http://localhost:3000/api/investigations/inv-jwt-01', {
        method: 'DELETE',
      });
      const delRes = await singleDelete(delReq, { params: Promise.resolve({ id: 'inv-jwt-01' }) });
      expect(delRes.status).toBe(200);
    });
  });
});
