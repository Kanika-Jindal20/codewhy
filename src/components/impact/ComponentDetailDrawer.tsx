'use client';

import React from 'react';
import { X, ShieldAlert, GitCommit, FileCode, CheckSquare, ArrowRight, CornerDownRight } from 'lucide-react';
import { AffectedComponent } from '@/types/impact';
import { EvidenceCard } from '@/components/evidence/EvidenceCard';
import { Badge } from '@/components/ui/Badge';

interface ComponentDetailDrawerProps {
  component: AffectedComponent | null;
  onClose: () => void;
}

export const ComponentDetailDrawer: React.FC<ComponentDetailDrawerProps> = ({
  component,
  onClose,
}) => {
  if (!component) return null;

  const { node, impactKind, severity, severityReason, paths, evidence, recommendedChecks } = component;
  const primaryPath = paths[0];

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-app-panel border-l border-app-border shadow-2xl z-50 flex flex-col">
      {/* Drawer Header */}
      <div className="h-16 px-6 border-b border-app-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <FileCode className="w-5 h-5 text-accent-primary" />
          <div>
            <h3 className="text-sm font-bold text-text-primary font-mono truncate max-w-[320px]">
              {node.label}
            </h3>
            <span className="text-[11px] text-text-muted font-mono block truncate">
              {node.filePath}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-app-surface transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Severity & Scoring Explanation */}
        <div className="bg-white border border-app-border rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-secondary">
              Assigned Severity Level
            </span>
            <Badge
              variant={severity === 'high' ? 'error' : severity === 'medium' ? 'warning' : 'info'}
              size="sm"
            >
              {severity.toUpperCase()} IMPACT
            </Badge>
          </div>
          <div className="text-xs text-text-primary font-medium mb-1">
            Scoring Rationale:
          </div>
          <p className="text-xs text-text-secondary leading-relaxed font-sans">
            {severityReason}
          </p>
        </div>

        {/* Relationship Propagation Path */}
        <div>
          <h4 className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-1.5">
            <CornerDownRight className="w-3.5 h-3.5 text-accent-secondary" />
            Dependency Propagation Path
          </h4>
          <div className="bg-white border border-app-border rounded-xl p-4 font-mono text-xs shadow-2xs">
            {primaryPath ? (
              <div className="space-y-2">
                <div className="text-[11px] text-accent-secondary font-semibold">
                  Chain ({primaryPath.hops} {primaryPath.hops === 1 ? 'hop' : 'hops'}):
                </div>
                <div className="flex flex-col gap-1.5 pl-2 border-l-2 border-accent-primary/40">
                  {primaryPath.nodes.map((n, idx) => (
                    <div key={n.id} className="flex items-center gap-2">
                      <span className="text-[10px] text-text-muted">{idx + 1}.</span>
                      <span className={`truncate ${idx === 0 ? 'text-accent-primary font-bold' : idx === primaryPath.nodes.length - 1 ? 'text-status-error font-bold' : 'text-text-secondary'}`}>
                        {n.label}
                      </span>
                      <span className="text-[10px] text-text-muted">({n.type})</span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-text-muted mt-2 pt-2 border-t border-app-border/60">
                  Semantics: {primaryPath.description}
                </div>
              </div>
            ) : (
              <div className="text-text-muted">No explicit graph path recorded.</div>
            )}
          </div>
        </div>

        {/* Recommended Verification Checks */}
        <div>
          <h4 className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-status-success" />
            Recommended Pre-Commit Checks
          </h4>
          <div className="space-y-2">
            {recommendedChecks.map((check, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-3 rounded-lg bg-white border border-app-border text-xs text-text-secondary shadow-2xs"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-app-border text-accent-primary focus:ring-accent-primary"
                />
                <span className="leading-snug">{check}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Verifiable Evidence Cards */}
        <div>
          <h4 className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-accent-primary" />
            Verifiable Evidence ({evidence.length})
          </h4>
          <div className="space-y-3">
            {evidence.length === 0 ? (
              <div className="p-4 text-center text-xs text-text-muted border border-dashed border-app-border rounded-xl bg-white">
                No direct file span or commit evidence attached to this relationship.
              </div>
            ) : (
              evidence.map((ev) => (
                <EvidenceCard key={ev.id} evidence={ev} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
