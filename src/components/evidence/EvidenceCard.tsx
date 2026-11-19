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
  const directnessLabel = directness === 'direct' ? 'Direct source' : directness === 'indirect' ? 'Inferred relationship' : 'Model interpretation';
  const sourceTypeLabel = evidence.type.replaceAll('_', ' ');

  return (
    <div className="rounded-lg border border-app-border bg-app-surface/50 p-3.5 hover:border-accent-primary/40 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex min-w-0 items-center gap-2">
          {isCommit ? (
            <GitCommit className="w-4 h-4 text-accent-secondary shrink-0" />
          ) : (
            <FileCode className="w-4 h-4 text-accent-primary shrink-0" />
          )}
          <span className="text-xs font-semibold text-text-primary truncate">
            {evidence.title}
          </span>
        </div>

        <div className="flex max-w-full flex-wrap items-center justify-end gap-1.5 shrink-0">
          {evidence.isSimulatedDemoData && (
            <Badge variant="warning" size="sm">Demo Data</Badge>
          )}
          {evidence.conflictGroup && <Badge variant="warning" size="sm">Conflict: {evidence.conflictGroup}</Badge>}
          <Badge variant="default" size="sm">{sourceTypeLabel}</Badge>
          <Badge variant={directness === 'direct' ? 'outline' : 'warning'} size="sm">
            {directness === 'direct' ? <ShieldCheck className="w-3 h-3 text-status-success inline mr-1" /> : <AlertTriangle className="w-3 h-3 inline mr-1" />}
            {directnessLabel}
          </Badge>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy evidence reference"
            title="Copy evidence reference"
            className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-app-surface transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {evidence.freshness === 'stale' && (
        <p className="text-[11px] text-status-warning mb-2" role="status">This source may be stale after repository changes.</p>
      )}
      {evidence.freshness === 'unknown' && (
        <p className="text-[11px] text-text-muted mb-2">Source freshness has not been verified.</p>
      )}

      {evidence.filePath && (
        <div className="font-mono text-xs text-text-secondary bg-app-panel px-2.5 py-1 rounded border border-app-border/60 flex items-center justify-between mb-2">
          <span className="truncate">
            {evidence.filePath}
            {evidence.startLine !== undefined && (
              <span className="text-accent-primary ml-1">
                #L{evidence.startLine}{evidence.endLine ? `-L${evidence.endLine}` : ''}
              </span>
            )}
          </span>
        </div>
      )}

      {evidence.commitHash && (
        <div className="font-mono text-xs text-text-secondary mb-2 flex flex-wrap items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-accent-secondary/15 text-accent-secondary border border-accent-secondary/30">
            {evidence.commitHash.substring(0, 7)}
          </span>
          {evidence.author && (
            <span className="text-text-muted text-[11px]">{evidence.author}</span>
          )}
          {evidence.timestamp && (
            <span className="text-text-muted text-[11px]">
              • {new Date(evidence.timestamp).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {evidence.commitMessage && (
        <p className="text-xs text-text-secondary italic mb-2">
          &ldquo;{evidence.commitMessage}&rdquo;
        </p>
      )}

      {evidence.snippet && !compact && (
        <pre className="font-mono text-[11px] leading-relaxed text-text-primary bg-app-bg/80 p-2.5 rounded border border-app-border overflow-x-auto">
          <code>{evidence.snippet}</code>
        </pre>
      )}

      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-accent-primary hover:underline mt-2"
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
