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
}

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'insufficient_evidence';

export interface ConfidenceAssessment {
  level: ConfidenceLevel;
  score: number; // 0.0 - 1.0
  reasoning: string;
  limitations: string[];
}
