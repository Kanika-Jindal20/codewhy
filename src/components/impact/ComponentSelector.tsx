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
    <div className="bg-white border border-app-border rounded-2xl p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-app-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#E5EDFF] text-[#4169E1] text-xs font-bold">1</span>
            <h2 className="text-sm font-bold text-[#25324B]">
              Select Target Component
            </h2>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Choose any symbol, function, or source file to simulate blast radius & architectural impact
          </p>
        </div>
        <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-[#F8FAFC] border border-app-border text-text-secondary self-start sm:self-auto">
          {filteredNodes.length} symbols discovered
        </span>
      </div>

      {/* Search Input */}
      <div className="relative mb-3.5">
        <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by file path or symbol name (e.g. jwt.ts, paymentService)..."
          className="w-full bg-[#F8FAFC] border border-app-border rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/15 focus:bg-white transition-all shadow-2xs font-mono"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-3.5 overflow-x-auto pb-1 text-xs">
        {['all', 'file', 'function', 'config', 'test'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition-all ${
              filterType === type
                ? 'bg-[#E5EDFF] text-[#4169E1] border border-[#C9D9FF] shadow-2xs'
                : 'bg-white text-text-secondary hover:text-text-primary border border-app-border hover:bg-[#F8FAFC]'
            }`}
          >
            {type === 'all' ? 'All Types' : type}
          </button>
        ))}
      </div>

      {/* Component List */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {filteredNodes.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted bg-[#F8FAFC] rounded-xl border border-dashed border-app-border">
            No components match &ldquo;{search}&rdquo;
          </div>
        ) : (
          filteredNodes.map((node) => {
            const isSelected = node.id === selectedNodeId;

            return (
              <button
                key={node.id}
                onClick={() => onSelectNode(node)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#E5EDFF] border-[#4169E1] ring-2 ring-[#4169E1]/20 shadow-xs'
                    : 'bg-white border-app-border hover:border-[#C9D9FF] hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    isSelected ? 'bg-white text-[#4169E1] shadow-2xs' : 'bg-[#F8FAFC] text-text-muted border border-app-border'
                  }`}>
                    {getNodeIcon(node.type)}
                  </span>
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-bold text-[#25324B] truncate">
                      {node.label}
                    </div>
                    <div className="font-mono text-[11px] text-text-secondary truncate mt-0.5">
                      {node.filePath}
                      {node.line ? `:${node.line}` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant={isSelected ? 'info' : 'outline'} size="sm">{node.type}</Badge>
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
