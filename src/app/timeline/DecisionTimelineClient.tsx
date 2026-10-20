'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, GitCommitHorizontal, History, LoaderCircle, Search } from 'lucide-react';
import { SAMPLE_REPO_ECOMMERCE } from '@/lib/graph/sample-repo';
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

const STATUS_VARIANTS: Record<DecisionTimelineStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  historical_event: 'info', possible_decision: 'warning', supported_decision: 'success',
  possible_supersession: 'warning', confirmed_supersession: 'success', conflicting_evidence: 'error', unresolved: 'default',
};

/** Maps each status to vivid pill colors */
const STATUS_PILL: Record<DecisionTimelineStatus, { bg: string; text: string; border: string; dot: string }> = {
  supported_decision:    { bg: 'bg-emerald-100',  text: 'text-emerald-700',  border: 'border-emerald-300',  dot: 'bg-emerald-500' },
  possible_decision:     { bg: 'bg-amber-100',    text: 'text-amber-700',    border: 'border-amber-300',    dot: 'bg-amber-500' },
  possible_supersession: { bg: 'bg-amber-100',    text: 'text-amber-700',    border: 'border-amber-300',    dot: 'bg-amber-500' },
  confirmed_supersession:{ bg: 'bg-amber-100',    text: 'text-amber-700',    border: 'border-amber-300',    dot: 'bg-amber-500' },
  conflicting_evidence:  { bg: 'bg-red-100',      text: 'text-red-700',      border: 'border-red-300',      dot: 'bg-red-500' },
  historical_event:      { bg: 'bg-teal-100',     text: 'text-teal-700',     border: 'border-teal-300',     dot: 'bg-teal-500' },
  unresolved:            { bg: 'bg-gray-100',     text: 'text-gray-600',     border: 'border-gray-300',     dot: 'bg-gray-400' },
};

/** Maps each status to the left-border accent color on list cards */
const STATUS_BORDER: Record<DecisionTimelineStatus, string> = {
  supported_decision:    'border-l-emerald-500',
  possible_decision:     'border-l-amber-400',
  possible_supersession: 'border-l-amber-400',
  confirmed_supersession:'border-l-amber-500',
  conflicting_evidence:  'border-l-red-500',
  historical_event:      'border-l-teal-500',
  unresolved:            'border-l-gray-400',
};

