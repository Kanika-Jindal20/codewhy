'use client';

import React from 'react';
import { Sparkles, AlertOctagon, Wrench, Clock, Sliders, ArrowUpRight } from 'lucide-react';
import { ChangeCategory } from '@/types/impact';
import { Button } from '@/components/ui/Button';

interface ChangeProposalCardProps {
  category: ChangeCategory;
  onCategoryChange: (cat: ChangeCategory) => void;
  description: string;
  onDescriptionChange: (desc: string) => void;
  maxDepth: number;
  onMaxDepthChange: (depth: number) => void;
  onSubmit: () => void;
  isLoading: boolean;
  targetLabel: string;
}

export const ChangeProposalCard: React.FC<ChangeProposalCardProps> = ({
  category,
  onCategoryChange,
  description,
  onDescriptionChange,
  maxDepth,
  onMaxDepthChange,
  onSubmit,
  isLoading,
  targetLabel,
}) => {
  const CATEGORIES: { id: ChangeCategory; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'breaking_interface',
      label: 'Breaking Interface',
      desc: 'Alters exported function signatures, parameter types, or return shapes.',
      icon: <AlertOctagon className="w-4 h-4 text-status-error" />,
    },
    {
      id: 'internal_refactor',
      label: 'Internal Refactor',
      desc: 'Optimizes logic or internal state while maintaining public contracts.',
      icon: <Wrench className="w-4 h-4 text-status-success" />,
    },
    {
      id: 'deprecation',
      label: 'Deprecation',
      desc: 'Flags symbols as obsolete and provides migration notices.',
      icon: <Clock className="w-4 h-4 text-status-warning" />,
    },
    {
      id: 'config_alteration',
      label: 'Config Alteration',
      desc: 'Renames or alters environment variables, secrets, or configuration schemas.',
      icon: <Sliders className="w-4 h-4 text-accent-secondary" />,
    },
    {
      id: 'dependency_update',
      label: 'Dependency Update',
      desc: 'Upgrades third-party library or internal shared packages.',
      icon: <ArrowUpRight className="w-4 h-4 text-status-info" />,
    },
  ];

  return (
    <div className="bg-white border border-app-border rounded-2xl p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-app-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#EEE9FF] text-[#5546B8] text-xs font-bold">2</span>
            <h2 className="text-sm font-bold text-[#25324B]">
              Define Proposed Modification for <span className="font-mono text-[#4169E1]">{targetLabel}</span>
            </h2>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Classify how this symbol will be modified to determine which downstream consumers break
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E5EDFF] text-[#4169E1] border border-[#C9D9FF] self-start sm:self-auto">
          Deterministic Traversal
        </span>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        {CATEGORIES.map((cat) => {
          const isSelected = category === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-[#E5EDFF] border-[#4169E1] ring-2 ring-[#4169E1]/20 shadow-xs'
                  : 'bg-white border-app-border hover:bg-[#F8FAFC] hover:border-[#C9D9FF]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`p-1.5 rounded-lg ${isSelected ? 'bg-white shadow-2xs' : 'bg-[#F8FAFC] border border-app-border'}`}>
                  {cat.icon}
                </span>
                <span className="text-xs font-bold text-[#25324B]">
                  {cat.label}
                </span>
              </div>
              <p className="text-[11px] text-text-secondary leading-snug pl-8">
                {cat.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Description Field */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-[#25324B] mb-1.5">
          Proposed Change Description & Intent
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="E.g., Update verifySessionToken() to asynchronously validate key rotations and return Promise<Result<UserSession>> instead of plain object..."
          className="w-full bg-[#F8FAFC] border border-app-border rounded-xl p-3 text-xs text-text-primary placeholder:text-text-muted font-sans focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/15 focus:bg-white transition-all shadow-2xs leading-relaxed"
        />
      </div>

      {/* Depth & Action Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-app-border">
        <div className="flex items-center gap-2.5 text-xs text-text-secondary">
          <span className="font-semibold text-text-primary">Max Transitive Depth:</span>
          <select
            value={maxDepth}
            onChange={(e) => onMaxDepthChange(Number(e.target.value))}
            className="bg-[#F8FAFC] border border-app-border rounded-lg px-3 py-1.5 text-xs text-text-primary font-semibold focus:outline-none focus:border-[#4169E1] focus:ring-1 focus:ring-[#4169E1]/20 shadow-2xs"
          >
            <option value={2}>2 Hops — Direct Callers + Immediate Consumers</option>
            <option value={4}>4 Hops — Standard Propagation (Recommended)</option>
            <option value={6}>6 Hops — Deep Transitive Reach (Full System)</option>
          </select>
        </div>

        <Button
          onClick={onSubmit}
          isLoading={isLoading}
          variant="primary"
          size="md"
          icon={<Sparkles className="w-4 h-4 stroke-[2]" />}
          className="shadow-sm"
        >
          Compute Blast Radius
        </Button>
      </div>
    </div>
  );
};
