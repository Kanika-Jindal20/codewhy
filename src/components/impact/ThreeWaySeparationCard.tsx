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
    <div className="bg-white border border-app-border rounded-2xl p-6 sm:p-7 shadow-xs">
      <div className="mb-5 pb-4 border-b border-app-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-[#25324B]">
            Three-Way Intelligence Source Separation
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            CodeWhy explicitly separates compiler-verified facts from statistical heuristics and AI explanations so engineers know what to trust.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#F8FAFC] text-text-secondary border border-app-border self-start sm:self-auto">
          3-Tier Provenance
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Statically Identified Relationships */}
        <div className="bg-gradient-to-b from-[#F0FDF4] to-[#DCFCE7]/40 border border-[#86EFAC] rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-extrabold text-[#14532D] flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#16A34A] text-white flex items-center justify-center shadow-2xs">
                  <Cpu className="w-4 h-4 stroke-[2.5]" />
                </div>
                Static AST Analysis
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white text-[#16A34A] border border-[#86EFAC] shadow-2xs uppercase tracking-wider">
                100% Grounded
              </span>
            </div>
            <p className="text-[11px] text-[#166534] mb-3.5 leading-relaxed font-medium">
              Extracted directly from code syntax trees, import declarations, and verified call sites.
            </p>
            <ul className="space-y-2 text-xs text-[#14532D]">
              {staticAnalysis.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-white/70 p-2 rounded-lg border border-[#BBF7D0]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                  <span className="leading-snug font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 2. Heuristic Suggestions */}
        <div className="bg-gradient-to-b from-[#FAF5FF] to-[#F3E8FF]/40 border border-[#D8B4FE] rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-extrabold text-[#581C87] flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#8B5CF6] text-white flex items-center justify-center shadow-2xs">
                  <Compass className="w-4 h-4 stroke-[2.5]" />
                </div>
                History & Heuristics
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white text-[#8B5CF6] border border-[#D8B4FE] shadow-2xs uppercase tracking-wider">
                Statistical
              </span>
            </div>
            <p className="text-[11px] text-[#6B21A8] mb-3.5 leading-relaxed font-medium">
              Mined from Git commit co-changes, convention-based test suites, and issue logs.
            </p>
            <ul className="space-y-2 text-xs text-[#581C87]">
              {heuristicSuggestions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-white/70 p-2 rounded-lg border border-[#E9D5FF]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0 mt-0.5" />
                  <span className="leading-snug font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 3. AI & Rule Interpretations */}
        <div className="bg-gradient-to-b from-[#EFF6FF] to-[#DBEAFE]/40 border border-[#93C5FD] rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-extrabold text-[#1E3A8A] flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#3B82F6] text-white flex items-center justify-center shadow-2xs">
                  <Bot className="w-4 h-4 stroke-[2.5]" />
                </div>
                AI Context & Logic
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white text-[#3B82F6] border border-[#93C5FD] shadow-2xs uppercase tracking-wider">
                Synthesized
              </span>
            </div>
            <p className="text-[11px] text-[#1D4ED8] mb-3.5 leading-relaxed font-medium">
              Synthesized behavioral assessments, edge-case risks, and suggested manual checklists.
            </p>
            <ul className="space-y-2 text-xs text-[#1E3A8A]">
              {aiInterpretations.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-white/70 p-2 rounded-lg border border-[#BFDBFE]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#3B82F6] shrink-0 mt-0.5" />
                  <span className="leading-snug font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
