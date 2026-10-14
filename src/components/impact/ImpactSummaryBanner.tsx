'use client';

import React from 'react';
import { Layers, ArrowRightLeft, GitFork, TestTube, Settings, History, Info } from 'lucide-react';
import { ImpactAnalysisResult } from '@/types/impact';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { Badge } from '@/components/ui/Badge';

interface ImpactSummaryBannerProps {
  result: ImpactAnalysisResult;
}

export const ImpactSummaryBanner: React.FC<ImpactSummaryBannerProps> = ({ result }) => {
  const { summary, confidence, proposedChange } = result;

  const STATS = [
    {
      label: 'Potentially Affected',
      value: summary.totalAffected,
      icon: <Layers className="w-4 h-4 text-accent-primary" />,
      sub: 'All categories',
    },
    {
      label: 'Direct Dependents',
      value: summary.directCount,
      icon: <ArrowRightLeft className="w-4 h-4 text-status-error" />,
      sub: 'Direct AST consumers',
    },
    {
      label: 'Transitive Reach',
      value: summary.transitiveCount,
      icon: <GitFork className="w-4 h-4 text-accent-secondary" />,
      sub: '2+ hops downstream',
    },
    {
      label: 'Test Suites',
      value: summary.testCount,
      icon: <TestTube className="w-4 h-4 text-status-warning" />,
      sub: 'Relevant test coverage',
    },
    {
      label: 'Configuration Files',
      value: summary.configCount,
      icon: <Settings className="w-4 h-4 text-text-muted" />,
      sub: 'Env & route schemas',
    },
    {
      label: 'Historical Co-Changes',
      value: summary.coChangeCount,
      icon: <History className="w-4 h-4 text-status-info" />,
      sub: 'Frequently committed together',
    },
  ];

  return (
    <div className="bg-app-panel border border-app-border rounded-lg p-5">
      {/* Header with Title and Confidence */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base font-bold text-text-primary">
              Impact Analysis Summary
            </h2>
            <Badge variant="purple" size="sm">
              {proposedChange.category.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            {summary.overview}
          </p>
        </div>

        <div className="shrink-0">
          <ConfidenceBadge level={confidence.level} score={confidence.score} />
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-3">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="bg-app-surface/60 border border-app-border rounded-lg p-3 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="text-[11px] font-medium truncate">{stat.label}</span>
              {stat.icon}
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-text-primary">
                {stat.value}
              </div>
              <div className="text-[10px] text-text-muted truncate mt-0.5">
                {stat.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer on language & certainty */}
      <div className="flex items-center gap-2 text-[11px] text-text-muted bg-app-surface/30 px-3 py-1.5 rounded border border-app-border/40 font-mono">
        <Info className="w-3.5 h-3.5 text-accent-primary shrink-0" />
        <span>
          Note: Components are marked &ldquo;potentially affected&rdquo; based on static AST dependencies and Git history. Runtime dynamic calls or reflection require manual verification.
        </span>
      </div>
    </div>
  );
};
