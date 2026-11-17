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
      icon: <AlertOctagon className="w-3.5 h-3.5 text-status-error" />,
    },
    {
      id: 'internal_refactor',
      label: 'Internal Refactor',
      desc: 'Optimizes logic or internal state while maintaining public contracts.',
      icon: <Wrench className="w-3.5 h-3.5 text-brand-deep" />,
    },
    {
      id: 'deprecation',
      label: 'Deprecation',
      desc: 'Flags symbols as obsolete and provides migration notices.',
      icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
    },
    {
      id: 'config_alteration',
      label: 'Config Alteration',
      desc: 'Renames or alters environment variables, secrets, or configuration schemas.',
      icon: <Sliders className="w-3.5 h-3.5 text-purple-600" />,
    },
    {
      id: 'dependency_update',
      label: 'Dependency Update',
      desc: 'Upgrades third-party library or internal shared packages.',
      icon: <ArrowUpRight className="w-3.5 h-3.5 text-indigo-600" />,
    },
  ];

  return (
    <div className="bg-white border border-border-default rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-surface-muted text-ink-muted text-xs font-mono font-medium">2</span>
            <h2 className="text-sm font-semibold text-ink-primary">
              Proposed Change for <span className="font-mono text-brand-deep">{targetLabel}</span>
            </h2>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Classify how this symbol will be modified to determine which downstream consumers break
          </p>
        </div>
        <span className="text-[11px] font-mono text-ink-faint px-2 py-0.5 rounded bg-surface-secondary border border-border-subtle self-start sm:self-auto">
          Deterministic Traversal
        </span>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-4">
        {CATEGORIES.map((cat) => {
          const isSelected = category === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'bg-brand-emerald/5 border-brand-emerald ring-1 ring-brand-emerald/20 shadow-xs'
                  : 'bg-white border-border-subtle hover:bg-surface-secondary hover:border-border-default'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`p-1 rounded ${isSelected ? 'bg-white shadow-2xs' : 'bg-surface-muted'}`}>
                  {cat.icon}
                </span>
                <span className="text-xs font-medium text-ink-primary">
                  {cat.label}
                </span>
              </div>
              <p className="text-[11px] text-ink-muted leading-snug pl-7">
                {cat.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Description Field */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-ink-primary mb-1.5">
          Change Description & Intent
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="E.g., Update verifySessionToken() to asynchronously validate key rotations and return Promise<Result<UserSession>>..."
          className="w-full bg-surface-secondary border border-border-default rounded-lg p-3 text-xs text-ink-primary placeholder:text-ink-faint font-sans focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/20 focus:bg-white transition-all leading-relaxed"
        />
      </div>

      {/* Depth & Action Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3.5 border-t border-border-subtle">
        <div className="flex items-center gap-2.5 text-xs text-ink-muted">
          <span className="font-medium text-ink-primary">Max Traversal Depth:</span>
          <select
            value={maxDepth}
            onChange={(e) => onMaxDepthChange(Number(e.target.value))}
            className="bg-surface-secondary border border-border-default rounded-md px-2.5 py-1 text-xs text-ink-primary font-medium focus:outline-none focus:border-brand-emerald"
          >
            <option value={2}>2 Hops — Direct Callers</option>
            <option value={4}>4 Hops — Standard Propagation</option>
            <option value={6}>6 Hops — Full System Reach</option>
          </select>
        </div>

        <Button
          onClick={onSubmit}
          isLoading={isLoading}
          variant="primary"
          size="sm"
          icon={<Sparkles className="w-3.5 h-3.5" />}
        >
          Compute Blast Radius
        </Button>
      </div>
    </div>
  );
};