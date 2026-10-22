import { searchGraph } from '@/lib/graph/graph-query';
import type { KnowledgeGraph, GraphEdge, GraphNode } from '@/types/graph';
import type { EvidenceSource } from '@/types/evidence';
import type { AnswerClaim, AskQuestionKind, AskWhyRequest, AskWhyResponse } from '@/types/ask';
import { assessAnswerReliability, inferDirectness } from './reliability';
import { generateGroundedClaims } from './model-adapter';
import {
  searchCode,
  getSymbolDetails,
  traceDependencies,
  findRelatedTests,
  inspectFile,
  getCommitHistory,
} from './investigation-tools';

export function classifyQuestion(question: string): AskQuestionKind {
  const q = question.toLowerCase().trim();
  if (!q) return 'unsupported';
  if (/\b(what if|impact|affect|break|change|modify|remove|blast radius|ripple)\b/.test(q)) return 'change_impact';
  if (/\b(supersed|replac|revers|changed since|decision|timeline|later|history|commit|pull request|\bpr\b|author|who changed|when was)\b/.test(q)) return 'decision_history';
  if (/\b(depend|import|call|use|consumer|caller|callee|relationship|circular|connected|subsystem|graph)\b/.test(q)) return 'dependency';
  if (/\b(why|reason|rationale|intended|design choice|chosen|purpose)\b/.test(q)) return 'historical_reasoning';
  if (/\b(what does|explain|how does|where is|function|class|module|code|flow|execution|auth|security|test)\b/.test(q)) return 'code_explanation';
  return 'architecture_inquiry';
}

