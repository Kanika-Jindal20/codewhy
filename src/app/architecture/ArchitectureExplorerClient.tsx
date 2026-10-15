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
    <div className="flex flex-col gap-4 h-full min-h-[calc(100vh-8rem)]">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Compass className="w-5 h-5 text-accent-primary" />
            <h1 className="text-lg font-bold text-text-primary">Architecture Explorer</h1>
            <Badge variant="purple" size="sm">Feature 11</Badge>
          </div>
          <p className="text-xs text-text-muted">
            Interactive graph of <span className="text-text-secondary font-mono">{repoName}</span>
            {' '}— {totalNodes} nodes, {totalEdges} edges in repository
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLegend(v => !v)}
            className="px-2.5 py-1.5 text-xs font-mono bg-app-surface border border-app-border rounded-lg text-text-secondary hover:text-text-primary transition-colors"
          >
            {showLegend ? 'Hide Legend' : 'Show Legend'}
          </button>
          {/* View toggle */}
          <div className="flex items-center bg-app-surface border border-app-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('graph')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'graph'
                  ? 'bg-accent-primary/15 text-accent-primary'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
              aria-pressed={viewMode === 'graph'}
            >
              <Network className="w-3.5 h-3.5" /> Graph
            </button>
            <div className="w-px h-4 bg-app-border" aria-hidden />
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-accent-primary/15 text-accent-primary'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
              aria-pressed={viewMode === 'table'}
            >
              <Table className="w-3.5 h-3.5" /> Table
            </button>
          </div>
        </div>
      </div>

      {/* Legend (collapsible) */}
      {showLegend && <GraphLegend />}

      {/* Search + Filters row */}
      <div className="flex flex-col gap-3 bg-app-panel border border-app-border rounded-lg p-3">
        <GraphSearchBar repoId={repoId} onSelectNode={handleSearchSelect} />
        <GraphFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Main content: canvas + detail panel */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Canvas / Table — takes up remaining space */}
        <div className="flex-1 flex flex-col min-w-0">
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

        {/* Detail panel — fixed width sidebar */}
        <div className="w-80 xl:w-96 shrink-0 bg-app-panel border border-app-border rounded-lg flex flex-col min-h-0 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-app-border flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider font-mono">
              Entity Detail
            </span>
            {selectedNode && (
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: NODE_TYPE_COLORS[selectedNode.type] }}
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
      <div className="bg-app-panel border border-app-border rounded-lg px-4 py-2 flex items-center">
        <NavigationBreadcrumb
          trail={navigationTrail}
          onNavigate={handleBreadcrumbNavigate}
        />
      </div>
    </div>
  );
};
