import { NextRequest, NextResponse } from 'next/server';
import { investigationStore, CURRENT_USER_ID, CURRENT_USER_NAME } from '@/lib/investigations/investigation-store';
import { CreateInvestigationInput, InvestigationStatus } from '@/types/investigation';

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const userId = req.headers.get('x-user-id') || sp.get('userId') || CURRENT_USER_ID;
    const search = sp.get('search') || undefined;
    const status = (sp.get('status') as 'all' | InvestigationStatus) || undefined;
    const repoId = sp.get('repoId') || undefined;
    const tag = sp.get('tag') || undefined;

    const list = investigationStore.list(userId, { search, status, repoId, tag });
    return NextResponse.json({ investigations: list }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateInvestigationInput = await req.json();
    const userId = req.headers.get('x-user-id') || CURRENT_USER_ID;
    const userName = req.headers.get('x-user-name') || CURRENT_USER_NAME;

    if (!body.title || !body.originalQuestion || !body.repoId) {
      return NextResponse.json(
        { error: 'Validation Error: "title", "repoId", and "originalQuestion" are required.' },
        { status: 400 }
      );
    }

    const created = investigationStore.create(body, userId, userName);
    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create investigation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
