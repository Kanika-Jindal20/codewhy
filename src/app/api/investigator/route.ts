import { NextRequest, NextResponse } from 'next/server';
import { runAutonomousInvestigation } from '@/lib/investigator/autonomous-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const repoId = body.repoId || req.cookies.get('codewhy_active_repo_id')?.value;
    const { goal } = body;

    const result = await runAutonomousInvestigation(
      repoId,
      goal || 'Investigate the riskiest parts and architectural bottlenecks of this repository.'
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('[/api/investigator] Error executing autonomous investigation:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to complete autonomous engineering investigation.',
      },
      { status: 500 }
    );
  }
}
