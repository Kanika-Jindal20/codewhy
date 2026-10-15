'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Loader2, ZoomIn, ZoomOut, RotateCcw, Maximize2, GitBranch } from 'lucide-react';
import { VisNode, VisEdge, FilterState, NODE_TYPE_COLORS, EDGE_TYPE_LABELS } from '@/types/architecture';
import { NodeType, EdgeType } from '@/types/graph';

// ---------------------------------------------------------------------------
// Edge visual config
// ---------------------------------------------------------------------------
const EDGE_STROKE: Record<EdgeType, { color: string; dash?: string }> = {
  imports:    { color: '#6485F5' },
  calls:      { color: '#35B88A' },
  extends:    { color: '#9B8AFB', dash: '5,3' },
  implements: { color: '#9B8AFB', dash: '5,3' },
  tests:      { color: '#E7B65C' },
  configures: { color: '#78869B', dash: '2,3' },
  co_changed: { color: '#F07878', dash: '4,3' },
  supersedes: { color: '#F07878', dash: '2,4' },
};

const NODE_RADIUS = 22;
const SELECTED_RADIUS = 26;

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
  const pad = r + 2;
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
  const [zoom, setZoom] = useState(1);
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
    setZoom(1);
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

  // Zoom handler
  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.max(0.3, Math.min(2.0, z + delta)));
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

  const zoomIn = () => setZoom(z => Math.min(z + 0.2, 2.0));
  const zoomOut = () => setZoom(z => Math.max(z - 0.2, 0.3));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------
  if (error) {
    return (
      <div className="flex-1 bg-app-bg rounded-lg border border-status-error/40 flex items-center justify-center min-h-[400px]">
        <div className="text-center text-sm text-status-error space-y-2">
          <GitBranch className="w-8 h-8 mx-auto opacity-60" />
          <div className="font-semibold">Graph query failed</div>
          <div className="text-xs text-text-muted max-w-xs">{error}</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 bg-app-bg rounded-lg border border-app-border flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
          <span className="text-xs font-mono">Loading graph neighborhood…</span>
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex-1 bg-app-bg rounded-lg border border-app-border flex items-center justify-center min-h-[400px]">
        <div className="text-center text-sm text-text-muted space-y-2">
          <GitBranch className="w-8 h-8 mx-auto opacity-40" />
          <div>No graph data available</div>
          <div className="text-xs">Try searching for a file or symbol above.</div>
        </div>
      </div>
    );
  }

  if (visibleNodes.length === 0) {
    return (
      <div className="flex-1 bg-app-bg rounded-lg border border-app-border flex items-center justify-center min-h-[400px]">
        <div className="text-center text-sm text-text-muted space-y-2">
          <div>All nodes hidden by filters</div>
          <div className="text-xs">Clear filters to see the graph.</div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main SVG render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex-1 flex flex-col bg-app-bg rounded-lg border border-app-border overflow-hidden min-h-[420px] relative">
      {/* Controls bar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-app-panel/90 border border-app-border rounded-lg px-1.5 py-1 backdrop-blur-sm">
        <button onClick={zoomIn} title="Zoom in" className="p-1 text-text-muted hover:text-text-primary transition-colors">
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-mono text-text-muted w-7 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={zoomOut} title="Zoom out" className="p-1 text-text-muted hover:text-text-primary transition-colors">
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-app-border mx-0.5" aria-hidden />
        <button onClick={resetView} title="Reset view" className="p-1 text-text-muted hover:text-text-primary transition-colors">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => svgRef.current?.requestFullscreen?.()}
          title="Full screen"
          className="p-1 text-text-muted hover:text-text-primary transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Truncation warning */}
      {truncated && (
        <div className="absolute top-3 left-3 z-10 px-2 py-1 bg-status-warning/15 border border-status-warning/40 rounded text-[10px] font-mono text-status-warning flex items-center gap-1.5">
          <span>⚠</span> Graph limited to {nodes.length} nodes. Expand individual nodes to explore further.
        </div>
      )}

      {/* Stats bar */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 text-[10px] font-mono text-text-muted bg-app-panel/80 border border-app-border/60 rounded px-2 py-1 backdrop-blur-sm">
        <span>{visibleNodes.length} nodes</span>
        <span>·</span>
        <span>{visibleEdges.length} edges</span>
        {isDragging && <span className="text-accent-primary">dragging</span>}
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
        {/* Arrowhead marker */}
        <defs>
          {Object.entries(EDGE_STROKE).map(([type, style]) => (
            <marker
              key={type}
              id={`arrow-${type}`}
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L8,3 z" fill={style.color} opacity="0.7" />
            </marker>
          ))}
        </defs>

        {/* Background hit area for panning */}
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="transparent"
          className="cursor-grab"
        />

        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
          {/* Edges */}
          {visibleEdges.map(edge => {
            const style = EDGE_STROKE[edge.type] ?? EDGE_STROKE.imports;
            const srcR = edge.sourceId === selectedNodeId ? SELECTED_RADIUS : NODE_RADIUS;
            const tgtR = edge.targetId === selectedNodeId ? SELECTED_RADIUS : NODE_RADIUS;
            const { x1, y1, x2, y2 } = shortenEdge(
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
              <g key={edge.id}>
                <line
                  x1={x1} y1={y1} x2={_.x2} y2={_.y2}
                  stroke={style.color}
                  strokeWidth={1.5}
                  strokeOpacity={0.55}
                  strokeDasharray={style.dash}
                  markerEnd={`url(#arrow-${edge.type})`}
                />
                {/* Edge label on hover — show via title */}
                <text
                  x={mid.x} y={mid.y - 5}
                  textAnchor="middle"
                  fontSize="9"
                  fill={style.color}
                  opacity="0.7"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {EDGE_TYPE_LABELS[edge.type]}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {visibleNodes.map((node, idx) => {
            const isSelected = node.id === selectedNodeId;
            const isFocused = idx === focusedNodeIdx;
            const r = isSelected ? SELECTED_RADIUS : NODE_RADIUS;
            const color = NODE_TYPE_COLORS[node.type as NodeType] ?? '#78869B';

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
                {/* Glow / selection ring */}
                {(isSelected || isFocused) && (
                  <circle
                    r={r + 6}
                    fill="none"
                    stroke={color}
                    strokeWidth={isSelected ? 2 : 1}
                    opacity={isSelected ? 0.5 : 0.3}
                  />
                )}

                {/* Node body */}
                <circle
                  r={r}
                  fill={`${color}22`}
                  stroke={color}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />

                {/* Type indicator ring */}
                <circle
                  r={r - 5}
                  fill={`${color}18`}
                  stroke={color}
                  strokeWidth={1}
                  opacity={0.5}
                />

                {/* Label */}
                <text
                  textAnchor="middle"
                  dy={r + 14}
                  fontSize="10"
                  fill="#F3F6FC"
                  fontFamily="JetBrains Mono, Fira Code, monospace"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {node.label.length > 18 ? node.label.slice(0, 16) + '…' : node.label}
                </text>

                {/* Type label */}
                <text
                  textAnchor="middle"
                  dy={r + 25}
                  fontSize="8"
                  fill={color}
                  fontFamily="JetBrains Mono, Fira Code, monospace"
                  opacity="0.8"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {node.type}
                </text>

                {/* SVG title for hover tooltip */}
                <title>{`${node.label} · ${node.type} · ${node.filePath}`}</title>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
