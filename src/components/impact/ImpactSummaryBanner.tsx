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
      title: 'Potential Impact',
      label: 'Blast Radius',
      value: summary.totalAffected,
      icon: <Layers className="w-4 h-4 text-brand-deep" />,
      explanation: 'Total affected entities in downstream graph',
    },
    {
      title: 'Direct Dependents',
      label: '1st Hop',
      value: summary.directCount,
      icon: <ArrowRightLeft className="w-4 h-4 text-emerald-600" />,
      explanation: 'Direct callers invoking this interface',
    },
    {
      title: 'Transitive Reach',
      label: 'Multi-Hop',
      value: summary.transitiveCount,
      icon: <GitFork className="w-4 h-4 text-purple-600" />,
      explanation: 'Indirect consumers 2+ hops away',
    },
    {
      title: 'Test Specs',
      label: 'Coverage',
      value: summary.testCount,
      icon: <TestTube className="w-4 h-4 text-amber-600" />,
      explanation: 'Automated test suites covering paths',
    },
    {
      title: 'Config Schemas',
      label: 'Environment',
      value: summary.configCount,
      icon: <Settings className="w-4 h-4 text-sky-600" />,
      explanation: 'Gateways, routes & config bindings',
    },
    {
      title: 'Co-Change History',
      label: 'Git History',
      value: summary.coChangeCount,
      icon: <History className="w-4 h-4 text-indigo-600" />,
      explanation: 'Files committed together historically',
    },
  ];

  return (
    <div className="bg-white border border-border-default rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header with Title and Confidence */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base font-semibold text-ink-primary">
              Impact Analysis Summary
            </h2>
            <Badge variant="purple" size="sm">
              {proposedChange.category.replace(/_/g, ' ')}
            </Badge>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed max-w-3xl">
            {summary.overview}
          </p>
        </div>

        <div className="shrink-0">
          <ConfidenceBadge level={confidence.level} score={confidence.score} />
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATS.map((stat) => (
          <div
            key={stat.title}
            className="bg-surface-secondary border border-border-subtle rounded-lg p-3.5 flex flex-col justify-between transition-all hover:border-border-default"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-ink-faint uppercase tracking-wider">
                {stat.label}
              </span>
              {stat.icon}
            </div>
            <div>
              <div className="text-xl font-semibold font-mono text-ink-primary">
                {stat.value}
              </div>
              <div className="text-xs font-medium text-ink-secondary mt-0.5">
                {stat.title}
              </div>
              <div className="text-[10px] text-ink-muted leading-tight mt-1">
                {stat.explanation}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Descriptive disclaimer on static AST certainty */}
      <div className="flex items-center gap-2 text-xs text-ink-muted bg-surface-secondary px-3.5 py-2.5 rounded-lg border border-border-subtle">
        <Info className="w-3.5 h-3.5 text-brand-deep shrink-0" />
        <span className="leading-relaxed">
          <strong className="text-ink-primary font-medium">Grounded Static Analysis:</strong> Components are flagged based on verified AST syntax relations and repository commit records. Dynamic reflection and runtime imports should be reviewed manually.
        </span>
      </div>
    </div>
  );
};