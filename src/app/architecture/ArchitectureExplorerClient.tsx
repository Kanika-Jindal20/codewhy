'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Network, Table, Compass } from 'lucide-react';
import { GraphNode } from '@/types/graph';
import {
  VisNode, VisEdge, FilterState, ExplorerView, BreadcrumbEntry,
  NODE_TYPE_COLORS,
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
import { Badge } from '@/components/ui/Badge';

// Canvas dimensions used for layout computation (matches typical viewport)
const CANVAS_W = 860;
const CANVAS_H = 520;

interface ArchitectureExplorerClientProps {
  repoId: string;
  repoName: string;
  suggestedSeedNodeId: string | null;
  totalNodes: number;
  totalEdges: number;
}

export const ArchitectureExplorerClient: React.FC<ArchitectureExplorerClientProps> = ({
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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
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
      if (!res.ok) throw new Error(`Graph query failed: ${res.status}`);
      const data: GraphQueryResult = await res.json();

      setTruncated(data.truncated);

      if (merge) {
        setVisNodes(prev => {
          setVisEdges(prevEdges => {
            const { nodes: mn, edges: me } = mergeIntoVisGraph(
              prev, prevEdges, data.nodes, data.edges, CANVAS_W, CANVAS_H
            );
            setVisNodes(mn);
            setVisEdges(me);
            return me;
          });
          return prev;
        });
        setRawNodes(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const newNodes = data.nodes.filter(n => !existingIds.has(n.id));
          return [...prev, ...newNodes];
        });
      } else {
        const laid = computeLayout(data.nodes, data.edges, CANVAS_W, CANVAS_H);
        const builtEdges = buildVisEdges(data.edges, laid);
        setVisNodes(laid);
        setVisEdges(builtEdges);
        setRawNodes(data.nodes);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error loading graph');
    } finally {
      setIsLoading(false);
    }
  }, [repoId]);

  // Initial load from suggested seed
  useEffect(() => {
    if (suggestedSeedNodeId) {
      fetchNeighborhood(suggestedSeedNodeId, false);
    } else {
      setIsLoading(false);
    }
  }, [suggestedSeedNodeId, fetchNeighborhood]);

  // ---------------------------------------------------------------------------
  // Node selection
  // ---------------------------------------------------------------------------
  const handleSelectNode = useCallback((nodeId: string) => {
    if (!nodeId) { setSelectedNodeId(null); return; }
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
      // Avoid duplicate at tail
      if (prev.length > 0 && prev[prev.length - 1].nodeId === nodeId) return prev;
      return [...prev.slice(-7), entry]; // keep last 8
    });
  }, [rawNodes]);

  // ---------------------------------------------------------------------------
  // Neighborhood expansion (double-click)
  // ---------------------------------------------------------------------------
  const handleExpandNode = useCallback(async (nodeId: string) => {
    // First select the node
    handleSelectNode(nodeId);
    // Then merge its neighbors in
    await fetchNeighborhood(nodeId, true);
  }, [fetchNeighborhood, handleSelectNode]);

  // ---------------------------------------------------------------------------
  // Search result → navigate
  // ---------------------------------------------------------------------------
  const handleSearchSelect = useCallback((node: GraphNode) => {
    fetchNeighborhood(node.id, false);
    // Select the node once data loads
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

  // ---------------------------------------------------------------------------
  // Derived: selected GraphNode
  // ---------------------------------------------------------------------------
  const selectedNode = selectedNodeId ? rawNodes.find(n => n.id === selectedNodeId) ?? null : null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-5 h-full min-h-[calc(100vh-8rem)]">
      {/* ── Page Header Banner ── */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 sm:p-7 text-white shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_white_0%,_transparent_70%)] pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg">
              <Compass className="w-7 h-7 text-white stroke-[2.5]" />
            </span>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Architecture Explorer
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm border border-white/30 text-white">
                  AST Knowledge Graph
                </span>
              </div>
              <p className="text-sm text-blue-100 mt-1 max-w-2xl">
                Explore structural dependencies and call hierarchies in{' '}
                <span className="font-bold text-white underline decoration-cyan-300 underline-offset-2">{repoName}</span>
                . Grounded in abstract syntax tree analysis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Stat Badges */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-extrabold text-white">{totalNodes}</span>
                <span className="text-[11px] text-blue-100 font-medium">Nodes</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span className="text-xs font-extrabold text-white">{totalEdges}</span>
                <span className="text-[11px] text-blue-100 font-medium">Edges</span>
              </div>
            </div>

            {/* Legend & View toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLegend(v => !v)}
                className="px-3.5 py-2 text-xs bg-white text-blue-700 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-md"
              >
                {showLegend ? 'Hide Legend' : 'Show Legend'}
              </button>
              <div className="flex items-center bg-black/20 backdrop-blur-md rounded-xl p-1 border border-white/20">
                <button
                  onClick={() => setViewMode('graph')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition-all ${
                    viewMode === 'graph'
                      ? 'bg-white text-blue-700 shadow-md'
                      : 'text-white/80 hover:text-white'
                  }`}
                  aria-pressed={viewMode === 'graph'}
                >
                  <Network className="w-3.5 h-3.5" /> Graph
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-bold transition-all ${
                    viewMode === 'table'
                      ? 'bg-white text-blue-700 shadow-md'
                      : 'text-white/80 hover:text-white'
                  }`}
                  aria-pressed={viewMode === 'table'}
                >
                  <Table className="w-3.5 h-3.5" /> Table
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Legend (collapsible) */}
      {showLegend && <GraphLegend />}

      {/* Search + Filters row */}
      <div className="flex flex-col gap-3 bg-white border border-blue-100 rounded-2xl p-4 sm:p-5 shadow-lg">
        <GraphSearchBar repoId={repoId} onSelectNode={handleSearchSelect} />
        <GraphFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Main content: canvas + detail panel */}
      <div className="flex flex-1 gap-5 min-h-0">
        {/* Canvas / Table */}
        <div className="flex-1 flex flex-col min-w-0 bg-white border border-blue-100 rounded-2xl overflow-hidden shadow-lg">
          {viewMode === 'graph' ? (
            <GraphCanvas
              nodes={visNodes}
              edges={visEdges}
              filters={filters}
              selectedNodeId={selectedNodeId}
              isLoading={isLoading}
              error={error}
              truncated={truncated}
              onSelectNode={handleSelectNode}
              onExpandNode={handleExpandNode}
            />
          ) : (
            <GraphAccessibleTable
              nodes={rawNodes}
              edges={visEdges}
              selectedNodeId={selectedNodeId}
              onSelectNode={handleSelectNode}
              onNavigateToNode={handleNavigateToNode}
            />
          )}
        </div>

        {/* Detail panel — Entity Inspector */}
        <div className="w-80 xl:w-96 shrink-0 bg-white border border-blue-100 rounded-2xl flex flex-col min-h-0 overflow-hidden shadow-lg border-t-4 border-t-blue-600">
          <div className="px-4 py-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-blue-900">
                Entity Inspector
              </span>
            </div>
            {selectedNode && (
              <span
                className="w-3 h-3 rounded-full shadow-xs"
                style={{ backgroundColor: NODE_TYPE_COLORS[selectedNode.type] }}
                title={`Type: ${selectedNode.type}`}
                aria-hidden
              />
            )}
          </div>
          <div className="flex-1 overflow-hidden">
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
      </div>

      {/* Breadcrumb trail */}
      <div className="bg-white border border-blue-100 rounded-2xl px-5 py-3 flex items-center shadow-md">
        <NavigationBreadcrumb
          trail={navigationTrail}
          onNavigate={handleBreadcrumbNavigate}
        />
      </div>
    </div>
  );
};
