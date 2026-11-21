import React from 'react';
import { NodeType, EdgeType } from '@/types/graph';
import { NODE_TYPE_COLORS, NODE_TYPE_LABELS, EDGE_TYPE_LABELS } from '@/types/architecture';
import { BookOpen, X } from 'lucide-react';

// Edge style configuration
const EDGE_STYLES: Record<EdgeType, { color: string; dash?: string; label: string }> = {
  imports:    { color: '#3B82F6', label: EDGE_TYPE_LABELS.imports },
  calls:      { color: '#10B981', label: EDGE_TYPE_LABELS.calls },
  extends:    { color: '#8B5CF6', dash: '5,3', label: EDGE_TYPE_LABELS.extends },
  implements: { color: '#8B5CF6', dash: '5,3', label: EDGE_TYPE_LABELS.implements },
  tests:      { color: '#F59E0B', label: EDGE_TYPE_LABELS.tests },
  configures: { color: '#64748B', dash: '2,3', label: EDGE_TYPE_LABELS.configures },
  co_changed: { color: '#EF4444', dash: '4,3', label: EDGE_TYPE_LABELS.co_changed },
  supersedes: { color: '#EF4444', dash: '2,4', label: EDGE_TYPE_LABELS.supersedes },
  defines:    { color: '#0EA5E9', label: EDGE_TYPE_LABELS.defines },
  depends_on: { color: '#6366F1', label: EDGE_TYPE_LABELS.depends_on },
  modifies:   { color: '#EC4899', dash: '3,2', label: EDGE_TYPE_LABELS.modifies },
};

const ALL_NODE_TYPES = Object.keys(NODE_TYPE_COLORS) as NodeType[];
const ALL_EDGE_TYPES = Object.keys(EDGE_STYLES) as EdgeType[];

interface GraphLegendProps {
  className?: string;
  onClose?: () => void;
}

export const GraphLegend: React.FC<GraphLegendProps> = ({ className = '', onClose }) => {
  return (
    <div
      className={`bg-white border border-blue-100 rounded-2xl p-5 shadow-lg ${className}`}
      aria-label="Graph legend"
    >
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
            <BookOpen className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-900">
            Graph Legend &amp; Symbols
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close legend"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Node types */}
        <div className="space-y-2">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
            Node Types
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ALL_NODE_TYPES.map(type => (
              <span
                key={type}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-semibold text-gray-800"
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: NODE_TYPE_COLORS[type] }}
                  aria-hidden
                />
                <span className="capitalize">{NODE_TYPE_LABELS[type]}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Edge types */}
        <div className="space-y-2">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
            Relationship Types
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ALL_EDGE_TYPES.map(type => {
              const style = EDGE_STYLES[type];
              return (
                <span
                  key={type}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-semibold text-gray-800"
                >
                  <svg width="24" height="10" aria-hidden className="shrink-0">
                    <line
                      x1="1" y1="5" x2="23" y2="5"
                      stroke={style.color}
                      strokeWidth="2"
                      strokeDasharray={style.dash}
                    />
                  </svg>
                  <span>{style.label}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
