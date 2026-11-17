'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, GitCommitHorizontal, History, LoaderCircle, Search, FolderGit2 } from 'lucide-react';
import { SAMPLE_REPO_ECOMMERCE } from '@/lib/graph/sample-repo';
import { useActiveRepo } from '@/lib/repositories/active-repo-client';
import type { DecisionTimelineEvent, DecisionTimelineStatus } from '@/types/timeline';
import type { EvidenceSource } from '@/types/evidence';
import { EvidenceCard } from '@/components/evidence/EvidenceCard';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';

const STATUS_OPTIONS: Array<{ value: DecisionTimelineStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'historical_event', label: 'Historical event' },
  { value: 'possible_decision', label: 'Possible decision' },
  { value: 'supported_decision', label: 'Supported decision' },
  { value: 'possible_supersession', label: 'Possible supersession' },
  { value: 'confirmed_supersession', label: 'Confirmed supersession' },
  { value: 'conflicting_evidence', label: 'Conflicting evidence' },
  { value: 'unresolved', label: 'Unresolved' },
];

const SOURCE_OPTIONS: Array<{ value: EvidenceSource['type'] | 'all'; label: string }> = [
  { value: 'all', label: 'All source types' },
  { value: 'commit', label: 'Commits' },
  { value: 'pull_request', label: 'Pull requests' },
  { value: 'doc', label: 'Documentation' },
  { value: 'file_span', label: 'Source files' },
  { value: 'ast_relation', label: 'Code relationships' },
  { value: 'config_reference', label: 'Configuration' },
  { value: 'test_coverage', label: 'Tests' },
  { value: 'co_change_history', label: 'Co-change history' },
];

interface TimelinePayload { 
  repoId: string; 
  repoName: string; 
  isDemoData: boolean; 
  events: DecisionTimelineEvent[]; 
  components?: Array<{ id: string; label: string }>; 
}

