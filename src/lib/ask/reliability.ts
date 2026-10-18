import type { AnswerClaim } from '@/types/ask';
import type { EvidenceSource, ReliabilityAssessment } from '@/types/evidence';

/**
 * Evidence-quality heuristic. It intentionally returns labels and reasons,
 * never a probability or a model self-reported confidence score.
 */
export function assessAnswerReliability(
  claims: AnswerClaim[],
  evidence: EvidenceSource[],
): ReliabilityAssessment {
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));
  const citedIds = new Set(claims.flatMap((claim) => claim.evidenceIds));
  const citedSources = [...citedIds].map((id) => evidenceById.get(id)).filter((item): item is EvidenceSource => Boolean(item));
  const unsupportedClaimCount = claims.filter((claim) =>
    claim.evidenceIds.length === 0 || claim.evidenceIds.some((id) => !evidenceById.has(id)),
  ).length;
  const conflictMap = new Map<string, EvidenceSource[]>();
  for (const item of evidence) {
    if (item.conflictGroup) conflictMap.set(item.conflictGroup, [...(conflictMap.get(item.conflictGroup) ?? []), item]);
  }
  const conflictGroups = [...conflictMap.values()].filter((group) => group.length > 1);
  const directSources = citedSources.filter((item) => (item.directness ?? inferDirectness(item)) === 'direct');
  const reasons: string[] = [];

  if (conflictGroups.length) reasons.push('Retrieved records are explicitly linked as conflicting; inspect both sources and their dates.');
  if (!citedSources.length) reasons.push('No retrieved source is attached to an answer claim.');
  if (unsupportedClaimCount) reasons.push(`${unsupportedClaimCount} claim${unsupportedClaimCount === 1 ? ' has' : 's have'} no valid source citation.`);
  if (evidence.some((item) => item.freshness === 'stale')) reasons.push('Some retrieved evidence is marked stale by repository analysis.');
  if (evidence.some((item) => item.freshness === 'unknown')) reasons.push('The freshness of some retrieved evidence is unknown.');
  if (claims.some((claim) => claim.directness !== 'direct')) reasons.push('Some explanation is indirect or interpretive rather than a direct source statement.');
  if (evidence.some((item) => item.isSimulatedDemoData)) reasons.push('The retrieved records are sample/demo data, not evidence from a connected repository.');

  const label: ReliabilityAssessment['label'] = conflictGroups.length
    ? 'conflicting_evidence'
    : !citedSources.length || !directSources.length
      ? 'insufficient_evidence'
      : unsupportedClaimCount || citedSources.some((item) => item.freshness !== 'current') || citedSources.some((item) => item.isSimulatedDemoData)
        ? 'limited_evidence'
        : citedSources.length >= 2 && new Set(citedSources.map((item) => item.id)).size >= 2
          ? 'high_evidence'
          : 'limited_evidence';

  if (!reasons.length) reasons.push('Cited, current direct sources support the listed claims; this label describes evidence coverage, not probability of correctness.');
  return { label, heuristic: true, reasons, conflictGroups, unsupportedClaimCount };
}

export function inferDirectness(evidence: EvidenceSource): 'direct' | 'indirect' | 'interpretation' {
  if (evidence.type === 'co_change_history') return 'indirect';
  if (evidence.type === 'ast_relation' || evidence.type === 'file_span' || evidence.type === 'config_reference') return 'direct';
  if (evidence.type === 'pull_request' || evidence.type === 'doc') return 'direct';
  return 'direct';
}
