import { GraphNode, GraphEdge } from '@/types/graph';
import { VisNode, VisEdge } from '@/types/architecture';

// ---------------------------------------------------------------------------
// Fruchterman–Reingold force-directed layout
// ---------------------------------------------------------------------------
// A one-shot static layout: runs N iterations and returns stable positions.
// Safe for up to 80 nodes (the enforced query limit).
// Deterministic for a given node set via ID-hash-based initial placement.
// ---------------------------------------------------------------------------

const ITERATIONS = 120;
const COOLING_FACTOR = 0.92; // temperature decay per iteration
const MIN_DISTANCE = 8;       // avoid division-by-zero collapse

/** Simple deterministic hash of a string → integer. */
function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Spread nodes in a deterministic pseudo-random initial placement so the
 * layout starts from a reasonable state rather than a single point.
 */
function initialPositions(
  nodes: GraphNode[],
  width: number,
  height: number,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.38;

  nodes.forEach((node, i) => {
    // Deterministic angle based on node ID hash + index
    const hash = hashString(node.id);
    const angle = ((hash % 1000) / 1000 + i / nodes.length) * 2 * Math.PI;
    positions.set(node.id, {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  });
  return positions;
}

/**
 * Run Fruchterman–Reingold force-directed layout.
 *
 * @param nodes  - Array of graph nodes to position
 * @param edges  - Edges defining attractive forces between nodes
 * @param width  - Canvas width in pixels
 * @param height - Canvas height in pixels
 * @returns      - Array of VisNodes with x, y coordinates
 */
export function computeLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
): VisNode[] {
  if (nodes.length === 0) return [];

  const k = Math.sqrt((width * height) / Math.max(nodes.length, 1));
  const area = Math.min(width, height);

  // Initialise positions
  const pos = initialPositions(nodes, width, height);
  const disp = new Map<string, { dx: number; dy: number }>();
  for (const node of nodes) disp.set(node.id, { dx: 0, dy: 0 });

  let temperature = area * 0.5; // initial temperature

  for (let iter = 0; iter < ITERATIONS; iter++) {
    // Reset displacements
    for (const id of disp.keys()) disp.set(id, { dx: 0, dy: 0 });

    // --- Repulsive forces between all pairs ---
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const ni = nodes[i]; const nj = nodes[j];
        const pi = pos.get(ni.id)!; const pj = pos.get(nj.id)!;
        let dx = pi.x - pj.x;
        let dy = pi.y - pj.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MIN_DISTANCE) dist = MIN_DISTANCE;
        const force = (k * k) / dist;
        const di = disp.get(ni.id)!; const dj = disp.get(nj.id)!;
        di.dx += (dx / dist) * force;
        di.dy += (dy / dist) * force;
        dj.dx -= (dx / dist) * force;
        dj.dy -= (dy / dist) * force;
      }
    }

    // --- Attractive forces along edges ---
    for (const edge of edges) {
      const ps = pos.get(edge.source);
      const pt = pos.get(edge.target);
      if (!ps || !pt) continue;
      let dx = ps.x - pt.x;
      let dy = ps.y - pt.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MIN_DISTANCE) dist = MIN_DISTANCE;
      const force = (dist * dist) / k;
      const ds = disp.get(edge.source)!;
      const dt = disp.get(edge.target)!;
      ds.dx -= (dx / dist) * force;
      ds.dy -= (dy / dist) * force;
      dt.dx += (dx / dist) * force;
      dt.dy += (dy / dist) * force;
    }

    // --- Apply displacements, capped by temperature, clamped to canvas ---
    for (const node of nodes) {
      const p = pos.get(node.id)!;
      const d = disp.get(node.id)!;
      const dispLen = Math.sqrt(d.dx * d.dx + d.dy * d.dy);
      if (dispLen < 0.001) continue;
      const scale = Math.min(dispLen, temperature) / dispLen;
      p.x = Math.max(40, Math.min(width - 40, p.x + d.dx * scale));
      p.y = Math.max(40, Math.min(height - 40, p.y + d.dy * scale));
    }

    temperature *= COOLING_FACTOR;
  }

  return nodes.map(node => {
    const p = pos.get(node.id) ?? { x: width / 2, y: height / 2 };
    return {
      ...node,
      x: p.x,
      y: p.y,
      vx: 0,
      vy: 0,
    } as VisNode;
  });
}

/**
 * Build VisEdge array by resolving source/target node references.
 * Edges referencing nodes not present in the vis node set are dropped.
 */
export function buildVisEdges(edges: GraphEdge[], visNodes: VisNode[]): VisEdge[] {
  const nodeMap = new Map<string, VisNode>(visNodes.map(n => [n.id, n]));
  const result: VisEdge[] = [];
  for (const edge of edges) {
    const src = nodeMap.get(edge.source);
    const tgt = nodeMap.get(edge.target);
    if (src && tgt) {
      result.push({
        id: edge.id,
        sourceId: edge.source,
        targetId: edge.target,
        type: edge.type,
        label: edge.label,
        weight: edge.weight,
        evidence: edge.evidence,
        sourceNode: src,
        targetNode: tgt,
      });
    }
  }
  return result;
}

/**
 * Merge new nodes and edges into an existing vis graph without duplicating
 * entries. Existing node positions are preserved.
 */
export function mergeIntoVisGraph(
  existingNodes: VisNode[],
  existingEdges: VisEdge[],
  newNodes: GraphNode[],
  newEdges: GraphEdge[],
  canvasWidth: number,
  canvasHeight: number,
): { nodes: VisNode[]; edges: VisEdge[] } {
  const existingIds = new Set(existingNodes.map(n => n.id));
  const trulyNew = newNodes.filter(n => !existingIds.has(n.id));

  // Layout only the new nodes, anchored around the canvas centre
  const layouted = computeLayout(trulyNew, [], canvasWidth, canvasHeight);
  const mergedNodes = [...existingNodes, ...layouted];

  const existingEdgeIds = new Set(existingEdges.map(e => e.id));
  const nodeMap = new Map<string, VisNode>(mergedNodes.map(n => [n.id, n]));
  const nodeSet = new Set(mergedNodes.map(n => n.id));

  const mergedEdges = [...existingEdges];
  for (const edge of newEdges) {
    if (existingEdgeIds.has(edge.id)) continue;
    if (!nodeSet.has(edge.source) || !nodeSet.has(edge.target)) continue;
    mergedEdges.push({
      id: edge.id,
      sourceId: edge.source,
      targetId: edge.target,
      type: edge.type,
      label: edge.label,
      weight: edge.weight,
      evidence: edge.evidence,
      sourceNode: nodeMap.get(edge.source)!,
      targetNode: nodeMap.get(edge.target)!,
    });
  }

  return { nodes: mergedNodes, edges: mergedEdges };
}
