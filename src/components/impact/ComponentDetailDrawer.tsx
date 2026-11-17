'use client';

import React from 'react';
import { X, ShieldAlert, GitCommit, FileCode, CheckSquare, CornerDownRight } from 'lucide-react';
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
    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white border-l border-border-default shadow-2xl z-50 flex flex-col">
      {/* Drawer Header */}
      <div className="h-14 px-5 border-b border-border-default flex items-center justify-between shrink-0 bg-surface-secondary">
        <div className="flex items-center gap-2.5 min-w-0">
          <FileCode className="w-4 h-4 text-brand-deep shrink-0" />
          <div className="min-w-0">
            <h3 className="text-xs font-semibold text-ink-primary font-mono truncate max-w-[340px]">
              {node.label}
            </h3>
            <span className="text-[11px] text-ink-muted font-mono block truncate">
              {node.filePath}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-ink-muted hover:text-ink-primary hover:bg-surface-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Severity & Scoring Explanation */}
        <div className="bg-surface-secondary border border-border-subtle rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-ink-muted">
              Assigned Severity Level
            </span>
            <Badge
              variant={severity === 'high' ? 'error' : severity === 'medium' ? 'warning' : 'info'}
              size="sm"
            >
              {severity.toUpperCase()} IMPACT
            </Badge>
          </div>
          <div className="text-xs text-ink-primary font-medium mb-1">
            Scoring Rationale:
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            {severityReason}
          </p>
        </div>

        {/* Relationship Propagation Path */}
        <div>
          <h4 className="text-xs font-semibold text-ink-primary mb-2 flex items-center gap-1.5">
            <CornerDownRight className="w-3.5 h-3.5 text-brand-deep" />
            Dependency Propagation Path
          </h4>
          <div className="bg-surface-secondary border border-border-subtle rounded-lg p-3.5 font-mono text-xs">
            {primaryPath ? (
              <div className="space-y-2">
                <div className="text-[11px] text-ink-muted font-medium">
                  Chain ({primaryPath.hops} {primaryPath.hops === 1 ? 'hop' : 'hops'}):
                </div>
                <div className="flex flex-col gap-1.5 pl-2 border-l-2 border-brand-emerald">
                  {primaryPath.nodes.map((n, idx) => (
                    <div key={n.id} className="flex items-center gap-2">
                      <span className="text-[10px] text-ink-faint">{idx + 1}.</span>
                      <span className={`truncate ${idx === 0 ? 'text-brand-deep font-semibold' : idx === primaryPath.nodes.length - 1 ? 'text-rose-600 font-semibold' : 'text-ink-secondary'}`}>
                        {n.label}
                      </span>
                      <span className="text-[10px] text-ink-faint">({n.type})</span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-ink-faint mt-2 pt-2 border-t border-border-subtle">
                  Semantics: {primaryPath.description}
                </div>
              </div>
            ) : (
              <div className="text-ink-faint">No explicit graph path recorded.</div>
            )}
          </div>
        </div>

        {/* Recommended Verification Checks */}
        <div>
          <h4 className="text-xs font-semibold text-ink-primary mb-2 flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-brand-deep" />
            Recommended Pre-Commit Checks
          </h4>
          <div className="space-y-1.5">
            {recommendedChecks.map((check, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface-secondary border border-border-subtle text-xs text-ink-secondary"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-border-default text-brand-deep focus:ring-brand-emerald"
                />
                <span className="leading-snug">{check}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Verifiable Evidence Cards */}
        <div>
          <h4 className="text-xs font-semibold text-ink-primary mb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-brand-deep" />
            Verifiable Evidence ({evidence.length})
          </h4>
          <div className="space-y-2.5">
            {evidence.length === 0 ? (
              <div className="p-4 text-center text-xs text-ink-faint border border-dashed border-border-default rounded-lg bg-surface-secondary">
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