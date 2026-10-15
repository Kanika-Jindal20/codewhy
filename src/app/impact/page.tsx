'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  RefreshCw, 
  HelpCircle, 
  SlidersHorizontal, 
  BookmarkCheck,
  AlertCircle,
  FileText 
} from 'lucide-react';
import { SAMPLE_REPO_ECOMMERCE } from '@/lib/graph/graph-store';
import { analyzeChangeImpact } from '@/lib/impact/impact-service';
import { 
  ImpactAnalysisResult, 
  ChangeCategory, 
  AffectedComponent 
} from '@/types/impact';
import { GraphNode } from '@/types/graph';
import { ComponentSelector } from '@/components/impact/ComponentSelector';
import { ChangeProposalCard } from '@/components/impact/ChangeProposalCard';
import { ImpactSummaryBanner } from '@/components/impact/ImpactSummaryBanner';
import { AffectedComponentList } from '@/components/impact/AffectedComponentList';
import { DependencyPathGraph } from '@/components/impact/DependencyPathGraph';
import { ComponentDetailDrawer } from '@/components/impact/ComponentDetailDrawer';
import { ThreeWaySeparationCard } from '@/components/impact/ThreeWaySeparationCard';
import { RisksAndChecklist } from '@/components/impact/RisksAndChecklist';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ExportPdfModal } from '@/components/reports/ExportPdfModal';
import { EngineeringDecisionReport } from '@/types/report';
import Link from 'next/link';

