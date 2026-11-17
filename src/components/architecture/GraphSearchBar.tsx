'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { GraphNode } from '@/types/graph';
import { NODE_TYPE_COLORS, NODE_TYPE_LABELS } from '@/types/architecture';
import { Badge } from '@/components/ui/Badge';

interface SearchResult {
  node: GraphNode;
  score: number;
  matchReason: string;
}

interface GraphSearchBarProps {
  repoId: string;
  onSelectNode: (node: GraphNode) => void;
  placeholder?: string;
}

export const GraphSearchBar: React.FC<GraphSearchBarProps> = ({
  repoId,
  onSelectNode,
  placeholder = 'Search by file, symbol, or dependency…',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/graph?repoId=${encodeURIComponent(repoId)}&search=${encodeURIComponent(q)}&limit=10`
        );
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        const searchMeta: { nodeId: string; score: number; matchReason: string }[] =
          data.searchMeta ?? [];
        const nodeMap = new Map<string, GraphNode>(
          (data.nodes as GraphNode[]).map((n: GraphNode) => [n.id, n])
        );
        const mapped: SearchResult[] = searchMeta
          .map((m) => ({ node: nodeMap.get(m.nodeId)!, score: m.score, matchReason: m.matchReason }))
          .filter((r) => r.node);
        setResults(mapped);
        setIsOpen(mapped.length > 0);
      } catch {
        setResults([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    },
    [repoId]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  const handleSelect = (result: SearchResult) => {
    onSelectNode(result.node);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setActiveIdx(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(results[activeIdx]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIdx(-1);
    }
  };

  return (
    <div className="relative w-full max-w-xl" role="search">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-[#9A9A9A] pointer-events-none" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIdx(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder={placeholder}
          aria-label="Search graph entities"
          className="w-full pl-9 pr-8 py-2 bg-[#FAFAFA] border border-[#DFDFDF] rounded-[8px] text-xs text-[#171717] placeholder:text-[#9A9A9A] focus:outline-none focus:border-[#3ECF8E] focus:bg-white focus:ring-1 focus:ring-[#3ECF8E] transition-all"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 w-3.5 h-3.5 text-[#707070] animate-spin" aria-label="Searching…" />
        )}
        {!isLoading && query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-3 text-[#707070] hover:text-[#171717] transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <ul
          id="graph-search-results"
          ref={listRef}
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-[#EDEDED] rounded-[8px] shadow-modal overflow-hidden max-h-64 overflow-y-auto"
        >
          {results.map((result, idx) => (
            <li
              key={result.node.id}
              role="option"
              aria-selected={idx === activeIdx}
              onClick={() => handleSelect(result)}
              className={`flex items-center justify-between gap-3 px-3 py-2 cursor-pointer transition-colors ${
                idx === activeIdx ? 'bg-[#F4F4F5]' : 'hover:bg-[#FAFAFA]'
              } border-b border-[#EDEDED] last:border-0`}
            >
              <div className="min-w-0 flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: NODE_TYPE_COLORS[result.node.type] }}
                  aria-hidden
                />
                <div className="min-w-0">
                  <div className="text-xs font-mono font-medium text-[#171717] truncate">
                    {result.node.label}
                  </div>
                  <div className="text-[10px] text-[#707070] font-mono truncate">
                    {result.node.filePath}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge variant="default" size="xs">
                  {NODE_TYPE_LABELS[result.node.type]}
                </Badge>
                <span className="text-[10px] text-[#9A9A9A] font-mono">
                  {Math.round(result.score * 100)}%
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
