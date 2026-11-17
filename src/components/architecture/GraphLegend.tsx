'use client';

import React from 'react';
import { NODE_TYPE_COLORS, NODE_TYPE_LABELS, EDGE_TYPE_LABELS } from '@/types/architecture';
import { NodeType, EdgeType } from '@/types/graph';

const LEGEND_NODE_TYPES: NodeType[] = ['file', 'module', 'function', 'class', 'test', 'config', 'decision', 'commit'];
const LEGEND_EDGE_TYPES: EdgeType[] = ['imports', 'calls', 'extends', 'tests', 'configures', 'co_changed'];

export const GraphLegend: React.FC = () => {
  return (
    <div className="p-4 bg-white border border-[#EDEDED] rounded-[10px] space-y-3 text-xs shadow-2xs">
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#707070] block mb-2">
          Node Semantics
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LEGEND_NODE_TYPES.map((type) => (
            <div key={type} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: NODE_TYPE_COLORS[type] }}
              />
              <span className="text-[#171717] font-medium">{NODE_TYPE_LABELS[type]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-[#EDEDED]">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#707070] block mb-2">
          Relationship Semantics
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {LEGEND_EDGE_TYPES.map((type) => (
            <div key={type} className="flex items-center gap-1.5 text-[11px] text-[#707070] font-mono">
              <span className="w-3 h-0.5 bg-[#9A9A9A] inline-block" />
              <span>{EDGE_TYPE_LABELS[type]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
