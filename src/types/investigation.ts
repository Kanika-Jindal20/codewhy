import { EvidenceSource } from './evidence';

export type InvestigationVisibility = 'private' | 'team' | 'public';
export type InvestigationStatus = 'active' | 'archived';

export interface InvestigationSourceContext {
  type: 'impact_analysis' | 'architecture_node' | 'knowledge_gap' | 'direct_inquiry';
  targetId?: string;
  targetPath?: string;
  reportId?: string;
}

export interface InvestigationRelatedLink {
  type: 'impact' | 'architecture' | 'report' | 'gap';
  label: string;
  href: string;
}

export interface InvestigationEntry {
  id: string;
  question: string;
  answerSummary: string;
  detailedFindings?: string[];
  evidence: EvidenceSource[];
  timestamp: string;
  author: string;
}

export interface StaleEvidenceStatus {
  isStale: boolean;
  reason?: string;
  staleEvidenceIds: string[];
  checkedAt: string;
}

export interface FollowUpSuggestion {
  id: string;
  question: string;
  rationale: string;
  category: 'tests' | 'commit_history' | 'dependents' | 'decisions' | 'blast_radius';
}

export interface Investigation {
  id: string;
  title: string;
  repoId: string;
  repoName: string;
  ownerId: string;
  ownerName: string;
  visibility: InvestigationVisibility;
  status: InvestigationStatus;
  createdAt: string;
  updatedAt: string;
  originalQuestion: string;
  sourceContext?: InvestigationSourceContext;
  entries: InvestigationEntry[];
  tags: string[];
  relatedLinks: InvestigationRelatedLink[];
  staleEvidenceStatus?: StaleEvidenceStatus;
}

export interface CreateInvestigationInput {
  title: string;
  repoId: string;
  repoName?: string;
  originalQuestion: string;
  initialAnswerSummary: string;
  detailedFindings?: string[];
  evidence?: EvidenceSource[];
  sourceContext?: InvestigationSourceContext;
  tags?: string[];
  visibility?: InvestigationVisibility;
}

export interface UpdateInvestigationInput {
  title?: string;
  status?: InvestigationStatus;
  visibility?: InvestigationVisibility;
  tags?: string[];
}

export interface SubmitFollowUpInput {
  question: string;
  customContext?: string;
}

export interface InvestigationFilterParams {
  search?: string;
  status?: 'all' | InvestigationStatus;
  repoId?: string;
  tag?: string;
}
