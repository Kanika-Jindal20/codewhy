import type { EvidenceSource } from './evidence';

export type AskQuestionKind =
  | 'code_explanation'
  | 'historical_reasoning'
  | 'dependency'
  | 'decision_history'
  | 'change_impact'
  | 'unsupported';

export interface AnswerClaim {
  text: string;
  evidenceIds: string[];
  directness: 'direct' | 'indirect' | 'interpretation';
}

export interface AskWhyResponse {
  requestId: string;
  conversationId: string;
  repoId: string;
  question: string;
  questionKind: AskQuestionKind;
  answer: string;
  answerMode: 'ai' | 'evidence_only';
  modelNote?: string;
  claims: AnswerClaim[];
  evidence: EvidenceSource[];
  reliability: import('./evidence').ReliabilityAssessment;
  followUpQuestions: string[];
  isDemoData: boolean;
}

export interface AskWhyRequest {
  repoId: string;
  question: string;
  conversationId?: string;
  /** Prior user questions only; prior answers are never treated as repository evidence. */
  recentQuestions?: string[];
}
