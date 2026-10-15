import { describe, it, expect } from 'vitest';
import { ReportPdfBuilder } from '@/lib/reports/pdf-builder';
import {
  SAMPLE_REPORT_JWT_REFACTOR,
  SAMPLE_REPORT_MINIMAL,
} from '@/lib/reports/sample-report-data';
import { EngineeringDecisionReport } from '@/types/report';
import { POST, GET } from '@/app/api/reports/pdf/route';
import { NextRequest } from 'next/server';

function isPdfBuffer(buffer: Uint8Array): boolean {
  if (buffer.length < 10) return false;
  // Check %PDF magic header
  const header = String.fromCharCode(...buffer.slice(0, 5));
  return header.startsWith('%PDF-');
}

describe('Feature 12 — Engineering Decision Report PDF Export', () => {
  describe('PDF Generation Engine (ReportPdfBuilder)', () => {
    it('generates a valid, non-empty PDF document from sample report', () => {
      const builder = new ReportPdfBuilder(SAMPLE_REPORT_JWT_REFACTOR);
      const pdfBytes = builder.generate();

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(5000);
      expect(isPdfBuffer(pdfBytes)).toBe(true);
    });

    it('generates a clean PDF for minimal reports without crashing or fabricating fields', () => {
      const builder = new ReportPdfBuilder(SAMPLE_REPORT_MINIMAL);
      const pdfBytes = builder.generate();

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(2000);
      expect(isPdfBuffer(pdfBytes)).toBe(true);
    });

    it('respects custom document title override', () => {
      const customTitle = 'Custom Audit Title: Q4 Security Certification';
      const builder = new ReportPdfBuilder(SAMPLE_REPORT_JWT_REFACTOR, {
        customTitle,
      });
      const pdfBytes = builder.generate();

      expect(pdfBytes.length).toBeGreaterThan(5000);
      expect(isPdfBuffer(pdfBytes)).toBe(true);
    });

    it('supports selective section inclusion and exclusion', () => {
      // Generate full report
      const fullBuilder = new ReportPdfBuilder(SAMPLE_REPORT_JWT_REFACTOR);
      const fullBytes = fullBuilder.generate();

      // Generate report with major sections disabled
      const partialBuilder = new ReportPdfBuilder(SAMPLE_REPORT_JWT_REFACTOR, {
        sections: {
          includeImpactAnalysis: false,
          includeDecisionTimeline: false,
          includeKnowledgeGaps: false,
          includeEvidenceReferences: false,
        },
      });
      const partialBytes = partialBuilder.generate();

      expect(partialBytes.length).toBeGreaterThan(1000);
      expect(partialBytes.length).toBeLessThan(fullBytes.length);
    });

    it('handles long content, deep evidence lists, and multi-page tables without layout overflow', () => {
      // Construct a high-density, stressful report
      const longReport: EngineeringDecisionReport = {
        ...SAMPLE_REPORT_JWT_REFACTOR,
        title: 'Massive Monorepo Migration Audit with Deep Transitive Blasts and Extreme Stress Content',
        findings: Array.from({ length: 40 }).map((_, i) => ({
          id: `f-stress-${i}`,
          title: `Finding #${i + 1}: Asynchronous contract shift across downstream subsystem cluster`,
          category: 'interface_coupling',
          severity: (i % 4 === 0 ? 'critical' : i % 3 === 0 ? 'high' : 'medium') as any,
          explanation: `Detailed explanation for stress finding #${i + 1}. `.repeat(8),
          supportingEvidenceIds: [`ev-${i}`],
        })),
        evidence: Array.from({ length: 60 }).map((_, i) => ({
          id: `ev-stress-${i}`,
          type: 'file_span',
          title: `Evidence Artifact Reference #${i + 1} for Microservice AST Node`,
          filePath: `src/packages/subsystem-${i % 5}/services/controller-${i}.ts`,
          startLine: i * 10 + 1,
          endLine: i * 10 + 25,
          confidenceScore: 0.95,
          url: `https://github.com/acme/commerce-core/blob/main/src/packages/subsystem-${i % 5}/services/controller-${i}.ts#L${i * 10 + 1}`,
        })),
        limitations: {
          staticAnalysisCaveats: Array.from({ length: 15 }).map(
            (_, i) => `Methodological limitation #${i + 1}: Reflection cannot resolve dynamic eval() payloads.`
          ),
          recommendedChecklist: Array.from({ length: 20 }).map(
            (_, i) => `Verification item #${i + 1}: Run integration test suite against staging cluster.`
          ),
          suggestedFollowUpInvestigations: ['Re-run scan on main branch post-merge.'],
        },
      };

      const builder = new ReportPdfBuilder(longReport);
      const pdfBytes = builder.generate();

      expect(pdfBytes.length).toBeGreaterThan(25000);
      expect(isPdfBuffer(pdfBytes)).toBe(true);
    });

    it('preserves clickable source URLs and repository links', () => {
      const reportWithLinks: EngineeringDecisionReport = {
        ...SAMPLE_REPORT_MINIMAL,
        repository: {
          ...SAMPLE_REPORT_MINIMAL.repository,
          repoUrl: 'https://github.com/acme/commerce-core',
        },
        evidence: [
          {
            id: 'ev-link-test',
            type: 'file_span',
            title: 'Clickable Source Evidence Test',
            filePath: 'src/auth/jwt.ts',
            startLine: 1,
            endLine: 40,
            confidenceScore: 1.0,
            url: 'https://github.com/acme/commerce-core/blob/main/src/auth/jwt.ts#L1-L40',
          },
        ],
      };

      const builder = new ReportPdfBuilder(reportWithLinks);
      const pdfBytes = builder.generate();

      expect(pdfBytes.length).toBeGreaterThan(2000);
      expect(isPdfBuffer(pdfBytes)).toBe(true);
    });
  });

  describe('API Route Handler (/api/reports/pdf)', () => {
    it('POST returns 400 if report object is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/reports/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toContain('Validation Error');
    });

    it('POST returns 200 with application/pdf and attachment headers for valid request', async () => {
      const req = new NextRequest('http://localhost:3000/api/reports/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report: SAMPLE_REPORT_JWT_REFACTOR,
          customTitle: 'Production Release Audit',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/pdf');
      expect(res.headers.get('Content-Disposition')).toContain('attachment');
      expect(res.headers.get('Content-Disposition')).toContain('CodeWhy-Report-');

      const arrayBuffer = await res.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      expect(isPdfBuffer(bytes)).toBe(true);
    });

    it('GET returns 200 with sample PDF file download', async () => {
      const req = new NextRequest('http://localhost:3000/api/reports/pdf?sample=commerce-jwt');
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/pdf');

      const arrayBuffer = await res.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      expect(isPdfBuffer(bytes)).toBe(true);
    });
  });
});
