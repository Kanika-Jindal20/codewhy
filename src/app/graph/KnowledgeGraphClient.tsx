'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Network, Table, RefreshCw, AlertCircle } from 'lucide-react';
import { GraphNode } from '@/types/graph';
import {
  VisNode, VisEdge, FilterState, ExplorerView, BreadcrumbEntry,
} from '@/types/architecture';
import { GraphQueryResult } from '@/types/architecture';
import { computeLayout, buildVisEdges, mergeIntoVisGraph } from '@/lib/graph/layout-engine';
import { GraphCanvas } from '@/components/architecture/GraphCanvas';
import { EntityDetailPanel } from '@/components/architecture/EntityDetailPanel';
import { GraphSearchBar } from '@/components/architecture/GraphSearchBar';
import { GraphFilters } from '@/components/architecture/GraphFilters';
import { GraphAccessibleTable } from '@/components/architecture/GraphAccessibleTable';
import { NavigationBreadcrumb } from '@/components/architecture/NavigationBreadcrumb';
import { GraphLegend } from '@/components/architecture/GraphLegend';
import { Button } from '@/components/ui/Button';

// Canvas dimensions used for layout computation (matches typical viewport)
const CANVAS_W = 860;
const CANVAS_H = 520;

interface KnowledgeGraphClientProps {
  repoId: string;
  repoName: string;
  suggestedSeedNodeId: string | null;
  totalNodes: number;
  totalEdges: number;
}

