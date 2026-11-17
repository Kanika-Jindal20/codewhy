'use client';

import React, { useState } from 'react';
import { Network, Table, ZoomIn, ZoomOut, RotateCcw, ArrowRight } from 'lucide-react';
import { AffectedComponent } from '@/types/impact';
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
  const directConsumers = affectedComponents.filter(c => c.isDirect && c.impactKind === 'direct_dependent');
  const transitiveConsumers = affectedComponents.filter(c => !c.isDirect && c.impactKind === 'transitive_consumer');
  const testsAndConfigs = affectedComponents.filter(c => c.impactKind === 'test_suite' || c.impactKind === 'config_consumer');

  return (
    <div className="bg-white border border-border-default rounded-xl p-5 sm:p-6 shadow-xs">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-border-subtle pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted text-ink-primary">
            <Network className="w-4 h-4 text-brand-deep" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-ink-primary">
              Dependency Propagation Flow
            </h3>
            <span className="text-xs text-ink-muted">
              Layered caller-chain graph tracing impacts back to the modified code entity
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {viewMode === 'graph' && (
            <div className="flex items-center gap-1 bg-surface-secondary border border-border-default rounded-lg px-2 py-1">
              <button
                onClick={() => setZoom(z => Math.min(Number((z + 0.1).toFixed(2)), 1.25))}
                title="Zoom in"
                className="p-1 text-ink-muted hover:text-ink-primary rounded transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono font-medium text-ink-secondary w-10 text-center select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(z => Math.max(Number((z - 0.1).toFixed(2)), 0.85))}
                title="Zoom out"
                className="p-1 text-ink-muted hover:text-ink-primary rounded transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-3.5 bg-border-default mx-0.5" />
              <button
                onClick={() => setZoom(1)}
                title="Reset zoom"
                className="p-1 text-ink-muted hover:text-ink-primary rounded transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={() => setViewMode(v => (v === 'graph' ? 'table' : 'graph'))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-secondary border border-border-default text-xs font-medium text-ink-secondary hover:text-ink-primary hover:bg-surface-muted transition-colors"
          >
            {viewMode === 'graph' ? (
              <>
                <Table className="w-3.5 h-3.5 text-ink-muted" />
                <span>View Table</span>
              </>
            ) : (
              <>
                <Network className="w-3.5 h-3.5 text-brand-deep" />
                <span>View Flow Graph</span>
              </>
            )}
          </button>
        </div>
      </div>

      {viewMode === 'graph' ? (
        <div className="relative overflow-x-auto min-h-[360px] bg-surface-secondary rounded-lg border border-border-subtle p-5">
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="flex items-start justify-between gap-5 min-w-[800px]"
          >
            {/* Column 1: Transitive Consumers (Hops 2+) */}
            <div className="flex-1 space-y-2.5">
              <div className="px-3 py-1.5 rounded-md bg-purple-50 border border-purple-200 text-xs font-medium text-purple-900 text-center flex items-center justify-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                Transitive Consumers (2+ Hops)
              </div>
              {transitiveConsumers.length === 0 ? (
                <div className="p-5 text-center text-xs text-ink-faint border border-dashed border-border-default rounded-lg bg-white">
                  No 2+ hop consumers
                </div>
              ) : (
                transitiveConsumers.map((item) => {
                  const isSelected = item.node.id === selectedComponentId;
                  return (
                    <div
                      key={item.node.id}
                      onClick={() => onSelectComponent(item)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-purple-50/60 border-purple-400 ring-1 ring-purple-300 shadow-xs'
                          : 'bg-white border-border-default hover:border-border-strong'
                      }`}
                    >
                      <div className="font-mono font-medium text-xs text-ink-primary truncate">{item.node.label}</div>
                      <div className="font-mono text-[11px] text-ink-muted truncate mt-0.5">{item.node.filePath}</div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-subtle text-[11px]">
                        <span className="text-purple-700 font-mono">consumes direct</span>
                        <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Column 2: Direct Consumers (Hop 1) */}
            <div className="flex-1 space-y-2.5">
              <div className="px-3 py-1.5 rounded-md bg-rose-50 border border-rose-200 text-xs font-medium text-rose-900 text-center flex items-center justify-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                Direct Consumers (Hop 1)
              </div>
              {directConsumers.length === 0 ? (
                <div className="p-5 text-center text-xs text-ink-faint border border-dashed border-border-default rounded-lg bg-white">
                  No direct callers
                </div>
              ) : (
                directConsumers.map((item) => {
                  const isSelected = item.node.id === selectedComponentId;
                  return (
                    <div
                      key={item.node.id}
                      onClick={() => onSelectComponent(item)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-rose-50/60 border-rose-400 ring-1 ring-rose-300 shadow-xs'
                          : 'bg-white border-border-default hover:border-border-strong'
                      }`}
                    >
                      <div className="font-mono font-medium text-xs text-ink-primary truncate">{item.node.label}</div>
                      <div className="font-mono text-[11px] text-ink-muted truncate mt-0.5">{item.node.filePath}</div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-subtle text-[11px]">
                        <span className="text-rose-700 font-mono">imports symbol</span>
                        <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Column 3: TARGET COMPONENT (Center Anchor) */}
            <div className="w-64 shrink-0 space-y-2.5">
              <div className="px-3 py-1.5 rounded-md bg-brand-emerald/10 border border-brand-emerald/30 text-xs font-semibold text-brand-deep text-center flex items-center justify-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-deep"></span>
                Target Symbol (Modified)
              </div>
              <div className="p-5 rounded-lg bg-white border-2 border-brand-emerald shadow-xs text-center space-y-2">
                <div className="font-mono font-semibold text-sm text-ink-primary truncate">
                  {targetNode.label}
                </div>
                <div className="font-mono text-[11px] text-ink-muted truncate">
                  {targetNode.filePath}
                </div>
                <div className="pt-1">
                  <Badge variant="success" size="sm">
                    {targetNode.type}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Column 4: Tests & Configs */}
            <div className="flex-1 space-y-2.5">
              <div className="px-3 py-1.5 rounded-md bg-amber-50 border border-amber-200 text-xs font-medium text-amber-900 text-center flex items-center justify-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Tests & Environment
              </div>
              {testsAndConfigs.length === 0 ? (
                <div className="p-5 text-center text-xs text-ink-faint border border-dashed border-border-default rounded-lg bg-white">
                  No linked tests or configs
                </div>
              ) : (
                testsAndConfigs.map((item) => {
                  const isSelected = item.node.id === selectedComponentId;
                  const isTest = item.impactKind === 'test_suite';
                  return (
                    <div
                      key={item.node.id}
                      onClick={() => onSelectComponent(item)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-50/60 border-amber-400 ring-1 ring-amber-300 shadow-xs'
                          : 'bg-white border-border-default hover:border-border-strong'
                      }`}
                    >
                      <div className="font-mono font-medium text-xs text-ink-primary truncate">{item.node.label}</div>
                      <div className="font-mono text-[11px] text-ink-muted truncate mt-0.5">{item.node.filePath}</div>
                      <div className="mt-2 pt-2 border-t border-border-subtle">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                          isTest ? 'bg-amber-100 text-amber-900' : 'bg-surface-muted text-ink-secondary'
                        }`}>
                          {isTest ? 'asserts behavior' : 'config schema'}
                        </span>
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
        <div className="overflow-x-auto border border-border-default rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-secondary text-ink-muted border-b border-border-default">
              <tr>
                <th className="py-2.5 px-3.5 font-medium">Component</th>
                <th className="py-2.5 px-3.5 font-medium">File Path</th>
                <th className="py-2.5 px-3.5 font-medium">Relationship</th>
                <th className="py-2.5 px-3.5 font-medium">Hops</th>
                <th className="py-2.5 px-3.5 font-medium">Severity</th>
                <th className="py-2.5 px-3.5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle bg-white">
              {affectedComponents.map((item) => (
                <tr
                  key={item.node.id}
                  onClick={() => onSelectComponent(item)}
                  className="hover:bg-surface-secondary cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-3.5 font-mono font-medium text-ink-primary">
                    {item.node.label}
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-ink-muted">
                    {item.node.filePath}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <Badge variant="outline" size="sm">{item.impactKind}</Badge>
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-ink-secondary">
                    {item.paths[0]?.hops || 1}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <Badge 
                      variant={item.severity === 'high' ? 'error' : item.severity === 'medium' ? 'warning' : 'info'}
                      size="sm"
                    >
                      {item.severity}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3.5 text-right text-brand-deep font-medium hover:underline">
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