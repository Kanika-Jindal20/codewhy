'use client';

import React from 'react';
import { NodeType, EdgeType } from '@/types/graph';
import { FilterState, NODE_TYPE_COLORS, NODE_TYPE_LABELS, EDGE_TYPE_LABELS } from '@/types/architecture';
import { Filter, RotateCcw } from 'lucide-react';

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
    <div className="flex flex-col gap-3 pt-2 border-t border-blue-50" role="group" aria-label="Graph filters">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
            <Filter className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden />
          </span>
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-900">
            Interactive Filters
          </span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-all shadow-xs"
          >
            <RotateCcw className="w-3 h-3" />
            Reset all filters
          </button>
        )}
      </div>

      {/* Node types row */}
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Node type filters">
        <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider min-w-[50px]">
          Nodes:
        </span>
        {ALL_NODE_TYPES.map(type => {
          const isSelected = filters.nodeTypes.has(type);
          const color = NODE_TYPE_COLORS[type];
          return (
            <button
              key={type}
              onClick={() => toggleNodeType(type)}
              aria-pressed={isSelected}
              title={`Toggle ${NODE_TYPE_LABELS[type]} nodes`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20 shadow-sm font-bold'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              <span>{NODE_TYPE_LABELS[type]}</span>
            </button>
          );
        })}
      </div>

      {/* Edge types row */}
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Edge type filters">
        <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider min-w-[50px]">
          Edges:
        </span>
        {ALL_EDGE_TYPES.map(type => {
          const isSelected = filters.edgeTypes.has(type);
          return (
            <button
              key={type}
              onClick={() => toggleEdgeType(type)}
              aria-pressed={isSelected}
              title={`Toggle ${EDGE_TYPE_LABELS[type]} edges`}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20 shadow-sm font-bold'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {EDGE_TYPE_LABELS[type]}
            </button>
          );
        })}
      </div>
    </div>
  );
};
