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
    <div className="bg-app-panel border border-app-border rounded-lg p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-text-primary">
          Intelligence Source Separation
        </h3>
        <p className="text-xs text-text-muted mt-0.5">
          CodeWhy strictly categorizes insights by verification method to eliminate hallucinated assumptions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Statically Identified Relationships */}
        <div className="bg-app-surface/50 border border-app-border rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-status-success" />
                Static AST Analysis
              </span>
              <Badge variant="success" size="sm">Deterministic</Badge>
            </div>
            <p className="text-[11px] text-text-muted mb-3">
              Extracted directly from code syntax trees, import statements, and call sites.
            </p>
            <ul className="space-y-2 text-xs text-text-secondary">
              {staticAnalysis.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0 mt-0.5" />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 2. Heuristic Suggestions */}
        <div className="bg-app-surface/50 border border-app-border rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-accent-secondary" />
                History & Heuristics
              </span>
              <Badge variant="purple" size="sm">Statistical</Badge>
            </div>
            <p className="text-[11px] text-text-muted mb-3">
              Mined from Git commit co-changes, convention-based test suites, and issue logs.
            </p>
            <ul className="space-y-2 text-xs text-text-secondary">
              {heuristicSuggestions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-secondary shrink-0 mt-0.5" />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 3. AI & Rule Interpretations */}
        <div className="bg-app-surface/50 border border-app-border rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-status-info" />
                AI Context & Logic
              </span>
              <Badge variant="info" size="sm">Interpreted</Badge>
            </div>
            <p className="text-[11px] text-text-muted mb-3">
              Synthesized behavioral assessments, edge-case risks, and suggested manual checklists.
            </p>
            <ul className="space-y-2 text-xs text-text-secondary">
              {aiInterpretations.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-info shrink-0 mt-0.5" />
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
