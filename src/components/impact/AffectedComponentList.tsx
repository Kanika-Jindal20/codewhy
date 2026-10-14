'use client';

import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  GitFork, 
  TestTube, 
  Settings, 
  ChevronRight, 
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2 
} from 'lucide-react';
import { AffectedComponent, ImpactSeverity } from '@/types/impact';
import { Badge } from '@/components/ui/Badge';

interface AffectedComponentListProps {
  components: AffectedComponent[];
  selectedComponentId?: string;
  onSelectComponent: (comp: AffectedComponent) => void;
}

export const AffectedComponentList: React.FC<AffectedComponentListProps> = ({
  components,
  selectedComponentId,
  onSelectComponent,
}) => {
  const [filterKind, setFilterKind] = useState<string>('all');

  const filtered = components.filter((c) => {
    if (filterKind === 'all') return true;
    return c.impactKind === filterKind;
  });

  const getSeverityBadge = (severity: ImpactSeverity, reason: string) => {
    switch (severity) {
      case 'high':
        return (
          <span 
            title={reason}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-status-error/15 text-status-error border border-status-error/30"
          >
            <AlertCircle className="w-3 h-3" />
            High Impact
          </span>
        );
      case 'medium':
        return (
          <span 
            title={reason}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-status-warning/15 text-status-warning border border-status-warning/30"
          >
            <AlertTriangle className="w-3 h-3" />
            Medium Impact
          </span>
        );
      case 'low':
        return (
          <span 
            title={reason}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-status-info/15 text-status-info border border-status-info/30"
          >
            <Info className="w-3 h-3" />
            Low Impact
          </span>
        );
      default:
        return (
          <span 
            title={reason}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-app-surface text-text-muted border border-app-border"
          >
            <CheckCircle2 className="w-3 h-3" />
            Info
          </span>
        );
    }
  };

  const getKindIcon = (kind: string) => {
    switch (kind) {
      case 'direct_dependent': return <ArrowRightLeft className="w-3.5 h-3.5 text-status-error" />;
      case 'transitive_consumer': return <GitFork className="w-3.5 h-3.5 text-accent-secondary" />;
      case 'test_suite': return <TestTube className="w-3.5 h-3.5 text-status-warning" />;
      case 'config_consumer': return <Settings className="w-3.5 h-3.5 text-text-muted" />;
      default: return <Info className="w-3.5 h-3.5 text-accent-primary" />;
    }
  };

  return (
    <div className="bg-app-panel border border-app-border rounded-lg p-4">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            Potentially Affected Components ({filtered.length})
          </h3>
          <p className="text-[11px] text-text-muted">
            Click any component to inspect its dependency path, evidence citations, and recommended checks.
          </p>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'direct_dependent', label: 'Direct' },
            { id: 'transitive_consumer', label: 'Transitive' },
            { id: 'test_suite', label: 'Tests' },
            { id: 'config_consumer', label: 'Configs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterKind(tab.id)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                filterKind === tab.id
                  ? 'bg-accent-primary text-white'
                  : 'bg-app-surface text-text-muted hover:text-text-primary border border-app-border/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted">
            No affected components found in this category.
          </div>
        ) : (
          filtered.map((item) => {
            const isSelected = item.node.id === selectedComponentId;
            const primaryPath = item.paths[0];

            return (
              <div
                key={item.node.id}
                onClick={() => onSelectComponent(item)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-accent-primary/10 border-accent-primary ring-1 ring-accent-primary/40'
                    : 'bg-app-surface/50 border-app-border hover:bg-app-surface hover:border-text-muted'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="p-1.5 rounded bg-app-panel border border-app-border mt-0.5 shrink-0">
                    {getKindIcon(item.impactKind)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-text-primary font-mono truncate">
                        {item.node.label}
                      </span>
                      <Badge variant="outline" size="sm">
                        {item.node.type}
                      </Badge>
                      {primaryPath && primaryPath.hops > 1 && (
                        <span className="text-[10px] font-mono text-text-muted bg-app-bg px-1.5 py-0.5 rounded border border-app-border/60">
                          {primaryPath.hops} hops
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-text-muted font-mono truncate mt-0.5">
                      {item.node.filePath}
                    </div>
                    <div className="text-[11px] text-text-secondary mt-1">
                      {item.severityReason}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  {getSeverityBadge(item.severity, item.severityReason)}
                  <div className="flex items-center text-xs text-accent-primary font-medium hover:underline">
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
