'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Loader2, ZoomIn, ZoomOut, RotateCcw, Maximize2, GitBranch } from 'lucide-react';
import { VisNode, VisEdge, FilterState, NODE_TYPE_COLORS, EDGE_TYPE_LABELS } from '@/types/architecture';
import { NodeType, EdgeType } from '@/types/graph';

// ---------------------------------------------------------------------------
// Edge visual config
// ---------------------------------------------------------------------------
const EDGE_STROKE: Record<EdgeType, { color: string; dash?: string }> = {
  imports:    { color: '#3B82F6' },
  calls:      { color: '#10B981' },
  extends:    { color: '#8B5CF6', dash: '5,3' },
  implements: { color: '#8B5CF6', dash: '5,3' },
  tests:      { color: '#F59E0B' },
  configures: { color: '#64748B', dash: '3,3' },
  co_changed: { color: '#EF4444', dash: '4,3' },
  supersedes: { color: '#EF4444', dash: '2,4' },
};

const NODE_RADIUS = 26;
const SELECTED_RADIUS = 32;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface GraphCanvasProps {
  nodes: VisNode[];
  edges: VisEdge[];
  filters: FilterState;
  selectedNodeId: string | null;
  isLoading: boolean;
  error: string | null;
  truncated: boolean;
  onSelectNode: (nodeId: string) => void;
  onExpandNode: (nodeId: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function isNodeVisible(node: VisNode, filters: FilterState): boolean {
  if (filters.nodeTypes.size === 0) return true;
  return filters.nodeTypes.has(node.type as NodeType);
}

function isEdgeVisible(edge: VisEdge, filters: FilterState, visibleNodeIds: Set<string>): boolean {
  if (!visibleNodeIds.has(edge.sourceId) || !visibleNodeIds.has(edge.targetId)) return false;
  if (filters.edgeTypes.size === 0) return true;
  return filters.edgeTypes.has(edge.type as EdgeType);
}

// Midpoint for edge label placement
function edgeMid(sx: number, sy: number, tx: number, ty: number) {
  return { x: (sx + tx) / 2, y: (sy + ty) / 2 };
}

// Shorten edge endpoints to not overlap node circles
function shortenEdge(
  sx: number, sy: number, tx: number, ty: number, r: number
): { x1: number; y1: number; x2: number; y2: number } {
  const dx = tx - sx; const dy = ty - sy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const pad = r + 3;
  return {
    x1: sx + (dx / len) * pad,
    y1: sy + (dy / len) * pad,
    x2: tx - (dx / len) * pad,
    y2: ty - (dy / len) * pad,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  filters,
  selectedNodeId,
  isLoading,
  error,
  truncated,
  onSelectNode,
  onExpandNode,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  // Default comfortably scaled so nodes don't look tiny
  const [zoom, setZoom] = useState(1.05);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [focusedNodeIdx, setFocusedNodeIdx] = useState<number>(-1);

  // Apply filters
  const visibleNodeSet = new Set(
    nodes.filter(n => isNodeVisible(n, filters)).map(n => n.id)
  );
  const visibleNodes = nodes.filter(n => visibleNodeSet.has(n.id));
  const visibleEdges = edges.filter(e => isEdgeVisible(e, filters, visibleNodeSet));

  // Reset pan/zoom when nodes change substantially
  useEffect(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1.05);
  }, [nodes.length]);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as Element).tagName !== 'svg' && !(e.target as Element).tagName.includes('rect')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPanStart({ x: pan.x, y: pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setPan({
      x: panStart.x + (e.clientX - dragStart.x),
      y: panStart.y + (e.clientY - dragStart.y),
    });
  }, [isDragging, dragStart, panStart]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  // Zoom handler: smooth step, never shrinks smaller than 0.75
  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.06 : 0.06;
    setZoom(z => Math.max(0.75, Math.min(2.2, Number((z + delta).toFixed(2)))));
  }, []);

  // Keyboard navigation through visible nodes
  const handleSvgKeyDown = (e: React.KeyboardEvent) => {
    if (visibleNodes.length === 0) return;
    if (e.key === 'Tab') {
      e.preventDefault();
      setFocusedNodeIdx(i => (i + 1) % visibleNodes.length);
    } else if (e.key === 'Enter' && focusedNodeIdx >= 0) {
      onSelectNode(visibleNodes[focusedNodeIdx].id);
    } else if (e.key === 'Escape') {
      onSelectNode('');
      setFocusedNodeIdx(-1);
    }
  };

  const zoomIn = () => setZoom(z => Math.min(Number((z + 0.15).toFixed(2)), 2.2));
  const zoomOut = () => setZoom(z => Math.max(Number((z - 0.15).toFixed(2)), 0.75));
  const resetView = () => { setZoom(1.05); setPan({ x: 0, y: 0 }); };

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------
  if (error) {
    return (
      <div className="flex-1 bg-white rounded-2xl border border-red-200 flex items-center justify-center min-h-[460px] p-6">
        <div className="text-center text-sm text-red-600 space-y-2">
          <GitBranch className="w-8 h-8 mx-auto opacity-70" />
          <div className="font-extrabold text-base">Graph query failed</div>
          <div className="text-xs text-gray-500 max-w-xs">{error}</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 bg-white rounded-2xl border border-blue-100 flex items-center justify-center min-h-[460px]">
        <div className="flex flex-col items-center gap-3 text-blue-600">
          <Loader2 className="w-9 h-9 animate-spin" />
          <span className="text-xs font-bold text-gray-700">Loading graph neighborhood…</span>
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 flex items-center justify-center min-h-[460px]">
        <div className="text-center text-sm text-gray-500 space-y-2">
          <GitBranch className="w-8 h-8 mx-auto opacity-40 text-gray-400" />
          <div className="font-bold text-gray-800">No graph data available</div>
          <div className="text-xs text-gray-500">Try searching for a file or symbol above.</div>
        </div>
      </div>
    );
  }

  if (visibleNodes.length === 0) {
    return (
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 flex items-center justify-center min-h-[460px]">
        <div className="text-center text-sm text-gray-500 space-y-2">
          <div className="font-bold text-gray-800">All nodes hidden by filters</div>
          <div className="text-xs text-gray-500">Clear filters to restore graph visibility.</div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main SVG render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex-1 flex flex-col bg-slate-50/70 rounded-2xl border border-blue-100 overflow-hidden min-h-[500px] relative shadow-inner">
      {/* Controls bar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white/95 border border-gray-200 rounded-xl px-2.5 py-1.5 shadow-md backdrop-blur-md">
        <button onClick={zoomIn} title="Zoom in" className="p-1.5 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
          <ZoomIn className="w-4 h-4 stroke-[2.2]" />
        </button>
        <span className="text-xs font-bold text-gray-800 w-11 text-center select-none">{Math.round(zoom * 100)}%</span>
        <button onClick={zoomOut} title="Zoom out" className="p-1.5 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
          <ZoomOut className="w-4 h-4 stroke-[2.2]" />
        </button>
        <div className="w-px h-5 bg-gray-200 mx-1" aria-hidden />
        <button onClick={resetView} title="Reset view (100%)" className="p-1.5 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
          <RotateCcw className="w-4 h-4 stroke-[2.2]" />
        </button>
        <button
          onClick={() => svgRef.current?.requestFullscreen?.()}
          title="Full screen"
          className="p-1.5 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <Maximize2 className="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>

      {/* Truncation warning */}
      {truncated && (
        <div className="absolute top-3 left-3 z-10 px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2 shadow-sm">
          <span>⚠️</span> Graph limited to {nodes.length} nodes. Expand nodes to explore further.
        </div>
      )}

      {/* Stats bar */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2.5 text-xs font-bold text-gray-600 bg-white/90 border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm backdrop-blur-sm">
        <span className="text-blue-600">{visibleNodes.length} nodes</span>
        <span className="text-gray-300">·</span>
        <span className="text-indigo-600">{visibleEdges.length} relationships</span>
        {isDragging && <span className="text-emerald-600 animate-pulse">● panning</span>}
      </div>

      <svg
        ref={svgRef}
        className={`flex-1 w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onKeyDown={handleSvgKeyDown}
        tabIndex={0}
        role="application"
        aria-label={`Architecture graph with ${visibleNodes.length} nodes and ${visibleEdges.length} edges. Tab to cycle nodes, Enter to select, double-click to expand.`}
        style={{ outline: 'none' }}
      >
        <defs>
          {/* Subtle grid pattern for engineering dashboard feel */}
          <pattern id="graph-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#E2E8F0" strokeWidth="0.8" opacity="0.6" />
          </pattern>

          {/* Node drop shadow for 3D depth */}
          <filter id="node-shadow" x="-20%" y="-20%" width="150%" height="150%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.15" />
          </filter>
          <filter id="selected-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="5" stdDeviation="6" floodOpacity="0.25" />
          </filter>

          {/* Arrowhead markers with high visibility */}
          {Object.entries(EDGE_STROKE).map(([type, style]) => (
            <marker
              key={type}
              id={`arrow-${type}`}
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 8 3.5, 0 7" fill={style.color} opacity="0.9" />
            </marker>
          ))}
        </defs>

        {/* Background Grid */}
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="url(#graph-grid)"
          className="cursor-grab"
        />

        {/* Graph Transform Group (with smooth transition when not dragging) */}
        <g
          transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}
          style={{
            transition: isDragging ? 'none' : 'transform 0.12s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Edges */}
          {visibleEdges.map(edge => {
            const style = EDGE_STROKE[edge.type] ?? EDGE_STROKE.imports;
            const srcR = edge.sourceId === selectedNodeId ? SELECTED_RADIUS : NODE_RADIUS;
            const tgtR = edge.targetId === selectedNodeId ? SELECTED_RADIUS : NODE_RADIUS;
            const { x1, y1 } = shortenEdge(
              edge.sourceNode.x, edge.sourceNode.y,
              edge.targetNode.x, edge.targetNode.y,
              srcR,
            );
            const _ = shortenEdge(
              edge.sourceNode.x, edge.sourceNode.y,
              edge.targetNode.x, edge.targetNode.y,
              tgtR,
            );
            const mid = edgeMid(x1, y1, _.x2, _.y2);

            return (
              <g key={edge.id} className="transition-opacity hover:opacity-100">
                <line
                  x1={x1} y1={y1} x2={_.x2} y2={_.y2}
                  stroke={style.color}
                  strokeWidth={2}
                  strokeOpacity={0.7}
                  strokeDasharray={style.dash}
                  markerEnd={`url(#arrow-${edge.type})`}
                />
                {/* Edge relationship pill */}
                <g transform={`translate(${mid.x},${mid.y})`}>
                  <rect
                    x="-24" y="-8"
                    width="48" height="16"
                    rx="8"
                    fill="#FFFFFF"
                    stroke={style.color}
                    strokeWidth="1"
                    opacity="0.9"
                  />
                  <text
                    textAnchor="middle"
                    y="3.5"
                    fontSize="8.5"
                    fontWeight="700"
                    fill={style.color}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {EDGE_TYPE_LABELS[edge.type]}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Nodes */}
          {visibleNodes.map((node, idx) => {
            const isSelected = node.id === selectedNodeId;
            const isFocused = idx === focusedNodeIdx;
            const r = isSelected ? SELECTED_RADIUS : NODE_RADIUS;
            const color = NODE_TYPE_COLORS[node.type as NodeType] ?? '#3B82F6';

            return (
              <g
                key={node.id}
                transform={`translate(${node.x},${node.y})`}
                onClick={() => onSelectNode(node.id)}
                onDoubleClick={() => onExpandNode(node.id)}
                style={{ cursor: 'pointer' }}
                role="button"
                aria-label={`${node.label} (${node.type}) — click to select, double-click to expand`}
                tabIndex={-1}
              >
                {/* Outer Glow / Focus Ring */}
                {(isSelected || isFocused) && (
                  <circle
                    r={r + 8}
                    fill="none"
                    stroke={color}
                    strokeWidth={isSelected ? 3 : 1.5}
                    opacity={isSelected ? 0.6 : 0.3}
                    className="animate-pulse"
                  />
                )}

                {/* Node Solid Body with 3D Drop Shadow */}
                <circle
                  r={r}
                  fill="#FFFFFF"
                  stroke={color}
                  strokeWidth={isSelected ? 3.5 : 2.5}
                  filter={isSelected ? 'url(#selected-shadow)' : 'url(#node-shadow)'}
                />

                {/* Inner Colored Accent Disc */}
                <circle
                  r={r - 7}
                  fill={color}
                  opacity={isSelected ? 0.25 : 0.15}
                />
                <circle
                  r={5}
                  fill={color}
                />

                {/* Node Label (Clean Normal Font, Never Typewriter) */}
                <text
                  textAnchor="middle"
                  dy={r + 16}
                  fontSize="11"
                  fill="#0F172A"
                  fontWeight="800"
                  style={{
                    userSelect: 'none',
                    pointerEvents: 'none',
                    paintOrder: 'stroke',
                    stroke: '#FFFFFF',
                    strokeWidth: 3,
                    strokeLinejoin: 'round',
                  }}
                >
                  {node.label.length > 20 ? node.label.slice(0, 18) + '…' : node.label}
                </text>

                {/* Node Type Pill Underneath */}
                <text
                  textAnchor="middle"
                  dy={r + 28}
                  fontSize="9"
                  fill={color}
                  fontWeight="700"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {node.type.toUpperCase()}
                </text>

                {/* SVG Title Tooltip */}
                <title>{`${node.label} · ${node.type} · ${node.filePath}`}</title>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
