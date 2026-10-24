import { NextRequest, NextResponse } from 'next/server';
import { getRepositoryGraph, getActiveRepositoryGraph } from '@/lib/graph/graph-store';

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const repoId = sp.get('repoId') || req.cookies.get('codewhy_active_repo_id')?.value;
    const graph = repoId ? getRepositoryGraph(repoId) || getActiveRepositoryGraph() : getActiveRepositoryGraph();

    const gaps: Array<{
      id: string;
      title: string;
      component: string;
      filePath: string;
      rule: string;
      severity: 'high' | 'medium' | 'low';
      description: string;
      developerImpact: string;
      suggestedRemediation: string;
    }> = [];

    // 1. Untested Core Files / Functions
    const testEdges = graph.edges.filter(e => e.type === 'tests');
    const testedNodeIds = new Set(testEdges.map(e => e.target));

    for (const node of graph.nodes) {
      if (node.type === 'file' || node.type === 'function') {
        const isTested = testedNodeIds.has(node.id) || node.label.includes('test');
        if (!isTested && (node.metadata?.isExported || node.type === 'file')) {
          gaps.push({
            id: `gap-untested-${node.id}`,
            title: `Untested Symbol: ${node.label}`,
            component: node.label,
            filePath: node.filePath || 'codebase',
            rule: 'Untested Contract Dependency',
            severity: node.metadata?.tags?.includes('critical') || node.metadata?.tags?.includes('security') ? 'high' : 'medium',
            description: `${node.label} in ${node.filePath || 'source'} has incoming callers but no detected automated test suite.`,
            developerImpact: 'Changes to this symbol cannot be verified automatically during CI regression runs.',
            suggestedRemediation: `Add a unit/integration test suite covering ${node.label} in tests/.`,
          });
        }
      }

      // 2. Undocumented Decisions / Configs
      if (node.type === 'config' && (!node.description || node.description.length < 20)) {
        gaps.push({
          id: `gap-undoc-config-${node.id}`,
          title: `Undocumented Configuration: ${node.label}`,
          component: node.label,
          filePath: node.filePath || 'config',
          rule: 'Undocumented Architectural Specification',
          severity: 'medium',
          description: `Configuration file ${node.label} lacks architectural documentation or schema specification.`,
          developerImpact: 'New team members cannot verify allowed keys or gateway routing rules.',
          suggestedRemediation: `Document configuration parameters and expected schema values in docs/ or README.`,
        });
      }
    }

    return NextResponse.json({
      repoId: graph.repoId,
      repoName: graph.repoName,
      isDemoData: Boolean(graph.isDemo),
      gaps: gaps.slice(0, 15),
      totalGaps: gaps.length,
      highCount: gaps.filter(g => g.severity === 'high').length,
      mediumCount: gaps.filter(g => g.severity === 'medium').length,
    }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to analyze knowledge gaps.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
