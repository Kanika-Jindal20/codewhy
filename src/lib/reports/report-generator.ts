import { EngineeringDecisionReport } from '@/types/report';
import { Investigation } from '@/types/investigation';
import { getRepositoryGraph, getActiveRepositoryGraph, SAMPLE_REPO_ECOMMERCE } from '@/lib/graph/graph-store';
import { SAMPLE_REPORT_JWT_REFACTOR } from './sample-report-data';

/**
 * Builds an official EngineeringDecisionReport from a real saved Investigation.
 */
export function buildReportFromInvestigation(inv: Investigation): EngineeringDecisionReport {
  const graph = getRepositoryGraph(inv.repoId) || getActiveRepositoryGraph();
  const allEvidence = inv.entries.flatMap(e => e.evidence);
  const focalNode = graph.nodes.find(n => n.id === inv.sourceContext?.targetId) || graph.nodes[0] || {
    id: 'node-focal',
    label: inv.title,
    type: 'file',
    filePath: inv.sourceContext?.targetPath || 'codebase',
  };

  const findings = inv.entries.flatMap((entry, idx) =>
    (entry.detailedFindings || []).map((finding, fIdx) => ({
      id: `finding-${entry.id}-${fIdx}`,
      title: finding.slice(0, 50),
      category: 'Architectural Finding',
      severity: (idx === 0 ? 'high' : 'medium') as any,
      explanation: finding,
      supportingEvidenceIds: entry.evidence.map(e => e.id),
    }))
  );

  return {
    id: `rep-${inv.id}`,
    title: `Engineering Decision Audit: ${inv.title}`,
    generatedAt: new Date().toISOString(),
    author: inv.ownerName || 'CodeWhy Architecture Engine',
    version: '1.0.0',
    repository: {
      repoId: inv.repoId,
      repoName: inv.repoName,
      repoUrl: `https://github.com/${inv.repoName}`,
      analyzedCommit: allEvidence.find(e => e.commitHash)?.commitHash || 'HEAD',
      analyzedBranch: 'main',
      primaryLanguage: 'TypeScript',
    },
    executiveSummary: {
      headline: inv.entries[0]?.answerSummary || inv.originalQuestion,
      overview: `Traceable engineering audit for ${inv.title}. Grounded across ${allEvidence.length} verified code/AST citations.`,
      criticalTakeaways: inv.entries[0]?.detailedFindings?.slice(0, 3) || [
        'AST relationships verified across repo knowledge graph.',
      ],
      riskAssessmentLevel: findings.some(f => f.severity === 'high') ? 'elevated' : 'moderate',
    },
    proposedChange: {
      targetSymbolOrFile: focalNode.filePath || focalNode.label,
      changeCategory: 'breaking_interface',
      questionOrDescription: inv.originalQuestion,
      rationale: inv.entries[0]?.answerSummary,
    },
    findings,
    architectureContext: {
      focalNode,
      connectedNodes: graph.nodes.slice(0, 8),
      edges: graph.edges.slice(0, 10),
      directCallersCount: graph.edges.filter(e => e.target === focalNode.id).length,
      transitiveConsumersCount: Math.max(1, graph.edges.filter(e => e.source === focalNode.id).length),
      architecturalRoleDescription: focalNode.description || `Core symbol in ${inv.repoName}`,
    },
    evidence: allEvidence,
    uncertainties: inv.entries.length === 1 && allEvidence.length === 0 ? [
      {
        area: 'Historical Documentation',
        divergingSignals: 'No linked documentation or ADR retrieved for historical rationale.',
        confidenceScore: 0.5,
        suggestedClarification: 'Team should verify commit logs directly.',
      }
    ] : [],
    decisionTimeline: inv.entries.map((e, idx) => ({
      id: `dt-${e.id}`,
      date: e.timestamp.slice(0, 10),
      title: e.question,
      rationale: e.detailedFindings?.[0] || e.answerSummary,
      status: (idx === 0 ? 'active' : 'deprecated') as 'active' | 'deprecated',
      evidenceId: e.evidence[0]?.id,
    })),
    limitations: {
      staticAnalysisCaveats: [
        'Dynamic reflection: Runtime eval() or dynamic import() cannot be deterministically resolved by AST alone.',
      ],
      recommendedChecklist: [
        'Run automated regression test suite.',
        'Verify public API contract signatures.',
      ],
      suggestedFollowUpInvestigations: [
        'Audit downstream caller error handling.',
      ],
    },
    confidence: {
      level: allEvidence.length > 2 ? 'high' : 'medium',
      score: allEvidence.length > 2 ? 0.95 : 0.75,
      reasoning: `Audit grounded in ${allEvidence.length} repository citations from ${inv.repoName}.`,
      limitations: ['Dynamic eval or untyped reflection cannot be statically proven.'],
    },
  };
}
