'use client';

import React, { useState } from 'react';
import { Network, Table, ZoomIn, ZoomOut, RotateCcw, ArrowRight, GitCommit, CheckCircle2, ChevronRight } from 'lucide-react';
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
  const directConsumers = affectedComponents.filter(c => c.isDirect && c.impactKind === 'direct_dependent');
  const transitiveConsumers = affectedComponents.filter(c => !c.isDirect && c.impactKind === 'transitive_consumer');
  const testsAndConfigs = affectedComponents.filter(c => c.impactKind === 'test_suite' || c.impactKind === 'config_consumer');

  return (
    <div className="bg-white border border-red-100 rounded-3xl p-6 sm:p-7 shadow-xl">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-100 text-red-600 shadow-xs">
            <Network className="w-5 h-5 stroke-[2.2]" />
          </span>
          <div>
            <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">
              Dependency Propagation Flow
            </h3>
            <span className="text-xs text-gray-500 font-medium">
              Smooth, layered caller-chain graph tracing impacts back to the modified code entity
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {viewMode === 'graph' && (
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-1.5 shadow-sm">
              <button
                onClick={() => setZoom(z => Math.min(Number((z + 0.1).toFixed(2)), 1.25))}
                title="Enlarge flow graph"
                className="p-1 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-white transition-colors"
              >
                <ZoomIn className="w-4 h-4 stroke-[2.2]" />
              </button>
              <span className="text-xs font-bold text-gray-700 w-10 text-center select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(z => Math.max(Number((z - 0.1).toFixed(2)), 0.9))}
                title="Reduce flow graph"
                className="p-1 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-white transition-colors"
              >
                <ZoomOut className="w-4 h-4 stroke-[2.2]" />
              </button>
              <div className="w-px h-4 bg-gray-200 mx-0.5" />
              <button
                onClick={() => setZoom(1)}
                title="Reset view (100%)"
                className="p-1 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-white transition-colors"
              >
                <RotateCcw className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>
          )}

          <button
            onClick={() => setViewMode(v => (v === 'graph' ? 'table' : 'graph'))}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gray-100 border border-gray-200 text-xs font-extrabold text-gray-800 hover:bg-gray-200 shadow-sm transition-all"
          >
            {viewMode === 'graph' ? (
              <>
                <Table className="w-4 h-4 text-blue-600 stroke-[2]" />
                <span>View Table</span>
              </>
            ) : (
              <>
                <Network className="w-4 h-4 text-blue-600 stroke-[2]" />
                <span>View Graph Canvas</span>
              </>
            )}
          </button>
        </div>
      </div>

      {viewMode === 'graph' ? (
        <div className="relative overflow-x-auto min-h-[380px] bg-gradient-to-br from-slate-50 via-white to-blue-50/20 rounded-2xl border border-gray-200 p-6 shadow-inner">
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="flex items-start justify-between gap-6 min-w-[840px]"
          >
            {/* Column 1: Transitive Consumers (Hops 2+) */}
            <div className="flex-1 space-y-3">
              <div className="px-3.5 py-2 rounded-2xl bg-purple-100 border border-purple-200 text-xs font-extrabold text-purple-900 text-center shadow-xs flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Transitive Consumers (Hops 2+)
              </div>
              {transitiveConsumers.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400 border border-dashed border-gray-300 rounded-2xl bg-white/80">
                  No 2+ hop consumers
                </div>
              ) : (
                transitiveConsumers.map((item) => {
                  const isSelected = item.node.id === selectedComponentId;
                  return (
                    <div
                      key={item.node.id}
                      onClick={() => onSelectComponent(item)}
                      className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all shadow-xs hover:shadow-md ${
                        isSelected
                          ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-400/30 shadow-md'
                          : 'bg-white border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="font-extrabold text-sm text-gray-900 truncate">{item.node.label}</div>
                      <div className="text-xs text-gray-500 truncate mt-1">{item.node.filePath}</div>
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 text-xs">
                        <span className="text-purple-700 font-extrabold">consumes direct</span>
                        <ArrowRight className="w-4 h-4 text-purple-400" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Column 2: Direct Consumers (Hop 1) */}
            <div className="flex-1 space-y-3">
              <div className="px-3.5 py-2 rounded-2xl bg-red-100 border border-red-200 text-xs font-extrabold text-red-900 text-center shadow-xs flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Direct Consumers (Hop 1)
              </div>
              {directConsumers.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400 border border-dashed border-gray-300 rounded-2xl bg-white/80">
                  No direct consumers
                </div>
              ) : (
                directConsumers.map((item) => {
                  const isSelected = item.node.id === selectedComponentId;
                  return (
                    <div
                      key={item.node.id}
                      onClick={() => onSelectComponent(item)}
                      className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all shadow-xs hover:shadow-md ${
                        isSelected
                          ? 'bg-red-50 border-red-500 ring-2 ring-red-400/30 shadow-md'
                          : 'bg-white border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <div className="font-extrabold text-sm text-gray-900 truncate">{item.node.label}</div>
                      <div className="text-xs text-gray-500 truncate mt-1">{item.node.filePath}</div>
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 text-xs">
                        <span className="text-red-700 font-extrabold">imports symbol</span>
                        <ArrowRight className="w-4 h-4 text-red-400" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Column 3: TARGET COMPONENT (Center Anchor) */}
            <div className="w-68 shrink-0 space-y-3">
              <div className="px-4 py-2 rounded-2xl bg-blue-600 border border-blue-700 text-xs font-extrabold text-white text-center shadow-md flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-300 animate-pulse"></span>
                Target (Modified)
              </div>
              <div className="p-6 rounded-3xl bg-white border-2 border-blue-500 shadow-xl text-center relative overflow-hidden space-y-2">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-600"></div>
                <div className="font-extrabold text-base text-gray-900 truncate mt-1">
                  {targetNode.label}
                </div>
                <div className="text-xs text-gray-600 truncate font-semibold">
                  {targetNode.filePath}
                </div>
                <div className="pt-2">
                  <span className="inline-block px-3.5 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-extrabold border border-blue-200 uppercase tracking-wider">
                    {targetNode.type}
                  </span>
                </div>
              </div>
            </div>

            {/* Column 4: Tests & Configs */}
            <div className="flex-1 space-y-3">
              <div className="px-3.5 py-2 rounded-2xl bg-amber-100 border border-amber-200 text-xs font-extrabold text-amber-900 text-center shadow-xs flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Tests & Environment
              </div>
              {testsAndConfigs.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400 border border-dashed border-gray-300 rounded-2xl bg-white/80">
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
                      className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all shadow-xs hover:shadow-md ${
                        isSelected
                          ? isTest
                            ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/30 shadow-md'
                            : 'bg-slate-100 border-slate-500 ring-2 ring-slate-400/30 shadow-md'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="font-extrabold text-sm text-gray-900 truncate">{item.node.label}</div>
                      <div className="text-xs text-gray-500 truncate mt-1">{item.node.filePath}</div>
                      <div className="mt-3 pt-2.5 border-t border-gray-100">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold ${
                          isTest ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-900 border border-slate-300'
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
        <div className="overflow-x-auto border border-gray-200 rounded-2xl shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#14213D] text-white">
              <tr>
                <th className="py-3 px-4 font-extrabold">Component</th>
                <th className="py-3 px-4 font-extrabold">File Path</th>
                <th className="py-3 px-4 font-extrabold">Relationship Type</th>
                <th className="py-3 px-4 font-extrabold">Hops</th>
                <th className="py-3 px-4 font-extrabold">Severity</th>
                <th className="py-3 px-4 font-extrabold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {affectedComponents.map((item) => (
                <tr
                  key={item.node.id}
                  onClick={() => onSelectComponent(item)}
                  className="hover:bg-blue-50/60 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-extrabold text-gray-900 text-sm">
                    {item.node.label}
                  </td>
                  <td className="py-3 px-4 text-gray-600 font-semibold">
                    {item.node.filePath}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" size="sm">{item.impactKind}</Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-800 font-extrabold">
                    {item.paths[0]?.hops || 1}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold ${
                      item.severity === 'high'
                        ? 'bg-red-100 text-red-700 border border-red-300'
                        : item.severity === 'medium'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-blue-100 text-blue-700 border border-blue-300'
                    }`}>
                      {item.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-red-600 font-extrabold hover:underline">
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
