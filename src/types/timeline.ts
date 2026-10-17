import type { EvidenceSource } from './evidence';

export type DecisionTimelineStatus =
  | 'historical_event'
  | 'possible_decision'
  | 'supported_decision'
  | 'possible_supersession'
  | 'confirmed_supersession'
  | 'conflicting_evidence'
  | 'unresolved';

export interface DecisionTimelineEvent {
  id: string;
  date?: string;
  title: string;
  summary: string;
  status: DecisionTimelineStatus;
  componentIds: string[];
  componentLabels: string[];
  evidence: EvidenceSource[];
  relatedEventId?: string;
  relationship?: 'supports' | 'possibly_supersedes' | 'supersedes' | 'conflicts_with';
}
