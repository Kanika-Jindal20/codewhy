'use client';

import React from 'react';
import { Layers, ArrowRightLeft, GitFork, TestTube, Settings, History, Info, ShieldAlert } from 'lucide-react';
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
      value: `${summary.totalAffected} components`,
      count: summary.totalAffected,
      icon: <Layers className="w-4 h-4 text-[#3B82F6]" />,
      explanation: 'Components that may be affected if this change is made',
      bg: 'bg-white',
      border: 'border-blue-200',
      badgeColor: 'text-[#3B82F6]',
      badgeBg: 'bg-[#EBF2FF]',
    },
    {
      title: 'Direct Dependents',
      label: '1st Hop Callers',
      value: `${summary.directCount} direct`,
      count: summary.directCount,
      icon: <ArrowRightLeft className="w-4 h-4 text-emerald-600" />,
      explanation: 'Immediate callers that directly invoke this interface',
      bg: 'bg-white',
      border: 'border-emerald-200',
      badgeColor: 'text-emerald-700',
      badgeBg: 'bg-[#ECFDF5]',
    },
    {
      title: 'Transitive Reach',
      label: 'Multi-Hop Chain',
      value: `${summary.transitiveCount} indirect`,
      count: summary.transitiveCount,
      icon: <GitFork className="w-4 h-4 text-[#8B5CF6]" />,
      explanation: 'Downstream components 2+ hops away via call paths',
      bg: 'bg-white',
      border: 'border-purple-200',
      badgeColor: 'text-[#8B5CF6]',
      badgeBg: 'bg-[#F5F3FF]',
    },
    {
      title: 'Test Suites',
      label: 'Verification Specs',
      value: `${summary.testCount} tests`,
      count: summary.testCount,
      icon: <TestTube className="w-4 h-4 text-amber-600" />,
      explanation: 'Automated test suites covering these code paths',
      bg: 'bg-white',
      border: 'border-amber-200',
      badgeColor: 'text-amber-800',
      badgeBg: 'bg-[#FFFBEB]',
    },
    {
      title: 'Config Schemas',
      label: 'Route & Gateway',
      value: `${summary.configCount} configs`,
      count: summary.configCount,
      icon: <Settings className="w-4 h-4 text-sky-600" />,
      explanation: 'Environment, gateway, and routing configurations',
      bg: 'bg-white',
      border: 'border-sky-200',
      badgeColor: 'text-sky-700',
      badgeBg: 'bg-sky-50',
    },
    {
      title: 'Co-Change History',
      label: 'Git Habit Coupling',
      value: `${summary.coChangeCount} paired`,
      count: summary.coChangeCount,
      icon: <History className="w-4 h-4 text-indigo-600" />,
      explanation: 'Files historically committed together in past PRs',
      bg: 'bg-white',
      border: 'border-indigo-200',
      badgeColor: 'text-indigo-700',
      badgeBg: 'bg-indigo-50',
    },
  ];

  return (
    <div className="bg-white border border-app-border rounded-3xl p-6 sm:p-7 shadow-card space-y-6">
      {/* Header with Title and Confidence */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-app-border">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-1.5 rounded-lg bg-blue-500/15 text-[#3B82F6]">
              <Layers className="w-4 h-4 stroke-[2]" />
            </span>
            <h2 className="text-lg font-bold text-[#172033]">
              Impact Analysis Summary
            </h2>
            <Badge variant="purple" size="sm">
              {proposedChange.category.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            {summary.overview}
          </p>
        </div>

        <div className="shrink-0">
          <ConfidenceBadge level={confidence.level} score={confidence.score} />
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {STATS.map((stat) => (
          <div
            key={stat.title}
            className={`${stat.bg} ${stat.border} border rounded-2xl p-4 flex flex-col justify-between shadow-2xs transition-all hover:shadow-card hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${stat.badgeBg} ${stat.badgeColor}`}>
                {stat.label}
              </span>
              {stat.icon}
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#172033]">
                {stat.count}
              </div>
              <div className="text-xs font-bold text-text-primary mt-0.5">
                {stat.title}
              </div>
              <div className="text-[10px] text-text-secondary leading-snug mt-1 font-medium">
                {stat.explanation}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Descriptive disclaimer on static AST certainty */}
      <div className="flex items-center gap-2.5 text-xs text-text-secondary bg-[#F8FAFC] px-4 py-3 rounded-xl border border-app-border">
        <Info className="w-4 h-4 text-[#3B82F6] shrink-0" />
        <span className="leading-relaxed">
          <strong className="text-text-primary">Grounded Static Analysis:</strong> Components are flagged based on verified AST syntax relations and repository commit records. Dynamic reflection and runtime imports should be reviewed manually using the checklist below.
        </span>
      </div>
    </div>
  );
};
