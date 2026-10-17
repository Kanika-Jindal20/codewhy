export type EvidenceType = 
  | 'file_span' 
  | 'commit' 
  | 'pull_request' 
  | 'ast_relation' 
  | 'co_change_history' 
  | 'config_reference' 
  | 'test_coverage' 
  | 'doc';

export interface EvidenceSource {
  id: string;
  type: EvidenceType;
  title: string;
  filePath?: string;
  startLine?: number;
  endLine?: number;
  commitHash?: string;
  commitMessage?: string;
  author?: string;
  timestamp?: string;
  url?: string;
  snippet?: string;
  confidenceScore: number; // 0.0 to 1.0
  isSimulatedDemoData?: boolean;
  /** Whether the source directly states a fact or only suggests a relationship. */
  directness?: 'direct' | 'indirect' | 'interpretation';
  /** Set by ingestion when a newer repository snapshot may invalidate this source. */
  freshness?: 'current' | 'stale' | 'unknown';
  /** Shared identifier supplied by a source-analysis step when records truly conflict. */
  conflictGroup?: string;
}

export type ReliabilityLabel =
  | 'high_evidence'
  | 'limited_evidence'
  | 'conflicting_evidence'
  | 'insufficient_evidence';

export interface ReliabilityAssessment {
  label: ReliabilityLabel;
  /** Evidence-quality label only; never a calibrated probability. */
  heuristic: true;
  reasons: string[];
  conflictGroups: EvidenceSource[][];
  unsupportedClaimCount: number;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'insufficient_evidence';

export interface ConfidenceAssessment {
  level: ConfidenceLevel;
  score: number; // 0.0 - 1.0
  reasoning: string;
  limitations: string[];
}
