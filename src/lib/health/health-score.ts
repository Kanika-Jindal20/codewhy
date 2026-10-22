import { KnowledgeGraph, GraphNode } from '@/types/graph';
import { getRepositoryGraph, getActiveRepositoryGraph } from '@/lib/graph/graph-store';

export interface ArchitectureHealthMetric {
  id: string;
  name: string;
  score: number; // 0 - 100
  weight: number;
  status: 'healthy' | 'moderate' | 'critical';
  formulaExplanation: string;
  measuredData: Record<string, any>;
  isHeuristicEstimate: boolean;
  contributingComponents: Array<{
    id: string;
    label: string;
    filePath: string;
    impact: string;
  }>;
}

export interface ArchitectureHealthReport {
  repoId: string;
  repoName: string;
  timestamp: string;
  overallScore: number; // 0 - 100
  tier: 'Optimal' | 'Maintainable' | 'Elevated Risk' | 'Critical Debt';
  metrics: ArchitectureHealthMetric[];
  circularDependencies: string[][];
  topBottlenecks: Array<{
    nodeId: string;
    label: string;
    filePath: string;
    dependentsCount: number;
    hasTests: boolean;
    debtPoints: number;
  }>;
  summaryExplanation: string;
}

/**
 * Computes an explainable Architecture Health Score strictly from verified graph data.
 */
