import { NextRequest, NextResponse } from 'next/server';
import { getRepositoryGraph, getActiveRepositoryGraph } from '@/lib/graph/graph-store';
import { buildDecisionTimeline, type TimelineFilters } from '@/lib/timeline/timeline-service';
import type { DecisionTimelineStatus } from '@/types/timeline';
import type { EvidenceSource } from '@/types/evidence';

const STATUSES: DecisionTimelineStatus[] = ['historical_event', 'possible_decision', 'supported_decision', 'possible_supersession', 'confirmed_supersession', 'conflicting_evidence', 'unresolved'];
const SOURCES: EvidenceSource['type'][] = ['file_span', 'commit', 'pull_request', 'ast_relation', 'co_change_history', 'config_reference', 'test_coverage', 'doc'];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const repoId = params.get('repoId')?.trim();
  const graph = (repoId ? getRepositoryGraph(repoId) : undefined) || getActiveRepositoryGraph();
  if (!graph) return NextResponse.json({ error: 'That repository is not available in the current analysis.' }, { status: 404 });
  const rawStatus = params.get('status');
  const rawSource = params.get('sourceType');
  if (rawStatus && rawStatus !== 'all' && !STATUSES.includes(rawStatus as DecisionTimelineStatus)) {
    return NextResponse.json({ error: 'Unsupported timeline status filter.' }, { status: 400 });
  }
  if (rawSource && rawSource !== 'all' && !SOURCES.includes(rawSource as EvidenceSource['type'])) {
    return NextResponse.json({ error: 'Unsupported evidence source filter.' }, { status: 400 });
  }
  const filters: TimelineFilters = {
    componentId: params.get('componentId') || undefined,
    status: (rawStatus as TimelineFilters['status']) || undefined,
    sourceType: (rawSource as TimelineFilters['sourceType']) || undefined,
    from: params.get('from') || undefined,
    to: params.get('to') || undefined,
  };
  const components = graph.nodes
    .filter((node) => node.type !== 'commit')
    .map((node) => ({ id: node.id, label: `${node.label} · ${node.filePath || ''}` }));

  return NextResponse.json({
    repoId: graph.repoId,
    repoName: graph.repoName,
    isDemoData: graph.isDemo ?? false,
    events: buildDecisionTimeline(graph, filters),
    components,
  });
}
