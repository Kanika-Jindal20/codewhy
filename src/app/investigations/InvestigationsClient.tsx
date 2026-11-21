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
    <div className="font-['Inter',sans-serif] max-w-7xl mx-auto space-y-6 pb-12">

      {/* ── Header Banner ── */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-6 sm:p-8 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <span className="p-3 rounded-2xl bg-white/20 border border-white/30 shadow-inner shrink-0">
              <History className="w-6 h-6 text-white stroke-[2.5]" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Investigation History
              </h1>
              <p className="text-indigo-100 text-sm leading-relaxed max-w-2xl mt-1">
                Revisit previous repository investigations, inspect grounded answer threads, detect stale evidence across commit revisions, and continue inquiries seamlessly.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <Link href="/impact">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 font-bold text-sm rounded-xl shadow-md hover:bg-indigo-50 transition-all border border-white/80">
                <ExternalLink className="w-4 h-4" />
                New Impact Inquiry
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT PANEL: Search & Investigation List ── */}
        <div className="lg:col-span-4 space-y-4">

          {/* Search & Filter Card */}
          <div className="bg-white rounded-2xl border border-indigo-100 shadow-lg p-4 space-y-3">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-indigo-300" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search inquiries, files, questions…"
                className="w-full pl-10 pr-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-sm text-gray-800 placeholder:text-indigo-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            {/* Status filter pills */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Filter:</span>
              <div className="flex items-center gap-1.5">
                {(['all', 'active', 'archived'] as const).map((st) => {
                  const isActive = statusFilter === st;
                  const styles: Record<string, string> = {
                    all: isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                      : 'bg-indigo-50 text-indigo-500 border-indigo-200 hover:bg-indigo-100',
                    active: isActive
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100',
                    archived: isActive
                      ? 'bg-gray-500 text-white border-gray-500 shadow'
                      : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200',
                  };
                  return (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold capitalize border transition-all ${styles[st]}`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Investigation List */}
          <div className="space-y-2.5">
            {isLoadingList ? (
              <div className="p-10 text-center bg-white border border-indigo-100 rounded-2xl shadow-lg flex flex-col items-center gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
                <span className="text-sm font-semibold text-indigo-400">Loading investigation history…</span>
              </div>
            ) : investigations.length === 0 ? (
              <div className="p-10 text-center bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl shadow-lg space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-100 flex items-center justify-center">
                  <Archive className="w-7 h-7 text-indigo-400" />
                </div>
                <div className="font-bold text-indigo-700 text-sm">No investigations found</div>
                <p className="text-xs text-indigo-400 max-w-xs mx-auto">
                  {searchQuery
                    ? 'Try clearing your search query.'
                    : 'Run an impact analysis or ask a question to start one.'}
                </p>
                <Link href="/impact">
                  <button className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-all shadow">
                    <ArrowRight className="w-3.5 h-3.5" />
                    Run Impact Analysis
                  </button>
                </Link>
              </div>
            ) : (
              investigations.map((inv) => {
                const isSelected = inv.id === selectedId;
                const isStale = inv.staleEvidenceStatus?.isStale;
                const isArchived = inv.status === 'archived';

                return (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedId(inv.id)}
                    className={`p-4 rounded-2xl border-l-4 cursor-pointer transition-all shadow-sm ${
                      isSelected
                        ? 'bg-indigo-50 border-l-indigo-500 border border-indigo-200 ring-2 ring-indigo-500/20 shadow-md'
                        : isArchived
                        ? 'bg-gray-50 border-l-gray-300 border border-gray-200 hover:border-gray-300'
                        : 'bg-white border-l-green-500 border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30'
                    }`}
                  >
                    {/* Row 1: repo + badges */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-mono text-gray-400 truncate">{inv.repoName}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isStale && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Stale
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          inv.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-gray-800 line-clamp-2 mb-1">
                      {inv.title}
                    </h3>

                    {/* Summary */}
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-2.5">
                      {inv.entries[0]?.answerSummary || inv.originalQuestion}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[10px] font-mono text-gray-400">
                      <span>{inv.entries.length} {inv.entries.length === 1 ? 'inquiry' : 'inquiries'}</span>
                      <span>{new Date(inv.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: Investigation Detail Workspace ── */}
        <div className="lg:col-span-8 space-y-5">
          {isLoadingDetail ? (
            <div className="p-16 text-center bg-white border border-indigo-100 rounded-2xl shadow-lg flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <span className="text-sm font-semibold text-indigo-400">Restoring investigation context…</span>
            </div>
          ) : selectedInvestigation ? (
            <div className="space-y-5">

              {/* ── Detail Header Card ── */}
              <div className="bg-white rounded-2xl shadow-lg border-t-4 border-t-indigo-500 border border-indigo-100 p-6 sm:p-7 space-y-5">

                {/* Title bar row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-indigo-100">
                  <div className="flex-1 min-w-0 space-y-2">
                    {isRenaming ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="flex-1 px-3 py-2 bg-indigo-50 border border-indigo-400 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                        />
                        <button
                          onClick={handleRename}
                          className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow"
                          title="Save title"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setIsRenaming(false);
                            setNewTitle(selectedInvestigation.title);
                          }}
                          className="p-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-700 transition-all"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-xl font-extrabold text-gray-900 leading-tight truncate">
                          {selectedInvestigation.title}
                        </h2>
                        <button
                          onClick={() => setIsRenaming(true)}
                          className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                          title="Rename investigation"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Repo / Branch / Status pills */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold">
                        <Layers className="w-3 h-3" />
                        {selectedInvestigation.repoName}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 border border-violet-200 text-xs font-bold">
                        {selectedInvestigation.ownerName}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        selectedInvestigation.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}>
                        {selectedInvestigation.status === 'active' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Archive className="w-3 h-3" />
                        )}
                        {selectedInvestigation.visibility}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleToggleArchive}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 font-bold text-sm hover:bg-indigo-100 transition-all"
                    >
                      {selectedInvestigation.status === 'active' ? (
                        <Archive className="w-3.5 h-3.5" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" />
                      )}
                      {selectedInvestigation.status === 'active' ? 'Archive' : 'Restore'}
                    </button>

                    <button
                      onClick={() => setDeleteConfirmationId(selectedInvestigation.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Stale Evidence Amber Alert */}
                {selectedInvestigation.staleEvidenceStatus?.isStale && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-amber-100 shrink-0">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-amber-800 text-sm flex items-center gap-2">
                        Potentially Stale Evidence Detected
                        <span className="text-[10px] font-mono text-amber-500 font-normal">
                          (Revalidated {new Date(selectedInvestigation.staleEvidenceStatus.checkedAt).toLocaleTimeString()})
                        </span>
                      </div>
                      <p className="text-amber-700 text-xs leading-relaxed">
                        {selectedInvestigation.staleEvidenceStatus.reason}
                      </p>
                    </div>
                  </div>
                )}

                {/* Related Cross-Feature Links */}
                {selectedInvestigation.relatedLinks.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Linked Artifacts:
                    </span>
                    {selectedInvestigation.relatedLinks.map((link, idx) => (
                      <Link
                        key={idx}
                        href={link.href}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 hover:underline transition-all"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Q&A Thread ── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 rounded-full bg-indigo-500" />
                    <span className="text-sm font-extrabold text-gray-800 uppercase tracking-wide">
                      Investigation Thread
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold">
                      {selectedInvestigation.entries.length}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Chronological</span>
                </div>

                {selectedInvestigation.entries.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="bg-white rounded-2xl border border-indigo-100 shadow-lg overflow-hidden"
                  >
                    {/* Question bubble */}
                    <div className="bg-indigo-50 border-l-4 border-indigo-500 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-1">
                            Inquiry #{idx + 1}
                          </span>
                          <h3 className="text-sm font-extrabold text-indigo-900 leading-snug">
                            {entry.question}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono text-indigo-400 shrink-0 pt-1">
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Answer body */}
                    <div className="p-5 space-y-4">
                      {/* Synthesized answer */}
                      <div className="p-4 bg-gray-50 rounded-xl border-l-4 border-emerald-500 space-y-1">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Synthesized Answer
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {entry.answerSummary}
                        </p>
                      </div>

                      {/* Detailed findings */}
                      {entry.detailedFindings && entry.detailedFindings.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                            Grounded Findings
                          </span>
                          <ul className="space-y-1.5">
                            {entry.detailedFindings.map((f, i) => (
                              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 leading-relaxed">
                                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Evidence artifacts */}
                      {entry.evidence && entry.evidence.length > 0 && (
                        <div className="space-y-2 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              Cited Evidence Artifacts
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200 text-[10px] font-bold">
                              {entry.evidence.length}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {entry.evidence.map((ev) => (
                              <div
                                key={ev.id}
                                className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 gap-2"
                              >
                                <div className="min-w-0 flex items-start gap-2.5">
                                  <div className="p-1.5 rounded-lg bg-indigo-100 shrink-0">
                                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-bold text-sm text-gray-800 truncate block">
                                      {ev.title}
                                    </span>
                                    <span className="text-[10px] font-mono text-gray-400 truncate block">
                                      {ev.filePath ? `${ev.filePath}:${ev.startLine || 1}` : ev.commitHash}
                                    </span>
                                  </div>
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

              {/* ── Follow-up Composer ── */}
              <FollowUpComposer
                suggestions={suggestions}
                onAskFollowUp={handleAskFollowUp}
                isLoading={isSubmittingFollowUp}
              />
            </div>
          ) : (
            /* ── Empty state (no investigation selected) ── */
            <div className="p-16 text-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 border border-indigo-100 rounded-3xl shadow-lg space-y-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-100 flex items-center justify-center shadow-inner">
                <Archive className="w-10 h-10 text-indigo-400" />
              </div>
              <div className="font-extrabold text-gray-800 text-lg">No Investigation Selected</div>
              <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                Select an investigation from the list on the left to restore its questions, evidence citations, and continue exploration.
              </p>
              <Link href="/impact">
                <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-all shadow-md mt-2">
                  <ArrowRight className="w-4 h-4" />
                  Run Impact Analysis
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-red-200 shadow-2xl p-7 max-w-md w-full space-y-5">
            {/* Warning header */}
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-red-100 shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-red-700 text-lg">Confirm Permanent Deletion</h3>
                <p className="text-red-400 text-xs mt-0.5 font-semibold">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed bg-red-50 border border-red-100 rounded-xl p-4">
              Are you sure you want to permanently delete this investigation? This will remove the complete Q&amp;A thread and all evidence history.
            </p>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={() => setDeleteConfirmationId(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-bold text-sm hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmationId)}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-all shadow-md"
              >
                <Trash2 className="w-4 h-4" />
                Delete Investigation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
