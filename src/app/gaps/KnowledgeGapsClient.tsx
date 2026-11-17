'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink, 
  Zap, 
  Compass,
  FileCode,
  Info,
  FolderGit2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useActiveRepo } from '@/lib/repositories/active-repo-client';

export function KnowledgeGapsClient() {
  const { activeRepo } = useActiveRepo();
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'high' | 'medium'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [gaps, setGaps] = useState<any[]>([]);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/gaps?repoId=${encodeURIComponent(activeRepo.repoId)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.gaps)) {
          setGaps(data.gaps);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [activeRepo.repoId]);

  const filteredGaps = filterSeverity === 'all' 
    ? gaps 
    : gaps.filter(g => g.severity === filterSeverity);

  const highCount = gaps.filter(g => g.severity === 'high').length;
  const mediumCount = gaps.filter(g => g.severity === 'medium').length;
  const debtScore = Math.min(100, Math.round((highCount * 25 + mediumCount * 12)));
  const debtTier = debtScore > 50 ? 'Elevated Debt' : debtScore > 15 ? 'Moderate Debt' : 'Healthy';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Page Header */}
      <div className="bg-white border border-border-default rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-brand-emerald/10 text-brand-deep border border-brand-emerald/20">
              <ShieldAlert className="w-3 h-3 text-brand-emerald" />
              Technical Debt Audit
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-muted text-ink-muted border border-border-subtle font-mono">
              AST Verified
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink-primary tracking-tight">
            Knowledge Gaps & Technical Debt
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl">
            Detect undocumented architectural decisions, blind spots, and missing test specifications across the codebase.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <div className="flex items-center gap-2 rounded-lg border border-border-default bg-surface-secondary px-3 py-1.5 text-xs text-ink-secondary">
            <FolderGit2 className="w-3.5 h-3.5 text-ink-muted" />
            <span className="font-mono font-medium">{activeRepo.repoName}</span>
          </div>
        </div>
      </div>

      {/* Debt Score + Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Debt Score Widget */}
        <div className="bg-white border border-border-default rounded-xl p-5 shadow-xs flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-faint mb-1">
            Debt Score
          </span>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-4xl font-semibold font-mono text-ink-primary">{debtScore}</span>
            <span className="text-xs font-mono text-ink-faint">/ 100</span>
          </div>
          <Badge
            variant={debtScore > 50 ? 'error' : debtScore > 15 ? 'warning' : 'success'}
            size="sm"
          >
            {debtTier}
          </Badge>
          <p className="text-[11px] text-ink-muted mt-2 leading-tight">
            Derived from commit churn & missing test fixtures
          </p>
        </div>

        {/* Total Gaps */}
        <div className="bg-white border border-border-default rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-ink-faint">
              Total Gaps
            </span>
            <FileText className="w-4 h-4 text-ink-muted" />
          </div>
          <div>
            <div className="text-2xl font-semibold font-mono text-ink-primary">{gaps.length}</div>
            <div className="text-xs text-ink-muted mt-0.5">Identified blind spots</div>
          </div>
        </div>

        {/* High Severity */}
        <div className="bg-white border border-border-default rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-rose-600">
              High Severity
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <div className="text-2xl font-semibold font-mono text-rose-600">{highCount}</div>
            <div className="text-xs text-ink-muted mt-0.5">Requires immediate attention</div>
          </div>
        </div>

        {/* Medium Severity */}
        <div className="bg-white border border-border-default rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-600">
              Medium Severity
            </span>
            <Info className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-semibold font-mono text-amber-600">{mediumCount}</div>
            <div className="text-xs text-ink-muted mt-0.5">Recommended to resolve soon</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterSeverity('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            filterSeverity === 'all'
              ? 'bg-ink-primary text-white border border-ink-primary'
              : 'bg-surface-secondary text-ink-muted hover:text-ink-primary border border-border-subtle'
          }`}
        >
          All Gaps ({gaps.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterSeverity('high')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            filterSeverity === 'high'
              ? 'bg-rose-600 text-white border border-rose-600'
              : 'bg-surface-secondary text-ink-muted hover:text-ink-primary border border-border-subtle'
          }`}
        >
          High Severity ({highCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterSeverity('medium')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            filterSeverity === 'medium'
              ? 'bg-amber-600 text-white border border-amber-600'
              : 'bg-surface-secondary text-ink-muted hover:text-ink-primary border border-border-subtle'
          }`}
        >
          Medium Severity ({mediumCount})
        </button>
      </div>

      {/* Gaps List */}
      <section className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-xl border border-border-default p-8 text-center text-xs text-ink-muted animate-pulse">
            Auditing codebase knowledge gaps...
          </div>
        ) : filteredGaps.length === 0 ? (
          <div className="bg-white border border-dashed border-border-default rounded-xl p-12 text-center">
            <CheckCircle2 className="w-8 h-8 text-brand-deep mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-ink-primary">No gaps detected</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Your codebase has no knowledge gaps matching this filter.
            </p>
          </div>
        ) : (
          filteredGaps.map((gap) => (
            <div
              key={gap.id}
              className="bg-white rounded-xl border border-border-default shadow-xs overflow-hidden hover:border-border-strong transition-all"
            >
              <div className="p-5 border-b border-border-subtle">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={gap.severity === 'high' ? 'error' : 'warning'}
                        size="sm"
                      >
                        {gap.severity}
                      </Badge>
                      <span className="text-[11px] font-mono text-ink-muted bg-surface-secondary px-2 py-0.5 rounded border border-border-subtle">
                        {gap.rule}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-ink-primary">
                      {gap.title}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs font-mono text-ink-muted">
                      <FileCode className="w-3.5 h-3.5 text-ink-faint shrink-0" />
                      <span className="truncate">{gap.filePath}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link href="/impact">
                      <Button variant="secondary" size="xs" icon={<Zap className="w-3 h-3 text-brand-deep" />}>
                        Blast Radius
                      </Button>
                    </Link>
                    <Link href="/architecture">
                      <Button variant="outline" size="xs" icon={<Compass className="w-3 h-3" />}>
                        Architecture
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3 bg-surface-secondary/40">
                <div className="rounded-lg p-3 border border-border-subtle bg-white space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-primary">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Why It Matters</span>
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed pl-5">
                    {gap.developerImpact}
                  </p>
                </div>

                <div className="rounded-lg p-3 border border-border-subtle bg-white space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-primary">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-deep" />
                    <span>How to Fix</span>
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed pl-5">
                    {gap.suggestedRemediation}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}