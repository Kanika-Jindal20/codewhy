'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, ArrowUpDown } from 'lucide-react';
import { GraphNode } from '@/types/graph';
import { VisEdge, TableSortKey, FilterState, NODE_TYPE_COLORS, NODE_TYPE_LABELS, EDGE_TYPE_LABELS } from '@/types/architecture';
import { Badge } from '@/components/ui/Badge';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';

interface GraphAccessibleTableProps {
  nodes: GraphNode[];
  edges: VisEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onNavigateToNode?: (node: GraphNode) => void;
  filters?: FilterState;
}

type SortOrder = 'asc' | 'desc';

export const GraphAccessibleTable: React.FC<GraphAccessibleTableProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onNavigateToNode,
  filters,
}) => {
  const [sortKey, setSortKey] = useState<TableSortKey>('type');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const filteredNodes = useMemo(() => {
    if (!filters || filters.nodeTypes.size === 0) return nodes;
    return nodes.filter((n) => filters.nodeTypes.has(n.type));
  }, [nodes, filters]);

  const edgeCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const edge of edges) {
      if (filters && filters.edgeTypes.size > 0 && !filters.edgeTypes.has(edge.type)) {
        continue;
      }
      map.set(edge.sourceId, (map.get(edge.sourceId) ?? 0) + 1);
      map.set(edge.targetId, (map.get(edge.targetId) ?? 0) + 1);
    }
    return map;
  }, [edges, filters]);

  const sorted = useMemo(() => {
    const copy = [...filteredNodes];
    copy.sort((a, b) => {
      let va: string | number = '';
      let vb: string | number = '';
      switch (sortKey) {
        case 'label':
          va = a.label;
          vb = b.label;
          break;
        case 'type':
          va = a.type;
          vb = b.type;
          break;
        case 'filePath':
          va = a.filePath;
          vb = b.filePath;
          break;
        case 'edgeCount':
          va = edgeCounts.get(a.id) ?? 0;
          vb = edgeCounts.get(b.id) ?? 0;
          break;
      }
      if (va < vb) return sortOrder === 'asc' ? -1 : 1;
      if (va > vb) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filteredNodes, sortKey, sortOrder, edgeCounts]);

  const handleSort = (key: TableSortKey) => {
    if (sortKey === key) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const toggleExpand = (nodeId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const SortIcon: React.FC<{ col: TableSortKey }> = ({ col }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 text-[#9A9A9A]" />;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-[#171717]" />
    ) : (
      <ChevronDown className="w-3 h-3 text-[#171717]" />
    );
  };

  if (filteredNodes.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-[#707070] border border-dashed border-[#EDEDED] rounded-[10px] bg-white">
        No entities to display in table view.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-[#EDEDED] rounded-[10px] bg-white shadow-2xs" role="region" aria-label="Architecture entity table">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-[#FAFAFA] text-[#707070] font-mono border-b border-[#EDEDED] sticky top-0 z-10">
          <tr>
            <th className="py-2.5 px-3 w-8" scope="col" />
            {(
              [
                ['label', 'Entity'],
                ['type', 'Type'],
                ['filePath', 'File Path'],
                ['edgeCount', 'Edges'],
              ] as [TableSortKey, string][]
            ).map(([key, label]) => (
              <th
                key={key}
                scope="col"
                aria-sort={sortKey === key ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                className="py-2.5 px-3 select-none font-medium"
              >
                <button
                  onClick={() => handleSort(key)}
                  className="flex items-center gap-1.5 hover:text-[#171717] transition-colors w-full text-left"
                >
                  {label}
                  <SortIcon col={key} />
                </button>
              </th>
            ))}
            <th scope="col" className="py-2.5 px-3 font-medium">Evidence</th>
            <th scope="col" className="py-2.5 px-3 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EDEDED]">
          {sorted.map((node) => {
            const isSelected = node.id === selectedNodeId;
            const isExpanded = expandedRows.has(node.id);
            const nodeEdges = edges.filter((e) => {
              if (filters && filters.edgeTypes.size > 0 && !filters.edgeTypes.has(e.type)) {
                return false;
              }
              return e.sourceId === node.id || e.targetId === node.id;
            });
            const color = NODE_TYPE_COLORS[node.type];
            const evidenceCount = node.evidence?.length ?? 0;

            return (
              <React.Fragment key={node.id}>
                <tr
                  onClick={() => onSelectNode(node.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#ECFDF5] border-l-2 border-[#3ECF8E]'
                      : 'hover:bg-[#FAFAFA]'
                  }`}
                  aria-selected={isSelected}
                >
                  <td className="py-2 px-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(node.id);
                      }}
                      aria-expanded={isExpanded}
                      className="p-0.5 text-[#707070] hover:text-[#171717]"
                    >
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  </td>

                  <td className="py-2 px-3 font-mono font-medium text-[#171717]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span>{node.label}</span>
                    </div>
                  </td>

                  <td className="py-2 px-3">
                    <Badge variant="default" size="xs">
                      {NODE_TYPE_LABELS[node.type]}
                    </Badge>
                  </td>

                  <td className="py-2 px-3 font-mono text-[#707070] max-w-[200px]">
                    <span className="truncate block" title={node.filePath}>
                      {node.filePath}
                    </span>
                  </td>

                  <td className="py-2 px-3 font-mono text-[#171717]">
                    {edgeCounts.get(node.id) ?? 0}
                  </td>

                  <td className="py-2 px-3">
                    {evidenceCount > 0 ? (
                      <ConfidenceBadge
                        score={node.evidence![0].confidenceScore}
                        level={node.evidence![0].confidenceScore >= 0.9 ? 'high' : 'medium'}
                      />
                    ) : (
                      <span className="text-[#9A9A9A]">—</span>
                    )}
                  </td>

                  <td className="py-2 px-3 text-right">
                    {onNavigateToNode ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToNode(node);
                        }}
                        className="text-[#171717] hover:text-[#24B47E] font-medium text-[11px]"
                      >
                        Explore &rarr;
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#9A9A9A]">Selected</span>
                    )}
                  </td>
                </tr>

                {isExpanded && (
                  <tr className="bg-[#FAFAFA]">
                    <td colSpan={7} className="px-6 py-3 border-t border-b border-[#EDEDED]">
                      <div className="text-[10px] text-[#707070] font-mono mb-2 uppercase tracking-wider font-semibold">
                        Relationships ({nodeEdges.length})
                      </div>
                      {nodeEdges.length === 0 ? (
                        <div className="text-xs text-[#9A9A9A]">No relationships in current view.</div>
                      ) : (
                        <div className="space-y-1">
                          {nodeEdges.map((edge) => {
                            const isOut = edge.sourceId === node.id;
                            const otherId = isOut ? edge.targetId : edge.sourceId;
                            const otherNode = sorted.find((n) => n.id === otherId);
                            const count = edge.evidence?.length ?? 0;
                            return (
                              <div
                                key={edge.id}
                                className="flex items-center gap-3 text-xs px-2.5 py-1.5 rounded-[6px] bg-white border border-[#EDEDED]"
                              >
                                <span className="font-mono text-[10px] text-[#9A9A9A] shrink-0">
                                  {isOut ? '→' : '←'}
                                </span>
                                <span className="font-mono text-[11px] text-[#171717] shrink-0">
                                  {EDGE_TYPE_LABELS[edge.type]}
                                </span>
                                {otherNode && (
                                  <span className="font-mono text-[#707070] truncate">
                                    {otherNode.label}
                                  </span>
                                )}
                                <span className="ml-auto text-[10px] text-[#9A9A9A] font-mono">
                                  {count > 0 ? `${count} citations` : 'ast'}
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
