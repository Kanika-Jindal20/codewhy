import { NextRequest, NextResponse } from 'next/server';
import { getRepositoryGraph, getActiveRepositoryGraph } from '@/lib/graph/graph-store';
import { answerRepositoryQuestion } from '@/lib/ask/ask-service';

const MAX_QUESTION_LENGTH = 2000;

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Request body must be an object.' }, { status: 400 });
    const { repoId, question, conversationId, recentQuestions } = body as Record<string, unknown>;
    if (typeof repoId !== 'string' || !repoId.trim()) return NextResponse.json({ error: 'Select a repository first.' }, { status: 400 });
    if (typeof question !== 'string' || question.trim().length < 3 || question.trim().length > MAX_QUESTION_LENGTH) {
      return NextResponse.json({ error: `Question must be between 3 and ${MAX_QUESTION_LENGTH} characters.` }, { status: 400 });
    }
    if (conversationId !== undefined && (typeof conversationId !== 'string' || conversationId.length > 100)) {
      return NextResponse.json({ error: 'Invalid conversation identifier.' }, { status: 400 });
    }
    if (recentQuestions !== undefined && (!Array.isArray(recentQuestions) || recentQuestions.length > 4 || recentQuestions.some((item) => typeof item !== 'string' || item.length > MAX_QUESTION_LENGTH))) {
      return NextResponse.json({ error: 'Recent question context must contain at most four short questions.' }, { status: 400 });
    }
    const graph = getRepositoryGraph(repoId.trim()) || getActiveRepositoryGraph();
    if (!graph) return NextResponse.json({ error: 'That repository is not available in the current analysis.' }, { status: 404 });
    return NextResponse.json(await answerRepositoryQuestion(graph, {
      repoId: graph.repoId,
      question: question.trim(),
      conversationId: typeof conversationId === 'string' ? conversationId : undefined,
      recentQuestions: Array.isArray(recentQuestions) ? recentQuestions : [],
    }), { status: 200 });
  } catch (error) {
    console.error('[/api/ask] Request failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Could not retrieve repository evidence. Please retry.' }, { status: 500 });
  }
}
