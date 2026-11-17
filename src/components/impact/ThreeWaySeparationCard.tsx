'use client';

import React from 'react';
import { Cpu, Compass, Bot, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface ThreeWaySeparationProps {
  staticAnalysis: string[];
  heuristicSuggestions: string[];
  aiInterpretations: string[];
}

export const ThreeWaySeparationCard: React.FC<ThreeWaySeparationProps> = ({
  staticAnalysis,
  heuristicSuggestions,
  aiInterpretations,
}) => {
  return (
    <div className="bg-white border border-border-default rounded-xl p-5 sm:p-6 shadow-xs">
      <div className="mb-4 pb-3 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-ink-primary">
            Three-Way Intelligence Source Separation
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            CodeWhy explicitly separates compiler-verified AST facts from statistical Git heuristics and LLM synthesis.
          </p>
        </div>
        <span className="text-[11px] font-mono text-ink-faint px-2 py-0.5 rounded bg-surface-secondary border border-border-subtle self-start sm:self-auto">
          3-Tier Provenance
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Statically Identified Relationships */}
        <div className="bg-surface-secondary border border-border-default rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-ink-primary flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-brand-emerald/10 text-brand-deep flex items-center justify-center">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                Static AST Analysis
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-brand-emerald/10 text-brand-deep border border-brand-emerald/20 uppercase tracking-wider">
                AST Grounded
              </span>
            </div>
            <p className="text-[11px] text-ink-muted mb-3 leading-relaxed">
              Extracted directly from code syntax trees, import declarations, and call sites.
            </p>
            <ul className="space-y-1.5 text-xs text-ink-secondary">
              {staticAnalysis.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-white p-2 rounded border border-border-subtle">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-deep shrink-0 mt-0.5" />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 2. Heuristic Suggestions */}
        <div className="bg-surface-secondary border border-border-default rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-ink-primary flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Compass className="w-3.5 h-3.5" />
                </div>
                Git Heuristics
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wider">
                Statistical
              </span>
            </div>
            <p className="text-[11px] text-ink-muted mb-3 leading-relaxed">
              Mined from Git commit co-changes, convention-based test suites, and commit logs.
            </p>
            <ul className="space-y-1.5 text-xs text-ink-secondary">
              {heuristicSuggestions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-white p-2 rounded border border-border-subtle">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 3. AI & Rule Interpretations */}
        <div className="bg-surface-secondary border border-border-default rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-ink-primary flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                AI Synthesis
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                Synthesized
              </span>
            </div>
            <p className="text-[11px] text-ink-muted mb-3 leading-relaxed">
              Synthesized behavioral assessments, edge-case risks, and suggested manual checklists.
            </p>
            <ul className="space-y-1.5 text-xs text-ink-secondary">
              {aiInterpretations.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-white p-2 rounded border border-border-subtle">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};