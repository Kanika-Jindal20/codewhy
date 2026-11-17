'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  GitCommit,
  ShieldCheck,
  AlertTriangle,
  Zap,
  HelpCircle,
  Expand,
  FileCode,
  CornerDownRight,
} from 'lucide-react';
import { GraphNode } from '@/types/graph';
import { VisEdge, NODE_TYPE_LABELS, EDGE_TYPE_LABELS } from '@/types/architecture';
import { EvidenceSource } from '@/types/evidence';
import { Badge } from '@/components/ui/Badge';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { Button } from '@/components/ui/Button';

interface EntityDetailPanelProps {
  node: GraphNode | null;
  edges: VisEdge[];
  allNodes: GraphNode[];
  repoId: string;
  onExpandNeighborhood: (nodeId: string) => void;
  onNavigateToNode: (node: GraphNode) => void;
}

function confidenceToLevel(score: number): 'high' | 'medium' | 'low' | 'insufficient_evidence' {
  if (score >= 0.9) return 'high';
  if (score >= 0.7) return 'medium';
  if (score >= 0.4) return 'low';
  return 'insufficient_evidence';
}

const EvidenceItem: React.FC<{ ev: EvidenceSource }> = ({ ev }) => {
  const [open, setOpen] = useState(false);
  const isCommit = ev.type === 'commit';
  const isVerified = ev.confidenceScore >= 0.9;

  return (
    <div className="border border-[#EDEDED] rounded-[6px] overflow-hidden text-xs bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#FAFAFA] text-left gap-2 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isCommit ? (
            <GitCommit className="w-3.5 h-3.5 text-[#707070] shrink-0" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-[#707070] shrink-0" />
          )}
          <span className="text-[#171717] font-medium truncate">{ev.title}</span>
          {isVerified ? (
            <ShieldCheck className="w-3 h-3 text-[#10B981] shrink-0" />
          ) : (
            <AlertTriangle className="w-3 h-3 text-[#F59E0B] shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono text-[#9A9A9A] uppercase">{ev.type}</span>
          <ConfidenceBadge score={ev.confidenceScore} level={confidenceToLevel(ev.confidenceScore)} />
          {open ? <ChevronDown className="w-3 h-3 text-[#707070]" /> : <ChevronRight className="w-3 h-3 text-[#707070]" />}
        </div>
      </button>

      {open && (
        <div className="px-3 py-2 bg-[#FAFAFA] border-t border-[#EDEDED] space-y-1.5 text-[11px] text-[#707070]">
          {ev.filePath && (
            <div className="font-mono truncate">
              Path: <span className="text-[#171717]">{ev.filePath}</span>
              {ev.startLine != null && (
                <span> #{ev.startLine}{ev.endLine ? `-${ev.endLine}` : ''}</span>
              )}
            </div>
          )}
          {ev.commitHash && (
            <div className="font-mono">
              Commit: <span className="text-[#171717]">{ev.commitHash.slice(0, 7)}</span>
              {ev.author && <span className="ml-2">by {ev.author}</span>}
            </div>
          )}
          {ev.snippet && (
            <pre className="font-mono text-[10px] p-2 bg-white rounded border border-[#EDEDED] overflow-x-auto text-[#171717]">
              <code>{ev.snippet}</code>
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

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
      <div className="p-6 bg-white border border-[#EDEDED] rounded-[12px] text-center text-xs text-[#707070] shadow-2xs">
        Select any node in the graph to inspect metadata, call hierarchies, and evidence citations.
      </div>
    );
  }

  const incomingEdges = edges.filter((e) => e.targetId === node.id);
  const outgoingEdges = edges.filter((e) => e.sourceId === node.id);

  return (
    <div className="bg-white border border-[#EDEDED] rounded-[12px] p-5 shadow-2xs space-y-5">
      {/* Node Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <Badge variant="default" size="xs">
            {NODE_TYPE_LABELS[node.type] || node.type}
          </Badge>
          <span className="font-mono text-[11px] text-[#9A9A9A]">{node.id}</span>
        </div>
        <h3 className="text-base font-semibold text-[#171717] tracking-tight">{node.label}</h3>
        <div className="font-mono text-xs text-[#707070] truncate mt-0.5">{node.filePath}</div>
        {node.description && (
          <p className="text-xs text-[#707070] mt-2 leading-relaxed">{node.description}</p>
        )}
      </div>

      {/* Upstream Callers */}
      <div className="space-y-1.5 pt-3 border-t border-[#EDEDED]">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#707070]">
          <span>Incoming Callers ({incomingEdges.length})</span>
        </div>
        {incomingEdges.length === 0 ? (
          <div className="text-xs text-[#9A9A9A] italic">No incoming callers recorded</div>
        ) : (
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {incomingEdges.map((e) => (
              <div
                key={e.id}
                onClick={() => onNavigateToNode(e.sourceNode)}
                className="flex items-center justify-between p-2 rounded-[6px] bg-[#FAFAFA] hover:bg-[#F4F4F5] border border-[#EDEDED] text-xs cursor-pointer transition-colors"
              >
                <span className="font-mono text-[11px] text-[#171717] truncate">{e.sourceNode.label}</span>
                <span className="text-[10px] text-[#707070] font-mono">{EDGE_TYPE_LABELS[e.type] || e.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Downstream Dependencies */}
      <div className="space-y-1.5 pt-3 border-t border-[#EDEDED]">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#707070]">
          <span>Outgoing Dependencies ({outgoingEdges.length})</span>
        </div>
        {outgoingEdges.length === 0 ? (
          <div className="text-xs text-[#9A9A9A] italic">No outgoing dependencies recorded</div>
        ) : (
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {outgoingEdges.map((e) => (
              <div
                key={e.id}
                onClick={() => onNavigateToNode(e.targetNode)}
                className="flex items-center justify-between p-2 rounded-[6px] bg-[#FAFAFA] hover:bg-[#F4F4F5] border border-[#EDEDED] text-xs cursor-pointer transition-colors"
              >
                <span className="font-mono text-[11px] text-[#171717] truncate">{e.targetNode.label}</span>
                <span className="text-[10px] text-[#707070] font-mono">{EDGE_TYPE_LABELS[e.type] || e.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evidence Citations */}
      {node.evidence && node.evidence.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-[#EDEDED]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#707070] block">
            Supporting Evidence ({node.evidence.length})
          </span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {node.evidence.map((ev, idx) => (
              <EvidenceItem key={idx} ev={ev} />
            ))}
          </div>
        </div>
      )}

      {/* Action Tray */}
      <div className="pt-3 border-t border-[#EDEDED] space-y-2">
        <Link href={`/impact?repoId=${repoId}&targetNodeId=${node.id}`}>
          <Button variant="primary" size="sm" icon={<Zap className="w-3.5 h-3.5" />} fullWidth>
            Analyze Impact Radius
          </Button>
        </Link>
        <Link href={`/ask?repoId=${repoId}&question=Why%20was%20${encodeURIComponent(node.label)}%20architected%20this%20way?`}>
          <Button variant="secondary" size="sm" icon={<HelpCircle className="w-3.5 h-3.5" />} fullWidth>
            Ask Why on this Component
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onExpandNeighborhood(node.id)}
          icon={<Expand className="w-3.5 h-3.5" />}
          fullWidth
        >
          Expand 1-Hop Neighborhood
        </Button>
      </div>
    </div>
  );
};
