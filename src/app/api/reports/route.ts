import { NextRequest, NextResponse } from 'next/server';
import { investigationStore, CURRENT_USER_ID } from '@/lib/investigations/investigation-store';
import { buildReportFromInvestigation } from '@/lib/reports/report-generator';
import { SAMPLE_REPORT_JWT_REFACTOR, SAMPLE_REPORT_MINIMAL } from '@/lib/reports/sample-report-data';
import { EngineeringDecisionReport } from '@/types/report';

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const userId = req.headers.get('x-user-id') || CURRENT_USER_ID;
    const repoId = sp.get('repoId') || undefined;

    const investigations = investigationStore.list(userId, { repoId });
    const realReports: EngineeringDecisionReport[] = investigations.map(inv =>
      buildReportFromInvestigation(inv)
    );

    // If no real reports exist yet, include sample reports as reference templates
    const allReports = realReports.length > 0
      ? realReports
      : [SAMPLE_REPORT_JWT_REFACTOR, SAMPLE_REPORT_MINIMAL];

    return NextResponse.json({
      reports: allReports,
      totalCount: allReports.length,
      realCount: realReports.length,
    }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve reports.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