export async function answerRepositoryQuestion(
  graph: KnowledgeGraph,
  request: AskWhyRequest
): Promise<AskWhyResponse> {
  const question = request.question.trim();
  const kind = classifyQuestion(question);
  const recentQuestions = (request.recentQuestions ?? [])
    .filter((item) => typeof item === 'string')
    .slice(-4);

  // 1. Multi-tool Investigation Pipeline
  const investigationEvidence: EvidenceSource[] = [];
  const answerParts: string[] = [];
  const claims: AnswerClaim[] = [];

  // Step A: Search codebase symbols and files
  const searchResults = searchCode(graph.repoId, question, 8);
  const topMatch = searchResults[0];

  // Step B: Deep inspection of top matched symbols
  if (topMatch) {
    const details = getSymbolDetails(graph.repoId, topMatch.nodeId);
    if (details) {
      // Add symbol definition evidence
      if (details.node.evidence && details.node.evidence.length > 0) {
        investigationEvidence.push(...details.node.evidence);
      } else {
        investigationEvidence.push({
          id: `ev-sym-${details.node.id}`,
          type: 'file_span',
          title: `Symbol declaration of ${details.node.label}`,
          filePath: details.node.filePath,
          startLine: details.node.line || 1,
          snippet: details.node.description,
          confidenceScore: 1.0,
        });
      }

      // Add callers / dependency evidence
      if (details.directCallers.length > 0) {
        investigationEvidence.push({
          id: `ev-callers-${details.node.id}`,
          type: 'ast_relation',
          title: `Direct callers of ${details.node.label} (${details.directCallers.length} callers)`,
          filePath: details.node.filePath,
          snippet: `Invoked by: ${details.directCallers.map((c) => c.label).join(', ')}`,
          confidenceScore: 0.95,
        });
      }

      if (details.directCallees.length > 0) {
        investigationEvidence.push({
          id: `ev-callees-${details.node.id}`,
          type: 'ast_relation',
          title: `Outgoing calls from ${details.node.label}`,
          filePath: details.node.filePath,
          snippet: `Calls: ${details.directCallees.map((c) => c.label).join(', ')}`,
          confidenceScore: 0.95,
        });
      }

      // Add tests evidence if available
      if (details.tests.length > 0) {
        investigationEvidence.push({
          id: `ev-tests-${details.node.id}`,
          type: 'test_coverage',
          title: `Tests asserting ${details.node.label}`,
          filePath: details.tests[0].filePath,
          snippet: `Covered by test suites: ${details.tests.map((t) => t.label).join(', ')}`,
          confidenceScore: 1.0,
        });
      }
    }

    // Step C: Dependency trace if inquiry asks about callers, callees, or impact
    if (kind === 'dependency' || kind === 'change_impact') {
      const trace = traceDependencies(graph.repoId, topMatch.nodeId, 'both', 3);
      if (trace && (trace.upstream.length > 0 || trace.downstream.length > 0)) {
        investigationEvidence.push({
          id: `ev-trace-${topMatch.nodeId}`,
          type: 'ast_relation',
          title: `Dependency reach for ${topMatch.label}`,
          filePath: topMatch.filePath,
          snippet: `Downstream consumers: ${trace.upstream.map((u) => u.node.label).join(', ') || 'None'}. Sub-dependencies: ${trace.downstream.map((d) => d.node.label).join(', ') || 'None'}.`,
          confidenceScore: 0.9,
        });
      }
    }
  }

  // Step D: If testing is mentioned in the query, find related test suites
  if (/\b(test|failing|assert|spec|coverage)\b/i.test(question)) {
    const testResult = findRelatedTests(graph.repoId, topMatch ? topMatch.nodeId : question);
    if (testResult.testNodes.length > 0) {
      investigationEvidence.push({
        id: `ev-related-tests-${topMatch?.nodeId || 'query'}`,
        type: 'test_coverage',
        title: `Discovered Test Suites for ${topMatch?.label || 'Inquiry'}`,
        filePath: testResult.testFilePaths[0] || 'tests',
        snippet: `Associated test files: ${testResult.testFilePaths.join(', ')}`,
        confidenceScore: 0.95,
      });
    }
  }

  // Step E: If history/commits are queried, fetch commit history
  if (kind === 'decision_history' || /\b(commit|author|history|when|who)\b/i.test(question)) {
    const history = getCommitHistory(graph.repoId, topMatch?.filePath);
    if (history.commits.length > 0) {
      for (const c of history.commits.slice(0, 3)) {
        investigationEvidence.push({
          id: `ev-commit-${c.hash}`,
          type: 'commit',
          title: `Commit ${c.hash.slice(0, 7)}: ${c.message}`,
          commitHash: c.hash,
          commitMessage: c.message,
          author: c.author,
          timestamp: c.timestamp,
          confidenceScore: 0.95,
        });
      }
    }
  }

  // Step F: Supplemental evidence from keyword graph matching
  const legacyRetrieved = retrieveEvidence(graph, question, kind, recentQuestions);
  for (const item of legacyRetrieved.evidence) {
    if (!investigationEvidence.some((e) => e.id === item.id)) {
      investigationEvidence.push(item);
    }
  }

  // Deduplicate and decorate evidence items
  const uniqueEvidence = Array.from(
    new Map(investigationEvidence.map((e) => [e.id, e])).values()
  ).map((item) => ({
    ...item,
    directness: item.directness ?? inferDirectness(item),
    freshness: item.freshness ?? 'unknown',
    isSimulatedDemoData: item.isSimulatedDemoData ?? graph.isDemo ?? false,
  }));

  // Build baseline deterministic claims from investigation tools
  if (topMatch) {
    const fact = `AST Analysis identifies ${topMatch.label} in ${topMatch.filePath}${topMatch.line ? `:${topMatch.line}` : ''} (${topMatch.description || 'Source component'}).`;
    addClaim(claims, answerParts, fact, uniqueEvidence[0]?.id || `ev-${topMatch.nodeId}`, 'direct');

    const details = getSymbolDetails(graph.repoId, topMatch.nodeId);
    if (details?.directCallers.length) {
      const callerFact = `${topMatch.label} is invoked by ${details.directCallers.length} component(s): ${details.directCallers.map((c) => c.label).join(', ')}.`;
      addClaim(claims, answerParts, callerFact, uniqueEvidence[0]?.id || `ev-${topMatch.nodeId}`, 'direct');
    }
    if (details?.directCallees.length) {
      const calleeFact = `${topMatch.label} calls ${details.directCallees.length} downstream component(s): ${details.directCallees.map((c) => c.label).join(', ')}.`;
      addClaim(claims, answerParts, calleeFact, uniqueEvidence[0]?.id || `ev-${topMatch.nodeId}`, 'direct');
    }
  } else {
    // General repository context if no specific symbol was singled out
    answerParts.push(
      `Investigated repository '${graph.repoName}' across ${graph.nodes.length} nodes and ${graph.edges.length} relationships.`
    );
  }

  let answerMode: AskWhyResponse['answerMode'] = 'evidence_only';
  let modelNote: string | undefined = !process.env.SARVAM_API_KEY
    ? 'Sarvam AI is not configured. Add SARVAM_API_KEY in .env to enable real-time 105B AI reasoning. Showing verified AST & graph facts.'
    : undefined;
  let sarvamDetails: AskWhyResponse['sarvamDetails'] = undefined;

  // 2. Invoke Sarvam AI if configured
  if (process.env.SARVAM_API_KEY) {
    try {
      const { querySarvamAI } = await import('@/lib/sarvam/sarvam-client');
      const sarvamResult = await querySarvamAI({
        question,
        questionKind: kind,
        evidence: uniqueEvidence,
        repoName: graph.repoName,
        recentQuestions,
      });

      if (sarvamResult.success && sarvamResult.structuredResponse) {
        const sr = sarvamResult.structuredResponse;
        if (sr.answer && sr.answer.trim()) {
          answerParts.splice(0, answerParts.length, sr.answer.trim());
          answerMode = 'ai';
          modelNote = `Verified explanation generated by Sarvam AI (${sarvamResult.model}) from AST and code evidence.`;

          sarvamDetails = {
            model: sarvamResult.model,
            reasoningSummary: sr.reasoning_summary,
            limitations: sr.limitations,
            suggestedNextSteps: sr.suggested_next_steps,
          };

          if (sr.reasoning_summary) {
            claims.push({
              text: sr.reasoning_summary,
              evidenceIds: uniqueEvidence.slice(0, 3).map((e) => e.id),
              directness: 'direct',
            });
          }

          if (Array.isArray(sr.evidence)) {
            for (const ev of sr.evidence) {
              if (ev.citationText) {
                claims.push({
                  text: ev.citationText,
                  evidenceIds: ev.id ? [ev.id] : uniqueEvidence.slice(0, 1).map((e) => e.id),
                  directness: 'direct',
                });
              }
            }
          }
        }
      } else if (sarvamResult.error) {
        modelNote = `Sarvam AI note: ${sarvamResult.error}`;
      }
    } catch (sarvamErr) {
      console.warn('[askWhy] Sarvam AI query failed, falling back to evidence:', sarvamErr);
    }
  }

  // 3. Fallback to generic model adapter if Sarvam did not answer but generic key is present
  if (answerMode === 'evidence_only' && process.env.CODEWHY_LLM_API_KEY) {
    try {
      const modelClaims = await generateGroundedClaims(question, kind, uniqueEvidence, recentQuestions);
      if (modelClaims?.length) {
        claims.splice(0, claims.length, ...modelClaims);
        answerParts.splice(0, answerParts.length, ...modelClaims.map((claim) => claim.text));
        answerMode = 'ai';
        modelNote = undefined;
      }
    } catch (error) {
      console.error('[askWhy] Generic answer service fallback failed:', error);
    }
  }

  const reliability = assessAnswerReliability(claims, uniqueEvidence);
  const baseFollowUps = makeFollowUps(kind, topMatch ? graph.nodes.find((n) => n.id === topMatch.nodeId) : undefined);
  const followUpQuestions = sarvamDetails?.suggestedNextSteps?.length
    ? [...sarvamDetails.suggestedNextSteps.slice(0, 3), ...baseFollowUps].slice(0, 4)
    : baseFollowUps;

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
    evidence: uniqueEvidence,
    reliability,
    followUpQuestions,
    isDemoData: graph.isDemo ?? false,
    sarvamDetails,
    neo4jGrounded: Boolean(graph.isDemo === false),
  };
}

