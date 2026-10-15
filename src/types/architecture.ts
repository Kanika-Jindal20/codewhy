import { NodeType, EdgeType } from './graph';

/**
 * Result returned by the /api/graph endpoint for scoped queries.
 * Never represents the entire repository graph.
 */
export interface GraphQueryResult {
  nodes: import('./graph').GraphNode[];
  edges: import('./graph').GraphEdge[];
  /** Total node count in the repository (not the returned subset). */
  totalNodes: number;
  /** True when the result was capped by the per-query limit. */
  truncated: boolean;
  queryType: 'neighborhood' | 'search' | 'meta';
}

/**
 * A graph node augmented with 2-D layout coordinates produced by the
 * force-directed layout engine.
 */
export interface VisNode {
  id: string;
  label: string;
  type: NodeType;
  filePath: string;
  line?: number;
  description?: string;
  metadata?: import('./graph').GraphNode['metadata'];
  evidence?: import('./evidence').EvidenceSource[];
  /** Canvas X position (pixels, in SVG coordinate space). */
  x: number;
  /** Canvas Y position (pixels, in SVG coordinate space). */
  y: number;
  /** Internal: velocity X for force simulation. */
  vx: number;
  /** Internal: velocity Y for force simulation. */
  vy: number;
}

/**
 * A graph edge with resolved source/target VisNode references.
 * Used for SVG rendering — avoids repeated Map lookups per frame.
 */
export interface VisEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: import('./graph').EdgeType;
  label?: string;
  weight?: number;
  evidence?: import('./evidence').EvidenceSource[];
  sourceNode: VisNode;
  targetNode: VisNode;
}

/** Active filter state for the explorer viewport. */
export interface FilterState {
  /** Set of node types currently visible. Empty set = all visible. */
  nodeTypes: Set<NodeType>;
  /** Set of edge types currently visible. Empty set = all visible. */
  edgeTypes: Set<EdgeType>;
}

/** View mode for the architecture explorer. */
export type ExplorerView = 'graph' | 'table';

/** A single entry in the breadcrumb navigation trail. */
export interface BreadcrumbEntry {
  nodeId: string;
  label: string;
  type: NodeType;
  filePath: string;
}

/** Supported sort columns for the table view. */
export type TableSortKey = 'label' | 'type' | 'filePath' | 'edgeCount';

/** Node type color palette, aligned with CodeWhy's global theme. */
export const NODE_TYPE_COLORS: Record<NodeType, string> = {
  file:     '#6485F5', // accent-primary
  module:   '#9B8AFB', // accent-secondary
  function: '#35B88A', // status-success
  class:    '#64B5F6', // status-info
  test:     '#E7B65C', // status-warning
  config:   '#78869B', // text-muted
  decision: '#F07878', // status-error
  commit:   '#A7B2C4', // text-secondary
};

/** Human-readable labels for node types. */
export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  file:     'File',
  module:   'Module',
  function: 'Function',
  class:    'Class',
  test:     'Test',
  config:   'Config',
  decision: 'Decision',
  commit:   'Commit',
};

/** Human-readable labels for edge types. */
export const EDGE_TYPE_LABELS: Record<EdgeType, string> = {
  imports:     'Imports',
  calls:       'Calls',
  extends:     'Extends',
  implements:  'Implements',
  tests:       'Tests',
  configures:  'Configures',
  co_changed:  'Co-Changed',
  supersedes:  'Supersedes',
};

/**
 * Factual explanation templates for each edge type.
 * These describe what a relationship means — never implying causality.
 */
export const EDGE_TYPE_EXPLANATIONS: Record<EdgeType, (sourceLabel: string, targetLabel: string) => string> = {
  imports:    (s, t) => `"${s}" statically imports one or more exported symbols from "${t}" via an ES module import declaration.`,
  calls:      (s, t) => `"${s}" invokes a function or method exported by "${t}" at runtime.`,
  extends:    (s, t) => `"${s}" extends the class "${t}", inheriting its interface and behaviour.`,
  implements: (s, t) => `"${s}" implements the interface or abstract contract defined in "${t}".`,
  tests:      (s, t) => `"${s}" is a test suite that exercises "${t}" through assertions and coverage.`,
  configures: (s, t) => `"${s}" reads or references configuration values defined in "${t}".`,
  co_changed: (s, t) => `"${s}" and "${t}" have historically been modified together in the same commits. This is a statistical observation, not a structural dependency.`,
  supersedes: (s, t) => `"${s}" replaces or deprecates "${t}" according to a recorded decision or migration event.`,
};
