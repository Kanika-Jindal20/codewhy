import { EvidenceSource } from './evidence';

export type GapSeverity = 'critical' | 'high' | 'medium' | 'low';
export type GapStatus = 'unresolved' | 'resolved' | 'ignored';

export interface KnowledgeDebtScore {
  overallScore: number;
  tier: 'low' | 'moderate' | 'high' | 'critical';
  tierLabel: string;
  formula: string;
  formulaExplanation: string;
  totalFindingsCount: number;
  severityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  categoryBreakdown: Record<string, number>;
  contributingFactors?: Array<{
    ruleId: string;
    ruleName: string;
    points: number;
    findingsCount: number;
  }>;
}

export interface KnowledgeGapFinding {
  id: string;
  repoId: string;
  targetComponent: string;
  filePath: string;
  category: string;
  title: string;
  description: string;
  evidence?: EvidenceSource[];
  ruleId: string;
  ruleName: string;
  developerImpact: string;
  suggestedImprovement: string;
  severity: GapSeverity;
  severityPoints: number;
  status: GapStatus;
  detectedAt: string;
}
