import { runCypherQuery } from './driver';
import { isNeo4jConfigured } from './config';
import { ensureNeo4jSchema, NODE_LABELS, RELATIONSHIP_TYPES } from './schema';
import { KnowledgeGraph, GraphNode, GraphEdge, NodeType, EdgeType } from '@/types/graph';

/**
 * Saves a KnowledgeGraph model into Neo4j using idempotent Cypher MERGE commands.
 * Guarantees no duplicate entities or relationships are created upon re-indexing.
 */
export async function saveGraphToNeo4j(graph: KnowledgeGraph): Promise<{
  success: boolean;
  nodesIndexed: number;
  edgesIndexed: number;
  error?: string;
}> {
  if (!isNeo4jConfigured()) {
    return { success: false, nodesIndexed: 0, edgesIndexed: 0, error: 'Neo4j is not configured.' };
  }

  try {
    // 1. Ensure constraints and indexes exist
    await ensureNeo4jSchema();

    // 2. Merge Repository node
    await runCypherQuery(
      `MERGE (r:${NODE_LABELS.REPOSITORY} {id: $repoId})
       SET r.name = $repoName,
           r.updatedAt = $updatedAt,
           r.isDemo = $isDemo`,
      {
        repoId: graph.repoId,
        repoName: graph.repoName,
        updatedAt: graph.updatedAt,
        isDemo: Boolean(graph.isDemo),
      },
      { write: true }
    );

    // 3. Batch Merge Nodes
    const nodeBatches = chunkArray(graph.nodes, 100);
    for (const batch of nodeBatches) {
      const cypher = `
        UNWIND $batch AS item
        MERGE (n:${NODE_LABELS.ENTITY} {repoId: $repoId, id: item.id})
        SET n.label = item.label,
            n.type = item.type,
            n.filePath = coalesce(item.filePath, ''),
            n.line = coalesce(item.line, 0),
            n.description = coalesce(item.description, ''),
            n.loc = coalesce(item.metadata.loc, 0),
            n.language = coalesce(item.metadata.language, 'typescript')
        WITH n, item
        // Dynamically link to Repository
        MATCH (r:${NODE_LABELS.REPOSITORY} {id: $repoId})
        MERGE (r)-[:${RELATIONSHIP_TYPES.CONTAINS}]->(n)
      `;

      await runCypherQuery(
        cypher,
        {
          repoId: graph.repoId,
          batch: batch.map(n => ({
            id: n.id,
            label: n.label,
            type: n.type,
            filePath: n.filePath || '',
            line: n.line || 0,
            description: n.description || '',
            metadata: n.metadata || {},
          })),
        },
        { write: true }
      );
    }

    // 4. Batch Merge Edges with dynamic relationship types
    const edgeBatches = chunkArray(graph.edges, 100);
    for (const batch of edgeBatches) {
      for (const edge of batch) {
        const relType = mapEdgeTypeToCypherRel(edge.type);
        const cypher = `
          MATCH (source:${NODE_LABELS.ENTITY} {repoId: $repoId, id: $sourceId})
          MATCH (target:${NODE_LABELS.ENTITY} {repoId: $repoId, id: $targetId})
          MERGE (source)-[r:${relType} {id: $edgeId}]->(target)
          SET r.type = $edgeType,
              r.label = $label
        `;

        await runCypherQuery(
          cypher,
          {
            repoId: graph.repoId,
            sourceId: edge.source,
            targetId: edge.target,
            edgeId: edge.id,
            edgeType: edge.type,
            label: edge.label || edge.type,
          },
          { write: true }
        );
      }
    }

    return {
      success: true,
      nodesIndexed: graph.nodes.length,
      edgesIndexed: graph.edges.length,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Neo4j] Failed to save graph:', message);
    return {
      success: false,
      nodesIndexed: 0,
      edgesIndexed: 0,
      error: message,
    };
  }
}

/**
 * Retrieves the complete knowledge graph for a repository from Neo4j.
 */
