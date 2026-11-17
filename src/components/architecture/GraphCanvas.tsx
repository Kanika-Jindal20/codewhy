'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Loader2, ZoomIn, ZoomOut, RotateCcw, GitBranch, ArrowRight } from 'lucide-react';
import { VisNode, VisEdge, FilterState, NODE_TYPE_COLORS, EDGE_TYPE_LABELS } from '@/types/architecture';
import { NodeType, EdgeType } from '@/types/graph';

// Refined edge stroke styles
const EDGE_STROKE: Record<EdgeType, { color: string; dash?: string }> = {
  imports:    { color: '#DFDFDF' },
  calls:      { color: '#3ECF8E' },
  extends:    { color: '#644FC1', dash: '4,3' },
  implements: { color: '#644FC1', dash: '4,3' },
  tests:      { color: '#F59E0B' },
  configures: { color: '#9A9A9A', dash: '3,3' },
  co_changed: { color: '#FF2201', dash: '4,3' },
  supersedes: { color: '#EF4444', dash: '2,4' },
  defines:    { color: '#054CFF' },
  depends_on: { color: '#212121' },
  modifies:   { color: '#C7007E', dash: '3,2' },
};

const NODE_RADIUS = 24;
const SELECTED_RADIUS = 28;

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

function isNodeVisible(node: VisNode, filters: FilterState): boolean {
  if (filters.nodeTypes.size === 0) return true;
  return filters.nodeTypes.has(node.type as NodeType);
}

function isEdgeVisible(edge: VisEdge, filters: FilterState, visibleNodeIds: Set<string>): boolean {
  if (!visibleNodeIds.has(edge.sourceId) || !visibleNodeIds.has(edge.targetId)) return false;
  if (filters.edgeTypes.size === 0) return true;
  return filters.edgeTypes.has(edge.type as EdgeType);
}

