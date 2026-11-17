'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Network, Table, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { GraphNode } from '@/types/graph';
import {
  VisNode,
  VisEdge,
  FilterState,
  ExplorerView,
  BreadcrumbEntry,
  GraphQueryResult,
} from '@/types/architecture';
import { computeLayout, buildVisEdges, mergeIntoVisGraph } from '@/lib/graph/layout-engine';
import { GraphCanvas } from '@/components/architecture/GraphCanvas';
import { EntityDetailPanel } from '@/components/architecture/EntityDetailPanel';
import { GraphSearchBar } from '@/components/architecture/GraphSearchBar';
import { GraphFilters } from '@/components/architecture/GraphFilters';
import { GraphAccessibleTable } from '@/components/architecture/GraphAccessibleTable';
import { NavigationBreadcrumb } from '@/components/architecture/NavigationBreadcrumb';
import { GraphLegend } from '@/components/architecture/GraphLegend';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const CANVAS_W = 860;
const CANVAS_H = 540;

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
  const [visNodes, setVisNodes] = useState<VisNode[]>([]);
  const [visEdges, setVisEdges] = useState<VisEdge[]>([]);
  const [rawNodes, setRawNodes] = useState<GraphNode[]>([]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(suggestedSeedNodeId);
  const [viewMode, setViewMode] = useState<ExplorerView>('graph');
  const [filters, setFilters] = useState<FilterState>({ nodeTypes: new Set(), edgeTypes: new Set() });
  const [navigationTrail, setNavigationTrail] = useState<BreadcrumbEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  const fetchNeighborhood = useCallback(
    async (nodeId: string, merge = false) => {
      setIsLoading(true);
      setError(null);
      try {
        const url = `/api/graph?repoId=${encodeURIComponent(repoId)}&nodeId=${encodeURIComponent(
          nodeId
        )}&hops=1&limit=40`;
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
          setVisNodes((prevNodes) => {
            setVisEdges((prevEdges) => {
              const { edges: me } = mergeIntoVisGraph(
                prevNodes,
                prevEdges,
                safeNewNodes,
                safeNewEdges,
                CANVAS_W,
                CANVAS_H
              );
              return me;
            });
            const { nodes: mn } = mergeIntoVisGraph(
              prevNodes,
              [],
              safeNewNodes,
              safeNewEdges,
              CANVAS_W,
              CANVAS_H
            );
            return mn;
          });
          setRawNodes((prev) => {
            const map = new Map(prev.map((n) => [n.id, n]));
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
            setSelectedNodeId((current) =>
              current && safeDataNodes.some((n) => n.id === current) ? current : safeDataNodes[0].id
            );
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load graph data');
      } finally {
        setIsLoading(false);
      }
    },
    [repoId]
  );

  useEffect(() => {
    fetchNeighborhood(suggestedSeedNodeId || '', false);
    if (suggestedSeedNodeId) {
      setSelectedNodeId(suggestedSeedNodeId);
    }
  }, [suggestedSeedNodeId, fetchNeighborhood]);

  const handleSelectNode = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(nodeId);

      const node = rawNodes.find((n) => n.id === nodeId);
      if (!node) return;

      const entry: BreadcrumbEntry = {
        nodeId: node.id,
        label: node.label,
        type: node.type,
        filePath: node.filePath,
      };
      setNavigationTrail((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].nodeId === nodeId) return prev;
        return [...prev.slice(-7), entry];
      });
    },
    [rawNodes]
  );

  const handleExpandNode = useCallback(
    async (nodeId: string) => {
      handleSelectNode(nodeId);
      await fetchNeighborhood(nodeId, true);
    },
    [fetchNeighborhood, handleSelectNode]
  );

  const handleSearchSelect = useCallback(
    (node: GraphNode) => {
      fetchNeighborhood(node.id, false);
      setTimeout(() => handleSelectNode(node.id), 400);
    },
    [fetchNeighborhood, handleSelectNode]
  );

  const handleBreadcrumbNavigate = useCallback(
    (entry: BreadcrumbEntry, idx: number) => {
      setNavigationTrail((prev) => prev.slice(0, idx + 1));
      fetchNeighborhood(entry.nodeId, false);
      setSelectedNodeId(entry.nodeId);
    },
    [fetchNeighborhood]
  );

  const handleNavigateToNode = useCallback(
    (node: GraphNode) => {
      fetchNeighborhood(node.id, false);
      setSelectedNodeId(node.id);
    },
    [fetchNeighborhood]
  );

  const selectedNode = selectedNodeId
    ? rawNodes.find((n) => n.id === selectedNodeId) ?? null
    : rawNodes[0] || null;

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto pb-12 font-sans">
      {/* ── Page Header Banner ── */}
      <header className="bg-white rounded-[12px] border border-[#EDEDED] p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#707070]">
              Visual Network
            </span>
            <span className="text-[#DFDFDF]">/</span>
            <span className="text-xs font-mono text-[#707070]">
              {totalNodes} nodes · {totalEdges} edges
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#171717] tracking-tight">
            Codebase Knowledge Graph
          </h1>
          <p className="text-xs sm:text-sm text-[#707070] max-w-xl">
            Hardware-friendly force-directed SVG graph. Inspect verified AST relationships, calls, imports, and evidence citations in{' '}
            <strong className="text-[#171717]">{repoName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowLegend((v) => !v)}
          >
            {showLegend ? 'Hide Legend' : 'Legend'}
          </Button>

          <div className="flex items-center rounded-[8px] bg-[#FAFAFA] border border-[#EDEDED] p-0.5">
            <button
              onClick={() => setViewMode('graph')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium transition-colors ${
                viewMode === 'graph'
                  ? 'bg-white text-[#171717] shadow-2xs font-semibold'
                  : 'text-[#707070] hover:text-[#171717]'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Canvas</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-[#171717] shadow-2xs font-semibold'
                  : 'text-[#707070] hover:text-[#171717]'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Search, Breadcrumb & Filters ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <GraphSearchBar repoId={repoId} onSelectNode={handleSearchSelect} />
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
        </div>

        {showLegend && <GraphLegend />}
        <GraphFilters filters={filters} onFilterChange={setFilters} />
      </div>

      {/* ── Main Content Split ── */}
      {viewMode === 'graph' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8 space-y-2">
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
              <div className="flex items-center gap-2 p-3 rounded-[8px] bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-xs">
                <Info className="w-4 h-4 text-[#F59E0B] shrink-0" />
                <span>
                  Query capped to 40 nodes to maintain hardware performance. Double-click any node to expand its local neighborhood.
                </span>
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
        <GraphAccessibleTable
          nodes={rawNodes}
          edges={visEdges}
          selectedNodeId={selectedNodeId}
          onSelectNode={handleSelectNode}
          filters={filters}
        />
      )}
    </div>
  );
};
