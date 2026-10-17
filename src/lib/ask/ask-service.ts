import { searchGraph } from '@/lib/graph/graph-query';
import type { KnowledgeGraph, GraphEdge, GraphNode } from '@/types/graph';
import type { EvidenceSource } from '@/types/evidence';
import type { AnswerClaim, AskQuestionKind, AskWhyRequest, AskWhyResponse } from '@/types/ask';
import { assessAnswerReliability, inferDirectness } from './reliability';
import { generateGroundedClaims } from './model-adapter';

const STOP_WORDS = new Set(['about', 'after', 'again', 'against', 'does', 'from', 'have', 'into', 'itself', 'more', 'most', 'other', 'over', 'same', 'should', 'that', 'their', 'there', 'these', 'they', 'this', 'through', 'under', 'what', 'when', 'where', 'which', 'while', 'with', 'would', 'could', 'does', 'why', 'how', 'was', 'were', 'the', 'and', 'for', 'are', 'can', 'not', 'you', 'your']);

export function classifyQuestion(question: string): AskQuestionKind {
  const q = question.toLowerCase();
  if (/\b(what if|impact|affect|break|change|modify|remove)\b/.test(q)) return 'change_impact';
  if (/\b(supersed|replac|revers|changed since|decision|timeline|later|history|commit|pull request|\bpr\b|issue|discussion|introduced|modified|author|proposed|who changed)\b/.test(q)) return 'decision_history';
  if (/\b(depend|import|call|use|consumer|caller|relationship)\b/.test(q)) return 'dependency';
  if (/\b(why|reason|rationale|intended|design choice|chosen)\b/.test(q)) return 'historical_reasoning';
  if (/\b(what does|explain|how does|function|class|module|code|evidence|supports)\b/.test(q)) return 'code_explanation';
  return 'unsupported';
}

export async function answerRepositoryQuestion(graph: KnowledgeGraph, request: AskWhyRequest): Promise<AskWhyResponse> {
  const question = request.question;
  const kind = classifyQuestion(question);
  const recentQuestions = (request.recentQuestions ?? []).filter((item) => typeof item === 'string').slice(-4);
  const retrieved = kind === 'unsupported'
    ? { hits: [] as EvidenceHit[], evidence: [] as EvidenceSource[] }
    : retrieveEvidence(graph, question, kind, recentQuestions);
  const evidence = retrieved.evidence.map((item) => ({
    ...item,
    directness: item.directness ?? inferDirectness(item),
    freshness: item.freshness ?? 'unknown',
    isSimulatedDemoData: item.isSimulatedDemoData ?? graph.isDemo ?? false,
  }));
  const answerParts: string[] = [];
  const claims: AnswerClaim[] = [];
  const isReasonQuestion = kind === 'historical_reasoning' || kind === 'decision_history';

  if (kind === 'unsupported') {
    answerParts.push('I can answer questions about this repository’s code, dependencies, commits, and recorded decisions. Please rephrase your question around one of those topics.');
  }

  for (const hit of retrieved.hits.slice(0, 4)) {
    const { node, item } = hit;
    if (item.commitHash && item.commitMessage) {
      const fact = `Commit ${item.commitHash.slice(0, 7)} records: “${item.commitMessage}”${item.timestamp ? ` (${new Date(item.timestamp).toLocaleDateString('en-US', { timeZone: 'UTC' })})` : ''}.`;
      addClaim(claims, answerParts, fact, item.id, 'direct');
    } else if (item.snippet) {
      const fact = `${node.label} includes this recorded source excerpt${item.filePath ? ` in ${item.filePath}` : ''}${item.startLine ? ` at line ${item.startLine}` : ''}: “${item.snippet.slice(0, 360)}”.`;
      addClaim(claims, answerParts, fact, item.id, item.directness ?? inferDirectness(item));
    } else if (item.title && item.type !== 'co_change_history') {
      const fact = `${node.label}: ${item.title}${item.filePath ? ` (${item.filePath}${item.startLine ? `:${item.startLine}` : ''})` : ''}.`;
      addClaim(claims, answerParts, fact, item.id, item.directness ?? inferDirectness(item));
    }
  }

  if (isReasonQuestion && !evidence.some((item) => item.type === 'pull_request' || item.type === 'doc')) {
    answerParts.push('The retrieved records do not contain a linked discussion or decision document that establishes the team’s rationale. I can report what the code or commit records show, but I can’t determine why the choice was made from this evidence.');
  }
  if (!answerParts.length) {
    answerParts.push('I can’t determine an answer from the available repository evidence. Try a file path, symbol name, commit, or a more specific question.');
  }

  const hasDecisionContext = evidence.some((item) => item.type === 'pull_request' || item.type === 'doc');
  let answerMode: AskWhyResponse['answerMode'] = 'evidence_only';
  let modelNote: string | undefined = kind === 'unsupported'
    ? undefined
    : !process.env.CODEWHY_LLM_API_KEY
      ? 'AI model is not configured. This answer summarizes retrieved evidence only.'
      : isReasonQuestion && !hasDecisionContext
        ? 'AI synthesis was withheld because no linked decision record was retrieved; the answer shows only source-grounded facts.'
        : 'The configured answer service was unavailable or returned no source-backed claims; showing the evidence-only response.';
  try {
    // Avoid asking a model to invent rationale or decision evolution when no decision source was retrieved.
    const modelClaims = kind === 'unsupported' || (isReasonQuestion && !hasDecisionContext)
      ? undefined
      : await generateGroundedClaims(question, kind, evidence, recentQuestions);
    if (modelClaims?.length) {
      claims.splice(0, claims.length, ...modelClaims);
      answerParts.splice(0, answerParts.length, ...modelClaims.map((claim) => claim.text));
      answerMode = 'ai';
      modelNote = undefined;
    }
  } catch (error) {
    console.error('[askWhy] Configured answer service failed:', error instanceof Error ? error.message : 'Unknown error');
  }
  // Do not let generated text imply a rationale absent from discussion or decision records.
  if (isReasonQuestion && !evidence.some((item) => item.type === 'pull_request' || item.type === 'doc')) {
    const caution = 'The retrieved records do not contain a linked discussion or decision document that establishes the team’s rationale. I can report what the code or commit records show, but I can’t determine why the choice was made from this evidence.';
    if (!answerParts.includes(caution)) answerParts.push(caution);
  }
  const reliability = assessAnswerReliability(claims, evidence);
  const followUpQuestions = makeFollowUps(kind, retrieved.hits[0]?.node);
  return {
    requestId: crypto.randomUUID(),
    conversationId: request.conversationId || crypto.randomUUID(),
    repoId: graph.repoId,
    question,
    questionKind: kind,
    answer: answerParts.join('\n\n'),
    answerMode,
    modelNote,
    claims,
    evidence,
    reliability,
    followUpQuestions,
    isDemoData: graph.isDemo ?? false,
  };
}