export async function getGraphFromNeo4j(repoId: string): Promise<KnowledgeGraph | null> {
  if (!isNeo4jConfigured()) {
    return null;
  }

  try {
    // 1. Get repository metadata
    const repoRecords = await runCypherQuery<{
      id: string;
      name: string;
      updatedAt?: string;
      isDemo?: boolean;
    }>(
      `MATCH (r:${NODE_LABELS.REPOSITORY} {id: $repoId})
       RETURN r.id AS id, r.name AS name, r.updatedAt AS updatedAt, r.isDemo AS isDemo`,
      { repoId }
    );

    if (repoRecords.length === 0) {
      return null;
    }

    const repoMeta = repoRecords[0];

    // 2. Fetch all nodes for this repository
    const nodeRecords = await runCypherQuery<{
      id: string;
      label: string;
      type: string;
      filePath?: string;
      line?: number;
      description?: string;
      language?: string;
      loc?: number;
    }>(
      `MATCH (n:${NODE_LABELS.ENTITY} {repoId: $repoId})
       RETURN n.id AS id, n.label AS label, n.type AS type,
              n.filePath AS filePath, n.line AS line,
              n.description AS description, n.language AS language, n.loc AS loc`,
      { repoId }
    );

    const nodes: GraphNode[] = nodeRecords.map(r => ({
      id: r.id,
      label: r.label,
      type: (r.type as NodeType) || 'file',
      filePath: r.filePath ?? '',
      line: r.line || undefined,
      description: r.description || undefined,
      metadata: {
        language: r.language || 'typescript',
        loc: r.loc || undefined,
      },
    }));

    // 3. Fetch all relationships
    const edgeRecords = await runCypherQuery<{
      id: string;
      source: string;
      target: string;
      type: string;
      label?: string;
    }>(
      `MATCH (source:${NODE_LABELS.ENTITY} {repoId: $repoId})-[r]->(target:${NODE_LABELS.ENTITY} {repoId: $repoId})
       RETURN coalesce(r.id, id(r)) AS id, source.id AS source, target.id AS target,
              coalesce(r.type, type(r)) AS type, r.label AS label`,
      { repoId }
    );

    const edges: GraphEdge[] = edgeRecords.map(r => ({
      id: String(r.id),
      source: r.source,
      target: r.target,
      type: (r.type.toLowerCase() as EdgeType) || 'calls',
      label: r.label || r.type,
    }));

    return {
      repoId: repoMeta.id,
      repoName: repoMeta.name,
      updatedAt: repoMeta.updatedAt || new Date().toISOString(),
      isDemo: Boolean(repoMeta.isDemo),
      nodes,
      edges,
    };
  } catch (err: unknown) {
    console.error('[Neo4j] getGraphFromNeo4j failed:', err);
    return null;
  }
}

/**
 * Retrieves a neighborhood around a specific node using Cypher path traversal.
 */
