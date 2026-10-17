'use client';

import React, { FormEvent, useState } from 'react';
import { ArrowUp, Bot, CircleHelp, Github, LoaderCircle, MessageSquareText } from 'lucide-react';
import { SAMPLE_REPO_ECOMMERCE } from '@/lib/graph/graph-store';
import type { AskWhyResponse } from '@/types/ask';
import { EvidenceCard } from '@/components/evidence/EvidenceCard';
import { ReliabilityIndicator } from '@/components/evidence/ReliabilityIndicator';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';

const SUGGESTIONS = [
  'What does verifySessionToken do?',
  'Which components depend on jwt.ts?',
  'Why was token verification changed?',
  'Has this decision changed over time?',
];

interface ConversationTurn { question: string; response: AskWhyResponse; }

export function AskWhyClient() {
  const [question, setQuestion] = useState('');
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const repo = SAMPLE_REPO_ECOMMERCE;

  async function submitQuestion(value = question) {
    const trimmed = value.trim();
    if (trimmed.length < 3 || loading) return;
    setLoading(true);
    setError(null);
    setQuestion(trimmed);
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId: repo.repoId, question: trimmed, conversationId, recentQuestions: turns.slice(-4).map((turn) => turn.question) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not retrieve repository evidence.');
      setTurns((current) => [...current, { question: trimmed, response: payload as AskWhyResponse }]);
      setConversationId((payload as AskWhyResponse).conversationId);
      setQuestion('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not retrieve repository evidence.');
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitQuestion();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <header className="flex flex-col gap-3 border-b border-app-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-accent-primary/20 text-accent-primary border border-accent-primary/30"><CircleHelp className="w-5 h-5" /></span>
            <h1 className="text-2xl font-bold tracking-tight">Ask Why</h1>
          </div>
          <p className="text-xs text-text-muted">Ask about code, dependencies, or repository history. Every answer is grounded in retrieved records.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-app-border bg-app-panel px-3 py-2 text-xs">
          <Github className="w-4 h-4 text-text-muted" aria-hidden />
          <span className="text-text-primary">{repo.repoName}</span>
          {repo.isDemo && <Badge variant="warning">Demo data</Badge>}
        </div>
      </header>

      {repo.isDemo && (
        <Alert type="warning" title="Sample repository data">
          This workspace currently uses illustrative sample records. Answers and citations demonstrate the workflow; they do not describe a live GitHub repository.
        </Alert>
      )}
      {error && <Alert type="error" title="Question could not be answered">{error}</Alert>}

      <section className="rounded-xl border border-app-border bg-app-panel p-4 sm:p-5" aria-label="Ask a repository question">
        <form onSubmit={onSubmit}>
          <label htmlFor="ask-why-question" className="block text-sm font-semibold text-text-primary mb-2">What do you want to understand?</label>
          <div className="flex items-end gap-2 rounded-lg border border-app-border bg-app-bg p-2 focus-within:border-accent-primary/70">
            <textarea
              id="ask-why-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void submitQuestion(); } }}
              maxLength={2000}
              rows={2}
              placeholder="Ask about a symbol, file, dependency, commit, or decision…"
              className="min-h-12 max-h-40 flex-1 resize-y bg-transparent px-2 py-1.5 text-sm text-text-primary outline-none placeholder:text-text-muted"
              aria-describedby="ask-why-help"
            />
            <button type="submit" disabled={loading || question.trim().length < 3} aria-label={loading ? 'Searching repository evidence' : 'Ask question'} className="mb-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-primary text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
            </button>
          </div>
          <div id="ask-why-help" className="mt-2 flex justify-between text-[11px] text-text-muted"><span>Enter to ask · Shift+Enter for a new line</span><span>{question.length}/2000</span></div>
        </form>
        {turns.length === 0 && (
          <div className="mt-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Try a question</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => { setQuestion(suggestion); void submitQuestion(suggestion); }} disabled={loading} className="rounded-full border border-app-border bg-app-surface px-3 py-1.5 text-xs text-text-secondary hover:border-accent-primary/50 hover:text-text-primary disabled:opacity-50">{suggestion}</button>
              ))}
            </div>
          </div>
        )}
      </section>

      {loading && <div role="status" className="flex items-center gap-2 rounded-lg border border-app-border bg-app-panel p-4 text-sm text-text-secondary"><LoaderCircle className="h-4 w-4 animate-spin text-accent-primary" />Searching repository structure, source records, and connected history…</div>}

      <div className="space-y-5" aria-live="polite">
        {turns.map(({ question: asked, response }, index) => (
          <article key={response.requestId} className="space-y-4 rounded-xl border border-app-border bg-app-panel p-4 sm:p-5">
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-primary/15 text-accent-primary"><MessageSquareText className="h-4 w-4" aria-hidden /></div>
              <div className="min-w-0 flex-1"><p className="text-sm font-medium text-text-primary">{asked}</p><p className="mt-1 text-[10px] uppercase tracking-wide text-text-muted">{response.questionKind.replaceAll('_', ' ')}</p></div>
            </div>
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-secondary/15 text-accent-secondary"><Bot className="h-4 w-4" aria-hidden /></div>
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2"><Badge variant={response.answerMode === 'ai' ? 'info' : 'outline'}>{response.answerMode === 'ai' ? 'Evidence-grounded AI' : 'Evidence-only'}</Badge>{response.modelNote && <span className="text-[11px] text-text-muted">{response.modelNote}</span>}</div>
                {response.answer.split('\n\n').map((paragraph, part) => <p key={part} className="whitespace-pre-wrap text-sm leading-6 text-text-secondary">{paragraph}</p>)}
                {response.claims.length > 0 && <div className="space-y-2 border-l-2 border-app-border pl-3">
                  {response.claims.map((claim, claimIndex) => (
                    <div key={`${claim.evidenceIds.join('-')}-${claimIndex}`} className="text-xs text-text-secondary">
                      <span>{claim.directness === 'direct' ? 'Observed' : claim.directness === 'indirect' ? 'Inferred' : 'Interpretation'} · supporting record</span>
                      <span className="ml-2 inline-flex gap-1">{claim.evidenceIds.map((id) => <a key={id} href={`#evidence-${response.requestId}-${id}`} className="rounded border border-accent-primary/30 px-1.5 py-0.5 text-accent-primary hover:bg-accent-primary/10">Source {response.evidence.findIndex((item) => item.id === id) + 1}</a>)}</span>
                    </div>
                  ))}
                </div>}
                <ReliabilityIndicator assessment={response.reliability} />
                <section aria-label="Supporting evidence" className="space-y-2">
                  <h2 className="text-xs font-semibold text-text-primary">Supporting evidence <span className="font-normal text-text-muted">({response.evidence.length})</span></h2>
                  {response.evidence.length ? groupEvidence(response.evidence).map((group) => <div key={group.key} className="space-y-2">
                    <h3 className={`text-[11px] font-semibold ${group.conflict ? 'text-status-warning' : 'text-text-muted'}`}>{group.label}{group.conflict ? ' · compare both records' : ''}</h3>
                    <div className="space-y-2">{group.items.map((item) => <div key={item.id} id={`evidence-${response.requestId}-${item.id}`} className="scroll-mt-6"><EvidenceCard evidence={item} compact={response.evidence.length > 4} /></div>)}</div>
                  </div>) : <p className="rounded-lg border border-dashed border-app-border p-3 text-xs text-text-muted">No supporting source records were retrieved.</p>}
                </section>
                {response.followUpQuestions.length > 0 && <section aria-label="Suggested follow-up questions"><p className="mb-2 text-[11px] font-semibold text-text-muted">Continue investigating</p><div className="flex flex-wrap gap-2">{response.followUpQuestions.map((followUp) => <button key={followUp} type="button" onClick={() => { setQuestion(followUp); void submitQuestion(followUp); }} disabled={loading} className="text-left rounded border border-app-border px-2.5 py-1.5 text-[11px] text-text-secondary hover:border-accent-primary/50 hover:text-text-primary disabled:opacity-50">{followUp}</button>)}</div></section>}
              </div>
            </div>
          </article>
        ))}
      </div>
      {turns.length === 0 && !loading && <div className="py-8 text-center text-xs text-text-muted"><MessageSquareText className="mx-auto mb-2 h-5 w-5" />Your repository questions and answers will appear here.</div>}
    </div>
  );
}

function groupEvidence(evidence: AskWhyResponse['evidence']) {
  const groups = new Map<string, { key: string; label: string; conflict: boolean; items: AskWhyResponse['evidence'] }>();
  for (const item of evidence) {
    const conflict = Boolean(item.conflictGroup);
    const key = conflict ? `conflict:${item.conflictGroup}` : `type:${item.type}`;
    const label = conflict ? `Conflicting sources · ${item.conflictGroup}` : item.type.replaceAll('_', ' ');
    const current = groups.get(key) ?? { key, label, conflict, items: [] };
    current.items.push(item);
    groups.set(key, current);
  }
  return [...groups.values()];
}
