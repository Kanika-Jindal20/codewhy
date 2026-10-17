'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, GitCommitHorizontal, History, LoaderCircle, Search } from 'lucide-react';
import { SAMPLE_REPO_ECOMMERCE } from '@/lib/graph/graph-store';
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
  const repo = SAMPLE_REPO_ECOMMERCE;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError(null);
      const params = new URLSearchParams({ repoId: repo.repoId, status, sourceType });
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
  }, [repo.repoId, status, sourceType, componentId, from, to]);

  const visibleEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return payload?.events ?? [];
    return (payload?.events ?? []).filter((event) => [event.title, event.summary, ...event.componentLabels, ...event.evidence.map((item) => `${item.filePath ?? ''} ${item.commitMessage ?? ''} ${item.title}`)].join(' ').toLowerCase().includes(query));
  }, [payload, search]);
  const selected = visibleEvents.find((event) => event.id === selectedId) ?? visibleEvents[0];
  const related = selected?.relatedEventId ? payload?.events.find((event) => event.id === selected.relatedEventId) : undefined;
  const components = repo.nodes.filter((node) => node.type !== 'commit').map((node) => ({ id: node.id, label: `${node.label} · ${node.filePath}` }));

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <header className="flex flex-col gap-3 border-b border-app-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1"><span className="p-1.5 rounded-lg bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/30"><History className="w-5 h-5" /></span><h1 className="text-2xl font-bold tracking-tight">Decision Timeline</h1></div>
          <p className="text-xs text-text-muted">Trace repository events to their original sources. A later change does not by itself prove a decision was replaced.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-app-border bg-app-panel px-3 py-2 text-xs"><GitCommitHorizontal className="w-4 h-4 text-text-muted" /><span className="text-text-primary">{repo.repoName}</span>{repo.isDemo && <Badge variant="warning">Demo data</Badge>}</div>
      </header>

      {repo.isDemo && <Alert type="warning" title="Sample repository history">Timeline entries use illustrative sample records. No live GitHub repository or engineering discussion has been connected.</Alert>}
      {error && <Alert type="error" title="Timeline unavailable">{error}</Alert>}

      <section className="grid grid-cols-1 gap-3 rounded-xl border border-app-border bg-app-panel p-4 sm:grid-cols-2 xl:grid-cols-6" aria-label="Timeline filters">
        <label className="text-[11px] text-text-muted">Component<select value={componentId} onChange={(event) => setComponentId(event.target.value)} className="mt-1 block w-full rounded-md border border-app-border bg-app-bg px-2.5 py-2 text-xs text-text-primary"><option value="">All components</option>{components.map((component) => <option key={component.id} value={component.id}>{component.label}</option>)}</select></label>
        <label className="text-[11px] text-text-muted">Status<select value={status} onChange={(event) => setStatus(event.target.value as DecisionTimelineStatus | 'all')} className="mt-1 block w-full rounded-md border border-app-border bg-app-bg px-2.5 py-2 text-xs text-text-primary">{STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="text-[11px] text-text-muted">Source type<select value={sourceType} onChange={(event) => setSourceType(event.target.value as EvidenceSource['type'] | 'all')} className="mt-1 block w-full rounded-md border border-app-border bg-app-bg px-2.5 py-2 text-xs text-text-primary">{SOURCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="text-[11px] text-text-muted">From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 block w-full rounded-md border border-app-border bg-app-bg px-2.5 py-2 text-xs text-text-primary" /></label>
        <label className="text-[11px] text-text-muted">To<input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 block w-full rounded-md border border-app-border bg-app-bg px-2.5 py-2 text-xs text-text-primary" /></label>
        <label className="text-[11px] text-text-muted">Search<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="File, commit, event…" className="mt-1 block w-full rounded-md border border-app-border bg-app-bg px-2.5 py-2 text-xs text-text-primary placeholder:text-text-muted" /></label>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <section className="xl:col-span-2" aria-label="Chronological repository events">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Repository history</h2><span className="text-[11px] text-text-muted">{visibleEvents.length} event{visibleEvents.length === 1 ? '' : 's'}</span></div>
          {loading ? <div role="status" className="flex items-center gap-2 rounded-lg border border-app-border bg-app-panel p-4 text-xs text-text-secondary"><LoaderCircle className="h-4 w-4 animate-spin" />Loading timeline…</div>
            : visibleEvents.length === 0 ? <div className="rounded-lg border border-dashed border-app-border p-6 text-center"><CalendarClock className="mx-auto h-5 w-5 text-text-muted" /><p className="mt-2 text-sm text-text-secondary">No timeline records match these filters.</p><p className="mt-1 text-xs text-text-muted">Decision history appears only when source records or explicit graph relationships are available.</p></div>
              : <ol className="space-y-2">{visibleEvents.map((event) => <li key={event.id}><button type="button" onClick={() => setSelectedId(event.id)} aria-pressed={selected?.id === event.id} className={`w-full rounded-lg border p-3 text-left transition ${selected?.id === event.id ? 'border-accent-primary/50 bg-accent-primary/10' : 'border-app-border bg-app-panel hover:border-accent-primary/30'}`}>
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-[10px] text-text-muted">{event.date ? new Date(event.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Date unavailable'}</span><Badge variant={STATUS_VARIANTS[event.status]}>{event.status.replaceAll('_', ' ')}</Badge></div>
                <p className="text-xs font-semibold text-text-primary">{event.title}</p><p className="mt-1 line-clamp-2 text-[11px] text-text-secondary">{event.componentLabels.join(' · ')}</p>
              </button></li>)}</ol>}
        </section>

        <section className="space-y-4 xl:col-span-3" aria-label="Selected timeline event details">
          {selected ? <>
            <div className="rounded-xl border border-app-border bg-app-panel p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-base font-semibold text-text-primary">{selected.title}</h2><p className="mt-1 text-xs text-text-muted">{selected.componentLabels.length ? `Affected: ${selected.componentLabels.join(', ')}` : 'No component link was recorded.'}</p></div><Badge variant={STATUS_VARIANTS[selected.status]}>{selected.status.replaceAll('_', ' ')}</Badge></div>
              <p className="mt-4 text-sm leading-6 text-text-secondary">{selected.summary}</p>
              <div className="mt-4"><h3 className="mb-2 text-xs font-semibold text-text-primary">Source evidence ({selected.evidence.length})</h3>{selected.evidence.length ? <div className="space-y-2">{selected.evidence.map((item, index) => <EvidenceCard key={`${item.id}-${index}`} evidence={{ ...item, isSimulatedDemoData: item.isSimulatedDemoData ?? repo.isDemo }} compact={selected.evidence.length > 3} />)}</div> : <p className="rounded-lg border border-dashed border-app-border p-3 text-xs text-text-muted">No source evidence is attached to this event.</p>}</div>
            </div>
            {related && <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-app-border bg-app-panel p-4"><p className="mb-3 text-xs font-semibold text-text-primary">Later record</p><p className="text-sm font-medium">{selected.title}</p><p className="mt-1 text-[11px] text-text-muted">{selected.date ? new Date(selected.date).toLocaleDateString() : 'Date unavailable'}</p>{selected.evidence.length ? <div className="mt-3 space-y-2">{selected.evidence.map((item, index) => <EvidenceCard key={`${item.id}-${index}`} evidence={{ ...item, isSimulatedDemoData: item.isSimulatedDemoData ?? repo.isDemo }} compact /></div> : <p className="mt-2 text-xs text-text-muted">No evidence attached.</p>}</div>
              <div className="rounded-xl border border-app-border bg-app-panel p-4"><p className="mb-3 text-xs font-semibold text-text-primary">Earlier linked record</p><p className="text-sm font-medium">{related.title}</p><p className="mt-1 text-[11px] text-text-muted">{related.date ? new Date(related.date).toLocaleDateString() : 'Date unavailable'}</p>{related.evidence.length ? <div className="mt-3 space-y-2">{related.evidence.map((item, index) => <EvidenceCard key={`${item.id}-${index}`} evidence={{ ...item, isSimulatedDemoData: item.isSimulatedDemoData ?? repo.isDemo }} compact /></div> : <p className="mt-2 text-xs text-text-muted">No evidence attached.</p>}</div>
            </div>}
          </> : <div className="rounded-xl border border-dashed border-app-border p-8 text-center text-sm text-text-muted"><AlertTriangle className="mx-auto mb-2 h-5 w-5" />Select a timeline event to inspect its evidence.</div>}
        </section>
      </div>
    </div>
  );
}
