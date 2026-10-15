'use client';

import React from 'react';
import { NodeType, EdgeType } from '@/types/graph';
import { FilterState, NODE_TYPE_COLORS, NODE_TYPE_LABELS, EDGE_TYPE_LABELS } from '@/types/architecture';
import { SlidersHorizontal } from 'lucide-react';

const ALL_NODE_TYPES: NodeType[] = ['file', 'module', 'function', 'class', 'test', 'config', 'decision', 'commit'];
const ALL_EDGE_TYPES: EdgeType[] = ['imports', 'calls', 'extends', 'implements', 'tests', 'configures', 'co_changed', 'supersedes'];

interface GraphFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export const GraphFilters: React.FC<GraphFiltersProps> = ({ filters, onChange }) => {
  const toggleNodeType = (type: NodeType) => {
    const next = new Set(filters.nodeTypes);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    onChange({ ...filters, nodeTypes: next });
  };

  const toggleEdgeType = (type: EdgeType) => {
    const next = new Set(filters.edgeTypes);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    onChange({ ...filters, edgeTypes: next });
  };

  const clearAll = () =>
    onChange({ ...filters, nodeTypes: new Set(), edgeTypes: new Set() });

  const hasActiveFilters = filters.nodeTypes.size > 0 || filters.edgeTypes.size > 0;

  return (
    <div className="flex flex-wrap items-start gap-3" role="group" aria-label="Graph filters">
      {/* Icon */}
      <div className="flex items-center gap-1.5 text-text-muted text-xs pt-1 shrink-0">
        <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden />
        <span className="font-mono text-[10px] uppercase tracking-wider">Filter</span>
      </div>

      {/* Node types */}
      <div className="flex flex-wrap gap-1" role="group" aria-label="Node type filters">
        <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider self-center mr-0.5">
          Nodes:
        </span>
        {ALL_NODE_TYPES.map(type => {
          const active = filters.nodeTypes.size === 0 || filters.nodeTypes.has(type);
          const color = NODE_TYPE_COLORS[type];
          return (
            <button
              key={type}
              onClick={() => toggleNodeType(type)}
              aria-pressed={filters.nodeTypes.has(type)}
              title={`Toggle ${NODE_TYPE_LABELS[type]} nodes`}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-mono transition-all ${
                active
                  ? 'border-app-border bg-app-surface text-text-primary'
                  : 'border-app-border/50 bg-app-bg text-text-muted opacity-50'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: active ? color : '#78869B' }}
                aria-hidden
              />
              {NODE_TYPE_LABELS[type]}
            </button>
          );
        })}
      </div>

      {/* Edge types */}
      <div className="flex flex-wrap gap-1" role="group" aria-label="Edge type filters">
        <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider self-center mr-0.5">
          Edges:
        </span>
        {ALL_EDGE_TYPES.map(type => {
          const active = filters.edgeTypes.size === 0 || filters.edgeTypes.has(type);
          return (
            <button
              key={type}
              onClick={() => toggleEdgeType(type)}
              aria-pressed={filters.edgeTypes.has(type)}
              title={`Toggle ${EDGE_TYPE_LABELS[type]} edges`}
              className={`px-2 py-0.5 rounded border text-[11px] font-mono transition-all ${
                active
                  ? 'border-app-border bg-app-surface text-text-secondary'
                  : 'border-app-border/50 bg-app-bg text-text-muted opacity-40'
              }`}
            >
              {EDGE_TYPE_LABELS[type]}
            </button>
          );
        })}
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="px-2 py-0.5 rounded border border-status-warning/40 bg-status-warning/10 text-status-warning text-[11px] font-mono hover:bg-status-warning/20 transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
};
