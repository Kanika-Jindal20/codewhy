'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, ArrowUpDown } from 'lucide-react';
import { GraphNode, GraphEdge } from '@/types/graph';
import { VisEdge, TableSortKey, NODE_TYPE_COLORS, NODE_TYPE_LABELS, EDGE_TYPE_LABELS } from '@/types/architecture';
import { Badge } from '@/components/ui/Badge';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';

interface GraphAccessibleTableProps {
  nodes: GraphNode[];
  edges: VisEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onNavigateToNode: (node: GraphNode) => void;
}

type SortOrder = 'asc' | 'desc';

function getNodeBadgeVariant(type: GraphNode['type']): 'default' | 'success' | 'warning' | 'info' | 'purple' | 'error' {
  const map: Record<string, 'default' | 'success' | 'warning' | 'info' | 'purple' | 'error'> = {
    file: 'default', module: 'purple', function: 'success',
    class: 'info', test: 'warning', config: 'default',
    decision: 'error', commit: 'default',
  };
  return map[type] ?? 'default';
}

export const GraphAccessibleTable: React.FC<GraphAccessibleTableProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onNavigateToNode,
}) => {
  const [sortKey, setSortKey] = useState<TableSortKey>('type');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Precompute edge counts per node
  const edgeCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const edge of edges) {
      map.set(edge.sourceId, (map.get(edge.sourceId) ?? 0) + 1);
      map.set(edge.targetId, (map.get(edge.targetId) ?? 0) + 1);
    }
    return map;
  }, [edges]);

  // Sort
  const sorted = useMemo(() => {
    const copy = [...nodes];
    copy.sort((a, b) => {
      let va: string | number = '';
      let vb: string | number = '';
      switch (sortKey) {
        case 'label':   va = a.label;   vb = b.label;   break;
        case 'type':    va = a.type;    vb = b.type;    break;
        case 'filePath': va = a.filePath; vb = b.filePath; break;
        case 'edgeCount': va = edgeCounts.get(a.id) ?? 0; vb = edgeCounts.get(b.id) ?? 0; break;
      }
      if (va < vb) return sortOrder === 'asc' ? -1 : 1;
      if (va > vb) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [nodes, sortKey, sortOrder, edgeCounts]);

  const handleSort = (key: TableSortKey) => {
    if (sortKey === key) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const toggleExpand = (nodeId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const SortIcon: React.FC<{ col: TableSortKey }> = ({ col }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortOrder === 'asc'
      ? <ChevronUp className="w-3 h-3 text-accent-primary" />
      : <ChevronDown className="w-3 h-3 text-accent-primary" />;
  };

  if (nodes.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-text-muted border border-dashed border-app-border rounded-lg">
        No entities to display. Apply a search or expand a node to populate the table.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-app-border rounded-lg" role="region" aria-label="Architecture entity table">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-app-surface text-text-muted font-mono border-b border-app-border sticky top-0 z-10">
          <tr>
            <th className="py-2.5 px-3 w-8" scope="col" />
            {(
              [
                ['label',     'Entity'],
                ['type',      'Type'],
                ['filePath',  'File Path'],
                ['edgeCount', 'Edges'],
              ] as [TableSortKey, string][]
            ).map(([key, label]) => (
              <th
                key={key}
                scope="col"
                aria-sort={sortKey === key ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                className="py-2.5 px-3 select-none"
              >
                <button
                  onClick={() => handleSort(key)}
                  className="flex items-center gap-1.5 hover:text-text-primary transition-colors w-full text-left"
                >
                  {label}
                  <SortIcon col={key} />
                </button>
              </th>
            ))}
            <th scope="col" className="py-2.5 px-3">Evidence</th>
            <th scope="col" className="py-2.5 px-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-app-border/50">
          {sorted.map(node => {
            const isSelected = node.id === selectedNodeId;
            const isExpanded = expandedRows.has(node.id);
            const nodeEdges = edges.filter(e => e.sourceId === node.id || e.targetId === node.id);
            const color = NODE_TYPE_COLORS[node.type];
            const evidenceCount = node.evidence?.length ?? 0;

            return (
              <React.Fragment key={node.id}>
                <tr
                  onClick={() => onSelectNode(node.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-accent-primary/10 border-l-2 border-accent-primary'
                      : 'hover:bg-app-surface/50'
                  }`}
                  aria-selected={isSelected}
                >
                  {/* Expand toggle */}
                  <td className="py-2.5 px-3">
                    <button
                      onClick={e => { e.stopPropagation(); toggleExpand(node.id); }}
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} relationships for ${node.label}`}
                      className="p-0.5 text-text-muted hover:text-text-primary transition-colors"
                    >
                      {isExpanded
                        ? <ChevronDown className="w-3.5 h-3.5" />
                        : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  </td>

                  {/* Label */}
                  <td className="py-2.5 px-3 font-mono font-semibold text-text-primary">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                        aria-hidden
                      />
                      {node.label}
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-2.5 px-3">
                    <Badge variant={getNodeBadgeVariant(node.type)} size="sm">
                      {NODE_TYPE_LABELS[node.type]}
                    </Badge>
                  </td>

                  {/* File path */}
                  <td className="py-2.5 px-3 font-mono text-text-muted max-w-[200px]">
                    <span className="truncate block" title={node.filePath}>
                      {node.filePath}
                    </span>
                  </td>

                  {/* Edge count */}
                  <td className="py-2.5 px-3 font-mono text-text-secondary">
                    {edgeCounts.get(node.id) ?? 0}
                  </td>

                  {/* Evidence count */}
                  <td className="py-2.5 px-3">
                    {evidenceCount > 0 ? (
                      <ConfidenceBadge
                        score={node.evidence![0].confidenceScore}
                        level={node.evidence![0].confidenceScore >= 0.9 ? 'high' : 'medium'}
                      />
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={e => { e.stopPropagation(); onNavigateToNode(node); }}
                      className="text-accent-primary hover:underline font-mono text-[11px]"
                    >
                      Explore
                    </button>
                  </td>
                </tr>

                {/* Expanded relationships */}
                {isExpanded && (
                  <tr className="bg-app-bg/60">
                    <td colSpan={7} className="px-6 py-3">
                      <div className="text-[11px] text-text-muted font-mono mb-2 uppercase tracking-wider">
                        Relationships ({nodeEdges.length})
                      </div>
                      {nodeEdges.length === 0 ? (
                        <div className="text-xs text-text-muted">No relationships in current viewport.</div>
                      ) : (
                        <div className="space-y-1">
                          {nodeEdges.map(edge => {
                            const isOut = edge.sourceId === node.id;
                            const otherId = isOut ? edge.targetId : edge.sourceId;
                            const otherNode = sorted.find(n => n.id === otherId);
                            const evidenceCount = edge.evidence?.length ?? 0;
                            const isVerified = edge.evidence?.some(ev => ev.confidenceScore >= 0.9) ?? false;
                            return (
                              <div
                                key={edge.id}
                                className="flex items-center gap-3 text-xs px-3 py-1.5 rounded bg-app-surface/40 border border-app-border"
                              >
                                <span className="font-mono text-[10px] text-text-muted shrink-0">
                                  {isOut ? '→' : '←'}
                                </span>
                                <span className="font-mono text-accent-secondary shrink-0">
                                  {EDGE_TYPE_LABELS[edge.type]}
                                </span>
                                {otherNode && (
                                  <span className="font-mono text-text-primary truncate">
                                    {otherNode.label}
                                  </span>
                                )}
                                <span className="ml-auto flex items-center gap-2 shrink-0">
                                  {isVerified ? (
                                    <span className="text-[10px] text-status-success font-mono">verified</span>
                                  ) : (
                                    <span className="text-[10px] text-status-warning font-mono">inferred</span>
                                  )}
                                  {evidenceCount > 0 && (
                                    <span className="text-[10px] text-text-muted">{evidenceCount} ev.</span>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