export async function getNeighborhoodFromNeo4j(
  repoId: string,
  nodeId: string,
  hops: number = 1,
  limit: number = 40
): Promise<{
  nodes: GraphNode[];
  edges: GraphEdge[];
  truncated: boolean;
} | null> {
  if (!isNeo4jConfigured()) {
    return null;
  }

  const safeHops = Math.max(1, Math.min(hops, 3));
  const safeLimit = Math.max(1, Math.min(limit, 100));

  try {
    const cypher = `
      MATCH (center:${NODE_LABELS.ENTITY} {repoId: $repoId, id: $nodeId})
      OPTIONAL MATCH path = (center)-[r*1..${safeHops}]-(neighbor:${NODE_LABELS.ENTITY} {repoId: $repoId})
      WITH center, collect(path) AS paths
      UNWIND (CASE WHEN size(paths) = 0 THEN [null] ELSE paths END) AS p
      WITH center,
           collect(DISTINCT center) + collect(DISTINCT last(nodes(p))) AS allNodes,
           collect(DISTINCT last(relationships(p))) AS allRels
      RETURN
        [n IN allNodes WHERE n IS NOT NULL | {
          id: n.id,
          label: n.label,
          type: n.type,
          filePath: n.filePath,
          line: n.line,
          description: n.description,
          language: n.language,
          loc: n.loc
        }][0..${safeLimit}] AS nodes,
        [rel IN allRels WHERE rel IS NOT NULL | {
          id: coalesce(rel.id, toString(id(rel))),
          source: startNode(rel).id,
          target: endNode(rel).id,
          type: coalesce(rel.type, type(rel)),
          label: rel.label
        }][0..${safeLimit}] AS edges,
        size(allNodes) > ${safeLimit} AS truncated
    `;

    const records = await runCypherQuery<{
      nodes: Array<{
        id: string;
        label: string;
        type: string;
        filePath?: string;
        line?: number;
        description?: string;
        language?: string;
        loc?: number;
      }>;
      edges: Array<{
        id: string;
        source: string;
        target: string;
        type: string;
        label?: string;
      }>;
      truncated: boolean;
    }>(cypher, { repoId, nodeId });

    if (records.length === 0 || !records[0].nodes || records[0].nodes.length === 0) {
      return null;
    }

    const row = records[0];
    const nodes: GraphNode[] = row.nodes.map(n => ({
      id: n.id,
      label: n.label,
      type: (n.type as NodeType) || 'file',
      filePath: n.filePath ?? '',
      line: n.line || undefined,
      description: n.description || undefined,
      metadata: {
        language: n.language || 'typescript',
        loc: n.loc || undefined,
      },
    }));

    const edges: GraphEdge[] = row.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: (e.type.toLowerCase() as EdgeType) || 'calls',
      label: e.label || e.type,
    }));

    return {
      nodes,
      edges,
      truncated: row.truncated,
    };
  } catch (err) {
    console.error('[Neo4j] getNeighborhoodFromNeo4j error:', err);
    return null;
  }
}

/**
 * Cypher-backed search across node labels and file paths.
 */
export async function searchGraphInNeo4j(
  repoId: string,
  query: string,
  limit: number = 20
): Promise<GraphNode[] | null> {
  if (!isNeo4jConfigured()) {
    return null;
  }

  try {
    const cypher = `
      MATCH (n:${NODE_LABELS.ENTITY} {repoId: $repoId})
      WHERE toLower(n.label) CONTAINS toLower($query)
         OR toLower(n.filePath) CONTAINS toLower($query)
         OR toLower(n.description) CONTAINS toLower($query)
      RETURN n.id AS id, n.label AS label, n.type AS type,
             n.filePath AS filePath, n.line AS line,
             n.description AS description, n.language AS language
      LIMIT $limit
    `;

    const records = await runCypherQuery<{
      id: string;
      label: string;
      type: string;
      filePath?: string;
      line?: number;
      description?: string;
      language?: string;
    }>(cypher, { repoId, query: query.trim(), limit: Math.min(limit, 50) });

    return records.map(r => ({
      id: r.id,
      label: r.label,
      type: (r.type as NodeType) || 'file',
      filePath: r.filePath ?? '',
      line: r.line || undefined,
      description: r.description || undefined,
      metadata: { language: r.language || 'typescript' },
    }));
  } catch (err) {
    console.error('[Neo4j] searchGraphInNeo4j error:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function mapEdgeTypeToCypherRel(edgeType: EdgeType | string): string {
  switch (edgeType) {
    case 'imports': return RELATIONSHIP_TYPES.IMPORTS;
    case 'calls': return RELATIONSHIP_TYPES.CALLS;
    case 'extends': return 'EXTENDS';
    case 'implements': return 'IMPLEMENTS';
    case 'tests': return RELATIONSHIP_TYPES.TESTS;
    case 'configures': return RELATIONSHIP_TYPES.CONFIGURES;
    case 'co_changed': return RELATIONSHIP_TYPES.CO_CHANGED;
    case 'supersedes': return RELATIONSHIP_TYPES.SUPERSEDES;
    default: return RELATIONSHIP_TYPES.DEPENDS_ON;
  }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
