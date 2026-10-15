import { EvidenceSource, ConfidenceAssessment } from './evidence';
import { GraphNode, GraphEdge, NodeType, EdgeType } from './graph';
import { ChangeCategory, AffectedComponent, DependencyPath, PastRegression } from './impact';
import { KnowledgeDebtScore, KnowledgeGapFinding } from './gaps';

export interface RepositoryContext {
  repoId: string;
  repoName: string;
  repoUrl?: string;
  analyzedCommit?: string;
  analyzedBranch?: string;
  primaryLanguage?: string;
}

export interface ReportExecutiveSummary {
  headline: string;
  overview: string;
  criticalTakeaways: string[];
  riskAssessmentLevel: 'low' | 'moderate' | 'elevated' | 'critical';
}

export interface ProposedChangeContext {
  targetSymbolOrFile: string;
  changeCategory: ChangeCategory;
  questionOrDescription: string;
  rationale?: string;
}

export interface ReportFindingItem {
  id: string;
  title: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  explanation: string;
  supportingEvidenceIds: string[];
}

export interface ReportArchitectureContext {
  focalNode: GraphNode;
  connectedNodes: GraphNode[];
  edges: GraphEdge[];
  directCallersCount: number;
  transitiveConsumersCount: number;
  architecturalRoleDescription: string;
}

export interface ReportImpactSection {
  summary: {
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
  pastRegressions: PastRegression[];
  potentialRisks: {
    risk: string;
    level: 'high' | 'medium' | 'low' | 'info';
    rationale: string;
  }[];
}

export interface ReportDecisionTimelineEntry {
  id: string;
  date: string;
  commitHash?: string;
  author?: string;
  title: string;
  rationale: string;
  status: 'superseded' | 'active' | 'deprecated';
  evidenceId?: string;
}

export interface ReportKnowledgeGapsSection {
  debtScore: KnowledgeDebtScore | null;
  keyGaps: KnowledgeGapFinding[];
  summaryNote: string;
}

export interface ReportUncertaintyItem {
  area: string;
  divergingSignals: string;
  confidenceScore: number;
  suggestedClarification: string;
}

export interface ReportLimitationsAndNextSteps {
  staticAnalysisCaveats: string[];
  recommendedChecklist: string[];
  suggestedFollowUpInvestigations: string[];
}

export interface EngineeringDecisionReport {
  id: string;
  title: string;
  generatedAt: string;
  author?: string;
  version?: string;
  repository: RepositoryContext;
  executiveSummary: ReportExecutiveSummary;
  proposedChange: ProposedChangeContext;
  findings: ReportFindingItem[];
  architectureContext?: ReportArchitectureContext;
  impactAnalysis?: ReportImpactSection;
  decisionTimeline?: ReportDecisionTimelineEntry[];
  knowledgeGaps?: ReportKnowledgeGapsSection;
  evidence: EvidenceSource[];
  uncertainties?: ReportUncertaintyItem[];
  limitations: ReportLimitationsAndNextSteps;
  confidence: ConfidenceAssessment;
}

export interface ReportSectionSelection {
  includeExecutiveSummary: boolean;
  includeProposedChange: boolean;
  includeFindings: boolean;
  includeArchitectureContext: boolean;
  includeImpactAnalysis: boolean;
  includeDecisionTimeline: boolean;
  includeKnowledgeGaps: boolean;
  includeEvidenceReferences: boolean;
  includeUncertainties: boolean;
  includeLimitationsAndNextSteps: boolean;
}

export const DEFAULT_SECTION_SELECTION: ReportSectionSelection = {
  includeExecutiveSummary: true,
  includeProposedChange: true,
  includeFindings: true,
  includeArchitectureContext: true,
  includeImpactAnalysis: true,
  includeDecisionTimeline: true,
  includeKnowledgeGaps: true,
  includeEvidenceReferences: true,
  includeUncertainties: true,
  includeLimitationsAndNextSteps: true,
};

export interface GeneratePdfRequest {
  report: EngineeringDecisionReport;
  customTitle?: string;
  sections?: Partial<ReportSectionSelection>;
}
