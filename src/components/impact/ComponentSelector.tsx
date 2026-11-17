'use client';

import React, { useState } from 'react';
import { Search, FileCode, Box, Cpu, TestTube, Settings } from 'lucide-react';
import { GraphNode } from '@/types/graph';
import { Badge } from '@/components/ui/Badge';

interface ComponentSelectorProps {
  nodes: GraphNode[];
  selectedNodeId?: string;
  onSelectNode: (node: GraphNode) => void;
}

export const ComponentSelector: React.FC<ComponentSelectorProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredNodes = nodes.filter((node) => {
    const matchesSearch = 
      node.label.toLowerCase().includes(search.toLowerCase()) ||
      node.filePath.toLowerCase().includes(search.toLowerCase());

    if (filterType === 'all') return matchesSearch;
    return matchesSearch && node.type === filterType;
  });

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'file': return <FileCode className="w-3.5 h-3.5 text-ink-muted" />;
      case 'function': return <Cpu className="w-3.5 h-3.5 text-brand-deep" />;
      case 'class': return <Box className="w-3.5 h-3.5 text-ink-muted" />;
      case 'test': return <TestTube className="w-3.5 h-3.5 text-amber-600" />;
      case 'config': return <Settings className="w-3.5 h-3.5 text-ink-muted" />;
      default: return <FileCode className="w-3.5 h-3.5 text-ink-muted" />;
    }
  };

  return (
    <div className="bg-white border border-border-default rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-surface-muted text-ink-muted text-xs font-mono font-medium">1</span>
            <h2 className="text-sm font-semibold text-ink-primary">
              Target Component
            </h2>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Choose a symbol or file to simulate blast radius & architectural impact
          </p>
        </div>
        <span className="text-[11px] font-mono text-ink-faint px-2 py-0.5 rounded bg-surface-secondary border border-border-subtle self-start sm:self-auto">
          {filteredNodes.length} symbols
        </span>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 text-ink-faint absolute left-3 top-2.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by file or symbol name..."
          className="w-full bg-surface-secondary border border-border-default rounded-lg pl-9 pr-3 py-1.5 text-xs text-ink-primary placeholder:text-ink-faint focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/20 focus:bg-white transition-all font-mono"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 text-xs">
        {['all', 'file', 'function', 'config', 'test'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-all ${
              filterType === type
                ? 'bg-ink-primary text-white border border-ink-primary'
                : 'bg-surface-secondary text-ink-muted hover:text-ink-primary border border-border-subtle hover:bg-surface-muted'
            }`}
          >
            {type === 'all' ? 'All' : type}
          </button>
        ))}
      </div>

      {/* Component List */}
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {filteredNodes.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-faint bg-surface-secondary rounded-lg border border-dashed border-border-default">
            No components match &ldquo;{search}&rdquo;
          </div>
        ) : (
          filteredNodes.map((node) => {
            const isSelected = node.id === selectedNodeId;

            return (
              <button
                key={node.id}
                onClick={() => onSelectNode(node)}
                className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-brand-emerald/5 border-brand-emerald ring-1 ring-brand-emerald/30 shadow-xs'
                    : 'bg-white border-border-subtle hover:border-border-default hover:bg-surface-secondary'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className={`p-1.5 rounded shrink-0 mt-0.5 ${
                    isSelected ? 'bg-brand-emerald/10 text-brand-deep' : 'bg-surface-muted text-ink-muted'
                  }`}>
                    {getNodeIcon(node.type)}
                  </span>
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-medium text-ink-primary truncate">
                      {node.label}
                    </div>
                    <div className="font-mono text-[11px] text-ink-muted truncate mt-0.5">
                      {node.filePath}
                      {node.line ? `:${node.line}` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant={isSelected ? 'success' : 'outline'} size="sm">{node.type}</Badge>
                  {node.metadata?.isExported && (
                    <Badge variant="purple" size="sm">exported</Badge>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};