export const KnowledgeGraphClient: React.FC<KnowledgeGraphClientProps> = ({
  repoId,
  repoName,
  suggestedSeedNodeId,
  totalNodes,
  totalEdges,
}) => {
  // Graph state
  const [visNodes, setVisNodes] = useState<VisNode[]>([]);
  const [visEdges, setVisEdges] = useState<VisEdge[]>([]);
  const [rawNodes, setRawNodes] = useState<GraphNode[]>([]);

  // UI state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(suggestedSeedNodeId);
  const [viewMode, setViewMode] = useState<ExplorerView>('graph');
  const [filters, setFilters] = useState<FilterState>({ nodeTypes: new Set(), edgeTypes: new Set() });
  const [navigationTrail, setNavigationTrail] = useState<BreadcrumbEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  // ---------------------------------------------------------------------------
  // Fetch neighborhood
  // ---------------------------------------------------------------------------
  const fetchNeighborhood = useCallback(async (nodeId: string, merge = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = `/api/graph?repoId=${encodeURIComponent(repoId)}&nodeId=${encodeURIComponent(nodeId)}&hops=1&limit=40`;
      const res = await fetch(url);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Graph query failed: ${res.status}`);
      }
      const data: GraphQueryResult = await res.json();

      setTruncated(Boolean(data.truncated));

      if (merge) {
        const safeNewNodes = data.nodes || [];
        const safeNewEdges = data.edges || [];
        setVisNodes(prevNodes => {
          setVisEdges(prevEdges => {
            const { edges: me } = mergeIntoVisGraph(
              prevNodes, prevEdges, safeNewNodes, safeNewEdges, CANVAS_W, CANVAS_H
            );
            return me;
          });
          const { nodes: mn } = mergeIntoVisGraph(
            prevNodes, [], safeNewNodes, safeNewEdges, CANVAS_W, CANVAS_H
          );
          return mn;
        });
        setRawNodes(prev => {
          const map = new Map(prev.map(n => [n.id, n]));
          for (const n of safeNewNodes) map.set(n.id, n);
          return Array.from(map.values());
        });
      } else {
        const safeDataNodes = data.nodes || [];
        const safeDataEdges = data.edges || [];
        const layoutedNodes = computeLayout(safeDataNodes, safeDataEdges, CANVAS_W, CANVAS_H);
        const layoutedEdges = buildVisEdges(safeDataEdges, layoutedNodes);
        setVisNodes(layoutedNodes);
        setVisEdges(layoutedEdges);
        setRawNodes(safeDataNodes);
        if (safeDataNodes.length > 0) {
          setSelectedNodeId(current =>
            current && safeDataNodes.some(n => n.id === current) ? current : safeDataNodes[0].id
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graph data');
    } finally {
      setIsLoading(false);
    }
  }, [repoId]);

  // ---------------------------------------------------------------------------
  // Initial load
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetchNeighborhood(suggestedSeedNodeId || '', false);
    if (suggestedSeedNodeId) {
      setSelectedNodeId(suggestedSeedNodeId);
    }
  }, [suggestedSeedNodeId, fetchNeighborhood]);

  // ---------------------------------------------------------------------------
  // Node selection
  // ---------------------------------------------------------------------------
  const handleSelectNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);

    const node = rawNodes.find(n => n.id === nodeId);
    if (!node) return;

    const entry: BreadcrumbEntry = {
      nodeId: node.id,
      label: node.label,
      type: node.type,
      filePath: node.filePath,
    };
    setNavigationTrail(prev => {
      if (prev.length > 0 && prev[prev.length - 1].nodeId === nodeId) return prev;
      return [...prev.slice(-7), entry];
    });
  }, [rawNodes]);

  // ---------------------------------------------------------------------------
  // Neighborhood expansion (double-click)
  // ---------------------------------------------------------------------------
  const handleExpandNode = useCallback(async (nodeId: string) => {
    handleSelectNode(nodeId);
    await fetchNeighborhood(nodeId, true);
  }, [fetchNeighborhood, handleSelectNode]);

  // ---------------------------------------------------------------------------
  // Search result → navigate
  // ---------------------------------------------------------------------------
  const handleSearchSelect = useCallback((node: GraphNode) => {
    fetchNeighborhood(node.id, false);
    setTimeout(() => handleSelectNode(node.id), 400);
  }, [fetchNeighborhood, handleSelectNode]);

  // ---------------------------------------------------------------------------
  // Breadcrumb navigation
  // ---------------------------------------------------------------------------
  const handleBreadcrumbNavigate = useCallback((entry: BreadcrumbEntry, idx: number) => {
    setNavigationTrail(prev => prev.slice(0, idx + 1));
    fetchNeighborhood(entry.nodeId, false);
    setSelectedNodeId(entry.nodeId);
  }, [fetchNeighborhood]);

  // ---------------------------------------------------------------------------
  // Navigate to node from detail panel
  // ---------------------------------------------------------------------------
  const handleNavigateToNode = useCallback((node: GraphNode) => {
    fetchNeighborhood(node.id, false);
    setSelectedNodeId(node.id);
  }, [fetchNeighborhood]);

  // Derived: selected GraphNode
  const selectedNode = selectedNodeId ? rawNodes.find(n => n.id === selectedNodeId) ?? null : (rawNodes[0] || null);

  return (
    <div className="flex flex-col gap-5 h-full min-h-[calc(100vh-8rem)] font-['Inter',sans-serif]">
      {/* ── Page Header Banner (Teal / Cyan theme for Knowledge Graph) ── */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-700 p-6 sm:p-7 text-white shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_white_0%,_transparent_70%)] pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg">
              <Network className="w-7 h-7 text-white stroke-[2.5]" />
            </span>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Codebase Knowledge Graph
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm border border-white/30 text-white">
                  Entity Network
                </span>
              </div>
              <p className="text-sm text-teal-100 mt-1 max-w-2xl font-medium">
                Inspect granular code entities (functions, classes, files, configs, tests) and trace AST call hierarchies, dependencies, and evidence provenance in{' '}
                <span className="font-bold text-white underline decoration-cyan-300 underline-offset-2">{repoName}</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Stat Badges */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-extrabold text-white">{totalNodes}</span>
                <span className="text-[11px] text-teal-100 font-medium">Entities</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span className="text-xs font-extrabold text-white">{totalEdges}</span>
                <span className="text-[11px] text-teal-100 font-medium">Relationships</span>
              </div>
            </div>

            {/* Legend & View toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLegend(v => !v)}
                className="px-3.5 py-2 text-xs bg-white text-teal-700 rounded-xl font-bold hover:bg-teal-50 transition-all shadow-md"
              >
                {showLegend ? 'Hide Legend' : 'Legend'}
              </button>

              <div className="flex items-center rounded-xl bg-black/20 p-1 border border-white/20">
                <button
                  onClick={() => setViewMode('graph')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'graph' ? 'bg-white text-teal-800 shadow' : 'text-white/80 hover:text-white'
                  }`}
                  aria-label="Graph View"
                >
                  <Network className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Graph</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'table' ? 'bg-white text-teal-800 shadow' : 'text-white/80 hover:text-white'
                  }`}
                  aria-label="Table View"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex-1 max-w-lg">
            <GraphSearchBar repoId={repoId} onSelectNode={handleSearchSelect} />
          </div>
          <GraphFilters filters={filters} onFilterChange={setFilters} />
        </div>

        {navigationTrail.length > 0 && (
          <NavigationBreadcrumb
            trail={navigationTrail}
            onNavigate={handleBreadcrumbNavigate}
            onReset={() => {
              setNavigationTrail([]);
              fetchNeighborhood(suggestedSeedNodeId || '', false);
            }}
          />
        )}

        {showLegend && <GraphLegend onClose={() => setShowLegend(false)} />}
      </div>

      {/* ── Main Content Area ── */}
      {viewMode === 'graph' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
          <div className="lg:col-span-8 flex flex-col gap-2">
            <GraphCanvas
              nodes={visNodes}
              edges={visEdges}
              selectedNodeId={selectedNodeId}
              onSelectNode={handleSelectNode}
              onExpandNode={handleExpandNode}
              filters={filters}
              isLoading={isLoading}
              error={error}
              truncated={truncated}
            />

            {truncated && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs shadow-sm font-medium">
                <span>⚠️ Graph bounded to 40 nodes to preserve performance. Double-click any node to expand its local neighborhood.</span>
              </div>
            )}
          </div>

          <div className="lg:col-span-4">
            <EntityDetailPanel
              node={selectedNode}
              edges={visEdges}
              allNodes={rawNodes}
              repoId={repoId}
              onExpandNeighborhood={handleExpandNode}
              onNavigateToNode={handleNavigateToNode}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 rounded-3xl bg-white border border-slate-200 p-5 shadow-sm">
          <GraphAccessibleTable
            nodes={rawNodes}
            edges={visEdges}
            selectedNodeId={selectedNodeId}
            onSelectNode={handleSelectNode}
            filters={filters}
          />
        </div>
      )}
    </div>
  );
};
