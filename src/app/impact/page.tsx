'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  HelpCircle, 
  SlidersHorizontal, 
  BookmarkCheck,
  AlertCircle,
  FileText,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  GitBranch,
  Target
} from 'lucide-react';
import { SAMPLE_REPO_ECOMMERCE } from '@/lib/graph/sample-repo';
import { useActiveRepo } from '@/lib/repositories/active-repo-client';
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
import { Badge } from '@/components/ui/Badge';
import { ExportPdfModal } from '@/components/reports/ExportPdfModal';
import { EngineeringDecisionReport } from '@/types/report';
import Link from 'next/link';

export default function ImpactAnalysisPage() {
  const { activeRepo } = useActiveRepo();
  const [availableNodes, setAvailableNodes] = useState<GraphNode[]>(SAMPLE_REPO_ECOMMERCE.nodes);
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

  useEffect(() => {
    let isCancelled = false;
    async function loadRepoGraph() {
      try {
        const graphRes = await fetch(`/api/graph?repoId=${encodeURIComponent(activeRepo.repoId)}&limit=100`);
        if (graphRes.ok) {
          const graphData = await graphRes.json();
          if (!isCancelled && Array.isArray(graphData.nodes) && graphData.nodes.length > 0) {
            setAvailableNodes(graphData.nodes);
            const params = new URLSearchParams(window.location.search);
            const targetId = params.get('targetNodeId');
            const matched = targetId ? graphData.nodes.find((n: GraphNode) => n.id === targetId) : graphData.nodes[0];
            if (matched) {
              setSelectedNode(matched);
            }
            if (activeRepo.repoId !== SAMPLE_REPO_ECOMMERCE.repoId) {
              setChangeDescription(`Refactor ${matched?.label || 'core module'} to update function signatures and verify downstream consumers.`);
            }
            setAnalysisResult(null);
          }
        }
      } catch (err) {
        console.warn('Could not load repository graph nodes for impact analysis:', err);
      }
    }
    loadRepoGraph();
    return () => { isCancelled = true; };
  }, [activeRepo.repoId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get('targetNodeId');
      if (targetId) {
        const found = availableNodes.find((n) => n.id === targetId);
        if (found) {
          setSelectedNode(found);
        }
      }
    }
  }, [availableNodes]);

  const handleSaveInvestigation = async () => {
    if (!analysisResult) return;
    try {
      const res = await fetch('/api/investigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Pre-Change Impact: ${analysisResult.selectedComponent.label} (${analysisResult.proposedChange.category})`,
          repoId: analysisResult.repoId,
          repoName: activeRepo.repoName,
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
        repoName: activeRepo.repoName,
        repoUrl: `https://github.com/${activeRepo.repoName}`,
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

  useEffect(() => {
    runAnalysis();
  }, [selectedNode.id]);

  const runAnalysis = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoId: activeRepo.repoId,
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
      console.error('Impact calculation error:', err);
      setError(err.message || 'Failed to compute impact analysis.');
      setAnalysisResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-white border border-border-default rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-brand-emerald/10 text-brand-deep border border-brand-emerald/20">
              <Zap className="w-3 h-3 text-brand-emerald" />
              Pre-Change Intelligence
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-muted text-ink-muted border border-border-subtle font-mono">
              AST Grounded
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink-primary tracking-tight">
            Impact Analysis
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl">
            Simulate code changes before making them. Inspect blast radius, caller chains, test requirements, and breaking contract risks.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-secondary border border-border-default rounded-lg text-xs">
            <Target className="w-3.5 h-3.5 text-brand-deep" />
            <span className="text-ink-muted">Target:</span>
            <span className="font-mono font-medium text-ink-primary truncate max-w-[180px]">{selectedNode.label}</span>
          </div>
          {analysisResult && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExportModalOpen(true)}
              icon={<FileText className="w-3.5 h-3.5" />}
            >
              Export PDF
            </Button>
          )}
        </div>
      </div>

      {/* 5-Stage Visual Workflow Strip */}
      <div className="bg-white border border-border-default rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-deep" />
            <span className="text-xs font-semibold text-ink-primary">5-Stage Impact Pipeline</span>
          </div>
          <span className="text-[11px] font-medium text-ink-muted bg-surface-muted px-2.5 py-0.5 rounded-full border border-border-subtle">
            {analysisResult ? 'All Stages Evaluated' : isLoading ? 'Running AST Pass…' : 'Configuring'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { step: '1', label: 'Select Target', value: selectedNode.label, status: 'done' },
            { step: '2', label: 'Change Type', value: changeCategory.replace(/_/g, ' '), status: 'done' },
            { step: '3', label: 'Depth Bounds', value: `${maxDepth} Hops`, status: 'done' },
            { step: '4', label: 'AST Traversal', value: isLoading ? 'Computing…' : 'Deterministic ✓', status: isLoading ? 'active' : 'done' },
            { step: '5', label: 'Blast Radius', value: analysisResult ? `${analysisResult.summary.totalAffected} Affected` : 'Pending', status: analysisResult ? 'done' : 'pending' },
          ].map((stage, i) => (
            <div 
              key={i} 
              className={`rounded-lg p-2.5 border transition-all ${
                stage.status === 'done'
                  ? 'bg-surface-secondary border-border-default'
                  : stage.status === 'active'
                  ? 'bg-brand-emerald/5 border-brand-emerald/40 ring-1 ring-brand-emerald/20'
                  : 'bg-surface-muted/40 border-border-subtle opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-ink-faint uppercase tracking-wider">Stage {stage.step}</span>
                {stage.status === 'done' && <CheckCircle2 className="w-3 h-3 text-brand-deep" />}
              </div>
              <div className="text-[11px] font-medium text-ink-muted">{stage.label}</div>
              <div className="text-xs font-semibold text-ink-primary truncate font-mono mt-0.5">{stage.value}</div>
            </div>
          ))}
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
              className="text-brand-deep underline font-medium ml-2 hover:opacity-80 shrink-0"
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
            nodes={availableNodes}
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
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
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