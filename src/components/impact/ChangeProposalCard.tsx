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
    <div className="bg-app-panel border border-app-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          2. Define Proposed Change for <span className="text-text-primary font-mono">{targetLabel}</span>
        </label>
        <span className="text-[11px] text-text-muted">Grounded Blast-Radius Analysis</span>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
        {CATEGORIES.map((cat) => {
          const isSelected = category === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'bg-accent-primary/10 border-accent-primary ring-1 ring-accent-primary/50'
                  : 'bg-app-surface/50 border-app-border hover:bg-app-surface hover:border-text-muted'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {cat.icon}
                <span className="text-xs font-semibold text-text-primary">
                  {cat.label}
                </span>
              </div>
              <p className="text-[11px] text-text-muted leading-snug">
                {cat.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Description Field */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          Proposed Change Description & Intent
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="E.g., Update verifySessionToken() to asynchronously validate key rotations and return Promise<Result<UserSession>> instead of plain object..."
          className="w-full bg-app-surface border border-app-border rounded-md p-2.5 text-xs text-text-primary placeholder-text-muted font-sans focus:outline-none focus:ring-1 focus:ring-accent-primary"
        />
      </div>

      {/* Depth & Action Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-app-border">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span>Max Transitive Hops:</span>
          <select
            value={maxDepth}
            onChange={(e) => onMaxDepthChange(Number(e.target.value))}
            className="bg-app-surface border border-app-border rounded px-2 py-1 text-xs text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-accent-primary"
          >
            <option value={2}>2 Hops (Direct + Immediate Consumers)</option>
            <option value={4}>4 Hops (Standard Propagation)</option>
            <option value={6}>6 Hops (Deep System Reach)</option>
          </select>
        </div>

        <Button
          onClick={onSubmit}
          isLoading={isLoading}
          variant="primary"
          size="md"
          icon={<Sparkles className="w-4 h-4" />}
        >
          Calculate Blast Radius
        </Button>
      </div>
    </div>
  );
};
