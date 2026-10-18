import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseSourceFilesToGraph, SourceFileInput } from '@/lib/neo4j/code-parser';
import { isNeo4jConfigured, getNeo4jConfig, getNeo4jStatusMessage } from '@/lib/neo4j/config';
import { verifyNeo4jConnection, runCypherQuery } from '@/lib/neo4j/driver';

describe('Neo4j AST Code Parser', () => {
  it('should parse JavaScript/TypeScript files into graph nodes and relationships', () => {
    const files: SourceFileInput[] = [
      {
        filePath: 'src/services/billing.ts',
        content: `
          import { calculateTax } from '../utils/tax';

          export class BillingManager {
            chargeUser(userId: string, amount: number) {
              const tax = calculateTax(amount);
              return amount + tax;
            }
          }
        `,
      },
      {
        filePath: 'src/utils/tax.ts',
        content: `
          export function calculateTax(amount: number): number {
            return amount * 0.18;
          }
        `,
      },
      {
        filePath: 'tests/billing.test.ts',
        content: `
          import { BillingManager } from '../src/services/billing';

          describe('Billing', () => {
            it('charges user with tax', () => {
              const manager = new BillingManager();
              expect(manager.chargeUser('123', 100)).toBe(118);
            });
          });
        `,
      },
    ];

    const graph = parseSourceFilesToGraph('repo-test', 'test-repo', files);

    // Verify nodes
    expect(graph.nodes.length).toBeGreaterThan(0);
    const fileNodes = graph.nodes.filter(n => n.type === 'file');
    const testNodes = graph.nodes.filter(n => n.type === 'test');
    const funcNodes = graph.nodes.filter(n => n.type === 'function');
    const classNodes = graph.nodes.filter(n => n.type === 'class');

    expect(fileNodes.length).toBe(2); // billing.ts and tax.ts
    expect(testNodes.length).toBe(1); // billing.test.ts
    expect(funcNodes.length).toBeGreaterThanOrEqual(1); // calculateTax
    expect(classNodes.length).toBeGreaterThanOrEqual(1); // BillingManager

    // Verify relationships
    expect(graph.edges.length).toBeGreaterThan(0);
    const imports = graph.edges.filter(e => e.type === 'imports');
    const calls = graph.edges.filter(e => e.type === 'calls');
    const tests = graph.edges.filter(e => e.type === 'tests');
    const extendsEdges = graph.edges.filter(e => e.type === 'extends');

    expect(imports.length).toBeGreaterThanOrEqual(1);
    expect(calls.length).toBeGreaterThanOrEqual(1);
    expect(tests.length).toBeGreaterThanOrEqual(1);
    expect(extendsEdges.length).toBeGreaterThanOrEqual(1);
  });

  it('should generate valid file and test edges with evidence metadata', () => {
    const files: SourceFileInput[] = [
      {
        filePath: 'src/index.ts',
        content: `console.log("hello world");`,
      },
    ];

    const graph = parseSourceFilesToGraph('repo-simple', 'simple-repo', files);
    expect(graph.nodes.length).toBe(1);
    expect(graph.nodes[0].evidence?.length).toBeGreaterThan(0);
    expect(graph.nodes[0].evidence?.[0].filePath).toBe('src/index.ts');
  });
});

describe('Neo4j Configuration & Fallback Management', () => {
  const origEnv = process.env;

  beforeEach(() => {
    process.env = { ...origEnv };
  });

  afterEach(() => {
    process.env = origEnv;
  });

  it('should report not configured when variables are missing', () => {
    delete process.env.NEO4J_URI;
    delete process.env.NEO4J_USERNAME;
    delete process.env.NEO4J_PASSWORD;

    expect(isNeo4jConfigured()).toBe(false);
    expect(getNeo4jConfig()).toBeNull();
    const status = getNeo4jStatusMessage();
    expect(status.configured).toBe(false);
    expect(status.message).toContain('Missing environment variables');
  });

  it('should report configured when all required variables are present', () => {
    process.env.NEO4J_URI = 'bolt://localhost:7687';
    process.env.NEO4J_USERNAME = 'neo4j';
    process.env.NEO4J_PASSWORD = 'password123';
    process.env.NEO4J_DATABASE = 'custom_db';

    expect(isNeo4jConfigured()).toBe(true);
    const config = getNeo4jConfig();
    expect(config).not.toBeNull();
    expect(config?.uri).toBe('bolt://localhost:7687');
    expect(config?.user).toBe('neo4j');
    expect(config?.database).toBe('custom_db');

    const status = getNeo4jStatusMessage();
    expect(status.configured).toBe(true);
    expect(status.message).toContain('bolt://localhost:7687');
  });

  it('should gracefully handle verification failure when Neo4j is unconfigured', async () => {
    delete process.env.NEO4J_URI;
    delete process.env.NEO4J_USERNAME;
    delete process.env.NEO4J_PASSWORD;

    const res = await verifyNeo4jConnection();
    expect(res.connected).toBe(false);
    expect(res.error).toBeDefined();
    expect(res.error).toContain('not configured');
  });

  it('should throw an informative error when trying to run query on unconfigured driver', async () => {
    delete process.env.NEO4J_URI;
    delete process.env.NEO4J_USERNAME;
    delete process.env.NEO4J_PASSWORD;

    await expect(runCypherQuery('MATCH (n) RETURN n LIMIT 1')).rejects.toThrow(
      'Neo4j driver is not available'
    );
  });
});
