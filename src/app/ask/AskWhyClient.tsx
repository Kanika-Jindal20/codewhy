'use client';

import React, { FormEvent, useState, useEffect } from 'react';
import { ArrowUp, Bot, CircleHelp, FolderGit2, LoaderCircle, MessageSquareText, Sparkles, Zap } from 'lucide-react';
import { SAMPLE_REPO_ECOMMERCE } from '@/lib/graph/sample-repo';
import type { AskWhyResponse } from '@/types/ask';
import { EvidenceCard } from '@/components/evidence/EvidenceCard';
import { ReliabilityIndicator } from '@/components/evidence/ReliabilityIndicator';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';


const SUGGESTIONS = [
  { text: 'What does verifySessionToken do?', bg: 'bg-blue-50', border: 'border-blue-200', textCol: 'text-blue-700', hover: 'hover:bg-blue-100', dot: 'bg-blue-500' },
  { text: 'Which components depend on jwt.ts?', bg: 'bg-violet-50', border: 'border-violet-200', textCol: 'text-violet-700', hover: 'hover:bg-violet-100', dot: 'bg-violet-500' },
  { text: 'Why was token verification changed?', bg: 'bg-amber-50', border: 'border-amber-200', textCol: 'text-amber-700', hover: 'hover:bg-amber-100', dot: 'bg-amber-500' },
  { text: 'Has this decision changed over time?', bg: 'bg-emerald-50', border: 'border-emerald-200', textCol: 'text-emerald-700', hover: 'hover:bg-emerald-100', dot: 'bg-emerald-500' },
];

const FOLLOW_UP_COLORS = [
  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', hover: 'hover:bg-violet-100' },
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', hover: 'hover:bg-blue-100' },
  { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', hover: 'hover:bg-teal-100' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', hover: 'hover:bg-indigo-100' },
];

interface ConversationTurn { question: string; response: AskWhyResponse; }

