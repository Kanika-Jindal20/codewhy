'use client';

import React, { useState } from 'react';
import { FileCode, GitCommit, ExternalLink, Copy, Check, ShieldCheck, AlertTriangle } from 'lucide-react';
import { EvidenceSource } from '@/types/evidence';
import { Badge } from '@/components/ui/Badge';

interface EvidenceCardProps {
  evidence: EvidenceSource;
  compact?: boolean;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ evidence, compact = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = evidence.snippet || evidence.commitHash || evidence.filePath || evidence.title;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCommit = evidence.type === 'commit' || !!evidence.commitHash;
  const sourceUrl = safeGitHubUrl(evidence.url);
  const directness = evidence.directness ?? (evidence.type === 'co_change_history' ? 'indirect' : 'direct');
  const directnessLabel = directness === 'direct' ? 'Direct source' : directness === 'indirect' ? 'Inferred' : 'Model interpretation';
  const sourceTypeLabel = evidence.type.replaceAll('_', ' ');

  return (
    <div className="rounded-lg border border-border-default bg-surface-secondary/60 p-3 hover:border-border-strong transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex min-w-0 items-center gap-2">
          {isCommit ? (
            <GitCommit className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          ) : (
            <FileCode className="w-3.5 h-3.5 text-brand-deep shrink-0" />
          )}
          <span className="text-xs font-semibold text-ink-primary truncate font-mono">
            {evidence.title}
          </span>
        </div>

        <div className="flex max-w-full flex-wrap items-center justify-end gap-1.5 shrink-0">
          {evidence.isSimulatedDemoData && (
            <Badge variant="warning" size="sm">Demo Data</Badge>
          )}
          {evidence.conflictGroup && <Badge variant="warning" size="sm">Conflict: {evidence.conflictGroup}</Badge>}
          <Badge variant="outline" size="sm">{sourceTypeLabel}</Badge>
          <Badge variant={directness === 'direct' ? 'success' : 'warning'} size="sm">
            {directness === 'direct' ? <ShieldCheck className="w-3 h-3 text-brand-deep inline mr-1" /> : <AlertTriangle className="w-3 h-3 inline mr-1" />}
            {directnessLabel}
          </Badge>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy evidence reference"
            title="Copy evidence reference"
            className="p-1 text-ink-muted hover:text-ink-primary rounded hover:bg-surface-muted transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-brand-deep" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {evidence.freshness === 'stale' && (
        <p className="text-[11px] text-amber-600 mb-2" role="status">This source may be stale after repository changes.</p>
      )}
      {evidence.freshness === 'unknown' && (
        <p className="text-[11px] text-ink-muted mb-2">Source freshness has not been verified.</p>
      )}

      {evidence.filePath && (
        <div className="font-mono text-xs text-ink-muted bg-white px-2.5 py-1 rounded border border-border-subtle flex items-center justify-between mb-2">
          <span className="truncate">
            {evidence.filePath}
            {evidence.startLine !== undefined && (
              <span className="text-brand-deep font-semibold ml-1">
                #L{evidence.startLine}{evidence.endLine ? `-L${evidence.endLine}` : ''}
              </span>
            )}
          </span>
        </div>
      )}

      {evidence.commitHash && (
        <div className="font-mono text-xs text-ink-secondary mb-2 flex flex-wrap items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-surface-muted text-ink-primary border border-border-subtle font-mono">
            {evidence.commitHash.substring(0, 7)}
          </span>
          {evidence.author && (
            <span className="text-ink-muted text-[11px]">{evidence.author}</span>
          )}
          {evidence.timestamp && (
            <span className="text-ink-faint text-[11px]">
              • {new Date(evidence.timestamp).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {evidence.commitMessage && (
        <p className="text-xs text-ink-muted italic mb-2">
          &ldquo;{evidence.commitMessage}&rdquo;
        </p>
      )}

      {evidence.snippet && !compact && (
        <pre className="font-mono text-[11px] leading-relaxed text-ink-primary bg-white p-2.5 rounded border border-border-subtle overflow-x-auto">
          <code>{evidence.snippet}</code>
        </pre>
      )}

      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-brand-deep hover:underline mt-1.5 font-medium"
        >
          View verified GitHub source <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
};

function safeGitHubUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.username || url.password) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}