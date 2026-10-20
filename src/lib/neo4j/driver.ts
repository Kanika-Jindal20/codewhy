import neo4j, { Driver, Session, type Integer } from 'neo4j-driver';
import { getNeo4jConfig, isNeo4jConfigured } from './config';

let driverInstance: Driver | null = null;

/**
 * Returns the singleton Neo4j driver instance.
 * Reuses the connection pool across requests.
 */
export function getNeo4jDriver(): Driver | null {
  const config = getNeo4jConfig();
  if (!config) {
    return null;
  }

  if (!driverInstance) {
    try {
      driverInstance = neo4j.driver(
        config.uri,
        neo4j.auth.basic(config.user, config.password),
        {
          maxConnectionPoolSize: 50,
          connectionTimeout: 10_000,
          connectionAcquisitionTimeout: 15_000,
        }
      );
    } catch (err) {
      console.error('[Neo4j] Failed to initialize driver:', err);
      driverInstance = null;
    }
  }

  return driverInstance;
}

/**
 * Verifies live connection to Neo4j.
 * Runs a lightweight Cypher statement (RETURN 1 AS ping) to verify authentication and connectivity.
 */
export async function verifyNeo4jConnection(): Promise<{
  connected: boolean;
  serverInfo?: string;
  database?: string;
  error?: string;
}> {
  if (!isNeo4jConfigured()) {
    return {
      connected: false,
      error: 'Neo4j credentials are not configured in environment variables (NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD).',
    };
  }

  const driver = getNeo4jDriver();
  if (!driver) {
    return {
      connected: false,
      error: 'Could not instantiate Neo4j driver with the provided settings.',
    };
  }

  const config = getNeo4jConfig()!;
  let session: Session | null = null;
  try {
    session = driver.session({ database: config.database });
    const result = await session.run('RETURN 1 AS ping, datetime() AS serverTime');
    const serverInfo = await driver.getServerInfo();

    return {
      connected: true,
      serverInfo: `${serverInfo.agent || 'Neo4j'} (${serverInfo.address || config.uri})`,
      database: config.database,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[Neo4j] Verification failed:', message);
    return {
      connected: false,
      error: message,
    };
  } finally {
    if (session) {
      await session.close();
    }
  }
}

/**
 * Safely executes a parameterized Cypher query with automatic session lifecycle management.
 * Guarantees session is closed even if the query throws.
 */
export async function runCypherQuery<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {},
  options: { write?: boolean; database?: string } = {}
): Promise<T[]> {
  const driver = getNeo4jDriver();
  if (!driver) {
    throw new Error('Neo4j driver is not available. Please verify your connection configuration.');
  }

  const config = getNeo4jConfig()!;
  const database = options.database || config.database;
  const session = driver.session({
    database,
    defaultAccessMode: options.write ? neo4j.session.WRITE : neo4j.session.READ,
  });

  try {
    const result = await session.run(cypher, params);
    return result.records.map((rec) => {
      const obj =  {} as Record<string, any>;
      for (const key of rec.keys) {
        // Normalize neo4j Integers to plain numbers if applicable
        if(typeof key !== 'string')continue;
        const val = rec.get(key);
        obj[key] = normalizeNeo4jValue(val);
        }
      return obj as T;
    });
  } finally {
    await session.close();
  }
}

/**
 * Normalizes Neo4j types (like neo4j.Integer, Node, Relationship) into plain JSON-serializable primitives.
 */
function normalizeNeo4jValue(val: unknown): unknown {
  if (val === null || val === undefined) return val;
  if (neo4j.isInt(val)) return (val as Integer).toNumber();
  if (Array.isArray(val)) return val.map(normalizeNeo4jValue);
  if (typeof val === 'object') {
    // If it's a Neo4j Node or Relationship with properties
    const obj = val as Record<string, unknown>;
    if ('properties' in obj && typeof obj.properties === 'object' && obj.properties !== null) {
      return normalizeNeo4jValue(obj.properties);
    }
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      clean[k] = normalizeNeo4jValue(v);
    }
    return clean;
  }
  return val;
}

/**
 * Closes driver connections gracefully.
 */
export async function closeNeo4jDriver(): Promise<void> {
  if (driverInstance) {
    try {
      await driverInstance.close();
    } finally {
      driverInstance = null;
    }
  }
}
