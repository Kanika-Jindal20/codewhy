# CodeWhy — Neo4j & Sarvam AI Integration & Setup Guide

Welcome to **CodeWhy**'s production integration guide for **Neo4j** (Codebase Knowledge Graph) and **Sarvam AI** (Evidence-Grounded Engineering Explanations).

---

## 1. Architecture Overview

CodeWhy combines AST code parsing, graph database traversal, and large language model reasoning:

```
┌─────────────────────────────────┐
│     Codebase (TS/JS Files)      │
└────────────────┬────────────────┘
                 │
                 ▼ TypeScript Compiler AST Parser
┌─────────────────────────────────┐
│      Graph Entity Extractor     │
│   (Files, Functions, Classes,   │
│     Tests, Imports, Calls)      │
└────────────────┬────────────────┘
                 │
                 ▼ Idempotent MERGE Cypher Queries
┌─────────────────────────────────┐
│        Neo4j Graph Database     │
│  - Architecture Explorer        │
│  - Blast Radius Impact Analysis │
│  - Multi-hop Traversal          │
└────────────────┬────────────────┘
                 │
                 ▼ Grounded AST & Graph Evidence
┌─────────────────────────────────┐
│       Sarvam AI (sarvam-105b)   │
│  - Official Chat Completions    │
│  - Structured JSON Explanation  │
│  - Citation & Claim Guardrails  │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│    Interactive Developer UI     │
│  - Ask Why Engineering Engine   │
│  - Architecture Graph View      │
│  - Impact Blast Radius View     │
└─────────────────────────────────┘
```

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env` (or `.env.local` for Next.js):

```bash
cp .env.example .env
```

### Required Configuration Fields:

```dotenv
# ==========================================
# 1. Neo4j Knowledge Graph Configuration
# ==========================================
# For Local Neo4j Desktop or Docker:
NEO4J_URI=neo4j://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_neo4j_password
NEO4J_DATABASE=neo4j

# For Neo4j AuraDB (Cloud):
# NEO4J_URI=neo4j+s://<dbid>.databases.neo4j.io
# NEO4J_USERNAME=neo4j
# NEO4J_PASSWORD=<generated-aura-password>
# NEO4J_DATABASE=neo4j

# ==========================================
# 2. Sarvam AI Configuration
# ==========================================
# Sign up at https://sarvam.ai/
SARVAM_API_KEY=your_sarvam_api_key_here
SARVAM_MODEL=sarvam-105b
SARVAM_API_ENDPOINT=https://api.sarvam.ai/v1/chat/completions
```

---

## 3. Setting Up Neo4j

You can run Neo4j using either **Docker**, **Neo4j Desktop**, or **Neo4j AuraDB (Free Cloud)**.

### Option A: Local Docker (Recommended for quick testing)

```bash
docker run -d \
  --name codewhy-neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password123 \
  -e NEO4J_PLUGINS='["apoc"]' \
  neo4j:5-community
```
Once started, access the Neo4j Browser UI at [http://localhost:7474](http://localhost:7474) (Username: `neo4j`, Password: `password123`).

### Option B: Neo4j AuraDB (Cloud)
1. Go to [https://neo4j.com/cloud/platform/aura-graph-database/](https://neo4j.com/cloud/platform/aura-graph-database/) and create a free AuraDB instance.
2. Download your connection credentials.
3. Set `NEO4J_URI=neo4j+s://<your-instance-id>.databases.neo4j.io`, username, and password in your `.env` file.

---

## 4. Setting Up Sarvam AI

1. Create an account on the [Sarvam AI Platform](https://sarvam.ai/).
2. Navigate to your API Keys dashboard and copy your subscription key.
3. Paste the key as `SARVAM_API_KEY` in your `.env` file.
4. The system automatically defaults to `sarvam-105b`, utilizing the official endpoint `https://api.sarvam.ai/v1/chat/completions`.

---

## 5. How CodeWhy Indexes Codebases into Neo4j

CodeWhy parses codebases into a semantic knowledge graph with the following schema:

### Node Labels
- `Repository`: Top-level codebase repository identifier.
- `File`: Source code files (`.ts`, `.tsx`, `.js`, etc.).
- `Function`: Function declarations, arrow functions, and exported helpers.
- `Class`: Class declarations and services.
- `Module`: Logical modules and packages.
- `Test`: Test suites and test files (`.test.ts`, `.spec.ts`).
- `Configuration`: Config files (`tsconfig.json`, `package.json`, etc.).
- `CodeEntity`: General label attached to all code symbols for unified indexing.

### Relationship Types
- `CONTAINS`: `(Repository)-[:CONTAINS]->(File)` and `(File)-[:CONTAINS]->(Function/Class)`
- `IMPORTS`: `(File)-[:IMPORTS]->(File)`
- `CALLS`: `(Function)-[:CALLS]->(Function)`
- `TESTS`: `(Test)-[:TESTS]->(File/Function)`
- `CONFIGURES`: `(Configuration)-[:CONFIGURES]->(File/Module)`
- `EXTENDS`: Class inheritance relations

### Triggering Indexing
1. **Via UI**: Navigate to the **Repositories** page (`/repos`) and click the **"Index into Neo4j"** button on any repository.
2. **Via API**: POST to `/api/repositories/index`:
```bash
curl -X POST http://localhost:3000/api/repositories/index \
  -H "Content-Type: application/json" \
  -d '{
    "repoId": "repo-billing-engine",
    "repoName": "Billing & Subscription Engine",
    "files": [
      {
        "filePath": "src/services/billing.ts",
        "content": "import { tax } from \"./tax\"; export function charge() { tax(); }"
      },
      {
        "filePath": "src/services/tax.ts",
        "content": "export function tax() { return 0.18; }"
      }
    ]
  }'
```

---

## 6. How Sarvam AI & Neo4j Work Together in "Ask Why"

When a developer asks a question on `/ask` (e.g. *"Why is tax computed before credit card authorization?"*):

1. **Graph Traversal & AST Extraction**: CodeWhy queries Neo4j for the target file/function, its upstream callers, downstream dependencies, and associated test suites.
2. **Evidence Packaging**: The matched AST snippets, commit messages, and dependency relationships are packaged into structured JSON evidence.
3. **Sarvam AI Prompt**: The evidence and user query are forwarded to `sarvam-105b` with strict guardrails:
   - Ground every statement strictly in the provided AST/graph evidence.
   - Forbid hallucinating unobserved functions or files.
   - Return structured engineering JSON.
4. **Reliability Scoring**: The response is parsed, verified against known graph entities, and displayed in the UI with a "Grounded with Neo4j" badge and clickable evidence cards.

---

## 7. Graceful Fallbacks

If `NEO4J_URI` or `SARVAM_API_KEY` are not set:
- **Neo4j Fallback**: The app continues to operate using its built-in in-memory sample knowledge graph with full AST mock traversals.
- **Sarvam AI Fallback**: The app falls back to rule-based claim extraction and AST evidence compilation, while displaying a helpful setup banner in the UI.

---

## 8. Verification & Running Tests

To verify that all integrations and unit tests pass:

```bash
npm test -- --run
```

All 82 tests (including `tests/neo4j.test.ts` and `tests/sarvam.test.ts`) should pass with 100% green status.
