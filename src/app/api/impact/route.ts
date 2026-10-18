import { NextRequest, NextResponse } from 'next/server';
import { getRepositoryGraph, SAMPLE_REPO_ECOMMERCE } from '@/lib/graph/graph-store';
import { analyzeChangeImpact } from '@/lib/impact/impact-service';
import { ChangeCategory, ImpactAnalysisRequest } from '@/types/impact';

const VALID_CATEGORIES: ChangeCategory[] = [
  'breaking_interface',
  'internal_refactor',
  'deprecation',
  'config_alteration',
  'dependency_update',
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repoId, targetNodeId, changeCategory, proposedChangeDescription, maxTransitiveDepth } = body;

    // Validation
    if (!targetNodeId) {
      return NextResponse.json(
        { error: "Validation Error: 'targetNodeId' is required." },
        { status: 400 }
      );
    }

    if (changeCategory && !VALID_CATEGORIES.includes(changeCategory)) {
      return NextResponse.json(
        { 
          error: `Validation Error: Invalid changeCategory '${changeCategory}'. Must be one of: ${VALID_CATEGORIES.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Lookup repository graph (falls back to default sample if not found or empty)
    const graph = getRepositoryGraph(repoId) || SAMPLE_REPO_ECOMMERCE;

    const request: ImpactAnalysisRequest = {
      repoId: graph.repoId,
      targetNodeId,
      changeCategory: changeCategory || 'breaking_interface',
      proposedChangeDescription: proposedChangeDescription || 'Refactoring component contract and behavior',
      maxTransitiveDepth: maxTransitiveDepth ? Math.min(Number(maxTransitiveDepth), 6) : 4,
    };

    // 1. Try Neo4j-backed impact analysis first if configured
    try {
      const { analyzeChangeImpactInNeo4j } = await import('@/lib/neo4j/neo4j-impact-service');
      const neo4jResult = await analyzeChangeImpactInNeo4j(request);
      if (neo4jResult) {
        return NextResponse.json(neo4jResult, { status: 200 });
      }
    } catch (neo4jErr) {
      console.warn('[/api/impact] Neo4j traversal fallback:', neo4jErr);
    }

    // 2. Fallback to in-memory graph traversal
    const targetExists = graph.nodes.some(n => n.id === targetNodeId);
    if (!targetExists) {
      return NextResponse.json(
        { 
          error: `Component '${targetNodeId}' not found in repository '${graph.repoId}'.`,
          availableComponents: graph.nodes.map(n => ({ id: n.id, label: n.label, type: n.type }))
        },
        { status: 404 }
      );
    }

    const analysis = analyzeChangeImpact(graph, request);

    return NextResponse.json(analysis, { status: 200 });
  } catch (error: any) {
    console.error('Impact analysis error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error during impact analysis', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const repoId = searchParams.get('repoId') || 'repo-commerce-core';
  const targetNodeId = searchParams.get('targetNodeId') || 'node-auth-jwt';
  const changeCategory = (searchParams.get('category') as ChangeCategory) || 'breaking_interface';
  const description = searchParams.get('description') || 'Evaluate component blast radius';

  const graph = getRepositoryGraph(repoId) || SAMPLE_REPO_ECOMMERCE;
  const targetExists = graph.nodes.some(n => n.id === targetNodeId);

  if (!targetExists) {
    return NextResponse.json(
      { error: `Component '${targetNodeId}' not found.` },
      { status: 404 }
    );
  }

  const analysis = analyzeChangeImpact(graph, {
    repoId,
    targetNodeId,
    changeCategory,
    proposedChangeDescription: description,
    maxTransitiveDepth: 4,
  });

  return NextResponse.json(analysis, { status: 200 });
}
