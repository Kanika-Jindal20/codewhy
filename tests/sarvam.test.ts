import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isSarvamConfigured,
  getSarvamModel,
  getSarvamEndpoint,
  querySarvamAI,
} from '@/lib/sarvam/sarvam-client';
import { EvidenceSource } from '@/types/evidence';

describe('Sarvam AI Client Configuration & Validation', () => {
  const origEnv = process.env;

  beforeEach(() => {
    process.env = { ...origEnv };
  });

  afterEach(() => {
    process.env = origEnv;
    vi.restoreAllMocks();
  });

  it('should detect when SARVAM_API_KEY is not configured', () => {
    delete process.env.SARVAM_API_KEY;
    expect(isSarvamConfigured()).toBe(false);
  });

  it('should detect when SARVAM_API_KEY is properly set', () => {
    process.env.SARVAM_API_KEY = 'sarvam_test_token_12345';
    expect(isSarvamConfigured()).toBe(true);
  });

  it('should provide default model sarvam-105b if not customized', () => {
    delete process.env.SARVAM_MODEL;
    expect(getSarvamModel()).toBe('sarvam-105b');
  });

  it('should respect custom SARVAM_MODEL override if provided', () => {
    process.env.SARVAM_MODEL = 'sarvam-2b';
    expect(getSarvamModel()).toBe('sarvam-2b');
  });

  it('should return unconfigured error when attempting to query without API key', async () => {
    delete process.env.SARVAM_API_KEY;

    const sampleEvidence: EvidenceSource[] = [
      {
        id: 'ev-1',
        type: 'file_span',
        title: 'Auth middleware',
        filePath: 'src/middleware/auth.ts',
        startLine: 10,
        endLine: 25,
        snippet: 'export function auth() {}',
        confidenceScore: 0.95,
      },
    ];

    const result = await querySarvamAI({
      question: 'Why is authentication checked on line 10?',
      questionKind: 'why',
      evidence: sampleEvidence,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Sarvam API key is not configured');
    expect(result.model).toBe('sarvam-105b');
  });

  it('should call official Sarvam endpoint with correct auth headers and parse structured JSON', async () => {
    process.env.SARVAM_API_KEY = 'test_sarvam_secret_key';

    const mockResponsePayload = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              answer: 'Authentication is enforced before route handlers to prevent unauthorized data access.',
              reasoning_summary: 'AST evidence shows token verification guard executes before handler dispatch.',
              evidence: [
                {
                  filePath: 'src/middleware/auth.ts',
                  symbolOrLabel: 'auth',
                  citationText: 'Token verification takes place at lines 10-25',
                },
              ],
              affected_components: ['src/middleware/auth.ts'],
              limitations: 'Audit logs do not capture IP addresses for anonymous requests.',
              suggested_next_steps: ['Verify token expiry handling', 'Inspect rate limiters'],
            }),
          },
        },
      ],
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponsePayload,
    } as any);

    const sampleEvidence: EvidenceSource[] = [
      {
        id: 'ev-auth',
        type: 'file_span',
        title: 'Auth Guard',
        filePath: 'src/middleware/auth.ts',
        startLine: 10,
        endLine: 25,
        snippet: 'export function auth() { verify(); }',
        confidenceScore: 1.0,
      },
    ];

    const res = await querySarvamAI({
      question: 'Why does auth guard run first?',
      questionKind: 'why',
      evidence: sampleEvidence,
      repoName: 'test-app',
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [callUrl, callOptions] = fetchSpy.mock.calls[0];

    expect(callUrl).toBe('https://api.sarvam.ai/v1/chat/completions');
    expect((callOptions as any).headers['api-subscription-key']).toBe('test_sarvam_secret_key');
    expect((callOptions as any).headers['Authorization']).toBe('Bearer test_sarvam_secret_key');

    expect(res.success).toBe(true);
    expect(res.structuredResponse).toBeDefined();
    expect(res.structuredResponse?.answer).toContain('Authentication is enforced before route handlers');
    expect(res.structuredResponse?.evidence[0].filePath).toBe('src/middleware/auth.ts');
    expect(res.structuredResponse?.affected_components).toEqual(['src/middleware/auth.ts']);
  });

  it('should handle markdown code fences in Sarvam JSON output gracefully', async () => {
    process.env.SARVAM_API_KEY = 'test_sarvam_secret_key';

    const rawJson = JSON.stringify({
      answer: 'Extracted successfully from markdown fence.',
      reasoning_summary: 'Cleaned parse.',
      evidence: [],
      affected_components: [],
      limitations: 'None',
      suggested_next_steps: [],
    });

    const mockResponsePayload = {
      choices: [
        {
          message: {
            content: `\`\`\`json\n${rawJson}\n\`\`\``,
          },
        },
      ],
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponsePayload,
    } as any);

    const res = await querySarvamAI({
      question: 'Testing fence cleanup',
      questionKind: 'why',
      evidence: [],
    });

    expect(res.success).toBe(true);
    expect(res.structuredResponse?.answer).toBe('Extracted successfully from markdown fence.');
  });
});
