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

  const getSeverityBadge = (severity: ImpactSeverity, reason: string) => {
    switch (severity) {
      case 'high':
        return (
          <span 
            title={reason}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-700 border border-red-300 shadow-xs"
          >
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            High Impact
          </span>
        );
      case 'medium':
        return (
          <span 
            title={reason}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Medium Impact
          </span>
        );
      case 'low':
        return (
          <span 
            title={reason}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-700 border border-blue-300 shadow-xs"
          >
            <Info className="w-3.5 h-3.5 text-blue-600" />
            Low Impact
          </span>
        );
      default:
        return (
          <span 
            title={reason}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Info
          </span>
        );
    }
  };

  const getKindIcon = (kind: string) => {
    switch (kind) {
      case 'direct_dependent':
        return (
          <span className="p-2 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
            <ArrowRightLeft className="w-4 h-4" />
          </span>
        );
      case 'transitive_consumer':
        return (
          <span className="p-2 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <GitFork className="w-4 h-4" />
          </span>
        );
      case 'test_suite':
        return (
          <span className="p-2 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <TestTube className="w-4 h-4" />
          </span>
        );
      case 'config_consumer':
        return (
          <span className="p-2 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Settings className="w-4 h-4" />
          </span>
        );
      default:
        return (
          <span className="p-2 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Info className="w-4 h-4" />
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-red-100 rounded-2xl p-5 sm:p-6 shadow-lg">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-red-100 text-red-600 font-bold">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className="text-base font-extrabold text-gray-900">
              Potentially Affected Components
              <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs bg-red-50 text-red-700 border border-red-200">
                {filtered.length} total
              </span>
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Click any component to inspect its propagation path, evidence citations, and recommended verification steps.
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterKind === tab.id
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            No affected components found in this category.
          </div>
        ) : (
          filtered.map((item) => {
            const isSelected = item.node.id === selectedComponentId;
            const primaryPath = item.paths[0];
            const severityBorder =
              item.severity === 'high'
                ? 'border-l-red-500'
                : item.severity === 'medium'
                ? 'border-l-amber-500'
                : 'border-l-blue-500';

            return (
              <div
                key={item.node.id}
                onClick={() => onSelectComponent(item)}
                className={`p-4 rounded-2xl border border-l-4 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:shadow-md ${severityBorder} ${
                  isSelected
                    ? 'bg-red-50/60 border-red-300 ring-2 ring-red-400/20'
                    : 'bg-white border-gray-200 hover:border-red-200 hover:bg-red-50/20'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="shrink-0 mt-0.5">
                    {getKindIcon(item.impactKind)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-extrabold text-gray-900 font-mono truncate">
                        {item.node.label}
                      </span>
                      <Badge variant="outline" size="sm">
                        {item.node.type}
                      </Badge>
                      {primaryPath && primaryPath.hops > 1 && (
                        <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200 font-bold">
                          {primaryPath.hops} hops away
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 font-mono truncate mt-0.5">
                      {item.node.filePath}
                    </div>
                    <div className="text-xs text-gray-700 mt-1 font-medium">
                      {item.severityReason}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  {getSeverityBadge(item.severity, item.severityReason)}
                  <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors">
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