export default function ImpactAnalysisPage() {
  const [selectedNode, setSelectedNode] = useState<GraphNode>(SAMPLE_REPO_ECOMMERCE.nodes[0]);
  const [changeCategory, setChangeCategory] = useState<ChangeCategory>('breaking_interface');
  const [changeDescription, setChangeDescription] = useState<string>(
    'Refactoring verifySessionToken() to asynchronously validate key rotations and return Promise<Result<UserSession>>.'
  );
  const [maxDepth, setMaxDepth] = useState<number>(4);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ImpactAnalysisResult | null>(null);
  const [inspectedComponent, setInspectedComponent] = useState<AffectedComponent | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  const handleSaveInvestigation = async () => {
    if (!analysisResult) return;
    try {
      const res = await fetch('/api/investigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Pre-Change Impact: ${analysisResult.selectedComponent.label} (${analysisResult.proposedChange.category})`,
          repoId: analysisResult.repoId,
          repoName: 'acme/commerce-core',
          originalQuestion: `What is the blast radius and architectural risk of ${analysisResult.proposedChange.description}?`,
          initialAnswerSummary: `Evaluated ${analysisResult.summary.totalAffected} downstream components (${analysisResult.summary.directCount} direct, ${analysisResult.summary.transitiveCount} transitive).`,
          detailedFindings: analysisResult.potentialRisks.map(r => `${r.risk}: ${r.rationale}`),
          evidence: analysisResult.affectedComponents.flatMap(c => c.evidence).slice(0, 5),
          sourceContext: {
            type: 'impact_analysis',
            targetId: analysisResult.selectedComponent.id,
            targetPath: analysisResult.selectedComponent.filePath,
          },
          tags: ['impact', 'blast_radius', analysisResult.proposedChange.category],
        }),
      });
      if (res.ok) {
        setSaveSuccessMessage('Investigation saved to history. Revisit and ask follow-ups at /investigations.');
        setTimeout(() => setSaveSuccessMessage(null), 6000);
      }
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const buildReportFromImpact = (): EngineeringDecisionReport | null => {
    if (!analysisResult) return null;
    return {
      id: `rep-impact-${analysisResult.selectedComponent.id}`,
      title: `Pre-Change Impact Audit: ${analysisResult.selectedComponent.label} (${analysisResult.proposedChange.category})`,
      generatedAt: analysisResult.analyzedAt,
      author: 'CodeWhy Pre-Change Impact Engine',
      version: '1.0.0',
      repository: {
        repoId: analysisResult.repoId,
        repoName: 'acme/commerce-core',
        repoUrl: 'https://github.com/acme/commerce-core',
        analyzedCommit: '7a8f9c2d1b',
        analyzedBranch: 'main',
        primaryLanguage: 'TypeScript',
      },
      executiveSummary: {
        headline: `Evaluated ${analysisResult.summary.totalAffected} downstream entities across ${analysisResult.summary.directCount} direct and ${analysisResult.summary.transitiveCount} transitive hops.`,
        overview: analysisResult.summary.overview,
        criticalTakeaways: analysisResult.potentialRisks.map(r => `${r.risk}: ${r.rationale}`),
        riskAssessmentLevel: analysisResult.potentialRisks.some(r => r.level === 'high') ? 'elevated' : 'moderate',
      },
      proposedChange: {
        targetSymbolOrFile: `${analysisResult.selectedComponent.label} (${analysisResult.selectedComponent.filePath})`,
        changeCategory: analysisResult.proposedChange.category,
        questionOrDescription: analysisResult.proposedChange.description,
      },
      findings: analysisResult.affectedComponents.map((c, i) => ({
        id: `f-${i}`,
        title: `${c.node.label} (${c.impactKind.replace(/_/g, ' ')})`,
        category: c.impactKind,
        severity: c.severity,
        explanation: c.severityReason,
        supportingEvidenceIds: c.evidence.map(e => e.id),
      })),
      impactAnalysis: {
        summary: analysisResult.summary,
        affectedComponents: analysisResult.affectedComponents,
        dependencyPaths: analysisResult.dependencyPaths,
        relatedTests: analysisResult.relatedTests,
        pastRegressions: analysisResult.pastRegressions,
        potentialRisks: analysisResult.potentialRisks,
      },
      evidence: analysisResult.affectedComponents.flatMap(c => c.evidence),
      limitations: {
        staticAnalysisCaveats: analysisResult.limitations || [
          'Dynamic reflection: Runtime eval() or dynamic import() cannot be deterministically resolved by AST alone.',
          'Statistical co-change coupling reflects developer habits, not guaranteed hard architectural dependencies.',
        ],
        recommendedChecklist: analysisResult.manualVerificationAreas.flatMap(a => a.checklist),
        suggestedFollowUpInvestigations: ['Run unit test suites against updated signatures.'],
      },
      confidence: analysisResult.confidence,
    };
  };

  // Run initial impact calculation on mount
  useEffect(() => {
    runAnalysis();
  }, [selectedNode.id]);

  const runAnalysis = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate real API latency / call service
      const res = await fetch('/api/impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoId: SAMPLE_REPO_ECOMMERCE.repoId,
          targetNodeId: selectedNode.id,
          changeCategory,
          proposedChangeDescription: changeDescription,
          maxTransitiveDepth: maxDepth,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to compute impact analysis');
      }

      const data: ImpactAnalysisResult = await res.json();
      setAnalysisResult(data);
    } catch (err: any) {
      console.warn('API fetch fallback to direct service:', err);
      try {
        const fallback = analyzeChangeImpact(SAMPLE_REPO_ECOMMERCE, {
          repoId: SAMPLE_REPO_ECOMMERCE.repoId,
          targetNodeId: selectedNode.id,
          changeCategory,
          proposedChangeDescription: changeDescription,
          maxTransitiveDepth: maxDepth,
        });
        setAnalysisResult(fallback);
      } catch (fallbackErr: any) {
        setError(fallbackErr.message || 'Error executing impact calculation.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-app-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-accent-primary/20 text-accent-primary border border-accent-primary/30">
              <Zap className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              What If We Change This? — Pre-Change Impact Analysis
            </h1>
          </div>
          <p className="text-xs text-text-muted">
            Select any file, class, function, or configuration to compute its blast radius, downstream consumers, test suites, and Git co-changes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-text-muted bg-app-panel px-3 py-1.5 rounded-lg border border-app-border">
            Target: <strong className="text-text-primary">{selectedNode.label}</strong>
          </span>
          {analysisResult && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsExportModalOpen(true)}
              icon={<FileText className="w-3.5 h-3.5 text-accent-primary" />}
            >
              Export PDF Report
            </Button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <Alert type="error" title="Analysis Failure">
          {error}
        </Alert>
      )}

      {/* Save Success Banner */}
      {saveSuccessMessage && (
        <Alert type="success" title="Investigation Saved to Memory">
          <div className="flex items-center justify-between text-xs">
            <span>{saveSuccessMessage}</span>
            <Link
              href="/investigations"
              className="text-status-success underline font-semibold ml-2 hover:opacity-80 shrink-0"
            >
              Open History &rarr;
            </Link>
          </div>
        </Alert>
      )}

      {/* Step 1 & 2: Component Selection & Change Definition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <ComponentSelector
            nodes={SAMPLE_REPO_ECOMMERCE.nodes}
            selectedNodeId={selectedNode.id}
            onSelectNode={(node) => {
              setSelectedNode(node);
              setInspectedComponent(null);
            }}
          />
        </div>

        <div className="lg:col-span-7">
          <ChangeProposalCard
            category={changeCategory}
            onCategoryChange={setChangeCategory}
            description={changeDescription}
            onDescriptionChange={setChangeDescription}
            maxDepth={maxDepth}
            onMaxDepthChange={setMaxDepth}
            onSubmit={runAnalysis}
            isLoading={isLoading}
            targetLabel={selectedNode.label}
          />
        </div>
      </div>

      {/* Analysis Output Results */}
      {isLoading ? (
        <div className="space-y-4 pt-4">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      ) : analysisResult ? (
        <div className="space-y-6 pt-2">
          {/* Summary Banner with High-Density Metrics */}
          <ImpactSummaryBanner result={analysisResult} />

          {/* Interactive Graph View & Table Alternative */}
          <DependencyPathGraph
            targetNode={analysisResult.selectedComponent}
            affectedComponents={analysisResult.affectedComponents}
            selectedComponentId={inspectedComponent?.node.id}
            onSelectComponent={(comp) => setInspectedComponent(comp)}
          />

          {/* Affected Components Filterable List */}
          <AffectedComponentList
            components={analysisResult.affectedComponents}
            selectedComponentId={inspectedComponent?.node.id}
            onSelectComponent={(comp) => setInspectedComponent(comp)}
          />

          {/* Explicit Three-Way Separation: Static vs Heuristics vs AI */}
          <ThreeWaySeparationCard
            staticAnalysis={analysisResult.separation.staticAnalysis}
            heuristicSuggestions={analysisResult.separation.heuristicSuggestions}
            aiInterpretations={analysisResult.separation.aiInterpretations}
          />

          {/* Potential Risks, Historical Regressions, Co-Changes & Verification Checklist */}
          <RisksAndChecklist
            result={analysisResult}
            onSaveInvestigation={handleSaveInvestigation}
          />
        </div>
      ) : null}

      {/* Right Drawer for Deep Component Inspection */}
      <ComponentDetailDrawer
        component={inspectedComponent}
        onClose={() => setInspectedComponent(null)}
      />

      {/* Export Decision Report PDF Modal */}
      {analysisResult && (
        <ExportPdfModal
          report={buildReportFromImpact()!}
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </div>
  );
}
