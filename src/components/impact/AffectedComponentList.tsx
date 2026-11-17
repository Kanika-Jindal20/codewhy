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
  CheckCircle2,
  Layers
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

  const getSeverityBadge = (severity: ImpactSeverity) => {
    switch (severity) {
      case 'high':
        return <Badge variant="error" size="sm">High Impact</Badge>;
      case 'medium':
        return <Badge variant="warning" size="sm">Medium Impact</Badge>;
      case 'low':
        return <Badge variant="info" size="sm">Low Impact</Badge>;
      default:
        return <Badge variant="outline" size="sm">Info</Badge>;
    }
  };

  const getKindIcon = (kind: string) => {
    switch (kind) {
      case 'direct_dependent':
        return (
          <span className="p-1.5 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </span>
        );
      case 'transitive_consumer':
        return (
          <span className="p-1.5 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
            <GitFork className="w-3.5 h-3.5" />
          </span>
        );
      case 'test_suite':
        return (
          <span className="p-1.5 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
            <TestTube className="w-3.5 h-3.5" />
          </span>
        );
      case 'config_consumer':
        return (
          <span className="p-1.5 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center">
            <Settings className="w-3.5 h-3.5" />
          </span>
        );
      default:
        return (
          <span className="p-1.5 rounded-md bg-surface-muted text-ink-muted flex items-center justify-center">
            <Info className="w-3.5 h-3.5" />
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-border-default rounded-xl p-5 sm:p-6 shadow-xs">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-ink-primary">
              Potentially Affected Components
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-surface-secondary text-ink-muted border border-border-subtle">
              {filtered.length} total
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Click any component to inspect its propagation path, evidence citations, and recommended checks.
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
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                filterKind === tab.id
                  ? 'bg-ink-primary text-white border border-ink-primary'
                  : 'bg-surface-secondary text-ink-muted hover:text-ink-primary border border-border-subtle hover:bg-surface-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-ink-faint bg-surface-secondary rounded-lg border border-dashed border-border-default">
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
                className={`p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-brand-emerald/5 border-brand-emerald ring-1 ring-brand-emerald/30 shadow-xs'
                    : 'bg-white border-border-subtle hover:border-border-default hover:bg-surface-secondary'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="shrink-0 mt-0.5">
                    {getKindIcon(item.impactKind)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-ink-primary font-mono truncate">
                        {item.node.label}
                      </span>
                      <Badge variant="outline" size="sm">
                        {item.node.type}
                      </Badge>
                      {primaryPath && primaryPath.hops > 1 && (
                        <span className="text-[10px] font-mono text-ink-faint bg-surface-muted px-1.5 py-0.5 rounded border border-border-subtle">
                          {primaryPath.hops} hops
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-ink-muted font-mono truncate mt-0.5">
                      {item.node.filePath}
                    </div>
                    <div className="text-xs text-ink-secondary mt-1">
                      {item.severityReason}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
                  {getSeverityBadge(item.severity)}
                  <div className="inline-flex items-center gap-1 text-xs text-brand-deep font-medium hover:underline">
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
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