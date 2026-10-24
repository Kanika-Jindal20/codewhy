import { NextRequest, NextResponse } from 'next/server';
import { reviewPullRequestRisk } from '@/lib/pr/pr-reviewer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const repoId = body.repoId || req.cookies.get('codewhy_active_repo_id')?.value;
    const { prUrl, prNumber, changedFiles } = body;
    const token = req.headers.get('x-github-token') || undefined;

    const review = await reviewPullRequestRisk({
      repoId,
      prUrl,
      prNumber,
      changedFiles,
      authToken: token,
    });

    return NextResponse.json(review, { status: 200 });
  } catch (error: any) {
    console.error('[/api/pr-review] PR review error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to review pull request risk.',
      },
      { status: 500 }
    );
  }
}
