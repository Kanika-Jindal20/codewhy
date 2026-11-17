'use client';

import React, { useState } from 'react';
import { Send, Sparkles, AlertCircle } from 'lucide-react';
import { FollowUpSuggestion } from '@/types/investigation';
import { Button } from '@/components/ui/Button';

interface FollowUpComposerProps {
  suggestions: FollowUpSuggestion[];
  onAskFollowUp: (question: string) => Promise<void>;
  isLoading: boolean;
}

export const FollowUpComposer: React.FC<FollowUpComposerProps> = ({
  suggestions,
  onAskFollowUp,
  isLoading,
}) => {
  const [question, setQuestion] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (qToSend?: string) => {
    const text = (qToSend || question).trim();
    if (!text || isLoading) return;

    setError(null);
    try {
      await onAskFollowUp(text);
      setQuestion('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to append follow-up.');
    }
  };

  return (
    <div className="bg-white border border-border-default rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
        <h4 className="text-xs font-semibold text-ink-primary flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-brand-deep" />
          Continue Investigation — Grounded Follow-up
        </h4>
        <span className="text-[10px] text-ink-faint font-mono">
          Context preserved
        </span>
      </div>

      {/* Suggested Follow-up chips */}
      {suggestions.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider font-mono text-ink-faint block">
            Suggested Next Inquiries:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((sug) => (
              <button
                key={sug.id}
                onClick={() => {
                  setQuestion(sug.question);
                  handleSubmit(sug.question);
                }}
                disabled={isLoading}
                className="text-left text-xs p-2 rounded-lg bg-surface-secondary hover:bg-surface-muted border border-border-subtle hover:border-brand-emerald transition-all flex items-start gap-2 max-w-xl group"
              >
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-muted text-ink-muted border border-border-subtle uppercase shrink-0 mt-0.5">
                  {sug.category.replace(/_/g, ' ')}
                </span>
                <span className="text-ink-secondary group-hover:text-ink-primary leading-tight font-normal">
                  {sug.question}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Inquiry Input */}
      <div className="space-y-2 pt-1">
        <div className="relative">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ask a specific question (e.g. Which components call this? Are there test regressions?)..."
            disabled={isLoading}
            rows={2}
            className="w-full px-3 py-2 bg-surface-secondary border border-border-default rounded-lg text-xs text-ink-primary placeholder:text-ink-faint focus:outline-none focus:border-brand-emerald focus:bg-white resize-none font-sans"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-ink-faint font-mono">
            Press <kbd className="px-1 py-0.5 bg-surface-muted border border-border-subtle rounded">Enter</kbd> to submit
          </span>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSubmit()}
            isLoading={isLoading}
            disabled={!question.trim() || isLoading}
            icon={<Send className="w-3.5 h-3.5" />}
          >
            Ask Follow-up
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};