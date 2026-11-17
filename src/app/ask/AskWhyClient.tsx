'use client';

import React, { FormEvent, useState } from 'react';
import { ArrowUp, Bot, CircleHelp, FolderGit2, LoaderCircle, MessageSquare, Sparkles, Terminal } from 'lucide-react';
import { SAMPLE_REPO_ECOMMERCE } from '@/lib/graph/sample-repo';
import { useActiveRepo } from '@/lib/repositories/active-repo-client';
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

interface ConversationTurn { 
  question: string; 
  response: AskWhyResponse; 
}

export function AskWhyClient() {
  const [question, setQuestion] = useState('');
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { activeRepo } = useActiveRepo();

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
        body: JSON.stringify({ 
          repoId: activeRepo.repoId, 
          question: trimmed, 
          conversationId, 
          recentQuestions: turns.slice(-4).map((turn) => turn.question) 
        }),
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-white border border-border-default rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-brand-emerald/10 text-brand-deep border border-brand-emerald/20">
              <Bot className="w-3 h-3 text-brand-emerald" />
              Engineering Reasoning
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-muted text-ink-muted border border-border-subtle font-mono">
              AST Grounded
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink-primary tracking-tight">
            Ask Why
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-xl">
            Query architectural decisions, dependencies, and rationale with verifiable source code citations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
          <div className="flex items-center gap-2 rounded-lg border border-border-default bg-surface-secondary px-3 py-1.5 text-xs text-ink-secondary">
            <FolderGit2 className="w-3.5 h-3.5 text-ink-muted" />
            <span className="font-mono font-medium">{activeRepo.repoName}</span>
            {activeRepo.repoId === SAMPLE_REPO_ECOMMERCE.repoId && (
              <Badge variant="warning" size="sm">Demo</Badge>
            )}
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-muted px-2.5 py-1.5 text-xs font-mono text-ink-muted">
            <Sparkles className="w-3 h-3 text-brand-deep" />
            Sarvam (105B) + Neo4j
          </span>
        </div>
      </div>

      {/* Demo Warning */}
      {activeRepo.repoId === SAMPLE_REPO_ECOMMERCE.repoId && (
        <Alert type="warning" title="Sample repository data">
          This workspace uses illustrative sample records. Answers and citations demonstrate the workflow; they do not describe a live GitHub repository.
        </Alert>
      )}

      {error && <Alert type="error" title="Question could not be answered">{error}</Alert>}

      {/* Query Input Box */}
      <section className="bg-white border border-border-default rounded-xl p-5 shadow-xs" aria-label="Ask a repository question">
        <form onSubmit={onSubmit}>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="ask-why-question" className="text-xs font-medium text-ink-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-deep" />
              What would you like to understand about the codebase?
            </label>
            <span className="text-[11px] font-mono text-ink-faint">
              {question.length}/2000
            </span>
          </div>

          <div className="relative rounded-lg border border-border-default bg-surface-secondary focus-within:border-brand-emerald focus-within:ring-1 focus-within:ring-brand-emerald/30 focus-within:bg-white transition-all">
            <textarea
              id="ask-why-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => { 
                if (event.key === 'Enter' && !event.shiftKey) { 
                  event.preventDefault(); 
                  void submitQuestion(); 
                } 
              }}
              maxLength={2000}
              rows={3}
              placeholder="E.g. What does verifySessionToken do? Which components depend on jwt.ts? Why was token verification changed?"
              className="w-full resize-none bg-transparent p-3.5 pr-14 text-xs text-ink-primary outline-none placeholder:text-ink-faint leading-relaxed font-sans"
            />
            <div className="absolute right-2.5 bottom-2.5">
              <button
                type="submit"
                disabled={loading || question.trim().length < 3}
                aria-label={loading ? 'Searching repository evidence' : 'Ask question'}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-emerald text-ink-primary font-medium hover:bg-brand-deep hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              >
                {loading
                  ? <LoaderCircle className="w-4 h-4 animate-spin text-ink-primary" />
                  : <ArrowUp className="w-4 h-4 stroke-[2.5]" />}
              </button>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-ink-faint">
            <span>Press <kbd className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[10px] text-ink-muted border border-border-subtle">Enter</kbd> to ask · <kbd className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[10px] text-ink-muted border border-border-subtle">Shift + Enter</kbd> for newline</span>
          </div>
        </form>

        {/* Suggestion Chips */}
        {turns.length === 0 && (
          <div className="mt-4 pt-4 border-t border-border-subtle">
            <p className="mb-2 text-[11px] font-mono uppercase tracking-wider text-ink-faint">
              Suggested questions
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => { setQuestion(item); void submitQuestion(item); }}
                  disabled={loading}
                  className="rounded-md border border-border-subtle bg-surface-secondary px-3 py-1.5 text-xs text-ink-secondary hover:text-ink-primary hover:border-brand-emerald hover:bg-brand-emerald/5 transition-colors disabled:opacity-50 font-normal"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Loading State */}
      {loading && (
        <div role="status" className="flex items-center gap-3 rounded-xl border border-border-default bg-white p-4 shadow-xs">
          <LoaderCircle className="h-4 w-4 animate-spin text-brand-deep shrink-0" />
          <div>
            <p className="text-xs font-medium text-ink-primary">Scanning repository evidence…</p>
            <p className="text-[11px] text-ink-muted">Traversing AST call hierarchy, git revisions, and architectural boundaries</p>
          </div>
        </div>
      )}

      {/* Conversation History */}
      <div className="space-y-6" aria-live="polite">
        {turns.map(({ question: asked, response }) => (
          <article key={response.requestId} className="space-y-4">
            {/* User Question */}
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-xl border border-border-default bg-surface-secondary p-4 shadow-xs">
                <div className="flex items-center gap-2 mb-1 justify-end text-[11px] text-ink-muted">
                  <span className="font-mono">{response.questionKind.replaceAll('_', ' ')}</span>
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-ink-primary leading-relaxed">{asked}</p>
              </div>
            </div>

            {/* AI Response Card */}
            <div className="bg-white border border-border-default rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-brand-emerald/10 text-brand-deep flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-ink-primary">CodeWhy Synthesis</span>
                  <Badge variant={response.answerMode === 'ai' ? 'success' : 'outline'} size="sm">
                    {response.answerMode === 'ai' ? 'Grounded' : 'Evidence-only'}
                  </Badge>
                  {response.neo4jGrounded && (
                    <Badge variant="purple" size="sm">Neo4j Verified</Badge>
                  )}
                </div>

                {response.sarvamDetails && (
                  <span className="text-[11px] font-mono text-ink-muted">
                    {response.sarvamDetails.model}
                  </span>
                )}
              </div>

              {/* Answer Text */}
              <div className="text-xs sm:text-sm leading-relaxed text-ink-secondary space-y-3 font-normal">
                {response.answer.split('\n\n').map((paragraph, part) => (
                  <p key={part} className="whitespace-pre-wrap">{paragraph}</p>
                ))}
              </div>

              {response.sarvamDetails?.limitations && (
                <div className="text-[11px] text-ink-muted bg-surface-secondary p-2.5 rounded-lg border border-border-subtle">
                  <strong className="text-ink-secondary">Verification Scope:</strong> {response.sarvamDetails.limitations}
                </div>
              )}

              {/* Claims / Cited Evidence Links */}
              {response.claims.length > 0 && (
                <div className="bg-surface-secondary border border-border-subtle rounded-lg p-3.5 space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                    Evidence Assertions
                  </div>
                  <div className="space-y-1.5">
                    {response.claims.map((claim, claimIndex) => (
                      <div key={`${claim.evidenceIds.join('-')}-${claimIndex}`} className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant={claim.directness === 'direct' ? 'success' : 'warning'} size="sm">
                          {claim.directness === 'direct' ? 'Direct AST' : 'Inferred'}
                        </Badge>
                        <div className="inline-flex gap-1.5 flex-wrap">
                          {claim.evidenceIds.map((id) => (
                            <a
                              key={id}
                              href={`#evidence-${response.requestId}-${id}`}
                              className="rounded bg-white px-2 py-0.5 font-mono text-[11px] font-medium text-brand-deep border border-border-default hover:border-brand-emerald transition-colors"
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

              {/* Evidence Citations */}
              <section aria-label="Supporting evidence" className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-ink-primary">
                    Supporting Citations ({response.evidence.length})
                  </h3>
                </div>

                {response.evidence.length > 0 ? (
                  <div className="space-y-2.5">
                    {groupEvidence(response.evidence).map((group) => (
                      <div key={group.key} className="space-y-2">
                        <div className="text-[11px] font-mono uppercase text-ink-faint px-1">
                          {group.label}
                        </div>
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
                  <div className="rounded-lg border border-dashed border-border-default p-4 text-center text-xs text-ink-faint">
                    No supporting source records retrieved for this query.
                  </div>
                )}
              </section>

              {/* Follow-up Questions */}
              {response.followUpQuestions.length > 0 && (
                <div className="pt-3 border-t border-border-subtle">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-ink-faint mb-2">
                    Suggested follow-up inquiries
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {response.followUpQuestions.map((followUp) => (
                      <button
                        key={followUp}
                        type="button"
                        onClick={() => { setQuestion(followUp); void submitQuestion(followUp); }}
                        disabled={loading}
                        className="rounded-md border border-border-subtle bg-surface-secondary px-2.5 py-1 text-xs text-ink-secondary hover:text-ink-primary hover:border-brand-emerald hover:bg-brand-emerald/5 transition-colors disabled:opacity-50"
                      >
                        {followUp} &rarr;
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* Empty State */}
      {turns.length === 0 && !loading && (
        <div className="rounded-xl border border-dashed border-border-default bg-white p-12 text-center">
          <div className="mx-auto w-10 h-10 rounded-lg bg-surface-muted text-ink-muted flex items-center justify-center mb-3">
            <Bot className="w-5 h-5 text-brand-deep" />
          </div>
          <h2 className="text-sm font-semibold text-ink-primary mb-1">Ask your first question</h2>
          <p className="text-xs text-ink-muted max-w-sm mx-auto mb-5">
            Grounded code evidence, callers, and architectural context will be synthesized here.
          </p>
          <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
            {SUGGESTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => { setQuestion(item); void submitQuestion(item); }}
                disabled={loading}
                className="rounded-md border border-border-subtle bg-surface-secondary px-2.5 py-1 text-xs text-ink-secondary hover:text-ink-primary hover:border-brand-emerald transition-colors"
              >
                {item}
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