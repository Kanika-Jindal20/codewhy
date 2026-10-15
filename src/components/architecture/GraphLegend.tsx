import React from 'react';
import { NodeType, EdgeType } from '@/types/graph';
import { NODE_TYPE_COLORS, NODE_TYPE_LABELS, EDGE_TYPE_LABELS } from '@/types/architecture';

// Edge style configuration
const EDGE_STYLES: Record<EdgeType, { color: string; dash?: string; label: string }> = {
  imports:    { color: '#6485F5', label: EDGE_TYPE_LABELS.imports },
  calls:      { color: '#35B88A', label: EDGE_TYPE_LABELS.calls },
  extends:    { color: '#9B8AFB', dash: '5,3', label: EDGE_TYPE_LABELS.extends },
  implements: { color: '#9B8AFB', dash: '5,3', label: EDGE_TYPE_LABELS.implements },
  tests:      { color: '#E7B65C', label: EDGE_TYPE_LABELS.tests },
  configures: { color: '#78869B', dash: '2,3', label: EDGE_TYPE_LABELS.configures },
  co_changed: { color: '#F07878', dash: '4,3', label: EDGE_TYPE_LABELS.co_changed },
  supersedes: { color: '#F07878', dash: '2,4', label: EDGE_TYPE_LABELS.supersedes },
};

const ALL_NODE_TYPES = Object.keys(NODE_TYPE_COLORS) as NodeType[];
const ALL_EDGE_TYPES = Object.keys(EDGE_STYLES) as EdgeType[];

interface GraphLegendProps {
  className?: string;
}

export const GraphLegend: React.FC<GraphLegendProps> = ({ className = '' }) => {
  return (
    <div
      className={`bg-app-panel border border-app-border rounded-lg p-3 ${className}`}
      aria-label="Graph legend"
    >
      <div className="flex flex-wrap gap-4">
        {/* Node types */}
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1.5 font-mono">
            Node Types
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {ALL_NODE_TYPES.map(type => (
              <span key={type} className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: NODE_TYPE_COLORS[type] }}
                  aria-hidden
                />
                {NODE_TYPE_LABELS[type]}
              </span>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px bg-app-border self-stretch" aria-hidden />

        {/* Edge types */}
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1.5 font-mono">
            Relationship Types
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {ALL_EDGE_TYPES.map(type => {
              const style = EDGE_STYLES[type];
              return (
                <span key={type} className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                  <svg width="22" height="10" aria-hidden>
                    <line
                      x1="1" y1="5" x2="21" y2="5"
                      stroke={style.color}
                      strokeWidth="1.5"
                      strokeDasharray={style.dash}
                    />
                  </svg>
                  {style.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
