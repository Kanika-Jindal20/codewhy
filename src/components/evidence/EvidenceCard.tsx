'use client';

import React, { useState } from 'react';
import { FileCode, GitCommit, ExternalLink, Copy, Check, ShieldCheck } from 'lucide-react';
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
  const isFile = evidence.type === 'file_span' || evidence.type === 'ast_relation' || !!evidence.filePath;

  return (
    <div className="rounded-lg border border-app-border bg-app-surface/50 p-3.5 hover:border-accent-primary/40 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {isCommit ? (
            <GitCommit className="w-4 h-4 text-accent-secondary shrink-0" />
          ) : (
            <FileCode className="w-4 h-4 text-accent-primary shrink-0" />
          )}
          <span className="text-xs font-semibold text-text-primary truncate">
            {evidence.title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {evidence.isSimulatedDemoData && (
            <Badge variant="warning" size="sm">Demo Data</Badge>
          )}
          <Badge variant="outline" size="sm">
            <ShieldCheck className="w-3 h-3 text-status-success inline mr-1" />
            {Math.round(evidence.confidenceScore * 100)}%
          </Badge>
          <button
            onClick={handleCopy}
            title="Copy evidence reference"
            className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-app-surface transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

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

      {evidence.url && (
        <a
          href={evidence.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-accent-primary hover:underline mt-2"
        >
          View source commit/PR <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
};
