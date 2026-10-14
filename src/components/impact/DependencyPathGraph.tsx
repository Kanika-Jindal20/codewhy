'use client';

import React, { useState } from 'react';
import { Network, Table, ZoomIn, ZoomOut, RotateCcw, ArrowRight } from 'lucide-react';
import { AffectedComponent, DependencyPath } from '@/types/impact';
import { GraphNode } from '@/types/graph';
import { Badge } from '@/components/ui/Badge';

interface DependencyPathGraphProps {
  targetNode: GraphNode;
  affectedComponents: AffectedComponent[];
  selectedComponentId?: string;
  onSelectComponent: (comp: AffectedComponent) => void;
}

export const DependencyPathGraph: React.FC<DependencyPathGraphProps> = ({
  targetNode,
  affectedComponents,
  selectedComponentId,
  onSelectComponent,
}) => {
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');
  const [zoom, setZoom] = useState(1);

  // Group components by hop distance for clear layered layout
  // Column 0: 2+ hops consumers (transitive)
  // Column 1: 1 hop consumers (direct)
  // Column 2: Target Component (modified)
  // Column 3: Configs & Tests associated
  const directConsumers = affectedComponents.filter(c => c.isDirect && c.impactKind === 'direct_dependent');
  const transitiveConsumers = affectedComponents.filter(c => !c.isDirect && c.impactKind === 'transitive_consumer');
  const testsAndConfigs = affectedComponents.filter(c => c.impactKind === 'test_suite' || c.impactKind === 'config_consumer');

  return (
    <div className="bg-app-panel border border-app-border rounded-lg p-4">
      {/* Controls Bar */}
      <div className="flex items-center justify-between mb-3 border-b border-app-border pb-3">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-accent-primary" />
          <h3 className="text-sm font-semibold text-text-primary">
            Dependency Propagation Graph
          </h3>
          <span className="text-[11px] text-text-muted">
            (Layered consumer flow ➔ target)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === 'graph' && (
            <div className="flex items-center gap-1 bg-app-surface border border-app-border rounded px-1.5 py-0.5">
              <button
                onClick={() => setZoom(z => Math.min(z + 0.15, 1.5))}
                title="Zoom In"
                className="p-1 text-text-muted hover:text-text-primary"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(z => Math.max(z - 0.15, 0.7))}
                title="Zoom Out"
                className="p-1 text-text-muted hover:text-text-primary"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(1)}
                title="Reset Zoom"
                className="p-1 text-text-muted hover:text-text-primary"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={() => setViewMode(v => (v === 'graph' ? 'table' : 'graph'))}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-app-surface border border-app-border text-xs text-text-secondary hover:text-text-primary font-medium"
          >
            {viewMode === 'graph' ? (
              <>
                <Table className="w-3.5 h-3.5 text-accent-primary" />
                <span>View Table Alternative</span>
              </>
            ) : (
              <>
                <Network className="w-3.5 h-3.5 text-accent-primary" />
                <span>View Graph Canvas</span>
              </>
            )}
          </button>
        </div>
      </div>

      {viewMode === 'graph' ? (
        <div className="relative overflow-x-auto min-h-[300px] bg-app-bg rounded-lg border border-app-border p-4">
          <div
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            className="flex items-center justify-between gap-8 min-w-[720px] transition-transform duration-200"
          >
            {/* Column 1: Transitive Consumers (Hops 2+) */}
            <div className="flex-1 space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2 text-center">
                Transitive Consumers (Hops 2+)
              </div>
              {transitiveConsumers.length === 0 ? (
                <div className="p-3 text-center text-xs text-text-muted border border-dashed border-app-border rounded">
                  No 2+ hop consumers
                </div>
              ) : (
                transitiveConsumers.map((item) => {
                  const isSelected = item.node.id === selectedComponentId;
                  return (
                    <div
                      key={item.node.id}
                      onClick={() => onSelectComponent(item)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-accent-primary/20 border-accent-primary text-text-primary ring-1 ring-accent-primary'
                          : 'bg-app-surface border-app-border text-text-secondary hover:border-accent-primary/60'
                      }`}
                    >
                      <div className="font-mono font-semibold truncate">{item.node.label}</div>
                      <div className="text-[10px] text-text-muted font-mono truncate">{item.node.filePath}</div>
                      <div className="flex items-center justify-between mt-1 text-[10px]">
                        <span className="text-accent-secondary">consumes direct</span>
                        <ArrowRight className="w-3 h-3 text-text-muted" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Column 2: Direct Consumers (Hop 1) */}
            <div className="flex-1 space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2 text-center">
                Direct Consumers (Hop 1)
              </div>
              {directConsumers.length === 0 ? (
                <div className="p-3 text-center text-xs text-text-muted border border-dashed border-app-border rounded">
                  No direct consumers
                </div>
              ) : (
                directConsumers.map((item) => {
                  const isSelected = item.node.id === selectedComponentId;
                  return (
                    <div
                      key={item.node.id}
                      onClick={() => onSelectComponent(item)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-accent-primary/20 border-accent-primary text-text-primary ring-1 ring-accent-primary'
                          : 'bg-app-surface border-app-border text-text-secondary hover:border-accent-primary/60'
                      }`}
                    >
                      <div className="font-mono font-semibold truncate">{item.node.label}</div>
                      <div className="text-[10px] text-text-muted font-mono truncate">{item.node.filePath}</div>
                      <div className="flex items-center justify-between mt-1 text-[10px]">
                        <span className="text-status-error">imports symbol</span>
                        <ArrowRight className="w-3 h-3 text-text-muted" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Column 3: TARGET COMPONENT (Center Anchor) */}
            <div className="w-56 shrink-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-accent-primary font-bold mb-2 text-center">
                ● Target Component (Being Changed)
              </div>
              <div className="p-4 rounded-lg bg-accent-primary/15 border-2 border-accent-primary text-center shadow-lg">
                <div className="font-mono font-bold text-sm text-text-primary truncate">
                  {targetNode.label}
                </div>
                <div className="text-[11px] font-mono text-text-secondary truncate mt-1">
                  {targetNode.filePath}
                </div>
                <div className="mt-2.5 inline-block">
                  <Badge variant="purple" size="sm">
                    {targetNode.type}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Column 4: Tests & Configs */}
            <div className="flex-1 space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2 text-center">
                Tests & Environment References
              </div>
              {testsAndConfigs.length === 0 ? (
                <div className="p-3 text-center text-xs text-text-muted border border-dashed border-app-border rounded">
                  No linked tests or configs
                </div>
              ) : (
                testsAndConfigs.map((item) => {
                  const isSelected = item.node.id === selectedComponentId;
                  return (
                    <div
                      key={item.node.id}
                      onClick={() => onSelectComponent(item)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-accent-primary/20 border-accent-primary text-text-primary ring-1 ring-accent-primary'
                          : 'bg-app-surface border-app-border text-text-secondary hover:border-accent-primary/60'
                      }`}
                    >
                      <div className="font-mono font-semibold truncate">{item.node.label}</div>
                      <div className="text-[10px] text-text-muted font-mono truncate">{item.node.filePath}</div>
                      <div className="mt-1">
                        <Badge variant={item.impactKind === 'test_suite' ? 'warning' : 'default'} size="sm">
                          {item.impactKind === 'test_suite' ? 'asserts behavior' : 'config schema'}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Accessible Table Alternative */
        <div className="overflow-x-auto border border-app-border rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-app-surface text-text-muted font-mono border-b border-app-border">
              <tr>
                <th className="py-2.5 px-3">Component</th>
                <th className="py-2.5 px-3">File Path</th>
                <th className="py-2.5 px-3">Relationship Type</th>
                <th className="py-2.5 px-3">Hops</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border/60">
              {affectedComponents.map((item) => (
                <tr
                  key={item.node.id}
                  onClick={() => onSelectComponent(item)}
                  className="hover:bg-app-surface/50 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-3 font-mono font-medium text-text-primary">
                    {item.node.label}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-text-muted">
                    {item.node.filePath}
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant="outline" size="sm">{item.impactKind}</Badge>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-text-secondary">
                    {item.paths[0]?.hops || 1}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-text-primary">
                    {item.severity}
                  </td>
                  <td className="py-2.5 px-3 text-right text-accent-primary font-medium">
                    Inspect
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
