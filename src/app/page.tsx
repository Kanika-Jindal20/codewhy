import React from 'react';
import Link from 'next/link';
import { 
  FolderGit2, 
  GitBranch, 
  Layers, 
  Zap, 
  Network, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  GitCommit, 
  ArrowRight,
  ShieldCheck 
} from 'lucide-react';
import { SAMPLE_REPO_ECOMMERCE } from '@/lib/graph/graph-store';
import { COMMERCE_COMMIT_HISTORY } from '@/lib/impact/heuristics-engine';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function DashboardOverviewPage() {
  const repo = SAMPLE_REPO_ECOMMERCE;
  const commits = COMMERCE_COMMIT_HISTORY.slice(0, 4);

  // Key verified statistics
  const totalNodes = repo.nodes.length;
  const totalEdges = repo.edges.length;
  const filesCount = repo.nodes.filter(n => n.type === 'file').length;
  const functionsCount = repo.nodes.filter(n => n.type === 'function').length;
  const testCount = repo.nodes.filter(n => n.type === 'test').length;
  const configCount = repo.nodes.filter(n => n.type === 'config').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Banner / Selected Repository Overview */}
      <div className="bg-app-panel border border-app-border rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-2 rounded-lg bg-accent-primary/20 text-accent-primary border border-accent-primary/30">
                <FolderGit2 className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                {repo.repoName}
              </h1>
              <Badge variant="success" size="sm">
                <CheckCircle2 className="w-3 h-3 text-status-success inline mr-1" />
                Indexed & Grounded
              </Badge>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed max-w-2xl">
              Engineering intelligence engine actively tracking AST call graphs, Git commit provenance, and dependency paths.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/impact">
              <Button
                variant="primary"
                size="md"
                icon={<Zap className="w-4 h-4" />}
              >
                Launch Impact Analysis
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-app-border">
          <div className="bg-app-surface/60 border border-app-border rounded-lg p-3">
            <div className="text-[11px] text-text-muted font-medium mb-1">Total Graph Nodes</div>
            <div className="text-xl font-bold font-mono text-text-primary">{totalNodes}</div>
            <div className="text-[10px] text-text-muted mt-0.5">Verified AST entities</div>
          </div>
          <div className="bg-app-surface/60 border border-app-border rounded-lg p-3">
            <div className="text-[11px] text-text-muted font-medium mb-1">Graph Edges</div>
            <div className="text-xl font-bold font-mono text-text-primary">{totalEdges}</div>
            <div className="text-[10px] text-text-muted mt-0.5">Imports & calls</div>
          </div>
          <div className="bg-app-surface/60 border border-app-border rounded-lg p-3">
            <div className="text-[11px] text-text-muted font-medium mb-1">Source Files</div>
            <div className="text-xl font-bold font-mono text-text-primary">{filesCount}</div>
            <div className="text-[10px] text-text-muted mt-0.5">TypeScript core</div>
          </div>
          <div className="bg-app-surface/60 border border-app-border rounded-lg p-3">
            <div className="text-[11px] text-text-muted font-medium mb-1">Exported Symbols</div>
            <div className="text-xl font-bold font-mono text-text-primary">{functionsCount}</div>
            <div className="text-[10px] text-text-muted mt-0.5">Functions & classes</div>
          </div>
          <div className="bg-app-surface/60 border border-app-border rounded-lg p-3">
            <div className="text-[11px] text-text-muted font-medium mb-1">Test Suites</div>
            <div className="text-xl font-bold font-mono text-text-primary">{testCount}</div>
            <div className="text-[10px] text-text-muted mt-0.5">Unit & E2E coverage</div>
          </div>
          <div className="bg-app-surface/60 border border-app-border rounded-lg p-3">
            <div className="text-[11px] text-text-muted font-medium mb-1">Configs & Schemas</div>
            <div className="text-xl font-bold font-mono text-text-primary">{configCount}</div>
            <div className="text-[10px] text-text-muted mt-0.5">Environment schemas</div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Recent Changes & Impact Analysis Spotlight */}
        <div className="lg:col-span-8 space-y-6">
          {/* Feature spotlight grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Feature 7 — Impact Analysis */}
            <div className="bg-gradient-to-r from-accent-primary/10 via-app-panel to-app-surface border border-accent-primary/30 rounded-lg p-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-xs font-semibold text-accent-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4" />
                  Impact Analysis
                </span>
                <Badge variant="purple" size="sm">Feature 7</Badge>
              </div>
              <h2 className="text-base font-bold text-text-primary mb-1">
                Pre-Change Blast Radius
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed mb-4">
                Evaluate direct callers, transitive dependents, unit tests, and co-change history before editing code.
              </p>
              <Link href="/impact">
                <Button variant="primary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Try Impact Estimator
                </Button>
              </Link>
            </div>

            {/* Feature 11 — Architecture Explorer */}
            <div className="bg-gradient-to-r from-accent-secondary/10 via-app-panel to-app-surface border border-accent-secondary/30 rounded-lg p-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-xs font-semibold text-accent-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Network className="w-4 h-4" />
                  Architecture Explorer
                </span>
                <Badge variant="success" size="sm">Feature 11 New</Badge>
              </div>
              <h2 className="text-base font-bold text-text-primary mb-1">
                Explainable Architecture Graph
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed mb-4">
                Visually explore component relationships, search entities, expand neighborhoods, and trace evidence to source code.
              </p>
              <Link href="/architecture">
                <Button variant="secondary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Open Explorer
                </Button>
              </Link>
            </div>
          </div>

          {/* Recent Commits & Detected Changes */}
          <div className="bg-app-panel border border-app-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-accent-secondary" />
                  Recent Commits & Detected Changes
                </h3>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Extracted from git history with associated file touches and regression flags.
                </p>
              </div>
              <span className="text-xs text-text-muted font-mono">{commits.length} commits</span>
            </div>

            <div className="space-y-3">
              {commits.map((commit) => (
                <div
                  key={commit.hash}
                  className="p-3 rounded-lg bg-app-surface/50 border border-app-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-semibold text-accent-secondary bg-accent-secondary/15 px-1.5 py-0.5 rounded border border-accent-secondary/30">
                        {commit.hash}
                      </span>
                      <span className="text-xs font-semibold text-text-primary truncate">
                        {commit.message}
                      </span>
                      {commit.isRegressionOrBugfix && (
                        <Badge variant="warning" size="sm">Historical Bugfix</Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-text-muted font-mono truncate">
                      Touched: {commit.filesChanged.join(', ')}
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-text-muted shrink-0 font-mono">
                    {new Date(commit.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Knowledge Gaps & Intelligence Status */}
        <div className="lg:col-span-4 space-y-6">
          {/* Important Unresolved Knowledge Gaps */}
          <div className="bg-app-panel border border-app-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-status-warning" />
                Unresolved Knowledge Gaps
              </h3>
              <Badge variant="warning" size="sm">2 Detected</Badge>
            </div>
            <p className="text-[11px] text-text-muted mb-3">
              Areas lacking architectural documentation (ADRs) or direct test suites.
            </p>

            <div className="space-y-2.5">
              <div className="p-3 rounded-lg bg-status-warning/10 border border-status-warning/30 text-xs">
                <div className="font-semibold text-status-warning mb-1">
                  Missing ADR for Token Key Rotation
                </div>
                <p className="text-text-secondary text-[11px] leading-relaxed">
                  Key rotation logic was introduced in commit 7a8f9c, but no architectural decision record documents the fallback protocol.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-status-warning/10 border border-status-warning/30 text-xs">
                <div className="font-semibold text-status-warning mb-1">
                  Untested Gateway Header Dependency
                </div>
                <p className="text-text-secondary text-[11px] leading-relaxed">
                  gateway.config.json references auth header pass-through, but no contract integration test validates headers.
                </p>
              </div>
            </div>
          </div>

          {/* Traceability Guarantee */}
          <div className="bg-app-panel border border-app-border rounded-lg p-5 text-xs">
            <div className="flex items-center gap-2 mb-2 text-status-success font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Evidence Provenance Guarantee
            </div>
            <p className="text-text-muted text-[11px] leading-relaxed">
              Every insight on CodeWhy links directly to source code lines, AST nodes, or verified Git commits. We never present unsupported or fabricated AI assertions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
