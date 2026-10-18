/**
 * Neo4j Configuration & Environment Validator
 *
 * Reads connection settings from environment variables:
 * - NEO4J_URI: e.g. neo4j://localhost:7687 or neo4j+s://<dbid>.databases.neo4j.io
 * - NEO4J_USERNAME: e.g. neo4j
 * - NEO4J_PASSWORD: database password
 * - NEO4J_DATABASE: database name, defaults to "neo4j"
 */

export interface Neo4jConfig {
  uri: string;
  user: string;
  password: string;
  database: string;
}

export function isNeo4jConfigured(): boolean {
  const uri = process.env.NEO4J_URI?.trim();
  const user = process.env.NEO4J_USERNAME?.trim();
  const password = process.env.NEO4J_PASSWORD?.trim();

  return Boolean(uri && user && password);
}

export function getNeo4jConfig(): Neo4jConfig | null {
  if (!isNeo4jConfigured()) {
    return null;
  }

  return {
    uri: process.env.NEO4J_URI!.trim(),
    user: process.env.NEO4J_USERNAME!.trim(),
    password: process.env.NEO4J_PASSWORD!.trim(),
    database: process.env.NEO4J_DATABASE?.trim() || 'neo4j',
  };
}

export function getNeo4jStatusMessage(): {
  configured: boolean;
  message: string;
  help?: string;
} {
  if (isNeo4jConfigured()) {
    const config = getNeo4jConfig()!;
    // Mask password, only show URI and database
    return {
      configured: true,
      message: `Configured for ${config.uri} (database: ${config.database})`,
    };
  }

  const missing: string[] = [];
  if (!process.env.NEO4J_URI) missing.push('NEO4J_URI');
  if (!process.env.NEO4J_USERNAME) missing.push('NEO4J_USERNAME');
  if (!process.env.NEO4J_PASSWORD) missing.push('NEO4J_PASSWORD');

  return {
    configured: false,
    message: `Neo4j is not configured. Missing environment variables: ${missing.join(', ')}`,
    help: 'To connect Neo4j, set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD in your .env file or environment.',
  };
}
