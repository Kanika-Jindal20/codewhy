import { EvidenceSource, ConfidenceAssessment } from './evidence';
import { GraphNode, GraphEdge } from './graph';

export type ChangeCategory = 
  | 'breaking_interface' 
  | 'internal_refactor' 
  | 'deprecation' 
  | 'config_alteration' 
  | 'dependency_update';

export type ImpactKind = 
  | 'direct_dependent' 
  | 'reverse_dependent' 
  | 'transitive_consumer' 
  | 'test_suite' 
  | 'config_consumer' 
  | 'co_changed_historical';

export type ImpactSeverity = 'high' | 'medium' | 'low' | 'info';

export interface DependencyPath {
  nodes: GraphNode[];
  edges: GraphEdge[];
  hops: number;
  description: string;
}

export interface AffectedComponent {
  node: GraphNode;
  impactKind: ImpactKind;
  severity: ImpactSeverity;
  severityReason: string; // Transparent scoring explanation
  paths: DependencyPath[];
  evidence: EvidenceSource[];
  recommendedChecks: string[];
  isDirect: boolean;
}

export interface PastRegression {
  id: string;
  commitHash: string;
  summary: string;
  date: string;
  author: string;
  relevanceExplanation: string;
  evidence: EvidenceSource;
}

export interface CoChangeCorrelation {
  targetNodeId: string;
  relatedFilePath: string;
  coChangeCount: number;
  confidenceScore: number;
  evidence: EvidenceSource;
}

export interface ImpactAnalysisRequest {
  repoId: string;
  targetNodeId: string;
  changeCategory: ChangeCategory;
  proposedChangeDescription: string;
  maxTransitiveDepth?: number;
}

export interface ImpactAnalysisResult {
  id: string;
  repoId: string;
  analyzedAt: string;
  selectedComponent: GraphNode;
  proposedChange: {
    category: ChangeCategory;
    description: string;
  };
  summary: {
    overview: string;
    totalAffected: number;
    directCount: number;
    transitiveCount: number;
    testCount: number;
    configCount: number;
    coChangeCount: number;
  };
  affectedComponents: AffectedComponent[];
  dependencyPaths: DependencyPath[];
  relatedTests: AffectedComponent[];
  configReferences: AffectedComponent[];
  coChangedFiles: CoChangeCorrelation[];
  pastRegressions: PastRegression[];
  potentialRisks: {
    risk: string;
    level: ImpactSeverity;
    rationale: string;
  }[];
  manualVerificationAreas: {
    area: string;
    checklist: string[];
  }[];
  separation: {
    staticAnalysis: string[];
    heuristicSuggestions: string[];
    aiInterpretations: string[];
  };
  confidence: ConfidenceAssessment;
  limitations: string[];
  isDemoData?: boolean;
}

export interface SavedInvestigation {
  id: string;
  title: string;
  createdAt: string;
  repoId: string;
  targetNodeId: string;
  result: ImpactAnalysisResult;
  userNotes?: string;
}
