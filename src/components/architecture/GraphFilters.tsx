'use client';

import React from 'react';
import { NodeType, EdgeType } from '@/types/graph';
import { FilterState, NODE_TYPE_COLORS, NODE_TYPE_LABELS, EDGE_TYPE_LABELS } from '@/types/architecture';
import { Filter, RotateCcw } from 'lucide-react';

const ALL_NODE_TYPES: NodeType[] = ['file', 'module', 'function', 'class', 'test', 'config', 'decision', 'commit'];
const ALL_EDGE_TYPES: EdgeType[] = ['imports', 'calls', 'extends', 'implements', 'tests', 'configures', 'co_changed', 'supersedes'];

interface GraphFiltersProps {
  filters: FilterState;
  onChange?: (filters: FilterState) => void;
  onFilterChange?: (filters: FilterState) => void;
}

export const GraphFilters: React.FC<GraphFiltersProps> = ({ filters, onChange, onFilterChange }) => {
  const notifyChange = (nextFilters: FilterState) => {
    if (onChange) onChange(nextFilters);
    if (onFilterChange) onFilterChange(nextFilters);
  };

  const toggleNodeType = (type: NodeType) => {
    const next = new Set(filters.nodeTypes);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    notifyChange({ ...filters, nodeTypes: next });
  };

  const toggleEdgeType = (type: EdgeType) => {
    const next = new Set(filters.edgeTypes);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    notifyChange({ ...filters, edgeTypes: next });
  };

  const clearAll = () =>
    notifyChange({ ...filters, nodeTypes: new Set(), edgeTypes: new Set() });

  const hasActiveFilters = filters.nodeTypes.size > 0 || filters.edgeTypes.size > 0;

  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-[#EDEDED]" role="group" aria-label="Graph filters">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#707070]" aria-hidden />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#707070]">
            Filters
          </span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 text-[11px] font-medium text-[#707070] hover:text-[#171717] transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Clear filters
          </button>
        )}
      </div>

      {/* Node Type Pills */}
      <div className="space-y-1">
        <span className="text-[10px] uppercase font-mono text-[#9A9A9A]">Entity Types</span>
        <div className="flex flex-wrap gap-1.5">
          {ALL_NODE_TYPES.map((type) => {
            const active = filters.nodeTypes.has(type);
            const color = NODE_TYPE_COLORS[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleNodeType(type)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-[#171717] text-white border-[#171717]'
                    : 'bg-white text-[#707070] border-[#EDEDED] hover:border-[#DFDFDF]'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span>{NODE_TYPE_LABELS[type]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Edge Type Pills */}
      <div className="space-y-1">
        <span className="text-[10px] uppercase font-mono text-[#9A9A9A]">Relationship Types</span>
        <div className="flex flex-wrap gap-1.5">
          {ALL_EDGE_TYPES.map((type) => {
            const active = filters.edgeTypes.has(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleEdgeType(type)}
                className={`px-2 py-0.5 rounded-[4px] font-mono text-[10px] border transition-colors ${
                  active
                    ? 'bg-[#171717] text-white border-[#171717]'
                    : 'bg-white text-[#707070] border-[#EDEDED] hover:border-[#DFDFDF]'
                }`}
              >
                {EDGE_TYPE_LABELS[type]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