interface TimelinePayload { repoId: string; repoName: string; isDemoData: boolean; events: DecisionTimelineEvent[]; }

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
  const [activeRepoId, setActiveRepoId] = useState<string>(SAMPLE_REPO_ECOMMERCE.repoId);

  useEffect(() => {
    fetch('/api/repositories')
      .then(r => r.json())
      .then(d => {
        const active = d.repositories?.find((r: any) => r.isActive) || d.repositories?.[0];
        if (active) setActiveRepoId(active.repoId);
      })
      .catch(() => {});
  }, []);

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
    repoName: payload?.repoName || SAMPLE_REPO_ECOMMERCE.repoName,
    isDemo: payload ? payload.isDemoData : Boolean(SAMPLE_REPO_ECOMMERCE.isDemo),
    nodes: SAMPLE_REPO_ECOMMERCE.nodes,
  };
  const components = repo.nodes.filter((node) => node.type !== 'commit').map((node) => ({ id: node.id, label: `${node.label} · ${node.filePath}` }));

  return (
    <div className="font-['Inter',sans-serif] max-w-7xl mx-auto space-y-6 pb-12">

      {/* ── HEADER BANNER ── */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 to-cyan-600 px-7 py-6 shadow-lg">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_white_0%,_transparent_70%)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-md border border-white/30">
              <History className="w-7 h-7 text-white stroke-[2]" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Decision Timeline</h1>
              <p className="text-sm text-teal-100 mt-0.5">
                Trace repository design decisions, architectural pivots, and component evolution backed by AST and commit records.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 px-4 py-2.5 shadow-sm self-start sm:self-auto">
            <GitCommitHorizontal className="w-4 h-4 text-teal-100" />
            <span className="font-bold text-white text-sm">{repo.repoName}</span>
            {repo.isDemo && (
              <span className="ml-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                Demo
              </span>
            )}
          </div>
        </div>
      </header>

      {repo.isDemo && (
        <Alert type="warning" title="Sample repository history">
          Timeline entries use illustrative sample records. No live GitHub repository or engineering discussion has been connected.
        </Alert>
      )}
      {error && <Alert type="error" title="Timeline unavailable">{error}</Alert>}

      {/* ── FILTER TOOLBAR ── */}
      <section
        className="rounded-2xl border border-teal-100 bg-white p-5 shadow-lg"
        aria-label="Timeline filters"
      >
        <div className="flex items-center gap-2 mb-4 border-l-4 border-teal-500 pl-3">
          <Search className="w-4 h-4 text-teal-600" />
          <span className="text-sm font-bold text-teal-700">Filter Timeline</span>
          <span className="text-xs text-teal-500">— narrow results by component, status, date or keyword</span>
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-6">
          {/* Component Focus */}
          <div>
            <label className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block mb-1.5">
              Component Focus
            </label>
            <select
              value={componentId}
              onChange={(event) => setComponentId(event.target.value)}
              className="w-full rounded-xl border border-teal-200 bg-teal-50/40 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-400/20 transition-all shadow-sm font-medium"
            >
              <option value="">All components</option>
              {components.map((component) => (
                <option key={component.id} value={component.id}>{component.label}</option>
              ))}
            </select>
          </div>

          {/* Evolution Status */}
          <div>
            <label className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block mb-1.5">
              Evolution Status
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as DecisionTimelineStatus | 'all')}
              className="w-full rounded-xl border border-teal-200 bg-teal-50/40 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-400/20 transition-all shadow-sm font-medium"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Source Evidence Type */}
          <div>
            <label className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block mb-1.5">
              Source Evidence Type
            </label>
            <select
              value={sourceType}
              onChange={(event) => setSourceType(event.target.value as EvidenceSource['type'] | 'all')}
              className="w-full rounded-xl border border-teal-200 bg-teal-50/40 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-400/20 transition-all shadow-sm font-medium"
            >
              {SOURCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block mb-1.5">
              From Date
            </label>
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="w-full rounded-xl border border-teal-200 bg-teal-50/40 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-400/20 transition-all shadow-sm font-medium"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block mb-1.5">
              To Date
            </label>
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="w-full rounded-xl border border-teal-200 bg-teal-50/40 px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-400/20 transition-all shadow-sm font-medium"
            />
          </div>

          {/* Search */}
          <div>
            <label className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block mb-1.5">
              Search Keywords
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-teal-400 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="File, commit, event…"
                className="w-full rounded-xl border border-teal-200 bg-teal-50/40 pl-8 pr-3 py-2 text-xs text-gray-800 placeholder:text-teal-300 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-400/20 transition-all shadow-sm font-medium"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">

        {/* ── LEFT COLUMN: Event List ── */}
        <section className="xl:col-span-2 space-y-3" aria-label="Chronological repository events">
          {/* List header */}
          <div className="flex items-center justify-between px-1 pb-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-500 text-white">
                <CalendarClock className="w-3.5 h-3.5" />
              </span>
              <h2 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider">
                Chronological History
              </h2>
            </div>
            <span className="rounded-full bg-teal-100 text-teal-700 border border-teal-200 px-2.5 py-0.5 text-xs font-bold">
              {visibleEvents.length} {visibleEvents.length === 1 ? 'event' : 'events'}
            </span>
          </div>

          {/* Loading */}
          {loading ? (
            <div role="status" className="flex items-center gap-3 rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50 p-5 shadow-sm">
              <LoaderCircle className="h-5 w-5 animate-spin text-teal-500" />
              <div>
                <p className="text-sm font-bold text-teal-700">Loading timeline…</p>
                <p className="text-xs text-teal-500">Fetching repository history records</p>
              </div>
            </div>

          /* Empty state */
          ) : visibleEvents.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50/50 p-10 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 border border-teal-200 shadow-sm">
                <CalendarClock className="h-7 w-7 text-teal-500" />
              </div>
              <p className="text-sm font-bold text-teal-700">No timeline records found</p>
              <p className="mt-1 text-xs text-teal-500">Try clearing the search query or adjusting the date range.</p>
            </div>

          /* Event cards */
          ) : (
            <ol className="space-y-2.5">
              {visibleEvents.map((event) => {
                const isSelected = selected?.id === event.id;
                const pill = STATUS_PILL[event.status];
                const leftBorder = STATUS_BORDER[event.status];
                return (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(event.id)}
                      aria-pressed={isSelected}
                      className={`w-full rounded-2xl border-l-4 border border-gray-100 p-4 text-left transition-all shadow-sm ${leftBorder} ${
                        isSelected
                          ? 'bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-300 ring-2 ring-teal-400/25 shadow-md'
                          : 'bg-white hover:border-teal-200 hover:bg-teal-50/30'
                      }`}
                    >
                      {/* Date chip + Status pill */}
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-full bg-teal-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                          {event.date
                            ? new Date(event.date).toLocaleDateString(undefined, { dateStyle: 'medium' })
                            : 'Date unavailable'}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${pill.bg} ${pill.text} ${pill.border}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${pill.dot}`} />
                          {event.status.replaceAll('_', ' ')}
                        </span>
                      </div>

                      {/* Title */}
                      <p className={`text-xs font-bold line-clamp-1 ${isSelected ? 'text-teal-700' : 'text-gray-800'}`}>
                        {event.title}
                      </p>

                      {/* Component labels */}
                      {event.componentLabels.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {event.componentLabels.map((label, i) => (
                            <span
                              key={i}
                              className="rounded-md bg-gray-100 border border-gray-200 px-1.5 py-0.5 font-mono text-[10px] text-gray-500"
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

        {/* ── RIGHT COLUMN: Event Detail ── */}
        <section className="space-y-4 xl:col-span-3" aria-label="Selected timeline event details">
          {selected ? (
            <>
              {/* Main detail card */}
              <div className="rounded-2xl border border-teal-100 bg-white shadow-lg overflow-hidden">
                {/* Card top accent bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 to-cyan-500" />

                <div className="p-6 sm:p-7">
                  {/* Title row */}
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-5">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-extrabold text-gray-900 leading-tight">{selected.title}</h2>
                      {selected.componentLabels.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {selected.componentLabels.map((label, i) => (
                            <span
                              key={i}
                              className="rounded-md bg-teal-50 border border-teal-200 px-2 py-0.5 font-mono text-[11px] text-teal-700 font-medium"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                      {selected.componentLabels.length === 0 && (
                        <p className="mt-1 text-xs text-gray-400 font-mono">No explicit component link was recorded.</p>
                      )}
                    </div>
                    {/* Large status badge */}
                    <span className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide shadow-sm flex-shrink-0
                      ${STATUS_PILL[selected.status].bg} ${STATUS_PILL[selected.status].text} ${STATUS_PILL[selected.status].border}`}>
                      <span className={`h-2 w-2 rounded-full ${STATUS_PILL[selected.status].dot}`} />
                      {selected.status.replaceAll('_', ' ')}
                    </span>
                  </div>

                  {/* Summary block */}
                  <div className="mt-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-teal-600 mb-2">
                      Decision Summary
                    </p>
                    <div className="rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50/60 border border-teal-100 p-4">
                      <p className="text-sm leading-relaxed text-gray-700">{selected.summary}</p>
                    </div>
                  </div>

                  {/* Evidence section */}
                  <div className="mt-6 border-t border-gray-100 pt-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-500 text-white shadow-sm">
                          <Search className="w-3.5 h-3.5" />
                        </span>
                        <h3 className="text-sm font-extrabold text-gray-800">Source Evidence Records</h3>
                      </div>
                      <span className="rounded-full bg-teal-100 text-teal-700 border border-teal-200 px-2.5 py-0.5 text-xs font-bold">
                        {selected.evidence.length} {selected.evidence.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    {selected.evidence.length > 0 ? (
                      <div className="space-y-2.5">
                        {selected.evidence.map((item, index) => (
                          <EvidenceCard
                            key={`${item.id}-${index}`}
                            evidence={{ ...item, isSimulatedDemoData: item.isSimulatedDemoData ?? repo.isDemo }}
                            compact={selected.evidence.length > 3}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/40 p-6 text-center">
                        <p className="text-sm font-bold text-teal-600">No evidence attached</p>
                        <p className="mt-1 text-xs text-teal-400">No source evidence is attached to this event.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Related events comparison */}
              {related && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {/* Later record */}
                  <div className="rounded-2xl border-l-4 border-l-teal-500 border border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50/60 p-5 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="h-2 w-2 rounded-full bg-teal-500" />
                      <p className="text-[11px] font-bold uppercase tracking-wider text-teal-600">Later record</p>
                    </div>
                    <p className="text-sm font-bold text-gray-800">{selected.title}</p>
                    <p className="mt-1 text-xs font-mono text-teal-600 bg-teal-100 border border-teal-200 rounded-full px-2 py-0.5 inline-block">
                      {selected.date ? new Date(selected.date).toLocaleDateString() : 'Date unavailable'}
                    </p>
                    {selected.evidence.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {selected.evidence.map((item, index) => (
                          <EvidenceCard
                            key={`${item.id}-${index}`}
                            evidence={{ ...item, isSimulatedDemoData: item.isSimulatedDemoData ?? repo.isDemo }}
                            compact
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-teal-500 italic">No evidence attached.</p>
                    )}
                  </div>

                  {/* Earlier linked record */}
                  <div className="rounded-2xl border-l-4 border-l-cyan-500 border border-cyan-100 bg-gradient-to-br from-cyan-50 to-teal-50/60 p-5 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="h-2 w-2 rounded-full bg-cyan-500" />
                      <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-600">Earlier linked record</p>
                    </div>
                    <p className="text-sm font-bold text-gray-800">{related.title}</p>
                    <p className="mt-1 text-xs font-mono text-cyan-600 bg-cyan-100 border border-cyan-200 rounded-full px-2 py-0.5 inline-block">
                      {related.date ? new Date(related.date).toLocaleDateString() : 'Date unavailable'}
                    </p>
                    {related.evidence.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {related.evidence.map((item, index) => (
                          <EvidenceCard
                            key={`${item.id}-${index}`}
                            evidence={{ ...item, isSimulatedDemoData: item.isSimulatedDemoData ?? repo.isDemo }}
                            compact
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-cyan-500 italic">No evidence attached.</p>
                    )}
                  </div>
                </div>
              )}
            </>

          /* No event selected */
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50/50 p-16 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 border border-teal-200 shadow-md">
                <AlertTriangle className="h-8 w-8 text-teal-500" />
              </div>
              <p className="text-base font-extrabold text-teal-700">No event selected</p>
              <p className="mt-2 text-sm text-teal-500 max-w-xs mx-auto">
                Select any timeline record on the left to inspect its evidence and relationships.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