export function DecisionTimelineClient() {
  const [payload, setPayload] = useState<TimelinePayload | null>(null);
  const [status, setStatus] = useState<DecisionTimelineStatus | 'all'>('all');
  const [sourceType, setSourceType] = useState<EvidenceSource['type'] | 'all'>('all');
  const [componentId, setComponentId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeRepo } = useActiveRepo();
  const activeRepoId = activeRepo.repoId;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError(null);
      const params = new URLSearchParams({ repoId: activeRepoId, status, sourceType });
      if (componentId) params.set('componentId', componentId);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      try {
        const response = await fetch(`/api/timeline?${params}`, { signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not load decision history.');
        setPayload(result as TimelinePayload);
        setSelectedId((current) => current && result.events.some((event: DecisionTimelineEvent) => event.id === current) ? current : result.events[0]?.id ?? null);
      } catch (cause) {
        if (cause instanceof Error && cause.name === 'AbortError') return;
        setError(cause instanceof Error ? cause.message : 'Could not load decision history.');
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [activeRepoId, status, sourceType, componentId, from, to]);

  const visibleEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return payload?.events ?? [];
    return (payload?.events ?? []).filter((event) => [event.title, event.summary, ...event.componentLabels, ...event.evidence.map((item) => `${item.filePath ?? ''} ${item.commitMessage ?? ''} ${item.title}`)].join(' ').toLowerCase().includes(query));
  }, [payload, search]);

  const selected = visibleEvents.find((event) => event.id === selectedId) ?? visibleEvents[0];
  const related = selected?.relatedEventId ? payload?.events.find((event) => event.id === selected.relatedEventId) : undefined;
  const repo = {
    repoName: payload?.repoName || activeRepo.repoName,
    isDemo: payload ? payload.isDemoData : Boolean(activeRepo.isDemo),
  };
  const components = (payload?.components && payload.components.length > 0)
    ? payload.components
    : [];

  const getStatusBadgeVariant = (st: DecisionTimelineStatus): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    switch (st) {
      case 'supported_decision':
      case 'confirmed_supersession':
        return 'success';
      case 'possible_decision':
      case 'possible_supersession':
        return 'warning';
      case 'conflicting_evidence':
        return 'error';
      case 'historical_event':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Page Header */}
      <div className="bg-white border border-border-default rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-brand-emerald/10 text-brand-deep border border-brand-emerald/20">
              <History className="w-3 h-3 text-brand-emerald" />
              Decision Memory
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-muted text-ink-muted border border-border-subtle font-mono">
              Chronological Audit
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink-primary tracking-tight">
            Decision Timeline
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl">
            Trace repository design decisions, architectural pivots, and component evolution backed by AST declarations and commit records.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <div className="flex items-center gap-2 rounded-lg border border-border-default bg-surface-secondary px-3 py-1.5 text-xs text-ink-secondary">
            <FolderGit2 className="w-3.5 h-3.5 text-ink-muted" />
            <span className="font-mono font-medium">{repo.repoName}</span>
            {repo.isDemo && (
              <Badge variant="warning" size="sm">Demo</Badge>
            )}
          </div>
        </div>
      </div>

      {repo.isDemo && (
        <Alert type="warning" title="Sample repository history">
          Timeline entries use illustrative sample records. No live GitHub repository has been connected.
        </Alert>
      )}
      {error && <Alert type="error" title="Timeline unavailable">{error}</Alert>}

      {/* Filter Toolbar */}
      <section className="bg-white border border-border-default rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {/* Component Focus */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-ink-faint block mb-1">
              Component Focus
            </label>
            <select
              value={componentId}
              onChange={(event) => setComponentId(event.target.value)}
              className="w-full rounded-md border border-border-default bg-surface-secondary px-2.5 py-1.5 text-xs text-ink-primary focus:outline-none focus:border-brand-emerald"
            >
              <option value="">All components</option>
              {components.map((component) => (
                <option key={component.id} value={component.id}>{component.label}</option>
              ))}
            </select>
          </div>

          {/* Evolution Status */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-ink-faint block mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as DecisionTimelineStatus | 'all')}
              className="w-full rounded-md border border-border-default bg-surface-secondary px-2.5 py-1.5 text-xs text-ink-primary focus:outline-none focus:border-brand-emerald"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Source Evidence Type */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-ink-faint block mb-1">
              Source Type
            </label>
            <select
              value={sourceType}
              onChange={(event) => setSourceType(event.target.value as EvidenceSource['type'] | 'all')}
              className="w-full rounded-md border border-border-default bg-surface-secondary px-2.5 py-1.5 text-xs text-ink-primary focus:outline-none focus:border-brand-emerald"
            >
              {SOURCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-ink-faint block mb-1">
              From Date
            </label>
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="w-full rounded-md border border-border-default bg-surface-secondary px-2.5 py-1.5 text-xs text-ink-primary focus:outline-none focus:border-brand-emerald font-mono"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-ink-faint block mb-1">
              To Date
            </label>
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="w-full rounded-md border border-border-default bg-surface-secondary px-2.5 py-1.5 text-xs text-ink-primary focus:outline-none focus:border-brand-emerald font-mono"
            />
          </div>

          {/* Search */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-ink-faint block mb-1">
              Search Keywords
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-ink-faint pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="File, commit..."
                className="w-full rounded-md border border-border-default bg-surface-secondary pl-8 pr-2.5 py-1.5 text-xs text-ink-primary placeholder:text-ink-faint focus:outline-none focus:border-brand-emerald"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Left Column: Event List */}
        <section className="xl:col-span-2 space-y-2.5">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-xs font-semibold text-ink-primary uppercase tracking-wider">
              Chronological History
            </h2>
            <span className="text-[11px] font-mono text-ink-faint">
              {visibleEvents.length} events
            </span>
          </div>

          {loading ? (
            <div className="rounded-xl border border-border-default bg-white p-6 text-center text-xs text-ink-muted animate-pulse">
              <LoaderCircle className="h-4 w-4 animate-spin text-brand-deep mx-auto mb-2" />
              Loading timeline events...
            </div>
          ) : visibleEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-default bg-white p-8 text-center text-xs text-ink-faint">
              No timeline records matching current filters.
            </div>
          ) : (
            <ol className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {visibleEvents.map((event) => {
                const isSelected = selected?.id === event.id;
                return (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(event.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-all ${
                        isSelected
                          ? 'bg-brand-emerald/5 border-brand-emerald ring-1 ring-brand-emerald/30 shadow-xs'
                          : 'bg-white border-border-subtle hover:border-border-default hover:bg-surface-secondary'
                      }`}
                    >
                      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5">
                        <span className="text-[10px] font-mono text-ink-muted">
                          {event.date ? new Date(event.date).toLocaleDateString() : 'No date'}
                        </span>
                        <Badge variant={getStatusBadgeVariant(event.status)} size="sm">
                          {event.status.replaceAll('_', ' ')}
                        </Badge>
                      </div>

                      <p className="text-xs font-medium text-ink-primary line-clamp-1">
                        {event.title}
                      </p>

                      {event.componentLabels.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {event.componentLabels.map((label, i) => (
                            <span
                              key={i}
                              className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[10px] text-ink-muted"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* Right Column: Event Detail */}
        <section className="space-y-4 xl:col-span-3">
          {selected ? (
            <div className="bg-white rounded-xl border border-border-default p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-border-subtle">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-ink-primary leading-snug">{selected.title}</h2>
                  {selected.componentLabels.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selected.componentLabels.map((label, i) => (
                        <span
                          key={i}
                          className="rounded bg-surface-secondary border border-border-subtle px-2 py-0.5 font-mono text-[11px] text-ink-secondary"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <Badge variant={getStatusBadgeVariant(selected.status)} size="sm">
                  {selected.status.replaceAll('_', ' ')}
                </Badge>
              </div>

              {/* Summary Block */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-ink-faint block mb-1">
                  Decision Summary
                </span>
                <div className="rounded-lg bg-surface-secondary border border-border-subtle p-3.5">
                  <p className="text-xs leading-relaxed text-ink-secondary">{selected.summary}</p>
                </div>
              </div>

              {/* Evidence Section */}
              <div className="pt-2 border-t border-border-subtle">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-ink-primary">
                    Source Evidence Records ({selected.evidence.length})
                  </h3>
                </div>

                {selected.evidence.length > 0 ? (
                  <div className="space-y-2">
                    {selected.evidence.map((item, index) => (
                      <EvidenceCard
                        key={`${item.id}-${index}`}
                        evidence={{ ...item, isSimulatedDemoData: item.isSimulatedDemoData ?? repo.isDemo }}
                        compact={selected.evidence.length > 3}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border-default p-4 text-center text-xs text-ink-faint">
                    No source evidence attached to this event.
                  </div>
                )}
              </div>

              {/* Related Events Comparison */}
              {related && (
                <div className="grid grid-cols-1 gap-3 pt-3 border-t border-border-subtle sm:grid-cols-2">
                  <div className="rounded-lg border border-border-default bg-surface-secondary p-3 space-y-1">
                    <span className="text-[10px] font-mono text-ink-faint uppercase block">Later Record</span>
                    <p className="text-xs font-medium text-ink-primary">{selected.title}</p>
                    <span className="text-[10px] font-mono text-ink-muted block">{selected.date}</span>
                  </div>
                  <div className="rounded-lg border border-border-default bg-surface-secondary p-3 space-y-1">
                    <span className="text-[10px] font-mono text-ink-faint uppercase block">Earlier Linked Record</span>
                    <p className="text-xs font-medium text-ink-primary">{related.title}</p>
                    <span className="text-[10px] font-mono text-ink-muted block">{related.date}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-border-default p-12 text-center text-xs text-ink-faint">
              Select any event on the left to inspect its details and evidence.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}