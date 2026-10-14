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
      case 'file': return <FileCode className="w-4 h-4 text-accent-primary" />;
      case 'function': return <Cpu className="w-4 h-4 text-accent-secondary" />;
      case 'class': return <Box className="w-4 h-4 text-status-info" />;
      case 'test': return <TestTube className="w-4 h-4 text-status-warning" />;
      case 'config': return <Settings className="w-4 h-4 text-text-muted" />;
      default: return <FileCode className="w-4 h-4 text-text-muted" />;
    }
  };

  return (
    <div className="bg-app-panel border border-app-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          1. Select Target Component to Modify
        </label>
        <span className="text-xs text-text-muted font-mono">
          {filteredNodes.length} symbols found
        </span>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by file path or symbol name (e.g. jwt.ts, paymentService)..."
          className="w-full bg-app-surface border border-app-border rounded-md pl-9 pr-3 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 text-[11px]">
        {['all', 'file', 'function', 'config', 'test'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-2.5 py-1 rounded capitalize font-medium transition-colors ${
              filterType === type
                ? 'bg-accent-primary text-white'
                : 'bg-app-surface text-text-muted hover:text-text-primary border border-app-border/60'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Component List */}
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {filteredNodes.length === 0 ? (
          <div className="py-6 text-center text-xs text-text-muted">
            No components match &ldquo;{search}&rdquo;
          </div>
        ) : (
          filteredNodes.map((node) => {
            const isSelected = node.id === selectedNodeId;

            return (
              <button
                key={node.id}
                onClick={() => onSelectNode(node)}
                className={`w-full text-left p-2.5 rounded-md border transition-all flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-accent-primary/10 border-accent-primary shadow-sm'
                    : 'bg-app-surface/60 border-app-border hover:border-text-muted hover:bg-app-surface'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="mt-0.5 shrink-0">{getNodeIcon(node.type)}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-text-primary font-mono truncate">
                      {node.label}
                    </div>
                    <div className="text-[11px] text-text-muted font-mono truncate">
                      {node.filePath}
                      {node.line ? `:${node.line}` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline" size="sm">{node.type}</Badge>
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
