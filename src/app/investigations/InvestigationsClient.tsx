'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  History,
  Archive,
  RotateCcw,
  Trash2,
  Edit2,
  AlertTriangle,
  FileText,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import {
  Investigation,
  FollowUpSuggestion,
  InvestigationStatus,
} from '@/types/investigation';
import { FollowUpComposer } from '@/components/investigations/FollowUpComposer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import Link from 'next/link';

export const InvestigationsClient: React.FC = () => {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null);
  const [suggestions, setSuggestions] = useState<FollowUpSuggestion[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvestigationStatus>('all');
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);

  // Edit / Delete dialog state
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // Load investigations list
  const loadInvestigations = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/investigations?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInvestigations(data.investigations || []);
        if (!selectedId && data.investigations?.length > 0) {
          setSelectedId(data.investigations[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load investigations:', err);
    } finally {
      setIsLoadingList(false);
    }
  }, [searchQuery, statusFilter, selectedId]);

  useEffect(() => {
    loadInvestigations();
  }, [loadInvestigations]);

  // Load single investigation detail
  const loadInvestigationDetail = useCallback(async (id: string) => {
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/investigations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedInvestigation(data.investigation);
        setSuggestions(data.suggestions || []);
        setNewTitle(data.investigation.title);
      }
    } catch (err) {
      console.error('Failed to load investigation detail:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadInvestigationDetail(selectedId);
    } else {
      setSelectedInvestigation(null);
      setSuggestions([]);
    }
  }, [selectedId, loadInvestigationDetail]);

  // Rename
  const handleRename = async () => {
    if (!selectedId || !newTitle.trim()) return;
    try {
      const res = await fetch(`/api/investigations/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (res.ok) {
        const updated: Investigation = await res.json();
        setSelectedInvestigation(updated);
        setIsRenaming(false);
        loadInvestigations();
      }
    } catch (err) {
      console.error('Rename failed:', err);
    }
  };

  // Toggle Archive
  const handleToggleArchive = async () => {
    if (!selectedInvestigation) return;
    const nextStatus: InvestigationStatus =
      selectedInvestigation.status === 'active' ? 'archived' : 'active';
    try {
      const res = await fetch(`/api/investigations/${selectedInvestigation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        const updated: Investigation = await res.json();
        setSelectedInvestigation(updated);
        loadInvestigations();
      }
    } catch (err) {
      console.error('Archive toggle failed:', err);
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/investigations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteConfirmationId(null);
        setSelectedId(null);
        setSelectedInvestigation(null);
        loadInvestigations();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Submit Follow-up
  const handleAskFollowUp = async (question: string) => {
    if (!selectedId) return;
    setIsSubmittingFollowUp(true);
    try {
      const res = await fetch(`/api/investigations/${selectedId}/follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedInvestigation(data.investigation);
        setSuggestions(data.suggestions || []);
        loadInvestigations();
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit follow-up');
      }
    } finally {
      setIsSubmittingFollowUp(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="bg-app-panel border border-app-border rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-2 rounded-lg bg-accent-primary/20 text-accent-primary border border-accent-primary/30">
                <History className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-text-primary tracking-tight">
                Investigation History & Memory
              </h1>
              <Badge variant="purple" size="sm">Feature 13</Badge>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed max-w-2xl">
              Preserve and revisit previous repository investigations, inspect grounded answer threads, detect stale evidence across commit revisions, and continue inquiries seamlessly.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/impact">
              <Button variant="secondary" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                New Impact Inquiry
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Searchable Investigation List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search & Filter Bar */}
          <div className="bg-app-panel border border-app-border rounded-lg p-3 space-y-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search inquiries, files, questions..."
                className="w-full pl-8 pr-3 py-1.5 bg-app-surface border border-app-border rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary font-mono"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-text-muted">Status Filter:</span>
              <div className="flex items-center gap-1">
                {(['all', 'active', 'archived'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2 py-0.5 rounded capitalize transition-colors ${
                      statusFilter === st
                        ? 'bg-accent-primary/20 text-accent-primary font-semibold'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Investigation List Items */}
          <div className="space-y-2.5">
            {isLoadingList ? (
              <div className="p-8 text-center text-xs text-text-muted bg-app-panel border border-app-border rounded-lg flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-accent-primary" />
                <span>Loading investigation history…</span>
              </div>
            ) : investigations.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-muted bg-app-panel border border-app-border rounded-lg space-y-1">
                <History className="w-8 h-8 mx-auto opacity-40 mb-2" />
                <div className="font-semibold text-text-secondary">No investigations found</div>
                <p className="text-[11px]">
                  {searchQuery ? 'Try clearing your search query.' : 'Run an impact analysis or ask a question to start one.'}
                </p>
              </div>
            ) : (
              investigations.map((inv) => {
                const isSelected = inv.id === selectedId;
                const isStale = inv.staleEvidenceStatus?.isStale;

                return (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedId(inv.id)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-app-surface border-accent-primary ring-1 ring-accent-primary shadow-lg'
                        : 'bg-app-panel border-app-border hover:border-app-border/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono text-text-muted truncate">
                        {inv.repoName}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isStale && (
                          <Badge variant="warning" size="sm">
                            <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                            Stale
                          </Badge>
                        )}
                        <Badge variant={inv.status === 'active' ? 'default' : 'outline'} size="sm">
                          {inv.status}
                        </Badge>
                      </div>
                    </div>

                    <h3 className="text-xs font-bold text-text-primary line-clamp-2 mb-1 font-mono">
                      {inv.title}
                    </h3>

                    <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed mb-2">
                      {inv.entries[0]?.answerSummary || inv.originalQuestion}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-app-border/60 text-[10px] font-mono text-text-muted">
                      <span>{inv.entries.length} {inv.entries.length === 1 ? 'inquiry' : 'inquiries'}</span>
                      <span>{new Date(inv.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Investigation Detail Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {isLoadingDetail ? (
            <div className="p-12 text-center text-xs text-text-muted bg-app-panel border border-app-border rounded-lg flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-accent-primary" />
              <span>Restoring investigation context…</span>
            </div>
          ) : selectedInvestigation ? (
            <div className="space-y-4">
              {/* Top Detail Card & Title bar */}
              <div className="bg-app-panel border border-app-border rounded-lg p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-app-border pb-4">
                  <div className="flex-1 min-w-0">
                    {isRenaming ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="px-2.5 py-1 bg-app-surface border border-accent-primary rounded text-sm font-bold text-text-primary font-mono w-full focus:outline-none"
                        />
                        <button
                          onClick={handleRename}
                          className="p-1.5 rounded bg-accent-primary text-white hover:bg-accent-primary/80"
                          title="Save title"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setIsRenaming(false);
                            setNewTitle(selectedInvestigation.title);
                          }}
                          className="p-1.5 rounded bg-app-surface border border-app-border text-text-muted hover:text-text-primary"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-text-primary font-mono truncate">
                          {selectedInvestigation.title}
                        </h2>
                        <button
                          onClick={() => setIsRenaming(true)}
                          className="p-1 text-text-muted hover:text-text-primary transition-colors"
                          title="Rename investigation"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted font-mono mt-1">
                      <span>Repo: <strong className="text-text-secondary">{selectedInvestigation.repoName}</strong></span>
                      <span>Owner: <strong className="text-text-secondary">{selectedInvestigation.ownerName}</strong></span>
                      <span>Visibility: <strong className="text-text-secondary">{selectedInvestigation.visibility}</strong></span>
                    </div>
                  </div>

                  {/* Actions: Archive, Delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleArchive}
                      icon={
                        selectedInvestigation.status === 'active' ? (
                          <Archive className="w-3.5 h-3.5" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )
                      }
                    >
                      {selectedInvestigation.status === 'active' ? 'Archive' : 'Restore'}
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteConfirmationId(selectedInvestigation.id)}
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Stale Evidence Alert Banner */}
                {selectedInvestigation.staleEvidenceStatus?.isStale && (
                  <div className="p-3.5 rounded-lg bg-status-warning/10 border border-status-warning/30 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-status-warning flex items-center gap-2">
                        <span>Potentially Stale Evidence Detected</span>
                        <span className="text-[10px] font-mono text-text-muted">
                          (Revalidated {new Date(selectedInvestigation.staleEvidenceStatus.checkedAt).toLocaleTimeString()})
                        </span>
                      </div>
                      <p className="text-text-secondary text-[11px] leading-relaxed">
                        {selectedInvestigation.staleEvidenceStatus.reason}
                      </p>
                    </div>
                  </div>
                )}

                {/* Related Cross-Feature Links */}
                {selectedInvestigation.relatedLinks.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted mr-1">
                      Linked Artifacts:
                    </span>
                    {selectedInvestigation.relatedLinks.map((link, idx) => (
                      <Link
                        key={idx}
                        href={link.href}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-app-surface border border-app-border hover:border-accent-primary text-xs font-mono text-accent-primary hover:underline transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Chronological Q&A Thread */}
              <div className="space-y-4">
                <div className="px-1 text-xs font-semibold uppercase tracking-wider text-text-muted font-mono flex items-center justify-between">
                  <span>Investigation Thread ({selectedInvestigation.entries.length})</span>
                  <span>Chronological History</span>
                </div>

                {selectedInvestigation.entries.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="bg-app-panel border border-app-border rounded-lg p-5 space-y-3"
                  >
                    {/* Entry Question */}
                    <div className="flex items-start justify-between gap-3 border-b border-app-border/60 pb-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-accent-primary font-bold uppercase tracking-wider">
                          Inquiry #{idx + 1}
                        </span>
                        <h3 className="text-sm font-bold text-text-primary font-mono">
                          {entry.question}
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-text-muted shrink-0">
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Grounded Answer Summary */}
                    <div className="p-3 bg-app-surface/60 border-l-4 border-status-success rounded-r-lg space-y-1 text-xs">
                      <div className="font-semibold text-text-primary">
                        Synthesized Answer
                      </div>
                      <p className="text-text-secondary leading-relaxed">
                        {entry.answerSummary}
                      </p>
                    </div>

                    {/* Detailed Findings */}
                    {entry.detailedFindings && entry.detailedFindings.length > 0 && (
                      <div className="space-y-1 text-xs">
                        <span className="text-[11px] font-semibold text-text-secondary font-mono">
                          Grounded Findings:
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-text-muted text-[11px]">
                          {entry.detailedFindings.map((f, i) => (
                            <li key={i} className="leading-relaxed">{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Cited Evidence Artifacts */}
                    {entry.evidence && entry.evidence.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-app-border/40">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                          Cited Evidence Artifacts ({entry.evidence.length}):
                        </span>
                        <div className="space-y-1">
                          {entry.evidence.map((ev) => (
                            <div
                              key={ev.id}
                              className="flex items-center justify-between p-2 rounded bg-app-surface/40 border border-app-border text-xs"
                            >
                              <div className="min-w-0">
                                <span className="font-semibold text-text-primary truncate block">
                                  {ev.title}
                                </span>
                                <span className="text-[10px] font-mono text-text-muted truncate block">
                                  {ev.filePath ? `${ev.filePath}:${ev.startLine || 1}` : ev.commitHash}
                                </span>
                              </div>
                              <ConfidenceBadge
                                score={ev.confidenceScore}
                                level={ev.confidenceScore >= 0.9 ? 'high' : 'medium'}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Interactive Follow-up Composer */}
              <FollowUpComposer
                suggestions={suggestions}
                onAskFollowUp={handleAskFollowUp}
                isLoading={isSubmittingFollowUp}
              />
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-text-muted bg-app-panel border border-app-border rounded-lg space-y-2">
              <History className="w-10 h-10 mx-auto opacity-30 mb-2" />
              <div className="font-bold text-text-primary">No Investigation Selected</div>
              <p className="text-text-muted max-w-sm mx-auto">
                Select an investigation from the list on the left to restore its questions, evidence citations, and continue exploration.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-app-panel border border-app-border rounded-xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-status-error font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Confirm Permanent Deletion</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Are you sure you want to permanently delete this investigation? This action cannot be undone and will remove the complete Q&A thread and evidence history.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmationId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(deleteConfirmationId)}
              >
                Delete Investigation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
