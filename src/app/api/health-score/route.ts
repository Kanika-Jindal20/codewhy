import { NextRequest, NextResponse } from 'next/server';
import { calculateArchitectureHealth } from '@/lib/health/health-score';

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const repoId = sp.get('repoId') || undefined;

    const report = calculateArchitectureHealth(repoId);
    return NextResponse.json(report, { status: 200 });
  } catch (error: any) {
    console.error('[/api/health-score] Architecture health calculation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate architecture health score.' },
      { status: 500 }
    );
  }
}
