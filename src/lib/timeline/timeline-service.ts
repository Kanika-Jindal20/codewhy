import type { KnowledgeGraph } from '@/types/graph';
import type { EvidenceSource } from '@/types/evidence';
import type { DecisionTimelineEvent, DecisionTimelineStatus } from '@/types/timeline';

export interface TimelineFilters {
  componentId?: string;
  status?: DecisionTimelineStatus | 'all';
  sourceType?: EvidenceSource['type'] | 'all';
  from?: string;
  to?: string;
}

export function buildDecisionTimeline(graph: KnowledgeGraph, filters: TimelineFilters = {}): DecisionTimelineEvent[] {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const events = new Map<string, DecisionTimelineEvent>();

  // A commit is a historical event; it is not automatically treated as a decision.
  for (const node of graph.nodes) {
    for (const evidence of node.evidence ?? []) {
      if (!evidence.commitHash) continue;
      const key = `commit:${evidence.commitHash.toLowerCase()}`;
      const prior = events.get(key);
      const affectedIds = new Set(prior?.componentIds ?? []);
      affectedIds.add(node.id);
      const affectedLabels = new Set(prior?.componentLabels ?? []);
      affectedLabels.add(node.label);
      events.set(key, {
        id: key,
        date: prior?.date ?? evidence.timestamp,
        title: evidence.commitMessage || evidence.title || `Commit ${evidence.commitHash.slice(0, 7)}`,
        summary: 'Historical repository change recorded in commit evidence. A later commit alone does not establish that a decision was reversed.',
        status: 'historical_event',
        componentIds: [...affectedIds],
        componentLabels: [...affectedLabels],
        evidence: [...(prior?.evidence ?? []), evidence],
      });
    }
  }

  for (const node of graph.nodes.filter((item) => item.type === 'decision')) {
    const evidence = node.evidence ?? [];
    const date = evidence.map((item) => item.timestamp).filter(Boolean).sort().at(-1);
    const explicitRecord = evidence.some((item) => {
      if (item.type !== 'doc' && item.type !== 'pull_request') return false;
      const text = `${item.title} ${item.commitMessage ?? ''} ${item.snippet ?? ''}`;
      return /\b(decision|rationale|because|chose|trade[- ]off|we decided)\b/i.test(text) && !/\b(not|never|no)\s+(?:to\s+)?(?:decide|choose|chose|support|adopt|use|proceed)\b/i.test(text);
    });
    events.set(`decision:${node.id}`, {
      id: `decision:${node.id}`,
      date,
      title: node.label,
      summary: node.description || (explicitRecord ? 'Decision entity with a linked source record.' : 'Decision entity is present, but no discussion or documentation source is linked.'),
      status: explicitRecord ? 'supported_decision' : 'possible_decision',
      componentIds: [node.id],
      componentLabels: [node.label],
      evidence,
    });
  }

  for (const edge of graph.edges.filter((item) => item.type === 'supersedes')) {
    const newer = nodeById.get(edge.source);
    const older = nodeById.get(edge.target);
    if (!newer || !older) continue;
    const evidence = edge.evidence ?? [];
    const explicitReplacement = evidence.some((item) => {
      if (item.type !== 'pull_request' && item.type !== 'doc') return false;
      const text = `${item.title} ${item.commitMessage ?? ''} ${item.snippet ?? ''}`;
      const statesReplacement = /\b(supersed(?:e|es|ed|ing)|replace(?:s|d)?|revers(?:e|es|ed|ing)|deprecat(?:e|es|ed|ing))\b/i.test(text);
      const deniesReplacement = /\b(not|never|no longer)\b.{0,30}\b(supersed|replac|revers|deprecat)/i.test(text);
      return statesReplacement && !deniesReplacement;
    });
    const status: DecisionTimelineStatus = explicitReplacement ? 'confirmed_supersession' : 'possible_supersession';
    const key = `supersession:${edge.id}`;
    events.set(key, {
      id: key,
      date: evidence.map((item) => item.timestamp).filter(Boolean).sort().at(-1),
      title: explicitReplacement ? `${newer.label} supersedes ${older.label}` : `Possible supersession: ${newer.label} and ${older.label}`,
      summary: explicitReplacement
        ? 'A linked source explicitly describes replacement or reversal; inspect the cited record to verify its scope.'
        : 'The graph contains a supersedes relationship, but its evidence does not explicitly confirm a replacement. Treat this as a candidate.',
      status,
      componentIds: [newer.id, older.id],
      componentLabels: [newer.label, older.label],
      evidence,
      relatedEventId: `decision:${older.id}`,
      relationship: explicitReplacement ? 'supersedes' : 'possibly_supersedes',
    });
  }

  const conflictEvidence = new Map<string, Array<{ nodeId: string; label: string; evidence: EvidenceSource }>>();
  for (const node of graph.nodes) {
    for (const evidence of node.evidence ?? []) {
      if (!evidence.conflictGroup) continue;
      conflictEvidence.set(evidence.conflictGroup, [...(conflictEvidence.get(evidence.conflictGroup) ?? []), { nodeId: node.id, label: node.label, evidence }]);
    }
  }
  for (const [groupId, entries] of conflictEvidence) {
    if (entries.length < 2) continue;
    const evidence = entries.map((entry) => entry.evidence);
    events.set(`conflict:${groupId}`, {
      id: `conflict:${groupId}`,
      date: evidence.map((item) => item.timestamp).filter(Boolean).sort().at(-1),
      title: `Conflicting source records (${entries.length})`,
      summary: 'An upstream analysis step explicitly grouped these records as conflicting. Compare the source text and timestamps; the timeline does not choose which one is correct.',
      status: 'conflicting_evidence',
      componentIds: [...new Set(entries.map((entry) => entry.nodeId))],
      componentLabels: [...new Set(entries.map((entry) => entry.label))],
      evidence,
    });
  }

  return [...events.values()]
    .map((event) => ({ ...event, evidence: event.evidence.map((item) => ({ ...item, freshness: item.freshness ?? 'unknown' })) }))
    .filter((event) => !filters.componentId || event.componentIds.includes(filters.componentId))
    .filter((event) => !filters.status || filters.status === 'all' || event.status === filters.status)
    .filter((event) => !filters.sourceType || filters.sourceType === 'all' || event.evidence.some((item) => item.type === filters.sourceType))
    .filter((event) => !filters.from || (event.date && event.date >= filters.from))
    .filter((event) => !filters.to || (event.date && event.date.slice(0, 10) <= filters.to))
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}
