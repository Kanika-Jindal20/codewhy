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
  Check,
  X,
  Loader2,
  FolderGit2,
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
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Page Header */}
      <div className="bg-white border border-border-default rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-brand-emerald/10 text-brand-deep border border-brand-emerald/20">
              <History className="w-3 h-3 text-brand-emerald" />
              Investigation Memory
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-muted text-ink-muted border border-border-subtle font-mono">
              Thread Persistence
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink-primary tracking-tight">
            Investigation History
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl">
            Revisit previous codebase audits, inspect grounded findings threads, verify evidence freshness, and continue investigations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <Link href="/impact">
            <Button variant="primary" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
              New Impact Inquiry
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANEL: Search & Investigation List */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search & Filter Card */}
          <div className="bg-white rounded-xl border border-border-default shadow-xs p-3.5 space-y-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-ink-faint" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter inquiries..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-surface-secondary border border-border-default rounded-md text-xs text-ink-primary placeholder:text-ink-faint focus:outline-none focus:border-brand-emerald"
              />
            </div>

            <div className="flex items-center gap-1">
              {(['all', 'active', 'archived'] as const).map((st) => {
                const isActive = statusFilter === st;
                return (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-all ${
                      isActive
                        ? 'bg-ink-primary text-white border border-ink-primary'
                        : 'bg-surface-secondary text-ink-muted hover:text-ink-primary border border-border-subtle'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Investigation List */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {isLoadingList ? (
              <div className="p-8 text-center bg-white border border-border-default rounded-xl shadow-xs">
                <Loader2 className="w-5 h-5 animate-spin text-brand-deep mx-auto mb-2" />
                <span className="text-xs text-ink-muted">Loading history...</span>
              </div>
            ) : investigations.length === 0 ? (
              <div className="p-8 text-center bg-white border border-dashed border-border-default rounded-xl shadow-xs space-y-2">
                <Archive className="w-6 h-6 text-ink-faint mx-auto" />
                <div className="font-medium text-ink-secondary text-xs">No investigations found</div>
                <p className="text-[11px] text-ink-muted">
                  {searchQuery ? 'Try clearing your search query.' : 'Run an impact analysis to start one.'}
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
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-brand-emerald/5 border-brand-emerald ring-1 ring-brand-emerald/30 shadow-xs'
                        : 'bg-white border-border-subtle hover:border-border-default hover:bg-surface-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono text-ink-faint truncate">{inv.repoName}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isStale && (
                          <Badge variant="warning" size="sm">Stale</Badge>
                        )}
                        <Badge variant={inv.status === 'active' ? 'success' : 'outline'} size="sm">
                          {inv.status}
                        </Badge>
                      </div>
                    </div>

                    <h3 className="text-xs font-semibold text-ink-primary line-clamp-2 mb-1">
                      {inv.title}
                    </h3>

                    <p className="text-[11px] text-ink-muted line-clamp-2 leading-relaxed mb-2">
                      {inv.entries[0]?.answerSummary || inv.originalQuestion}
                    </p>

                    <div className="flex items-center justify-between pt-1.5 border-t border-border-subtle text-[10px] font-mono text-ink-faint">
                      <span>{inv.entries.length} {inv.entries.length === 1 ? 'inquiry' : 'inquiries'}</span>
                      <span>{new Date(inv.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Investigation Detail Workspace */}
        <div className="lg:col-span-8 space-y-4">
          {isLoadingDetail ? (
            <div className="p-16 text-center bg-white border border-border-default rounded-xl shadow-xs">
              <Loader2 className="w-5 h-5 animate-spin text-brand-deep mx-auto mb-2" />
              <span className="text-xs text-ink-muted">Restoring investigation context...</span>
            </div>
          ) : selectedInvestigation ? (
            <div className="space-y-4">
              {/* Detail Header Card */}
              <div className="bg-white rounded-xl border border-border-default p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-border-subtle">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {isRenaming ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="flex-1 px-2.5 py-1 bg-surface-secondary border border-border-default rounded text-xs font-semibold text-ink-primary focus:outline-none focus:border-brand-emerald"
                        />
                        <button
                          onClick={handleRename}
                          className="p-1.5 rounded bg-brand-emerald text-ink-primary hover:bg-brand-deep transition-all"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setIsRenaming(false);
                            setNewTitle(selectedInvestigation.title);
                          }}
                          className="p-1.5 rounded bg-surface-muted text-ink-muted hover:text-ink-primary"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-ink-primary truncate">
                          {selectedInvestigation.title}
                        </h2>
                        <button
                          onClick={() => setIsRenaming(true)}
                          className="p-1 text-ink-muted hover:text-ink-primary transition-colors"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-ink-muted bg-surface-secondary px-2 py-0.5 rounded border border-border-subtle">
                        {selectedInvestigation.repoName}
                      </span>
                      <Badge variant={selectedInvestigation.status === 'active' ? 'success' : 'outline'} size="sm">
                        {selectedInvestigation.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={handleToggleArchive}
                      icon={selectedInvestigation.status === 'active' ? <Archive className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
                    >
                      {selectedInvestigation.status === 'active' ? 'Archive' : 'Restore'}
                    </Button>

                    <Button
                      variant="danger"
                      size="xs"
                      onClick={() => setDeleteConfirmationId(selectedInvestigation.id)}
                      icon={<Trash2 className="w-3 h-3" />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Stale Evidence Amber Alert */}
                {selectedInvestigation.staleEvidenceStatus?.isStale && (
                  <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 text-xs">
                      <div className="font-medium text-amber-900">
                        Potentially Stale Evidence Detected
                      </div>
                      <p className="text-amber-800 leading-relaxed">
                        {selectedInvestigation.staleEvidenceStatus.reason}
                      </p>
                    </div>
                  </div>
                )}

                {/* Related Links */}
                {selectedInvestigation.relatedLinks.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-mono uppercase text-ink-faint">Linked:</span>
                    {selectedInvestigation.relatedLinks.map((link, idx) => (
                      <Link
                        key={idx}
                        href={link.href}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-secondary border border-border-subtle text-brand-deep text-xs font-medium hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Q&A Thread */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-ink-primary uppercase tracking-wider">
                    Investigation Thread ({selectedInvestigation.entries.length})
                  </h3>
                </div>

                {selectedInvestigation.entries.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="bg-white rounded-xl border border-border-default shadow-xs overflow-hidden"
                  >
                    {/* Question Header */}
                    <div className="bg-surface-secondary border-b border-border-subtle p-3.5 flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-ink-faint block mb-0.5">
                          Inquiry #{idx + 1}
                        </span>
                        <h4 className="text-xs font-semibold text-ink-primary">
                          {entry.question}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-ink-faint shrink-0">
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Answer body */}
                    <div className="p-4 space-y-3">
                      <div className="text-xs leading-relaxed text-ink-secondary">
                        {entry.answerSummary}
                      </div>

                      {entry.detailedFindings && entry.detailedFindings.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-border-subtle">
                          <span className="text-[10px] font-mono uppercase text-ink-faint block">
                            Key Findings
                          </span>
                          <ul className="space-y-1 text-xs text-ink-muted">
                            {entry.detailedFindings.map((f, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-brand-deep font-bold">•</span>
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Evidence */}
                      {entry.evidence && entry.evidence.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-border-subtle">
                          <span className="text-[10px] font-mono uppercase text-ink-faint block">
                            Cited Evidence ({entry.evidence.length})
                          </span>
                          <div className="space-y-1">
                            {entry.evidence.map((ev) => (
                              <div
                                key={ev.id}
                                className="flex items-center justify-between p-2 rounded bg-surface-secondary border border-border-subtle text-xs"
                              >
                                <div className="min-w-0 pr-2">
                                  <span className="font-medium text-ink-primary truncate block font-mono">
                                    {ev.title}
                                  </span>
                                  <span className="text-[10px] font-mono text-ink-muted truncate block">
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
                  </div>
                ))}
              </div>

              {/* Follow-up Composer */}
              <FollowUpComposer
                suggestions={suggestions}
                onAskFollowUp={handleAskFollowUp}
                isLoading={isSubmittingFollowUp}
              />
            </div>
          ) : (
            <div className="p-12 text-center bg-white border border-dashed border-border-default rounded-xl shadow-xs space-y-2">
              <Archive className="w-8 h-8 text-ink-faint mx-auto mb-1" />
              <div className="font-semibold text-ink-primary text-sm">No Investigation Selected</div>
              <p className="text-xs text-ink-muted max-w-xs mx-auto">
                Select an entry on the left to restore its evidence thread and continue inquiry.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-border-default shadow-xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-ink-primary text-sm">Delete Investigation</h3>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Are you sure you want to permanently delete this investigation? All thread entries and saved evidence will be removed.
                </p>
              </div>
            </div>

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
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};