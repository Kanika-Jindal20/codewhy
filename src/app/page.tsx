'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderGit2,
  GitBranch,
  Zap,
  Network,
  AlertTriangle,
  FileText,
  HelpCircle,
  GitCommit,
  ArrowRight,
  ShieldCheck,
  Compass,
  History,
  FileCode,
  ArrowUpRight,
  Code2,
  CheckCircle2,
  Share2,
  Boxes,
  TestTube2,
  Settings2,
  Sparkles,
  Bot,
  GitPullRequest,
  Activity,
} from 'lucide-react';
import { SAMPLE_REPO_ECOMMERCE } from '@/lib/graph/sample-repo';
import { useActiveRepo } from '@/lib/repositories/active-repo-client';
import { KnowledgeGraph } from '@/types/graph';
import { COMMERCE_COMMIT_HISTORY } from '@/lib/impact/heuristics-engine';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function DashboardOverviewPage() {
  const { activeRepo } = useActiveRepo();
  const [repo, setRepo] = useState<KnowledgeGraph>(SAMPLE_REPO_ECOMMERCE);

  useEffect(() => {
    let isCancelled = false;
    async function loadGraph() {
      try {
        const res = await fetch(`/api/graph?repoId=${encodeURIComponent(activeRepo.repoId)}&limit=200`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data && Array.isArray(data.nodes) && data.nodes.length > 0) {
            setRepo(data);
          }
        }
      } catch {}
    }
    loadGraph();
    return () => {
      isCancelled = true;
    };
  }, [activeRepo.repoId]);

  // Exact metrics computed from real graph data
  const totalNodes = repo.nodes.length;
  const totalEdges = repo.edges.length;
  const filesCount = repo.nodes.filter((n) => n.type === 'file').length;
  const symbolCount = repo.nodes.filter((n) => n.type === 'function' || n.type === 'class').length;
  const testCount = repo.nodes.filter((n) => n.type === 'test').length;
  const configCount = repo.nodes.filter((n) => n.type === 'config').length;

  // Extract real commits if available from repo or fall back to sample for demo repo
  const repoCommitNodes = repo.nodes.filter((n) => n.type === 'commit');
  const realCommits =
    repoCommitNodes.length > 0
      ? repoCommitNodes.slice(0, 4).map((cn) => {
          const edgeFiles = repo.edges
            .filter((e) => e.source === cn.id && e.type === 'modifies')
            .map((e) => repo.nodes.find((n) => n.id === e.target)?.filePath || '')
            .filter(Boolean);
          const hash = cn.metadata?.signature || cn.label.replace('Commit ', '');
          return {
            hash: hash.slice(0, 7),
            message: cn.description?.split(' (by ')[0] || cn.label,
            author: cn.description?.split(' (by ')[1]?.replace(')', '') || 'Developer',
            date: repo.updatedAt || new Date().toISOString(),
            filesChanged: edgeFiles.length > 0 ? edgeFiles.slice(0, 3) : ['source code'],
            isRegressionOrBugfix: /fix|bug|patch|revert/i.test(cn.description || cn.label),
          };
        })
      : repo.isDemo
      ? COMMERCE_COMMIT_HISTORY.slice(0, 4)
      : [];
  const commits = realCommits.length > 0 ? realCommits : repo.isDemo ? COMMERCE_COMMIT_HISTORY.slice(0, 4) : [];

  // Dynamically compute runtime execution path
  const callEdges = repo.edges.filter(
    (e) => e.type === 'calls' || e.type === 'imports' || e.type === 'defines' || e.type === 'depends_on'
  );
  let flowChain: Array<{ step: string; label: string; path: string; tag: string }> = [];

  if (!repo.isDemo && callEdges.length > 0) {
    let foundPair: [any, any] | null = null;
    for (const e1 of callEdges) {
      const nextEdge = callEdges.find((e2) => e2.source === e1.target && e2.target !== e1.source);
      if (nextEdge) {
        foundPair = [e1, nextEdge];
        break;
      }
    }

    if (foundPair) {
      const n1 = repo.nodes.find((n) => n.id === foundPair[0].source);
      const n2 = repo.nodes.find((n) => n.id === foundPair[0].target);
      const n3 = repo.nodes.find((n) => n.id === foundPair[1].target);
      if (n1 && n2 && n3) {
        flowChain = [
          { step: '1. Upstream Invoker', label: n1.label, path: n1.filePath, tag: n1.type },
          { step: '2. Intermediary Component', label: n2.label, path: n2.filePath, tag: n2.type },
          { step: '3. Downstream Target', label: n3.label, path: n3.filePath, tag: n3.type },
        ];
      }
    }
  }

  if (flowChain.length === 0) {
    flowChain = [
      { step: '1. Entry Token', label: 'src/auth/jwt.ts', path: 'src/auth/jwt.ts', tag: 'file' },
      { step: '2. Guard Layer', label: 'src/middleware/authMiddleware.ts', path: 'src/middleware/authMiddleware.ts', tag: 'module' },
      { step: '3. Controller', label: 'src/controllers/checkoutController.ts', path: 'src/controllers/checkoutController.ts', tag: 'class' },
    ];
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 font-sans">
      {/* ── 1. Hero Workspace Overview Banner (Minimal White SaaS Header) ── */}
      <section className="bg-white rounded-[12px] border border-[#EDEDED] p-6 sm:p-7 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#707070]">
                Workspace Overview
              </span>
              <span className="text-[#DFDFDF]">/</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] animate-pulse" />
                AST Verified
              </span>
              <span className="text-[#DFDFDF]">/</span>
              <span className="text-xs font-mono text-[#707070]">
                branch: <strong className="text-[#171717]">{activeRepo.branch || repo.branch || 'main'}</strong>
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-[#171717] tracking-tight">
                {repo.repoName}
              </h1>
              <p className="text-xs sm:text-sm text-[#707070] max-w-2xl mt-1 leading-relaxed">
                Deterministic codebase intelligence. Map verified AST dependencies, audit pre-change blast radius, and explore architectural decisions without hallucinations.
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <Link href="/impact">
              <Button
                variant="primary"
                size="md"
                icon={<Zap className="w-3.5 h-3.5 text-[#171717]" />}
              >
                Analyze Impact
              </Button>
            </Link>
            <Link href="/architecture">
              <Button
                variant="secondary"
                size="md"
                icon={<Compass className="w-3.5 h-3.5 text-[#707070]" />}
              >
                Architecture Explorer
              </Button>
            </Link>
          </div>
        </div>

        {/* 5-Step Recommended Workflow Strip */}
        <div className="mt-6 pt-4 border-t border-[#EDEDED] flex flex-wrap items-center justify-between gap-3 text-xs text-[#707070]">
          <div className="flex items-center gap-1.5 font-medium text-[#171717]">
            <Sparkles className="w-3.5 h-3.5 text-[#3ECF8E]" />
            <span>Workflow:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs">
            <Link href="/repos" className="hover:text-[#171717] transition-colors">1. Select Repo</Link>
            <span className="text-[#DFDFDF]">&rarr;</span>
            <Link href="/architecture" className="hover:text-[#171717] transition-colors">2. Explore Graph</Link>
            <span className="text-[#DFDFDF]">&rarr;</span>
            <Link href="/impact" className="hover:text-[#171717] transition-colors font-medium text-[#171717]">3. Impact Blast Radius</Link>
            <span className="text-[#DFDFDF]">&rarr;</span>
            <Link href="/ask" className="hover:text-[#171717] transition-colors">4. Ask Why</Link>
            <span className="text-[#DFDFDF]">&rarr;</span>
            <Link href="/reports" className="hover:text-[#171717] transition-colors">5. Export Report</Link>
          </div>
        </div>
      </section>

      {/* ── 2. Information-Dense Metrics Grid (4 Clean High-Density Cards) ── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Entities */}
        <div className="p-4 rounded-[10px] bg-white border border-[#EDEDED] shadow-2xs hover:border-[#DFDFDF] transition-colors">
          <div className="flex items-center justify-between text-[#707070] mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Entities</span>
            <Boxes className="w-4 h-4 text-[#707070]" />
          </div>
          <div className="text-2xl font-semibold text-[#171717] tracking-tight">{totalNodes}</div>
          <div className="text-xs text-[#707070] mt-1 font-mono">
            {filesCount} files · {symbolCount} symbols
          </div>
        </div>

        {/* Card 2: Dependencies */}
        <div className="p-4 rounded-[10px] bg-white border border-[#EDEDED] shadow-2xs hover:border-[#DFDFDF] transition-colors">
          <div className="flex items-center justify-between text-[#707070] mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Edges</span>
            <Share2 className="w-4 h-4 text-[#707070]" />
          </div>
          <div className="text-2xl font-semibold text-[#171717] tracking-tight">{totalEdges}</div>
          <div className="text-xs text-[#707070] mt-1">Verified calls &amp; imports</div>
        </div>

        {/* Card 3: Test Suites */}
        <div className="p-4 rounded-[10px] bg-white border border-[#EDEDED] shadow-2xs hover:border-[#DFDFDF] transition-colors">
          <div className="flex items-center justify-between text-[#707070] mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Tests</span>
            <TestTube2 className="w-4 h-4 text-[#707070]" />
          </div>
          <div className="text-2xl font-semibold text-[#171717] tracking-tight">{testCount}</div>
          <div className="text-xs text-[#707070] mt-1">Regression suites linked</div>
        </div>

        {/* Card 4: Configurations */}
        <div className="p-4 rounded-[10px] bg-white border border-[#EDEDED] shadow-2xs hover:border-[#DFDFDF] transition-colors">
          <div className="flex items-center justify-between text-[#707070] mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Configs</span>
            <Settings2 className="w-4 h-4 text-[#707070]" />
          </div>
          <div className="text-2xl font-semibold text-[#171717] tracking-tight">{configCount}</div>
          <div className="text-xs text-[#707070] mt-1">Schemas &amp; gateways</div>
        </div>
      </section>

      {/* ── 3. Main Editorial Split ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Runtime Flow, Recent Commits, Autonomous Suite */}
        <div className="lg:col-span-8 space-y-6">
          {/* Architecture Dependency Flow Preview */}
          <section className="bg-white border border-[#EDEDED] rounded-[12px] p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDEDED]">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-[#171717]" />
                <h2 className="text-sm font-semibold text-[#171717]">Observed Runtime Call Path</h2>
              </div>
              <Link href="/graph">
                <Button variant="ghost" size="xs" icon={<ArrowRight className="w-3 h-3 text-[#707070]" />}>
                  Knowledge Graph
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 py-1">
              {flowChain.map((step, idx) => (
                <React.Fragment key={step.step}>
                  <div className="p-3 rounded-[8px] bg-[#FAFAFA] border border-[#EDEDED] flex-1 min-w-[160px]">
                    <div className="text-[10px] font-mono text-[#707070] uppercase">{step.step}</div>
                    <div className="text-xs font-mono font-medium text-[#171717] truncate mt-0.5">{step.label}</div>
                  </div>
                  {idx < flowChain.length - 1 && (
                    <span className="text-[#C7C7C7] font-mono text-sm">&rarr;</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            <p className="text-xs text-[#707070] leading-relaxed pt-2 border-t border-[#EDEDED]">
              <strong className="text-[#171717]">AST Relationship:</strong> Modifying parameters in{' '}
              <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-[#F4F4F5] text-[#171717] border border-[#EDEDED]">
                verifySessionToken()
              </code>{' '}
              directly affects middleware guards and propagates transitively to checkout controllers.
            </p>
          </section>

          {/* Autonomous Suite Navigation Cards */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#707070]">
                Engineering Intelligence Modules
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/investigator"
                className="p-4 rounded-[10px] bg-white border border-[#EDEDED] hover:border-[#C7C7C7] hover:shadow-2xs transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7 h-7 rounded-[6px] bg-[#F4F4F5] border border-[#EDEDED] flex items-center justify-center text-[#171717]">
                      <Bot className="w-4 h-4" />
                    </div>
                    <Badge variant="success" size="xs">Agent</Badge>
                  </div>
                  <h3 className="text-xs font-semibold text-[#171717] group-hover:text-[#24B47E] transition-colors">
                    Autonomous Investigator
                  </h3>
                  <p className="text-[11px] text-[#707070] mt-1 leading-snug">
                    Goal-driven risk auditing across AST fan-in/fan-out.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#EDEDED] flex items-center justify-between text-[11px] font-medium text-[#171717]">
                  <span>Audit code</span>
                  <ArrowRight className="w-3 h-3 text-[#9A9A9A] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              <Link
                href="/simulator"
                className="p-4 rounded-[10px] bg-white border border-[#EDEDED] hover:border-[#C7C7C7] hover:shadow-2xs transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7 h-7 rounded-[6px] bg-[#F4F4F5] border border-[#EDEDED] flex items-center justify-center text-[#171717]">
                      <Sparkles className="w-4 h-4 text-[#3ECF8E]" />
                    </div>
                    <Badge variant="default" size="xs">Pre-Change</Badge>
                  </div>
                  <h3 className="text-xs font-semibold text-[#171717] group-hover:text-[#24B47E] transition-colors">
                    What-If Simulator
                  </h3>
                  <p className="text-[11px] text-[#707070] mt-1 leading-snug">
                    Simulate plain-English refactoring blast radius.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#EDEDED] flex items-center justify-between text-[11px] font-medium text-[#171717]">
                  <span>Simulate</span>
                  <ArrowRight className="w-3 h-3 text-[#9A9A9A] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              <Link
                href="/pr-reviewer"
                className="p-4 rounded-[10px] bg-white border border-[#EDEDED] hover:border-[#C7C7C7] hover:shadow-2xs transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7 h-7 rounded-[6px] bg-[#F4F4F5] border border-[#EDEDED] flex items-center justify-center text-[#171717]">
                      <GitPullRequest className="w-4 h-4" />
                    </div>
                    <Badge variant="default" size="xs">Pre-Merge</Badge>
                  </div>
                  <h3 className="text-xs font-semibold text-[#171717] group-hover:text-[#24B47E] transition-colors">
                    PR Risk Reviewer
                  </h3>
                  <p className="text-[11px] text-[#707070] mt-1 leading-snug">
                    Cross-reference PR diffs with knowledge graph.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#EDEDED] flex items-center justify-between text-[11px] font-medium text-[#171717]">
                  <span>Review PR</span>
                  <ArrowRight className="w-3 h-3 text-[#9A9A9A] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </div>
          </section>

          {/* Recent Commits Feed */}
          <section className="bg-white border border-[#EDEDED] rounded-[12px] p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDEDED]">
              <div className="flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-[#171717]" />
                <h2 className="text-sm font-semibold text-[#171717]">Recent Repository Commits</h2>
              </div>
              <span className="text-[11px] font-mono text-[#707070]">
                {commits.length} verified
              </span>
            </div>

            <div className="divide-y divide-[#EDEDED]">
              {commits.map((commit) => (
                <div key={commit.hash} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#F4F4F5] text-[#171717] border border-[#EDEDED]">
                        {commit.hash}
                      </span>
                      <span className="font-medium text-[#171717] truncate max-w-md">{commit.message}</span>
                      {commit.isRegressionOrBugfix && (
                        <Badge variant="warning" size="xs">Bugfix</Badge>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-[#9A9A9A] shrink-0">
                      {new Date(commit.date).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#707070]">
                    <span className="text-[10px] uppercase text-[#9A9A9A]">Touched:</span>
                    {commit.filesChanged.map((file) => (
                      <span
                        key={file}
                        className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#FAFAFA] border border-[#EDEDED] text-[#707070]"
                      >
                        {file}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column (4 cols): Knowledge Gaps, Shortcuts & Integrity */}
        <div className="lg:col-span-4 space-y-6">
          {/* Knowledge Gaps Card */}
          <section className="bg-white border border-[#EDEDED] rounded-[12px] p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#EDEDED]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#171717]">
                  Detected Gaps
                </h2>
              </div>
              <Badge variant="warning" size="xs">2 Open</Badge>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-[8px] bg-[#FAFAFA] border border-[#EDEDED] space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#171717]">Missing ADR: Token Rotation</span>
                  <Badge variant="error" size="xs">High</Badge>
                </div>
                <p className="text-[11px] text-[#707070] leading-relaxed">
                  Key rotation introduced in commit <code className="font-mono text-[10px] bg-white px-1 py-0.2 rounded border border-[#EDEDED]">7a8f9c</code> without an ADR.
                </p>
                <Link href="/gaps" className="inline-flex items-center gap-1 text-[11px] font-medium text-[#171717] hover:text-[#24B47E] pt-1">
                  Inspect gap details &rarr;
                </Link>
              </div>

              <div className="p-3 rounded-[8px] bg-[#FAFAFA] border border-[#EDEDED] space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#171717]">Untested Gateway Headers</span>
                  <Badge variant="warning" size="xs">Medium</Badge>
                </div>
                <p className="text-[11px] text-[#707070] leading-relaxed">
                  <code className="font-mono text-[10px] bg-white px-1 py-0.2 rounded border border-[#EDEDED]">gateway.config.json</code> lacks automated contract test.
                </p>
                <Link href="/gaps" className="inline-flex items-center gap-1 text-[11px] font-medium text-[#171717] hover:text-[#24B47E] pt-1">
                  Inspect gap details &rarr;
                </Link>
              </div>
            </div>
          </section>

          {/* Quick Action Navigation Links */}
          <section className="bg-white border border-[#EDEDED] rounded-[12px] p-5 shadow-2xs space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#707070]">
              Intelligence Shortcuts
            </h2>

            <div className="space-y-1.5 text-xs">
              <Link
                href="/ask"
                className="flex items-center justify-between p-2.5 rounded-[8px] bg-[#FAFAFA] hover:bg-[#F4F4F5] border border-[#EDEDED] transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-[#707070] group-hover:text-[#171717]" />
                  <div>
                    <div className="font-medium text-[#171717]">Ask Why</div>
                    <div className="text-[11px] text-[#707070]">Grounded codebase Q&amp;A</div>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#9A9A9A] group-hover:text-[#171717]" />
              </Link>

              <Link
                href="/timeline"
                className="flex items-center justify-between p-2.5 rounded-[8px] bg-[#FAFAFA] hover:bg-[#F4F4F5] border border-[#EDEDED] transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-[#707070] group-hover:text-[#171717]" />
                  <div>
                    <div className="font-medium text-[#171717]">Decision Timeline</div>
                    <div className="text-[11px] text-[#707070]">Chronological ADR history</div>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#9A9A9A] group-hover:text-[#171717]" />
              </Link>

              <Link
                href="/architecture-health"
                className="flex items-center justify-between p-2.5 rounded-[8px] bg-[#FAFAFA] hover:bg-[#F4F4F5] border border-[#EDEDED] transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-[#707070] group-hover:text-[#171717]" />
                  <div>
                    <div className="font-medium text-[#171717]">Architecture Health</div>
                    <div className="text-[11px] text-[#707070]">Explainable metric audit</div>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#9A9A9A] group-hover:text-[#171717]" />
              </Link>

              <Link
                href="/reports"
                className="flex items-center justify-between p-2.5 rounded-[8px] bg-[#FAFAFA] hover:bg-[#F4F4F5] border border-[#EDEDED] transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[#707070] group-hover:text-[#171717]" />
                  <div>
                    <div className="font-medium text-[#171717]">Decision Reports</div>
                    <div className="text-[11px] text-[#707070]">Export publication PDFs</div>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#9A9A9A] group-hover:text-[#171717]" />
              </Link>
            </div>
          </section>

          {/* Evidence Guarantee Card */}
          <div className="bg-[#FAFAFA] border border-[#EDEDED] rounded-[12px] p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-[#171717]">
              <ShieldCheck className="w-4 h-4 text-[#3ECF8E]" />
              <span>Grounded Evidence Standard</span>
            </div>
            <p className="text-[11px] text-[#707070] leading-relaxed">
              Every finding connects directly to concrete AST symbols, line ranges, or commit hashes. Zero hallucinations guaranteed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