function shortenEdge(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  r: number
): { x1: number; y1: number; x2: number; y2: number } {
  const dx = tx - sx;
  const dy = ty - sy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const pad = r + 2;
  return {
    x1: sx + (dx / len) * pad,
    y1: sy + (dy / len) * pad,
    x2: tx - (dx / len) * pad,
    y2: ty - (dy / len) * pad,
  };
}

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
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safeEdges = Array.isArray(edges) ? edges : [];

  const visibleNodeSet = new Set(
    safeNodes.filter((n) => isNodeVisible(n, filters)).map((n) => n.id)
  );

  const visibleNodes = safeNodes.filter((n) => visibleNodeSet.has(n.id));
  const visibleEdges = safeEdges.filter((e) => isEdgeVisible(e, filters, visibleNodeSet));

  useEffect(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1.0);
  }, [safeNodes.length]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if ((e.target as Element).tagName !== 'svg' && !(e.target as Element).tagName.includes('rect')) return;
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanStart({ x: pan.x, y: pan.y });
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isDragging) return;
      setPan({
        x: panStart.x + (e.clientX - dragStart.x),
        y: panStart.y + (e.clientY - dragStart.y),
      });
    },
    [isDragging, dragStart, panStart]
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom((z) => Math.max(0.75, Math.min(2.0, Number((z + delta).toFixed(2)))));
  }, []);

  return (
    <div className="relative w-full h-[540px] bg-white rounded-[12px] border border-[#EDEDED] overflow-hidden select-none shadow-2xs">
      {/* Background Subtle Dot Pattern */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
        <defs>
          <pattern id="graph-dot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.8" fill="#DFDFDF" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#graph-dot-grid)" />
      </svg>

      {/* Floating Canvas Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/95 border border-[#EDEDED] rounded-[8px] p-1 shadow-sm backdrop-blur-xs">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(2.0, Number((z + 0.1).toFixed(2))))}
          aria-label="Zoom in"
          className="p-1 rounded-[4px] text-[#707070] hover:text-[#171717] hover:bg-[#F4F4F5] transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className="font-mono text-[11px] text-[#707070] w-10 text-center select-none">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.75, Number((z - 0.1).toFixed(2))))}
          aria-label="Zoom out"
          className="p-1 rounded-[4px] text-[#707070] hover:text-[#171717] hover:bg-[#F4F4F5] transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-3.5 bg-[#EDEDED] mx-0.5" />
        <button
          type="button"
          onClick={() => {
            setZoom(1.0);
            setPan({ x: 0, y: 0 });
          }}
          aria-label="Reset zoom and pan"
          className="p-1 rounded-[4px] text-[#707070] hover:text-[#171717] hover:bg-[#F4F4F5] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-2 text-[11px] text-[#707070] bg-white/90 border border-[#EDEDED] px-2.5 py-1 rounded-[6px] shadow-2xs">
        <span>Click node to inspect</span>
        <span className="text-[#DFDFDF]">·</span>
        <span>Double-click to expand 1-hop reach</span>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs flex items-center justify-center z-20">
          <div className="flex items-center gap-2 text-xs font-medium text-[#171717]">
            <Loader2 className="w-4 h-4 animate-spin text-[#3ECF8E]" />
            <span>Computing layout...</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[8px] text-xs text-[#991B1B]">
            {error}
          </div>
        </div>
      )}

      {/* SVG Canvas Element */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          <marker
            id="edge-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#C7C7C7" />
          </marker>
          <marker
            id="edge-arrow-selected"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#3ECF8E" />
          </marker>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Edges */}
          {visibleEdges.map((edge) => {
            const isConnectedToSelected =
              edge.sourceId === selectedNodeId || edge.targetId === selectedNodeId;
            const strokeConfig = EDGE_STROKE[edge.type] || { color: '#DFDFDF' };
            const strokeColor = isConnectedToSelected ? '#3ECF8E' : strokeConfig.color;
            const strokeWidth = isConnectedToSelected ? 2 : 1.25;

            const { x1, y1, x2, y2 } = shortenEdge(
              edge.sourceNode.x,
              edge.sourceNode.y,
              edge.targetNode.x,
              edge.targetNode.y,
              NODE_RADIUS
            );

            return (
              <g key={edge.id} className="transition-opacity">
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeConfig.dash}
                  markerEnd={isConnectedToSelected ? 'url(#edge-arrow-selected)' : 'url(#edge-arrow)'}
                />
              </g>
            );
          })}

          {/* Nodes */}
          {visibleNodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            const r = isSelected ? SELECTED_RADIUS : NODE_RADIUS;
            const color = NODE_TYPE_COLORS[node.type] || '#707070';

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => onSelectNode(node.id)}
                onDoubleClick={() => onExpandNode(node.id)}
                className="cursor-pointer group"
              >
                {/* Emerald halo if selected */}
                {isSelected && (
                  <circle
                    r={r + 6}
                    fill="none"
                    stroke="#3ECF8E"
                    strokeWidth="2.5"
                    strokeOpacity="0.4"
                    className="animate-pulse"
                  />
                )}

                {/* Node Circle */}
                <circle
                  r={r}
                  fill="#FFFFFF"
                  stroke={isSelected ? '#3ECF8E' : '#DFDFDF'}
                  strokeWidth={isSelected ? '2' : '1.5'}
                  className="transition-colors group-hover:stroke-[#171717]"
                />

                {/* Internal Type Dot */}
                <circle cx={0} cy={-4} r={4} fill={color} />

                {/* Centered Monospace Symbol / Type Initials */}
                <text
                  x={0}
                  y={8}
                  textAnchor="middle"
                  className="font-mono text-[9px] font-semibold fill-[#171717] select-none pointer-events-none"
                >
                  {node.type.slice(0, 3).toUpperCase()}
                </text>

                {/* Label text below node */}
                <text
                  x={0}
                  y={r + 14}
                  textAnchor="middle"
                  className={`font-sans text-[11px] select-none pointer-events-none ${
                    isSelected ? 'font-semibold fill-[#171717]' : 'font-normal fill-[#707070]'
                  }`}
                >
                  {node.label.length > 18 ? `${node.label.slice(0, 16)}…` : node.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
