import { NextRequest, NextResponse } from 'next/server';
import { investigationStore, CURRENT_USER_ID } from '@/lib/investigations/investigation-store';
import { generateFollowUpSuggestions } from '@/lib/investigations/follow-up-engine';
import { UpdateInvestigationInput } from '@/types/investigation';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const sp = req.nextUrl.searchParams;
    const userId = req.headers.get('x-user-id') || sp.get('userId') || CURRENT_USER_ID;

    const investigation = investigationStore.getById(id, userId);
    if (!investigation) {
      return NextResponse.json({ error: `Investigation '${id}' not found.` }, { status: 404 });
    }

    const suggestions = generateFollowUpSuggestions(investigation);

    return NextResponse.json({ investigation, suggestions }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body: UpdateInvestigationInput = await req.json();
    const userId = req.headers.get('x-user-id') || CURRENT_USER_ID;

    const updated = investigationStore.update(id, body, userId);
    return NextResponse.json(updated, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update investigation';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const userId = req.headers.get('x-user-id') || CURRENT_USER_ID;

    const success = investigationStore.delete(id, userId);
    if (!success) {
      return NextResponse.json({ error: `Investigation '${id}' not found.` }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: id }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete investigation';
    if (message.includes('Forbidden')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