const STOP_WORDS = new Set([
  'about', 'after', 'again', 'against', 'does', 'from', 'have', 'into', 'itself',
  'more', 'most', 'other', 'over', 'same', 'should', 'that', 'their', 'there',
  'these', 'they', 'this', 'through', 'under', 'what', 'when', 'where', 'which',
  'while', 'with', 'would', 'could', 'why', 'how', 'was', 'were', 'the', 'and',
  'for', 'are', 'can', 'not', 'you', 'your'
]);

interface LegacyEvidenceHit {
  node: GraphNode;
  item: EvidenceSource;
  score: number;
}

function retrieveEvidence(
  graph: KnowledgeGraph,
  question: string,
  kind: AskQuestionKind,
  recentQuestions: string[]
): { hits: LegacyEvidenceHit[]; evidence: EvidenceSource[] } {
  const retrievalText = [question, ...recentQuestions].join(' ');
  const terms = [...new Set(retrievalText.toLowerCase().match(/[a-z0-9_./-]{3,}/g) ?? [])].filter(
    (term) => !STOP_WORDS.has(term)
  );

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

  const matchedIds = new Set(scoredNodes.slice(0, 8).map(({ node }) => node.id));
  const relatedEdges: GraphEdge[] = graph.edges.filter(
    (edge) => matchedIds.has(edge.source) || matchedIds.has(edge.target)
  );
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const hits: LegacyEvidenceHit[] = [];

  for (const { node, score } of scoredNodes.slice(0, 8)) {
    for (const item of node.evidence ?? []) {
      hits.push({
        node,
        item,
        score: score + (item.commitHash && kind !== 'code_explanation' ? 0.12 : 0),
      });
    }
  }

  for (const edge of relatedEdges) {
    const node = nodeById.get(edge.source);
    if (!node) continue;
    const other = nodeById.get(edge.target);
    for (const item of edge.evidence ?? []) {
      hits.push({ node: other ?? node, item, score: 0.35 });
    }
  }

  const unique = new Map<string, LegacyEvidenceHit>();
  for (const hit of hits) {
    if (!hit.item.id || !hit.item.title) continue;
    const prior = unique.get(hit.item.id);
    if (!prior || hit.score > prior.score) unique.set(hit.item.id, hit);
  }

  const sortedHits = [...unique.values()].sort((a, b) => b.score - a.score).slice(0, 10);
  return { hits: sortedHits, evidence: sortedHits.map(({ item }) => item) };
}

function addClaim(
  claims: AnswerClaim[],
  parts: string[],
  text: string,
  evidenceId: string,
  directness: AnswerClaim['directness']
): void {
  claims.push({ text, evidenceIds: [evidenceId], directness });
  parts.push(text);
}

function makeFollowUps(kind: AskQuestionKind, node?: GraphNode): string[] {
  const entity = node?.label ?? 'this component';
  if (kind === 'historical_reasoning' || kind === 'decision_history') {
    return [
      `Which commits modified ${entity}?`,
      `What were the key architectural motivations behind ${entity}?`,
      `Which components depend on ${entity}?`,
    ];
  }
  if (kind === 'dependency') {
    return [
      `Which automated tests assert ${entity}?`,
      `What happens downstream if ${entity} fails?`,
      `What files does ${entity} import?`,
    ];
  }
  if (kind === 'change_impact') {
    return [
      `Which direct callers of ${entity} need migration?`,
      `What test coverage exists for ${entity}?`,
      `Are there breaking interface risks with ${entity}?`,
    ];
  }
  return [
    `Which files call ${entity}?`,
    `What tests exercise ${entity}?`,
    `Explain the complete execution flow of ${entity}.`,
  ];
}
