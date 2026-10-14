import { KnowledgeGraph, GraphNode, GraphEdge } from '@/types/graph';
import { DependencyPath } from '@/types/impact';

export interface TraversalResult {
  targetNode: GraphNode;
  directDependents: GraphNode[]; // Nodes that directly import or call targetNode
  directDependencies: GraphNode[]; // Nodes that targetNode directly imports or calls
  transitiveConsumers: {
    node: GraphNode;
    path: DependencyPath;
  }[];
  allEdges: GraphEdge[];
}

/**
 * Traverses the knowledge graph to discover direct and transitive reverse dependencies (consumers)
 * with robust cycle detection and path accumulation.
 */
export function traverseImpactPaths(
  graph: KnowledgeGraph,
  targetNodeId: string,
  maxDepth = 5
): TraversalResult {
  const nodeMap = new Map<string, GraphNode>();
  graph.nodes.forEach(n => nodeMap.set(n.id, n));

  const targetNode = nodeMap.get(targetNodeId);
  if (!targetNode) {
    throw new Error(`Target node ${targetNodeId} not found in knowledge graph.`);
  }

  // Build incoming and outgoing adjacency maps
  // edge: source -> target
  // If B imports A, edge is B -> A. B is an incoming consumer of A.
  const incomingEdges = new Map<string, GraphEdge[]>(); // targetId -> edges where target == targetId
  const outgoingEdges = new Map<string, GraphEdge[]>(); // sourceId -> edges where source == sourceId

  for (const edge of graph.edges) {
    if (!incomingEdges.has(edge.target)) {
      incomingEdges.set(edge.target, []);
    }
    incomingEdges.get(edge.target)!.push(edge);

    if (!outgoingEdges.has(edge.source)) {
      outgoingEdges.set(edge.source, []);
    }
    outgoingEdges.get(edge.source)!.push(edge);
  }

  // 1. Direct dependencies: what targetNode depends on (outgoing)
  const directDependencies: GraphNode[] = [];
  const outEdges = outgoingEdges.get(targetNodeId) || [];
  for (const edge of outEdges) {
    const depNode = nodeMap.get(edge.target);
    if (depNode && depNode.id !== targetNodeId) {
      directDependencies.push(depNode);
    }
  }

  // 2. Direct dependents: what directly consumes targetNode (incoming)
  const directDependents: GraphNode[] = [];
  const inEdges = incomingEdges.get(targetNodeId) || [];
  for (const edge of inEdges) {
    const consumerNode = nodeMap.get(edge.source);
    if (consumerNode && consumerNode.id !== targetNodeId) {
      directDependents.push(consumerNode);
    }
  }

  // 3. Transitive consumers using BFS with path tracking & cycle detection
  // Queue items: { currentId: string, pathNodes: GraphNode[], pathEdges: GraphEdge[], depth: number }
  const transitiveConsumers: { node: GraphNode; path: DependencyPath }[] = [];
  const visitedAtMinDepth = new Map<string, number>();
  visitedAtMinDepth.set(targetNodeId, 0);

  // Exclude direct dependents from transitive consumers if already classified, or keep them structured
  const queue: {
    currentNode: GraphNode;
    nodesOnPath: GraphNode[];
    edgesOnPath: GraphEdge[];
    depth: number;
  }[] = [];

  // Seed queue with direct incoming edges
  for (const edge of inEdges) {
    const consumerNode = nodeMap.get(edge.source);
    if (consumerNode && consumerNode.id !== targetNodeId) {
      queue.push({
        currentNode: consumerNode,
        nodesOnPath: [consumerNode, targetNode],
        edgesOnPath: [edge],
        depth: 1,
      });
      visitedAtMinDepth.set(consumerNode.id, 1);
    }
  }

  while (queue.length > 0) {
    const item = queue.shift()!;
    const { currentNode, nodesOnPath, edgesOnPath, depth } = item;

    // Record path
    const pathDescription = nodesOnPath.map(n => n.label).join(' ➔ consumes ➔ ');
    transitiveConsumers.push({
      node: currentNode,
      path: {
        nodes: [...nodesOnPath],
        edges: [...edgesOnPath],
        hops: depth,
        description: pathDescription,
      },
    });

    if (depth >= maxDepth) {
      continue;
    }

    // Look for consumers of currentNode (who consumes currentNode?)
    const nextInEdges = incomingEdges.get(currentNode.id) || [];
    for (const nextEdge of nextInEdges) {
      const parentNode = nodeMap.get(nextEdge.source);
      if (!parentNode) continue;

      // Cycle check: do not visit a node that is already on our current path
      if (nodesOnPath.some(p => p.id === parentNode.id)) {
        continue;
      }

      // Check if visited at an earlier or equal depth
      const existingDepth = visitedAtMinDepth.get(parentNode.id);
      if (existingDepth !== undefined && existingDepth <= depth + 1) {
        continue;
      }

      visitedAtMinDepth.set(parentNode.id, depth + 1);
      queue.push({
        currentNode: parentNode,
        nodesOnPath: [parentNode, ...nodesOnPath],
        edgesOnPath: [nextEdge, ...edgesOnPath],
        depth: depth + 1,
      });
    }
  }

  return {
    targetNode,
    directDependents,
    directDependencies,
    transitiveConsumers,
    allEdges: graph.edges,
  };
}