interface EvidenceHit { node: GraphNode; item: EvidenceSource; score: number; }
function retrieveEvidence(graph: KnowledgeGraph, question: string, kind: AskQuestionKind, recentQuestions: string[]): { hits: EvidenceHit[]; evidence: EvidenceSource[] } {
  const retrievalText = [question, ...recentQuestions].join(' ');
  const terms = [...new Set(retrievalText.toLowerCase().match(/[a-z0-9_./-]{3,}/g) ?? [])]
    .filter((term) => !STOP_WORDS.has(term));
  const nodeScores = new Map<string, number>();
  for (const term of terms) {
    for (const result of searchGraph(graph, term, 12)) {
      nodeScores.set(result.node.id, Math.max(nodeScores.get(result.node.id) ?? 0, result.score));
    }
  }
  const scoredNodes = graph.nodes
    .filter((node) => nodeScores.has(node.id))
    .map((node) => ({ node, score: nodeScores.get(node.id) ?? 0 }))
    .sort((a, b) => b.score - a.score);

  // For relationship questions, include only explicitly connected graph evidence.
  const matchedIds = new Set(scoredNodes.slice(0, 8).map(({ node }) => node.id));
  const relatedEdges: GraphEdge[] = graph.edges.filter((edge) => matchedIds.has(edge.source) || matchedIds.has(edge.target));
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const hits: EvidenceHit[] = [];
  for (const { node, score } of scoredNodes.slice(0, 8)) {
    for (const item of node.evidence ?? []) hits.push({ node, item, score: score + (item.commitHash && kind !== 'code_explanation' ? 0.12 : 0) });
  }
  if (kind === 'dependency' || kind === 'decision_history' || kind === 'historical_reasoning' || kind === 'change_impact') {
    for (const edge of relatedEdges) {
      const node = nodeById.get(edge.source);
      if (!node) continue;
      const other = nodeById.get(edge.target);
      for (const item of edge.evidence ?? []) hits.push({ node: other ?? node, item, score: 0.35 });
    }
  }
  const unique = new Map<string, EvidenceHit>();
  for (const hit of hits) {
    if (!hit.item.id || !hit.item.title) continue;
    const prior = unique.get(hit.item.id);
    if (!prior || hit.score > prior.score) unique.set(hit.item.id, hit);
  }
  const sortedHits = [...unique.values()].sort((a, b) => b.score - a.score).slice(0, 12);
  return { hits: sortedHits, evidence: sortedHits.map(({ item }) => item) };
}

function addClaim(claims: AnswerClaim[], parts: string[], text: string, evidenceId: string, directness: AnswerClaim['directness']): void {
  claims.push({ text, evidenceIds: [evidenceId], directness });
  parts.push(text);
}

function makeFollowUps(kind: AskQuestionKind, node?: GraphNode): string[] {
  const entity = node?.label ?? 'this component';
  if (kind === 'historical_reasoning' || kind === 'decision_history') return [`Which commits changed ${entity}?`, `Is there a linked discussion or decision record for ${entity}?`];
  if (kind === 'dependency') return [`Which tests reference ${entity}?`, `Which graph relationships connect to ${entity}?`];
  if (kind === 'change_impact') return [`Which direct dependents of ${entity} have evidence?`, `Which tests are linked to ${entity}?`];
  return [`Which commits changed ${entity}?`, `What dependencies are explicitly linked to ${entity}?`];
}
