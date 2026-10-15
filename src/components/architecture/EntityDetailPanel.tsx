'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  GitCommit,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  Expand,
} from 'lucide-react';
import { GraphNode, GraphEdge } from '@/types/graph';
import { VisEdge, NODE_TYPE_COLORS, NODE_TYPE_LABELS, EDGE_TYPE_LABELS, EDGE_TYPE_EXPLANATIONS } from '@/types/architecture';
import { EvidenceSource } from '@/types/evidence';
import { Badge } from '@/components/ui/Badge';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface EntityDetailPanelProps {
  node: GraphNode | null;
  /** All edges in the current vis graph (both directions are checked). */
  edges: VisEdge[];
  allNodes: GraphNode[];
  repoId: string;
  onExpandNeighborhood: (nodeId: string) => void;
  onNavigateToNode: (node: GraphNode) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getNodeBadgeVariant(type: GraphNode['type']): 'default' | 'success' | 'warning' | 'info' | 'purple' | 'error' {
  const map: Record<string, 'default' | 'success' | 'warning' | 'info' | 'purple' | 'error'> = {
    file: 'default', module: 'purple', function: 'success',
    class: 'info', test: 'warning', config: 'default',
    decision: 'error', commit: 'default',
  };
  return map[type] ?? 'default';
}

function confidenceToLevel(score: number): 'high' | 'medium' | 'low' | 'insufficient_evidence' {
  if (score >= 0.9) return 'high';
  if (score >= 0.7) return 'medium';
  if (score >= 0.4) return 'low';
  return 'insufficient_evidence';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const EvidenceSourceItem: React.FC<{ ev: EvidenceSource; idx: number }> = ({ ev, idx }) => {
  const [open, setOpen] = useState(false);
  const isCommit = ev.type === 'commit';
  const isVerified = ev.confidenceScore >= 0.9;

  return (
    <div className="border border-app-border rounded-lg overflow-hidden text-xs">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-app-surface/60 hover:bg-app-surface text-left gap-2"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isCommit
            ? <GitCommit className="w-3 h-3 text-accent-secondary shrink-0" />
            : <FileText className="w-3 h-3 text-text-muted shrink-0" />}
          <span className="text-text-secondary truncate">{ev.title}</span>
          {isVerified
            ? <span title="Verified"><ShieldCheck className="w-3 h-3 text-status-success shrink-0" /></span>
            : <span title="Inferred / lower confidence"><AlertTriangle className="w-3 h-3 text-status-warning shrink-0" /></span>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-text-muted font-mono">{ev.type}</span>
          <ConfidenceBadge score={ev.confidenceScore} level={confidenceToLevel(ev.confidenceScore)} />
          {open ? <ChevronDown className="w-3 h-3 text-text-muted" /> : <ChevronRight className="w-3 h-3 text-text-muted" />}
        </div>
      </button>
      {open && (
        <div className="px-3 py-2 bg-app-bg/60 space-y-1.5">
          {ev.filePath && (
            <div className="font-mono text-[11px] text-text-muted">
              <span className="text-text-secondary">Path:</span>{' '}{ev.filePath}
              {ev.startLine != null && (
                <span className="text-text-muted"> :{ev.startLine}{ev.endLine && ev.endLine !== ev.startLine ? `–${ev.endLine}` : ''}</span>
              )}
            </div>
          )}
          {ev.commitHash && (
            <div className="font-mono text-[11px] text-text-muted">
              <span className="text-text-secondary">Commit:</span>{' '}
              <span className="text-accent-secondary">{ev.commitHash.slice(0, 10)}</span>
              {ev.author && <span className="ml-2 text-text-muted">by {ev.author}</span>}
            </div>
          )}
          {ev.commitMessage && (
            <div className="text-[11px] text-text-muted italic">{ev.commitMessage}</div>
          )}
          {ev.snippet && (
            <pre className="mt-1 p-2 bg-app-panel border border-app-border rounded text-[10px] text-text-secondary overflow-x-auto font-mono">
              {ev.snippet}
            </pre>
          )}
          {ev.timestamp && (
            <div className="text-[10px] text-text-muted">
              {new Date(ev.timestamp).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Relationship item
// ---------------------------------------------------------------------------
interface RelItemProps {
  edge: VisEdge;
  perspectiveNodeId: string;
  allNodes: GraphNode[];
  onNavigate: (node: GraphNode) => void;
}

const RelationshipItem: React.FC<RelItemProps> = ({ edge, perspectiveNodeId, allNodes, onNavigate }) => {
  const [open, setOpen] = useState(false);
  const isOutgoing = edge.sourceId === perspectiveNodeId;
  const otherNodeId = isOutgoing ? edge.targetId : edge.sourceId;
  const otherNode = allNodes.find(n => n.id === otherNodeId);
  const color = otherNode ? NODE_TYPE_COLORS[otherNode.type] : '#78869B';

  const sourceLabel = edge.sourceNode.label;
  const targetLabel = edge.targetNode.label;
  const explanation = EDGE_TYPE_EXPLANATIONS[edge.type]?.(sourceLabel, targetLabel) ?? '';

  const hasEvidence = (edge.evidence?.length ?? 0) > 0;
  const isVerified = edge.evidence?.some(ev => ev.confidenceScore >= 0.9) ?? false;

  return (
    <div className="border border-app-border rounded-lg overflow-hidden text-xs">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-app-surface/40 hover:bg-app-surface text-left gap-2"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-app-bg border border-app-border text-text-muted shrink-0">
            {isOutgoing ? '→' : '←'}
          </span>
          <span className="text-[11px] font-mono text-accent-secondary shrink-0">
            {EDGE_TYPE_LABELS[edge.type]}
          </span>
          {otherNode && (
            <span className="flex items-center gap-1 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              <span className="text-text-primary font-mono truncate">{otherNode.label}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isVerified
            ? <span title="Verified (AST / static analysis)"><ShieldCheck className="w-3 h-3 text-status-success" /></span>
            : <span title="Inferred / heuristic"><AlertTriangle className="w-3 h-3 text-status-warning" /></span>}
          {open ? <ChevronDown className="w-3 h-3 text-text-muted" /> : <ChevronRight className="w-3 h-3 text-text-muted" />}
        </div>
      </button>

      {open && (
        <div className="px-3 py-2.5 bg-app-bg/60 space-y-2">
          {/* Factual explanation */}
          <p className="text-[11px] text-text-secondary leading-relaxed">{explanation}</p>

          {/* Provenance / confidence note */}
          <div className="text-[10px] text-text-muted font-mono flex items-center gap-1.5">
            {isVerified ? (
              <><ShieldCheck className="w-2.5 h-2.5 text-status-success" /> Verified — static analysis / AST</>
            ) : (
              <><AlertTriangle className="w-2.5 h-2.5 text-status-warning" /> Inferred — heuristic correlation</>
            )}
          </div>

          {/* Navigate to other node */}
          {otherNode && (
            <button
              onClick={() => onNavigate(otherNode)}
              className="flex items-center gap-1 text-[11px] text-accent-primary hover:underline font-mono"
            >
              <ArrowUpRight className="w-3 h-3" />
              Explore {otherNode.label}
            </button>
          )}

          {/* Evidence list */}
          {hasEvidence && (
            <div className="space-y-1 pt-1 border-t border-app-border/40">
              <div className="text-[10px] text-text-muted uppercase tracking-wider font-mono mb-1">
                Evidence Sources
              </div>
              {edge.evidence!.map((ev, i) => (
                <EvidenceSourceItem key={ev.id} ev={ev} idx={i} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------
export const EntityDetailPanel: React.FC<EntityDetailPanelProps> = ({
  node,
  edges,
  allNodes,
  repoId,
  onExpandNeighborhood,
  onNavigateToNode,
}) => {
  if (!node) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-app-surface border border-app-border flex items-center justify-center mb-3">
          <FileText className="w-5 h-5 text-text-muted" />
        </div>
        <div className="text-sm font-semibold text-text-secondary mb-1">No entity selected</div>
        <div className="text-xs text-text-muted leading-relaxed">
          Click a node in the graph to inspect its relationships and evidence.
        </div>
      </div>
    );
  }

  const color = NODE_TYPE_COLORS[node.type];
  const nodeEdges = edges.filter(e => e.sourceId === node.id || e.targetId === node.id);
  const commitEvidence = node.evidence?.filter(ev => ev.type === 'commit') ?? [];
  const hasEvidence = (node.evidence?.length ?? 0) > 0;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-app-border space-y-2 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-3 h-3 rounded-full shrink-0 mt-0.5"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            <h3 className="text-sm font-bold text-text-primary font-mono truncate">{node.label}</h3>
          </div>
          <Badge variant={getNodeBadgeVariant(node.type)} size="sm">
            {NODE_TYPE_LABELS[node.type]}
          </Badge>
        </div>

        <div className="font-mono text-[11px] text-text-muted truncate" title={node.filePath}>
          📁 {node.filePath}
          {node.line != null && <span className="text-text-muted">:{node.line}</span>}
        </div>

        {node.description && (
          <p className="text-xs text-text-secondary leading-relaxed">{node.description}</p>
        )}

        {/* Metadata chips */}
        {node.metadata && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {node.metadata.language && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-app-surface border border-app-border rounded text-text-muted">
                {node.metadata.language}
              </span>
            )}
            {node.metadata.loc != null && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-app-surface border border-app-border rounded text-text-muted">
                {node.metadata.loc} LOC
              </span>
            )}
            {node.metadata.isExported && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-status-success/10 border border-status-success/30 rounded text-status-success">
                exported
              </span>
            )}
            {node.metadata.tags?.map(tag => (
              <span key={tag} className="text-[10px] font-mono px-1.5 py-0.5 bg-accent-primary/10 border border-accent-primary/20 rounded text-accent-primary">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Signature */}
        {node.metadata?.signature && (
          <pre className="mt-1 p-2 bg-app-bg border border-app-border rounded text-[10px] font-mono text-text-secondary overflow-x-auto">
            {node.metadata.signature}
          </pre>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Relationships */}
        <section aria-label="Relationships">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted font-mono">
              Relationships ({nodeEdges.length})
            </h4>
            <button
              onClick={() => onExpandNeighborhood(node.id)}
              className="flex items-center gap-1 text-[11px] text-accent-primary hover:underline font-mono"
              title="Load more neighbors"
            >
              <Expand className="w-3 h-3" />
              Expand
            </button>
          </div>

          {nodeEdges.length === 0 ? (
            <div className="p-3 text-center text-xs text-text-muted border border-dashed border-app-border rounded-lg">
              No relationships visible in current viewport.
            </div>
          ) : (
            <div className="space-y-1.5">
              {nodeEdges.map(edge => (
                <RelationshipItem
                  key={edge.id}
                  edge={edge}
                  perspectiveNodeId={node.id}
                  allNodes={allNodes}
                  onNavigate={onNavigateToNode}
                />
              ))}
            </div>
          )}
        </section>

        {/* Node-level evidence */}
        {hasEvidence && (
          <section aria-label="Node evidence sources">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted font-mono mb-2">
              Node Evidence ({node.evidence!.length})
            </h4>
            <div className="space-y-1.5">
              {node.evidence!.map((ev, i) => (
                <EvidenceSourceItem key={ev.id} ev={ev} idx={i} />
              ))}
            </div>
          </section>
        )}

        {/* Related commit history */}
        {commitEvidence.length > 0 && (
          <section aria-label="Related commit history">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted font-mono mb-2">
              Commit History ({commitEvidence.length})
            </h4>
            <div className="space-y-1.5">
              {commitEvidence.map(ev => (
                <div key={ev.id} className="flex items-start gap-2 p-2.5 bg-app-surface/40 border border-app-border rounded-lg text-xs">
                  <GitCommit className="w-3 h-3 text-accent-secondary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    {ev.commitHash && (
                      <span className="font-mono text-[10px] text-accent-secondary mr-2">
                        {ev.commitHash.slice(0, 10)}
                      </span>
                    )}
                    {ev.commitMessage && (
                      <span className="text-text-secondary">{ev.commitMessage}</span>
                    )}
                    {ev.author && (
                      <div className="text-[10px] text-text-muted mt-0.5">{ev.author}</div>
                    )}
                    {ev.timestamp && (
                      <div className="text-[10px] text-text-muted">
                        {new Date(ev.timestamp).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Action links */}
        <section className="pt-2 border-t border-app-border space-y-2" aria-label="Navigation actions">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted font-mono mb-2">
            Navigate To
          </h4>
          <Link
            href={`/impact?repoId=${encodeURIComponent(repoId)}&targetNodeId=${encodeURIComponent(node.id)}`}
            className="flex items-center gap-2 text-xs text-accent-primary hover:underline font-mono"
          >
            <ExternalLink className="w-3 h-3" />
            Run Impact Analysis on {node.label}
          </Link>
        </section>

        {/* Explainability disclaimer */}
        <div className="p-2.5 bg-status-info/5 border border-status-info/20 rounded-lg text-[10px] text-text-muted leading-relaxed">
          <ShieldCheck className="w-3 h-3 text-status-info inline mr-1" />
          Relationships are derived from static AST analysis, import declarations, or Git history.
          Co-occurrence in commit history is a statistical observation — it does not imply architectural dependency.
        </div>
      </div>
    </div>
  );
};
