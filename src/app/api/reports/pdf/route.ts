import { NextRequest, NextResponse } from 'next/server';
import { ReportPdfBuilder } from '@/lib/reports/pdf-builder';
import { EngineeringDecisionReport, GeneratePdfRequest } from '@/types/report';
import { SAMPLE_REPORT_JWT_REFACTOR, SAMPLE_REPORT_MINIMAL } from '@/lib/reports/sample-report-data';

function makeSafeFilename(title: string): string {
  const clean = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50);
  return `CodeWhy-Report-${clean || 'decision'}.pdf`;
}

export async function POST(req: NextRequest) {
  try {
    const body: GeneratePdfRequest = await req.json();

    if (!body || !body.report) {
      return NextResponse.json(
        { error: 'Validation Error: "report" object is required in request body.' },
        { status: 400 }
      );
    }

    const { report, customTitle, sections } = body;

    // Validate essential report structure
    if (!report.title && !customTitle) {
      return NextResponse.json(
        { error: 'Validation Error: report must have a title.' },
        { status: 400 }
      );
    }

    if (!report.repository || !report.repository.repoId) {
      return NextResponse.json(
        { error: 'Validation Error: report must specify repository context.' },
        { status: 400 }
      );
    }

    // Build PDF
    const builder = new ReportPdfBuilder(report, { customTitle, sections });
    const pdfBuffer = builder.generate();

    const filename = makeSafeFilename(customTitle || report.title);

    return new Response(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.byteLength),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown PDF generation error';
    console.error('[/api/reports/pdf] Generation error:', err);
    return NextResponse.json(
      { error: 'PDF generation failed.', details: message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const invId = sp.get('investigationId');
    const sample = sp.get('sample') || 'commerce-jwt';

    const invStore = (await import('@/lib/investigations/investigation-store')).investigationStore;
    const inv = invId ? invStore.getById(invId, 'user-dev-current') : null;
    const report: EngineeringDecisionReport = inv
      ? (await import('@/lib/reports/report-generator')).buildReportFromInvestigation(inv)
      : sample === 'minimal' ? SAMPLE_REPORT_MINIMAL : SAMPLE_REPORT_JWT_REFACTOR;

    const builder = new ReportPdfBuilder(report);
    const pdfBuffer = builder.generate();
    const filename = makeSafeFilename(report.title);

    return new Response(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.byteLength),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to retrieve sample PDF.', details: message }, { status: 500 });
  }
}
