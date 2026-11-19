'use client';

import React, { useState } from 'react';
import { Send, Sparkles, HelpCircle, AlertCircle, Loader2 } from 'lucide-react';
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

  const getCategoryBadgeClass = (category: FollowUpSuggestion['category']) => {
    switch (category) {
      case 'tests':
        return 'bg-status-warning/15 text-status-warning border-status-warning/30';
      case 'commit_history':
        return 'bg-accent-secondary/15 text-accent-secondary border-accent-secondary/30';
      case 'dependents':
        return 'bg-accent-primary/15 text-accent-primary border-accent-primary/30';
      case 'decisions':
        return 'bg-status-info/15 text-status-info border-status-info/30';
      default:
        return 'bg-app-surface text-text-muted border-app-border';
    }
  };

  return (
    <div className="bg-app-panel border border-app-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent-secondary" />
          Continue Investigation — Grounded Follow-up
        </h4>
        <span className="text-[11px] text-text-muted font-mono">
          Context preserved across inquiries
        </span>
      </div>

      {/* Suggested Follow-up chips */}
      {suggestions.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider font-mono text-text-muted block">
            Suggested Next Inquiries (Based on Current AST & Commit Evidence):
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((sug) => (
              <button
                key={sug.id}
                onClick={() => {
                  setQuestion(sug.question);
                  handleSubmit(sug.question);
                }}
                disabled={isLoading}
                className="text-left text-xs p-2 rounded-lg bg-app-surface/60 hover:bg-app-surface border border-app-border hover:border-accent-primary/50 transition-all flex items-start gap-2 max-w-xl group"
              >
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase shrink-0 mt-0.5 ${getCategoryBadgeClass(
                    sug.category
                  )}`}
                >
                  {sug.category.replace(/_/g, ' ')}
                </span>
                <span className="text-text-secondary group-hover:text-text-primary leading-tight font-medium">
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
            className="w-full px-3 py-2.5 bg-app-surface border border-app-border rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary resize-none font-mono"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-text-muted font-mono">
            Press <kbd className="px-1 py-0.5 bg-app-bg border border-app-border rounded">Enter</kbd> to submit
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
        <div className="p-2.5 bg-status-error/10 border border-status-error/30 rounded text-status-error text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
