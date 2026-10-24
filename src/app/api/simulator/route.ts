import { NextRequest, NextResponse } from 'next/server';
import { simulateProposedChange } from '@/lib/simulator/change-simulator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const repoId = body.repoId || req.cookies.get('codewhy_active_repo_id')?.value;
    const { changeDescription, proposedApproach, targetSymbolHint, maxTransitiveDepth } = body;

    if (!changeDescription || typeof changeDescription !== 'string') {
      return NextResponse.json(
        { error: 'Validation Error: "changeDescription" is required.' },
        { status: 400 }
      );
    }

    const result = await simulateProposedChange({
      repoId,
      changeDescription: changeDescription.trim(),
      proposedApproach,
      targetSymbolHint,
      maxTransitiveDepth,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('[/api/simulator] Simulation error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to simulate proposed change.',
      },
      { status: 500 }
    );
  }
}
