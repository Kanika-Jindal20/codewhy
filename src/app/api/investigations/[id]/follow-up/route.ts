import { NextRequest, NextResponse } from 'next/server';
import { investigationStore, CURRENT_USER_ID, CURRENT_USER_NAME } from '@/lib/investigations/investigation-store';
import { generateFollowUpSuggestions } from '@/lib/investigations/follow-up-engine';
import { SubmitFollowUpInput } from '@/types/investigation';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body: SubmitFollowUpInput = await req.json();
    const userId = req.headers.get('x-user-id') || CURRENT_USER_ID;
    const userName = req.headers.get('x-user-name') || CURRENT_USER_NAME;

    if (!body.question || !body.question.trim()) {
      return NextResponse.json(
        { error: 'Validation Error: "question" string is required.' },
        { status: 400 }
      );
    }

    const updated = investigationStore.appendFollowUp(id, body, userId, userName);
    const suggestions = generateFollowUpSuggestions(updated);

    return NextResponse.json({ investigation: updated, suggestions }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit follow-up';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
