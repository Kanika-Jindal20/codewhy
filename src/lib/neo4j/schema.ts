import { runCypherQuery } from './driver';
import { isNeo4jConfigured } from './config';

/**
 * Neo4j Schema Definitions for CodeWhy Codebase Knowledge Graph
 *
 * Node Labels:
 * - Repository: Top-level repository metadata
 * - File: Source or configuration files
 * - Function: Functions, methods, or procedures
 * - Class: Classes or struct definitions
 * - Module: Internal submodules or external package references
 * - Test: Automated tests (unit, integration, contract)
 * - Configuration: Configuration files or gateway rules
 *
 * Relationship Types:
 * - CONTAINS: Parent contains child (e.g. Repository -> File, File -> Function)
 * - IMPORTS: Source file imports another file or module
 * - CALLS: Function calls another function
 * - DEPENDS_ON: Generic architectural dependency
 * - TESTS: Test verifies behavior of component
 * - CONFIGURES: Configuration drives component
 * - CO_CHANGED: Historical commit co-change relation
 * - SUPERSEDES: Later decision or implementation supersedes earlier one
 */

export const NODE_LABELS = {
  REPOSITORY: 'Repository',
  FILE: 'File',
  FUNCTION: 'Function',
  CLASS: 'Class',
  MODULE: 'Module',
  TEST: 'Test',
  CONFIGURATION: 'Configuration',
  ENTITY: 'Entity', // Base label for all graph components
} as const;

export const RELATIONSHIP_TYPES = {
  CONTAINS: 'CONTAINS',
  IMPORTS: 'IMPORTS',
  CALLS: 'CALLS',
  DEPENDS_ON: 'DEPENDS_ON',
  TESTS: 'TESTS',
  CONFIGURES: 'CONFIGURES',
  CO_CHANGED: 'CO_CHANGED',
  SUPERSEDES: 'SUPERSEDES',
} as const;

/**
 * Initializes schema constraints and indexes to prevent duplicates and ensure fast lookups.
 * Uses idempotent Cypher (CREATE CONSTRAINT IF NOT EXISTS / CREATE INDEX IF NOT EXISTS).
 */
export async function ensureNeo4jSchema(): Promise<{
  success: boolean;
  appliedConstraints: string[];
  error?: string;
}> {
  if (!isNeo4jConfigured()) {
    return {
      success: false,
      appliedConstraints: [],
      error: 'Neo4j is not configured.',
    };
  }

  const statements = [
    // 1. Uniqueness constraint for Repositories
    {
      name: 'constraint_repository_id',
      query: `CREATE CONSTRAINT constraint_repository_id IF NOT EXISTS
              FOR (r:${NODE_LABELS.REPOSITORY}) REQUIRE r.id IS UNIQUE`,
    },
    // 2. Composite uniqueness constraint for Entity (repoId + id)
    {
      name: 'constraint_entity_key',
      query: `CREATE CONSTRAINT constraint_entity_key IF NOT EXISTS
              FOR (e:${NODE_LABELS.ENTITY}) REQUIRE (e.repoId, e.id) IS UNIQUE`,
    },
    // 3. Fast lookup indexes for common queries
    {
      name: 'index_entity_repo_type',
      query: `CREATE INDEX index_entity_repo_type IF NOT EXISTS
              FOR (e:${NODE_LABELS.ENTITY}) ON (e.repoId, e.type)`,
    },
    {
      name: 'index_entity_filepath',
      query: `CREATE INDEX index_entity_filepath IF NOT EXISTS
              FOR (e:${NODE_LABELS.ENTITY}) ON (e.repoId, e.filePath)`,
    },
    {
      name: 'index_entity_label',
      query: `CREATE INDEX index_entity_label IF NOT EXISTS
              FOR (e:${NODE_LABELS.ENTITY}) ON (e.label)`,
    },
  ];

  const applied: string[] = [];

  try {
    for (const stmt of statements) {
      await runCypherQuery(stmt.query, {}, { write: true });
      applied.push(stmt.name);
    }

    return {
      success: true,
      appliedConstraints: applied,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[Neo4j Schema] Constraint creation note:', message);
    return {
      success: false,
      appliedConstraints: applied,
      error: message,
    };
  }
}