export function AskWhyClient() {
  const [question, setQuestion] = useState('');
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeRepo, setActiveRepo] = useState<{ repoId: string; repoName: string }>({
    repoId: SAMPLE_REPO_ECOMMERCE.repoId,
    repoName: SAMPLE_REPO_ECOMMERCE.repoName,
  });

  useEffect(() => {
    async function loadActive() {
      try {
        const res = await fetch('/api/repositories');
        if (res.ok) {
          const data = await res.json();
          const active = data.repositories?.find((r: any) => r.isActive) || data.repositories?.[0];
          if (active) {
            setActiveRepo({ repoId: active.repoId, repoName: active.repoName });
          }
        }
      } catch {
        // Fallback
      }
    }
    loadActive();
  }, []);

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
        body: JSON.stringify({ repoId: activeRepo.repoId, question: trimmed, conversationId, recentQuestions: turns.slice(-4).map((turn) => turn.question) }),
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
    <div className="font-['Inter',sans-serif] max-w-5xl mx-auto space-y-6 pb-12">

      {/* ── Violet Gradient Header Banner ── */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-purple-700 p-7 shadow-lg">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 left-16 h-32 w-32 rounded-full bg-purple-400/20 blur-xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-sm border border-white/30">
              <Bot className="h-9 w-9 text-white stroke-[1.5]" aria-hidden />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">Ask Why</h1>
              <p className="mt-1 text-sm font-medium text-purple-100">
                Get plain-English answers backed by real code evidence
              </p>
            </div>
          </div>

          {/* Repo & AI Model badges */}
          <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
            <div className="flex items-center gap-2 rounded-2xl border border-white/30 bg-white/15 backdrop-blur-sm px-4 py-2.5 shadow-sm">
              <FolderGit2 className="w-4 h-4 text-purple-100" aria-hidden />
              <span className="font-bold text-white text-sm">{activeRepo.repoName}</span>
              {activeRepo.repoId === SAMPLE_REPO_ECOMMERCE.repoId && (
                <span className="rounded-full bg-amber-400/90 px-2.5 py-0.5 text-xs font-bold text-amber-900 border border-amber-300/50">
                  Demo
                </span>
              )}
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-2xl border border-white/30 bg-white/20 backdrop-blur-sm px-3.5 py-2.5 text-xs font-bold text-white shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Sarvam AI (105B) + Neo4j
            </span>
          </div>
        </div>
      </header>

      {/* ── Alerts ── */}
      {activeRepo.repoId === SAMPLE_REPO_ECOMMERCE.repoId && (
        <Alert type="warning" title="Sample repository data">
          This workspace currently uses illustrative sample records. Answers and citations demonstrate the workflow; they do not describe a live GitHub repository.
        </Alert>
      )}
      {error && <Alert type="error" title="Question could not be answered">{error}</Alert>}

      {/* ── Ask Input Section ── */}
      <section
        className="rounded-3xl border-2 border-violet-100 bg-white p-6 shadow-lg"
        aria-label="Ask a repository question"
      >
        <form onSubmit={onSubmit}>
          <label htmlFor="ask-why-question" className="block text-sm font-bold text-gray-800 mb-3">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              What do you want to understand about the codebase?
            </span>
          </label>

          <div className="flex items-end gap-3 rounded-2xl border-2 border-gray-200 bg-gray-50 p-3 shadow-sm focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/10 focus-within:bg-white transition-all duration-200">
            <textarea
              id="ask-why-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void submitQuestion(); } }}
              maxLength={2000}
              rows={3}
              placeholder="E.g. What does verifySessionToken do? Which components depend on jwt.ts? Why was token verification changed?"
              className="min-h-14 max-h-48 flex-1 resize-y bg-transparent px-2 py-1 text-sm text-gray-800 outline-none placeholder:text-gray-400 leading-relaxed"
              aria-describedby="ask-why-help"
            />
            <button
              type="submit"
              disabled={loading || question.trim().length < 3}
              aria-label={loading ? 'Searching repository evidence' : 'Ask question'}
              className="mb-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 text-white transition-all hover:from-violet-700 hover:to-purple-800 hover:shadow-lg hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 shadow-md"
            >
              {loading
                ? <LoaderCircle className="w-5 h-5 animate-spin" />
                : <ArrowUp className="w-5 h-5 stroke-[2.5]" />}
            </button>
          </div>

          <div id="ask-why-help" className="mt-2 flex justify-between text-xs text-gray-400">
            <span>Press <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-500 border border-gray-200">Enter</kbd> to ask · <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-500 border border-gray-200">Shift + Enter</kbd> for a new line</span>
            <span className={question.length > 1800 ? 'text-amber-500 font-bold' : ''}>{question.length}/2000</span>
          </div>
        </form>

        {/* Suggestion chips — only show before first message */}
        {turns.length === 0 && (
          <div className="mt-5 border-t-2 border-gray-100 pt-5">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
              Suggested questions to explore
            </p>
            <div className="flex flex-wrap gap-2.5">
              {SUGGESTIONS.map((item) => (
                <button
                  key={item.text}
                  type="button"
                  onClick={() => { setQuestion(item.text); void submitQuestion(item.text); }}
                  disabled={loading}
                  className={`flex items-center gap-2 rounded-full border-2 ${item.border} ${item.bg} ${item.textCol} ${item.hover} px-4 py-2 text-sm font-semibold transition-all duration-150 shadow-sm hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className={`h-2 w-2 rounded-full ${item.dot} shrink-0`} />
                  {item.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Loading State ── */}
      {loading && (
        <div
          role="status"
          className="flex items-center gap-4 rounded-2xl border-2 border-violet-100 bg-gradient-to-r from-violet-50 to-purple-50 p-5 shadow-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">
            <LoaderCircle className="h-5 w-5 animate-spin text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-violet-700">Searching codebase…</p>
            <p className="text-xs text-violet-500 mt-0.5">Scanning repository structure, AST relationships, and connected commit history</p>
          </div>
        </div>
      )}

      {/* ── Conversation Turns ── */}
      <div className="space-y-6" aria-live="polite">
        {turns.map(({ question: asked, response }) => (
          <article key={response.requestId} className="space-y-5 rounded-3xl border-2 border-gray-100 bg-white shadow-lg overflow-hidden">

            {/* User Question Bubble — right-aligned blue gradient */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-5">
              <div className="flex gap-3.5 justify-end">
                <div className="max-w-[85%] min-w-0">
                  <p className="text-base font-bold text-white leading-snug">{asked}</p>
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Category:</span>
                    <span className="text-xs font-bold text-blue-900 bg-white/90 px-2.5 py-0.5 rounded-full border border-blue-100 shadow-sm">
                      {response.questionKind.replaceAll('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 border border-white/30 shadow-sm">
                  <MessageSquareText className="h-4 w-4 text-white stroke-[2]" aria-hidden />
                </div>
              </div>
            </div>

            {/* AI Answer — left-aligned white card with violet left border */}
            <div className="px-6 pb-6">
              <div className="flex gap-4">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md">
                  <Bot className="h-5 w-5 stroke-[1.5]" aria-hidden />
                </div>

                <div className="min-w-0 flex-1 space-y-5">
                  {/* Answer Mode Badge */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${response.answerMode === 'ai' ? 'bg-violet-100 text-violet-700 border-violet-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      <Sparkles className="w-3 h-3" />
                      {response.answerMode === 'ai' ? 'Evidence-grounded synthesis' : 'Evidence-only'}
                    </span>
                    {response.sarvamDetails && (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {response.sarvamDetails.model}
                      </span>
                    )}
                    {response.neo4jGrounded && (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 shadow-xs">
                        Neo4j Grounded
                      </span>
                    )}
                    {response.modelNote && (
                      <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">{response.modelNote}</span>
                    )}
                  </div>

                  {/* Answer Text */}
                  <div className="rounded-2xl border-l-4 border-violet-500 bg-gradient-to-br from-violet-50 to-purple-50/50 px-5 py-4 shadow-sm">
                    <div className="space-y-3 text-sm leading-relaxed text-gray-800">
                      {response.answer.split('\n\n').map((paragraph, part) => (
                        <p key={part} className="whitespace-pre-wrap">{paragraph}</p>
                      ))}
                    </div>

                    {response.sarvamDetails?.limitations && (
                      <div className="mt-4 pt-3 border-t border-violet-200 text-xs text-amber-900 bg-amber-50/70 p-3 rounded-xl border border-amber-200 font-medium">
                        <span className="font-extrabold text-amber-950">Verification Scope:</span> {response.sarvamDetails.limitations}
                      </div>
                    )}
                  </div>

                  {/* Claims / Cited Evidence */}
                  {response.claims.length > 0 && (
                    <div className="rounded-2xl border-2 border-blue-100 bg-blue-50/70 p-4">
                      <p className="mb-3 flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        Cited Evidence Findings
                      </p>
                      <div className="space-y-2">
                        {response.claims.map((claim, claimIndex) => (
                          <div key={`${claim.evidenceIds.join('-')}-${claimIndex}`} className="flex flex-wrap items-center gap-2 text-xs">
                            <span className={`font-bold px-2.5 py-1 rounded-full border ${
                              claim.directness === 'direct'
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : claim.directness === 'indirect'
                                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                                  : 'bg-gray-100 text-gray-600 border-gray-200'
                            }`}>
                              {claim.directness === 'direct' ? '✓ Observed directly in AST' : claim.directness === 'indirect' ? '⟳ Inferred relation' : '◎ Model interpretation'}
                            </span>
                            <div className="inline-flex gap-1.5 flex-wrap">
                              {claim.evidenceIds.map((id) => (
                                <a
                                  key={id}
                                  href={`#evidence-${response.requestId}-${id}`}
                                  className="rounded-full border-2 border-blue-200 bg-white px-2.5 py-0.5 font-mono text-xs font-bold text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all shadow-sm"
                                >
                                  Source {response.evidence.findIndex((item) => item.id === id) + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reliability Indicator */}
                  <ReliabilityIndicator assessment={response.reliability} />

                  {/* Supporting Evidence Citations */}
                  <section aria-label="Supporting evidence" className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5">
                      <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-violet-500" />
                        Supporting Evidence Citations
                      </h2>
                      <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700 border border-violet-200">
                        {response.evidence.length} {response.evidence.length === 1 ? 'record' : 'records'}
                      </span>
                    </div>

                    {response.evidence.length ? (
                      <div className="space-y-3">
                        {groupEvidence(response.evidence).map((group) => (
                          <div key={group.key} className="space-y-2">
                            <h3 className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-1 ${group.conflict ? 'text-amber-600' : 'text-gray-500'}`}>
                              {group.conflict && <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />}
                              {group.label}{group.conflict ? ' · Compare both sources' : ''}
                            </h3>
                            <div className="space-y-2">
                              {group.items.map((item) => (
                                <div key={item.id} id={`evidence-${response.requestId}-${item.id}`} className="scroll-mt-6">
                                  <EvidenceCard evidence={item} compact={response.evidence.length > 4} />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center">
                        <CircleHelp className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                        <p className="text-sm font-semibold text-gray-400">No supporting source records were retrieved for this query.</p>
                      </div>
                    )}
                  </section>

                  {/* Follow-up Suggestions */}
                  {response.followUpQuestions.length > 0 && (
                    <section aria-label="Suggested follow-up questions" className="rounded-2xl border-2 border-violet-100 bg-gradient-to-br from-violet-50 to-purple-50/50 p-4">
                      <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-600">
                        <Sparkles className="w-3.5 h-3.5" />
                        Suggested follow-up inquiries
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {response.followUpQuestions.map((followUp, idx) => {
                          const color = FOLLOW_UP_COLORS[idx % FOLLOW_UP_COLORS.length];
                          return (
                            <button
                              key={followUp}
                              type="button"
                              onClick={() => { setQuestion(followUp); void submitQuestion(followUp); }}
                              disabled={loading}
                              className={`rounded-full border-2 ${color.border} ${color.bg} ${color.text} ${color.hover} px-3.5 py-1.5 text-left text-sm font-semibold transition-all duration-150 hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {followUp} →
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* ── Empty State ── */}
      {turns.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-200">
            <Bot className="h-12 w-12 text-white stroke-[1.5]" aria-hidden />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Ask your first question</h2>
          <p className="text-sm text-gray-500 max-w-sm mb-8 leading-relaxed">
            Your questions and grounded architectural evidence will appear here. Try one of the suggestions above to get started.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {SUGGESTIONS.map((item) => (
              <button
                key={item.text}
                type="button"
                onClick={() => { setQuestion(item.text); void submitQuestion(item.text); }}
                disabled={loading}
                className={`flex items-center gap-2 rounded-full border-2 ${item.border} ${item.bg} ${item.textCol} ${item.hover} px-4 py-2 text-sm font-semibold transition-all duration-150 shadow-sm hover:scale-105 hover:shadow-md disabled:opacity-50`}
              >
                <span className={`h-2 w-2 rounded-full ${item.dot} shrink-0`} />
                {item.text}
              </button>
            ))}
          </div>
        </div>
      )}
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