export function calculateArchitectureHealth(repoId?: string): ArchitectureHealthReport {
  const graph = (repoId ? getRepositoryGraph(repoId) : undefined) || getActiveRepositoryGraph();

  // 1. In-degree and Out-degree Map
  const inDegreeMap = new Map<string, number>();
  const outDegreeMap = new Map<string, number>();
  const nodeMap = new Map<string, GraphNode>(graph.nodes.map((n) => [n.id, n]));

  for (const edge of graph.edges) {
    outDegreeMap.set(edge.source, (outDegreeMap.get(edge.source) || 0) + 1);
    inDegreeMap.set(edge.target, (inDegreeMap.get(edge.target) || 0) + 1);
  }

  // 2. Circular Dependencies Detection (DFS cycle finder)
  const circularDependencies: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function detectCycle(currentId: string, path: string[]) {
    visited.add(currentId);
    recursionStack.add(currentId);
    path.push(nodeMap.get(currentId)?.label || currentId);

    const outgoing = graph.edges.filter((e) => e.source === currentId);
    for (const edge of outgoing) {
      if (!visited.has(edge.target)) {
        detectCycle(edge.target, [...path]);
      } else if (recursionStack.has(edge.target)) {
        const cycleStartLabel = nodeMap.get(edge.target)?.label || edge.target;
        const cycleStartIndex = path.indexOf(cycleStartLabel);
        if (cycleStartIndex !== -1) {
          circularDependencies.push([...path.slice(cycleStartIndex), cycleStartLabel]);
        }
      }
    }

    recursionStack.delete(currentId);
  }

  for (const node of graph.nodes) {
    if (!visited.has(node.id)) {
      detectCycle(node.id, []);
    }
  }

  // Deduplicate cycles
  const uniqueCycles: string[][] = [];
  const seenCycleStrings = new Set<string>();
  for (const c of circularDependencies) {
    const str = c.join('->');
    if (!seenCycleStrings.has(str)) {
      seenCycleStrings.add(str);
      uniqueCycles.push(c);
    }
  }

  // 3. Test Coverage Calculation
  const testEdges = graph.edges.filter((e) => e.type === 'tests');
  const testedNodeIds = new Set(testEdges.map((e) => e.target));
  const testableNodes = graph.nodes.filter(
    (n) => (n.type === 'function' || n.type === 'class' || n.type === 'file') && !n.label.includes('test')
  );
  const testedCount = testableNodes.filter((n) => testedNodeIds.has(n.id)).length;
  const testScore = testableNodes.length > 0 ? Math.round((testedCount / testableNodes.length) * 100) : 100;

  // 4. Coupling and Complexity Score
  const totalInDegrees = Array.from(inDegreeMap.values()).reduce((a, b) => a + b, 0);
  const avgCoupling = graph.nodes.length > 0 ? totalInDegrees / graph.nodes.length : 0;
  // Lower avg coupling is better: > 3 coupling deducts score
  const couplingScore = Math.max(0, Math.min(100, Math.round(100 - avgCoupling * 18)));

  // 5. Circular Dependency Score (100 - 25 points per cycle)
  const circularScore = Math.max(0, 100 - uniqueCycles.length * 25);

  // 6. Documentation & Schema Completeness
  const docNodes = graph.nodes.filter((n) => n.type === 'file' || n.type === 'config' || n.type === 'class');
  const documentedNodes = docNodes.filter((n) => (n.description && n.description.length >= 25) || n.evidence?.length);
  const docScore = docNodes.length > 0 ? Math.round((documentedNodes.length / docNodes.length) * 100) : 100;

  // 7. Identify Top Bottlenecks
  const topBottlenecks: ArchitectureHealthReport['topBottlenecks'] = [];
  for (const node of graph.nodes) {
    if (node.type === 'file' || node.type === 'function' || node.type === 'class') {
      const dependentsCount = inDegreeMap.get(node.id) || 0;
      const hasTests = testedNodeIds.has(node.id);
      if (dependentsCount >= 2) {
        let debtPoints = dependentsCount * 12;
        if (!hasTests) debtPoints += 30;
        topBottlenecks.push({
          nodeId: node.id,
          label: node.label,
          filePath: node.filePath,
          dependentsCount,
          hasTests,
          debtPoints,
        });
      }
    }
  }
  topBottlenecks.sort((a, b) => b.debtPoints - a.debtPoints);

  // 8. Weighted Composite Health Score
  // Formula: Test Coverage (35%) + Coupling Control (30%) + Cycle Freedom (20%) + Documentation (15%)
  const overallScore = Math.round(
    testScore * 0.35 +
    couplingScore * 0.30 +
    circularScore * 0.20 +
    docScore * 0.15
  );

  let tier: ArchitectureHealthReport['tier'] = 'Optimal';
  if (overallScore < 50) tier = 'Critical Debt';
  else if (overallScore < 70) tier = 'Elevated Risk';
  else if (overallScore < 85) tier = 'Maintainable';

  const metrics: ArchitectureHealthMetric[] = [
    {
      id: 'metric-tests',
      name: 'Automated Test Verification',
      score: testScore,
      weight: 0.35,
      status: testScore >= 80 ? 'healthy' : testScore >= 50 ? 'moderate' : 'critical',
      formulaExplanation: `(Tested Components: ${testedCount} / Total Testable: ${testableNodes.length}) × 100`,
      measuredData: { testedCount, totalTestable: testableNodes.length },
      isHeuristicEstimate: false,
      contributingComponents: testableNodes
        .filter((n) => !testedNodeIds.has(n.id))
        .slice(0, 4)
        .map((n) => ({
          id: n.id,
          label: n.label,
          filePath: n.filePath,
          impact: `Untested symbol with ${inDegreeMap.get(n.id) || 0} callers`,
        })),
    },
    {
      id: 'metric-coupling',
      name: 'Coupling & Blast Radius Control',
      score: couplingScore,
      weight: 0.30,
      status: couplingScore >= 75 ? 'healthy' : couplingScore >= 50 ? 'moderate' : 'critical',
      formulaExplanation: `Max(0, 100 - (Avg Fan-in: ${avgCoupling.toFixed(1)} × 18))`,
      measuredData: { avgCoupling: Number(avgCoupling.toFixed(2)), totalEdges: graph.edges.length },
      isHeuristicEstimate: false,
      contributingComponents: topBottlenecks.slice(0, 3).map((b) => ({
        id: b.nodeId,
        label: b.label,
        filePath: b.filePath,
        impact: `Hub component with ${b.dependentsCount} direct dependents`,
      })),
    },
    {
      id: 'metric-cycles',
      name: 'Circular Dependency Freedom',
      score: circularScore,
      weight: 0.20,
      status: uniqueCycles.length === 0 ? 'healthy' : uniqueCycles.length === 1 ? 'moderate' : 'critical',
      formulaExplanation: `Max(0, 100 - (Detected Cycle Loops: ${uniqueCycles.length} × 25))`,
      measuredData: { cycleCount: uniqueCycles.length },
      isHeuristicEstimate: false,
      contributingComponents: uniqueCycles.slice(0, 2).map((c, idx) => ({
        id: `cycle-${idx}`,
        label: `Cycle Loop #${idx + 1}`,
        filePath: c.join(' → '),
        impact: 'Bidirectional dependency creates tight coupling and testing hurdles',
      })),
    },
    {
      id: 'metric-docs',
      name: 'Architectural Documentation & JSDoc',
      score: docScore,
      weight: 0.15,
      status: docScore >= 70 ? 'healthy' : docScore >= 40 ? 'moderate' : 'critical',
      formulaExplanation: `(Documented Symbols: ${documentedNodes.length} / Total Tracked: ${docNodes.length}) × 100`,
      measuredData: { documentedCount: documentedNodes.length, totalCount: docNodes.length },
      isHeuristicEstimate: true,
      contributingComponents: docNodes
        .filter((n) => !documentedNodes.some((dn) => dn.id === n.id))
        .slice(0, 3)
        .map((n) => ({
          id: n.id,
          label: n.label,
          filePath: n.filePath,
          impact: 'Lacks JSDoc or architectural schema documentation',
        })),
    },
  ];

  const summaryExplanation = `Architecture Health for '${graph.repoName}' stands at ${overallScore}/100 (${tier}). Measured across ${graph.nodes.length} nodes and ${graph.edges.length} relationships. Test coverage is ${testScore}%, average coupling is ${avgCoupling.toFixed(1)} dependents/node, and ${uniqueCycles.length} circular loops were detected.`;

  return {
    repoId: graph.repoId,
    repoName: graph.repoName,
    timestamp: new Date().toISOString(),
    overallScore,
    tier,
    metrics,
    circularDependencies: uniqueCycles,
    topBottlenecks: topBottlenecks.slice(0, 5),
    summaryExplanation,
  };
}
