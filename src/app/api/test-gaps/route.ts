import { NextRequest, NextResponse } from 'next/server';
import { analyzeTestGaps } from '@/lib/gaps/test-gap-engine';

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const repoId = sp.get('repoId') || undefined;

    const result = await analyzeTestGaps(repoId);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('[/api/test-gaps] Test gap analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze test gaps.' },
      { status: 500 }
    );
  }
}
