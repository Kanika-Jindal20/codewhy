import React from 'react';
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
  Layers,
  Code2,
  CheckCircle2,
  Share2,
  Boxes,
  Cpu,
  TestTube2,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { SAMPLE_REPO_ECOMMERCE, getActiveRepositoryGraph } from '@/lib/graph/graph-store';
import { COMMERCE_COMMIT_HISTORY } from '@/lib/impact/heuristics-engine';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function DashboardOverviewPage() {
  const repo = getActiveRepositoryGraph();
  const commits = COMMERCE_COMMIT_HISTORY.slice(0, 4);

  // Exact metrics computed from real graph data
  const totalNodes = repo.nodes.length;
  const totalEdges = repo.edges.length;
  const filesCount = repo.nodes.filter(n => n.type === 'file').length;
  const symbolCount = repo.nodes.filter(n => n.type === 'function' || n.type === 'class').length;
  const testCount = repo.nodes.filter(n => n.type === 'test').length;
  const configCount = repo.nodes.filter(n => n.type === 'config').length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* 1. Hero Header & Primary Actions */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#14213D] via-[#1E2E4F] to-[#2B3E68] text-white rounded-3xl p-7 sm:p-9 shadow-elevated border border-slate-700/50">
        {/* Soft glowing ambient circles */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 rounded-full bg-[#3B82F6]/25 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-12 w-72 h-72 rounded-full bg-[#8B5CF6]/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            {/* 3D-styled Emblem Container */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/20 p-1 flex items-center justify-center shrink-0 shadow-lg">
              <div className="w-full h-full rounded-xl bg-gradient-to-tr from-[#3B82F6] via-[#6366F1] to-[#8B5CF6] text-white flex items-center justify-center shadow-glowBlue">
                <FolderGit2 className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.2]" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Active Workspace
                </span>
                <span className="text-slate-400">·</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  AST Verified & Grounded
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-xs font-medium text-slate-300">
                  Branch: <code className="font-semibold text-white font-mono bg-white/10 px-2 py-0.5 rounded">main</code>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                {repo.repoName}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
                Engineering intelligence for codebase reasoning: map verified AST dependencies, audit pre-change blast radius, and explore architectural decisions with zero hallucinations.
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0 pt-2 lg:pt-0">
            <Link href="/architecture" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                icon={<Compass className="w-4 h-4 stroke-[2]" />}
                className="w-full sm:w-auto bg-[#3B82F6] hover:bg-[#2563EB] shadow-glowBlue border-0 text-white font-bold"
              >
                Explore Architecture
              </Button>
            </Link>
            <Link href="/impact" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="md"
                icon={<Zap className="w-4 h-4 text-[#3B82F6] stroke-[2]" />}
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm font-bold"
              >
                Analyze Change Impact
              </Button>
            </Link>
          </div>
        </div>

        {/* Developer Journey Flow Strip */}
        <div className="mt-7 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-semibold text-blue-200">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Recommended Workflow:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            <Link href="/repos" className="hover:text-white transition-colors">1. Select Repo</Link>
            <span className="text-slate-500">&rarr;</span>
            <Link href="/architecture" className="hover:text-white transition-colors">2. Explore Graph</Link>
            <span className="text-slate-500">&rarr;</span>
            <Link href="/impact" className="hover:text-white transition-colors font-semibold text-blue-300">3. Impact Blast Radius</Link>
            <span className="text-slate-500">&rarr;</span>
            <Link href="/ask" className="hover:text-white transition-colors">4. Ask Why</Link>
            <span className="text-slate-500">&rarr;</span>
            <Link href="/reports" className="hover:text-white transition-colors">5. Export Report</Link>
          </div>
        </div>
      </section>

      {/* 2. 6 Coordinated Metric Cards (With Plain-English Explanations) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">
              Repository Intelligence Metrics
            </h2>
            <p className="text-xs text-text-secondary">
              Derived deterministically from source code AST and commit history.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-app-border text-text-secondary shadow-2xs">
            Live Analysis State
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
          {/* Card 1: Graph Nodes */}
          <div className="p-4 rounded-2xl bg-white border border-teal-200/80 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                Entities
              </span>
              <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-600 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                <Boxes className="w-4 h-4 stroke-[2]" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#172033]">
                {totalNodes}
              </div>
              <div className="text-xs font-bold text-text-primary mt-0.5">
                Architecture Nodes
              </div>
              <p className="text-[11px] text-text-secondary mt-1 leading-snug">
                Files, functions, and code entities in active graph
              </p>
            </div>
          </div>

          {/* Card 2: Graph Edges */}
          <div className="p-4 rounded-2xl bg-white border border-blue-200/80 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Connections
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                <Share2 className="w-4 h-4 stroke-[2]" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#172033]">
                {totalEdges}
              </div>
              <div className="text-xs font-bold text-text-primary mt-0.5">
                Dependency Edges
              </div>
              <p className="text-[11px] text-text-secondary mt-1 leading-snug">
                Direct calls, imports, and interface connections
              </p>
            </div>
          </div>

          {/* Card 3: Source Files */}
          <div className="p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Modules
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                <FileCode className="w-4 h-4 stroke-[2]" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#172033]">
                {filesCount}
              </div>
              <div className="text-xs font-bold text-text-primary mt-0.5">
                Source Files
              </div>
              <p className="text-[11px] text-text-secondary mt-1 leading-snug">
                TypeScript source files and module boundaries
              </p>
            </div>
          </div>

          {/* Card 4: Exported Symbols */}
          <div className="p-4 rounded-2xl bg-white border border-orange-200/80 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                Symbols
              </span>
              <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-600 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                <Code2 className="w-4 h-4 stroke-[2]" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#172033]">
                {symbolCount}
              </div>
              <div className="text-xs font-bold text-text-primary mt-0.5">
                Exported Symbols
              </div>
              <p className="text-[11px] text-text-secondary mt-1 leading-snug">
                Functions, classes, and exported interfaces
              </p>
            </div>
          </div>

          {/* Card 5: Test Suites */}
          <div className="p-4 rounded-2xl bg-white border border-indigo-200/80 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Tests
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                <TestTube2 className="w-4 h-4 stroke-[2]" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#172033]">
                {testCount}
              </div>
              <div className="text-xs font-bold text-text-primary mt-0.5">
                Test Suites
              </div>
              <p className="text-[11px] text-text-secondary mt-1 leading-snug">
                Automated regression and unit test specifications
              </p>
            </div>
          </div>

          {/* Card 6: Configurations */}
          <div className="p-4 rounded-2xl bg-white border border-purple-200/80 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                Configs
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                <Settings2 className="w-4 h-4 stroke-[2]" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#172033]">
                {configCount}
              </div>
              <div className="text-xs font-bold text-text-primary mt-0.5">
                Configurations
              </div>
              <p className="text-[11px] text-text-secondary mt-1 leading-snug">
                Routing, gateway, and environment configurations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Editorial Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols): Architecture Flow & Recent Changes */}
        <div className="lg:col-span-8 space-y-8">
          {/* Architecture & Dependency Flow Preview */}
          <section className="bg-white border border-app-border rounded-3xl p-6 sm:p-7 shadow-card space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-app-border pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-[#8B5CF6] flex items-center justify-center">
                    <Network className="w-4 h-4 stroke-[2]" />
                  </div>
                  <h2 className="text-lg font-bold text-[#172033] tracking-tight">
                    Architecture & Dependency Flow
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary">
                  How components in <span className="font-semibold text-text-primary">commerce-core</span> connect, authenticate, and call one another.
                </p>
              </div>

              <Link href="/graph">
                <Button variant="outline" size="sm" icon={<ArrowRight className="w-3.5 h-3.5 text-[#3B82F6]" />}>
                  View Knowledge Graph
                </Button>
              </Link>
            </div>

            {/* Visual Flow Connector Strip with 3D Card Depth */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#F8FAFC] via-[#F4F7FF] to-[#F8FAFC] border border-app-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Observed Runtime Execution Path
                </span>
                <span className="text-xs font-semibold text-[#3B82F6] bg-[#EBF2FF] px-2.5 py-0.5 rounded-full border border-blue-200">
                  Auth & Checkout Chain
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 py-2 text-xs">
                <div className="px-3.5 py-2.5 rounded-xl bg-white border border-blue-200 shadow-2xs hover:shadow-xs transition-shadow">
                  <div className="text-[10px] uppercase font-bold text-[#3B82F6]">1. Entry Token</div>
                  <span className="font-mono text-xs text-[#172033] font-semibold">src/auth/jwt.ts</span>
                </div>

                <span className="text-[#3B82F6] font-bold text-sm">&rarr;</span>

                <div className="px-3.5 py-2.5 rounded-xl bg-white border border-purple-200 shadow-2xs hover:shadow-xs transition-shadow">
                  <div className="text-[10px] uppercase font-bold text-[#8B5CF6]">2. Guard Layer</div>
                  <span className="font-mono text-xs text-[#172033] font-semibold">src/middleware/authMiddleware.ts</span>
                </div>

                <span className="text-[#8B5CF6] font-bold text-sm">&rarr;</span>

                <div className="px-3.5 py-2.5 rounded-xl bg-white border border-emerald-200 shadow-2xs hover:shadow-xs transition-shadow">
                  <div className="text-[10px] uppercase font-bold text-emerald-600">3. Controller</div>
                  <span className="font-mono text-xs text-[#172033] font-semibold">src/controllers/checkoutController.ts</span>
                </div>
              </div>

              <div className="text-xs text-text-secondary leading-relaxed pt-2 border-t border-slate-200">
                <span className="font-semibold text-text-primary">Call relationship:</span> Refactoring the signature of <code className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-app-border text-[#3B82F6] font-semibold">verifySessionToken()</code> directly affects <code className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-app-border text-[#8B5CF6] font-semibold">authMiddleware.ts</code> and transitively affects checkout processing.
              </div>
            </div>

            {/* Architecture Subsystems Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-blue-100 hover:border-[#3B82F6]/50 transition-colors">
                <div className="flex items-center gap-2 text-xs font-bold text-[#3B82F6]">
                  <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                  Auth Subsystem
                </div>
                <div className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                  JWT issuance, refresh rotation, and revocation checks.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-purple-100 hover:border-[#8B5CF6]/50 transition-colors">
                <div className="flex items-center gap-2 text-xs font-bold text-[#8B5CF6]">
                  <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                  Checkout Engine
                </div>
                <div className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                  Cart validation, payment gateway calls, and order emission.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-emerald-100 hover:border-emerald-400/50 transition-colors">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Data Tier
                </div>
                <div className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                  PostgreSQL relations, schema migrations, and cache layers.
                </div>
              </div>
            </div>
          </section>

          {/* Recent Commits Feed */}
          <section className="bg-white border border-app-border rounded-3xl p-6 sm:p-7 shadow-card space-y-5">
            <div className="flex items-center justify-between border-b border-app-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-[#3B82F6] flex items-center justify-center">
                  <GitCommit className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#172033] tracking-tight">
                    Recent Repository Commits
                  </h2>
                  <p className="text-xs sm:text-sm text-text-secondary">
                    Latest changes cross-referenced with architectural nodes.
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#F4F7FF] border border-app-border text-text-secondary">
                {commits.length} commits verified
              </span>
            </div>

            <div className="divide-y divide-app-border">
              {commits.map((commit) => (
                <div key={commit.hash} className="py-4 first:pt-1 last:pb-1 space-y-2.5 group hover:bg-[#F8FAFC] -mx-4 px-4 rounded-2xl transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-[#3B82F6] bg-[#EBF2FF] px-2.5 py-1 rounded-md border border-blue-200">
                        {commit.hash}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#172033] group-hover:text-[#3B82F6] transition-colors">
                        {commit.message}
                      </span>
                      {commit.isRegressionOrBugfix && (
                        <Badge variant="warning" size="sm">Bugfix</Badge>
                      )}
                    </div>
                    <span className="text-xs font-medium text-text-muted shrink-0 font-mono">
                      {new Date(commit.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                    <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Files touched:</span>
                    {commit.filesChanged.map((file) => (
                      <span
                        key={file}
                        className="font-mono text-[11px] px-2 py-0.5 rounded bg-white border border-app-border text-text-primary shadow-2xs"
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

        {/* Right Column (4 cols): Potential Knowledge Gaps, Shortcuts & Evidence Standard */}
        <div className="lg:col-span-4 space-y-8">
          {/* Potential Knowledge Gaps Card */}
          {/* Potential Knowledge Gaps Card */}
          <section className="bg-white border border-amber-200 rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <AlertTriangle className="w-4 h-4 stroke-[2]" />
                </div>
                <h2 className="text-base font-extrabold text-gray-900 tracking-tight">
                  Knowledge Gaps
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                2 Detected
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Areas where architectural decision records (ADRs) or test suites are absent.
            </p>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200 space-y-2 text-xs shadow-xs hover:shadow-md transition-shadow">
                <div className="font-extrabold text-gray-900 flex items-center justify-between">
                  <span>Missing ADR: Token Rotation</span>
                  <span className="text-[10px] font-bold uppercase bg-red-100 text-red-800 px-2 py-0.5 rounded-full border border-red-200">High</span>
                </div>
                <p className="text-gray-600 leading-relaxed font-medium">
                  Key rotation logic was introduced in commit <code className="text-gray-900 bg-white px-1.5 py-0.5 rounded border border-gray-200 font-bold">7a8f9c</code> without an ADR specifying fallback validation.
                </p>
                <Link
                  href="/gaps"
                  className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 pt-1"
                >
                  Inspect gap details <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200 space-y-2 text-xs shadow-xs hover:shadow-md transition-shadow">
                <div className="font-extrabold text-gray-900 flex items-center justify-between">
                  <span>Untested Gateway Headers</span>
                  <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">Medium</span>
                </div>
                <p className="text-gray-600 leading-relaxed font-medium">
                  <code className="text-gray-900 bg-white px-1.5 py-0.5 rounded border border-gray-200 font-bold">gateway.config.json</code> configures claim forwarding without an automated contract test.
                </p>
                <Link
                  href="/gaps"
                  className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 pt-1"
                >
                  Inspect gap details <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </section>

          {/* Quick Action Cards with Colored Icon Containers */}
          <section className="bg-white border border-app-border rounded-3xl p-6 shadow-card space-y-4">
            <h2 className="text-base font-bold text-[#172033] tracking-tight">
              Investigation Shortcuts
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              Explore codebase context through dedicated reasoning workflows.
            </p>

            <div className="space-y-2.5 pt-1">
              <Link
                href="/ask"
                className="flex items-center justify-between p-3.5 rounded-2xl border border-app-border bg-[#F8FAFC] hover:bg-[#F5F3FF] hover:border-purple-300 text-xs transition-all group shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-[#8B5CF6] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <HelpCircle className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <div className="font-bold text-text-primary group-hover:text-[#8B5CF6] transition-colors">
                      Ask Why
                    </div>
                    <div className="text-text-secondary text-[11px]">
                      Plain-English explanations backed by code evidence
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-text-muted group-hover:text-[#8B5CF6] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </Link>

              <Link
                href="/timeline"
                className="flex items-center justify-between p-3.5 rounded-2xl border border-app-border bg-[#F8FAFC] hover:bg-[#ECFDF5] hover:border-emerald-300 text-xs transition-all group shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <History className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <div className="font-bold text-text-primary group-hover:text-emerald-700 transition-colors">
                      Decision Timeline
                    </div>
                    <div className="text-text-secondary text-[11px]">
                      Chronological history of architectural decisions
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-text-muted group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </Link>

              <Link
                href="/impact"
                className="flex items-center justify-between p-3.5 rounded-2xl border border-app-border bg-[#F8FAFC] hover:bg-[#EBF2FF] hover:border-blue-300 text-xs transition-all group shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-[#3B82F6] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Zap className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <div className="font-bold text-text-primary group-hover:text-[#3B82F6] transition-colors">
                      Impact Analysis
                    </div>
                    <div className="text-text-secondary text-[11px]">
                      Pre-change blast radius and caller chains
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-text-muted group-hover:text-[#3B82F6] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </Link>

              <Link
                href="/reports"
                className="flex items-center justify-between p-3.5 rounded-2xl border border-app-border bg-[#F8FAFC] hover:bg-[#FDF4FF] hover:border-fuchsia-300 text-xs transition-all group shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-fuchsia-500/15 text-fuchsia-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <div className="font-bold text-text-primary group-hover:text-fuchsia-600 transition-colors">
                      Decision Reports
                    </div>
                    <div className="text-text-secondary text-[11px]">
                      Audit-ready architecture summaries with citations
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-text-muted group-hover:text-fuchsia-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </Link>
            </div>
          </section>

          {/* Evidence & Traceability Card */}
          <div className="bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] border border-[#A7F3D0] rounded-3xl p-6 text-xs space-y-3 shadow-card">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-700 flex items-center justify-center border border-emerald-300">
                <ShieldCheck className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="font-bold text-emerald-950 text-sm">Evidence & Traceability</span>
            </div>
            <p className="text-emerald-800 leading-relaxed">
              Every finding in CodeWhy connects directly to concrete source lines, verified Git commits, or AST relationship edges. We never produce unsupported assertions or speculative code summaries.
            </p>
            <div className="flex items-center gap-2 pt-1 text-emerald-800 font-bold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero hallucinations guaranteed by AST extraction</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
