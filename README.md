# CodeWhy

> AI-powered codebase intelligence that explains why code exists by connecting source code, Git history, and engineering decisions.

CodeWhy is an engineering decision intelligence platform designed to help developers understand not only *what* code contains, but *why* it was designed that way, how decisions evolved, what evidence supports those decisions, and what could happen if the code changes.

---

## Features Implemented

### Feature 7: Pre-Change Impact Analysis ("What If We Change This?")
- **Target Selection**: Select files, functions, classes, modules, configs, or test suites.
- **Change Categories**:
  - `breaking_interface`: Signature alteration, parameter changes, return model shifts.
  - `internal_refactor`: Logic changes preserving public interface contracts.
  - `deprecation`: Marking APIs obsolete with phased migration notices.
  - `config_alteration`: Altering environment variables, schemas, or routing flags.
  - `dependency_update`: Upgrading internal or third-party packages.
- **Multilayered Blast Radius Detection**:
  - **Direct Dependents**: Components directly importing or invoking target symbols.
  - **Transitive Consumers**: Downstream consumers across customizable hops (up to 6) with cycle detection.
  - **Test Suite Mapping**: AST links and convention-based test suites covering the component.
  - **Configuration Schemas**: Associated `.env`, config objects, and gateway definitions.
  - **Git Co-Change History**: Files frequently committed together in past Git history.
  - **Historical Regressions**: Commit citations for past bugfixes and reverts in this module.
- **Three-Way Intelligence Separation**:
  - **Static AST Analysis**: Deterministic, syntax-derived import and call relationships.
  - **History & Heuristics**: Statistical coupling derived from Git logs.
  - **AI / Rule Interpretation**: Synthesized risks, verification checklists, and edge-case warnings.
- **Visual Propagation Graph**:
  - Interactive SVG dependency path explorer with zoom/pan and accessible tabular view.
- **Evidence Drawer**:
  - Inspect exact file spans, lines `#L..`, commit hashes, authors, and recommended pre-commit checklists.

### Feature 8: Missing Knowledge and Documentation Gaps
- **Knowledge Debt Score**:
  - Prioritization heuristic calculated transparently:
    $$\text{Debt Points} = \sum (\text{Critical} \times 15 + \text{High} \times 10 + \text{Medium} \times 5 + \text{Low} \times 2)$$
    $$\text{Score} = \min\left(100, \text{Round}\left(\frac{\text{Debt Points}}{80} \times 100\right)\right)$$
  - Never fabricated: unanalysed repositories return explicit unanalysed states.
  - Tiers: `Healthy (0-24)`, `Moderate (25-49)`, `Elevated (50-74)`, `Critical (75-100)`.
- **Measurable Repository Signals**:
  - `undocumented_architectural_decision`: Git commit architectural migrations lacking matching ADR in `docs/adr/`.
  - `complex_undocumented_module`: Components $\ge 150$ LOC lacking high-level overview.
  - `high_churn_sparse_docs`: Files touched in $\ge 3$ recent commits without companion documentation.
  - `undocumented_public_api`: Exported functions lacking JSDoc parameter/return annotations.
  - `unexplained_dependency`: Critical external dependencies without recorded rationale.
  - `stale_todo_marker`: Unresolved TODO/FIXME markers in production paths.
- **Deduplication Rule**:
  - Prevents double-counting by deduplicating findings across `(filePath, category)`.
- **Interactive Remediation**:
  - Filterable by category, severity, status, and directory.
  - Actionable improvement suggestions with copy-ready Markdown and JSDoc templates.
  - Detail drawer with verifiable file spans and commit citations.

### Feature 11: Explainable Architecture Explorer
- **Interactive Knowledge Graph Canvas**:
  - SVG-based hardware-friendly interactive graph workspace with pan, zoom (0.3x–2.0x), reset, and full-screen controls.
  - Pure TypeScript force-directed layout engine (Fruchterman-Reingold) with deterministic positioning.
  - Visual differentiation of entities (`file`, `module`, `function`, `class`, `test`, `config`, `decision`, `commit`) and relationship semantics (`imports`, `calls`, `extends`, `implements`, `tests`, `configures`, `co_changed`, `supersedes`).
- **Entity Detail Panel & Provenance**:
  - Detailed breakdown of selected node: entity type, path, line numbers, signature, LOC, tags, and summary.
  - Factual relationship explanations that avoid implied causality.
  - Distinguishes verified AST-derived links from heuristic/inferred historical suggestions.
  - Direct provenance citations to file spans, AST nodes, and Git commit records.
  - Action link to launch Pre-Change Impact Analysis directly from any architecture node.
- **Search, Filtering, and Neighborhood Exploration**:
  - Type-ahead search bar with debounced query scoring across labels, file paths, and descriptions.
  - Real-time client-side filters for node types and edge types.
  - Neighborhood expansion on double-click to dynamically append reachable nodes.
  - Breadcrumb navigation trail allowing one-click back-navigation.
- **Accessible Table Alternative**:
  - Full screen-reader accessible tabular view conforming to WAI-ARIA grid/table standards.
### Feature 12: Engineering Decision Report PDF Export
- **Authoritative Technical Decision Documents**:
  - Publication-grade PDF generator engineered with `jspdf` and `jspdf-autotable` in pure TypeScript/Node.
  - Generates multi-page vector reports with running headers, page numbers (`Page X of Y`), clickable remote source links, and clear section hierarchies.
  - Light-mode design specifically formatted for executive decision-making and cross-team sharing (white background, dark headings, restrained blue/purple accents).
- **Comprehensive Report Contents**:
  - Executive summary with risk tier indicator and critical takeaways.
  - Scope and problem statement mapping target files and change categories.
  - Audited findings and architectural reasoning with severity categorization.
  - Architecture context detailing direct callers, transitive consumers, and connected symbols.
  - Blast radius and downstream impact analysis with risk tables and dependency propagation counts.
  - Historical decision timeline with commit citations and status flags.
  - Knowledge and documentation gap findings with transparently calculated debt scores.
  - Traceable evidence references with clickable source links, line numbers, and confidence metrics.
  - Disclosed uncertainties and conflicting heuristic signals.
  - Limitations, methodological caveats, and mandatory pre-deployment verification checklists.
- **Honesty & Explainability Standard**:
  - Empty headings for unavailable features are completely suppressed.
  - Missing metadata or findings are never fabricated.
  - Non-causality guarantees ensure statistical co-change history is clearly distinguished from verified AST dependencies.
- **Interactive UI & Customization**:
  - Export modal on `/reports` and directly inside the `/impact` workspace.
### Feature 13: Investigation Memory and Follow-up Questions
- **Investigation Persistence & History**:
  - Preserves full engineering investigation context: original inquiry, chronological Q&A thread entries, synthesized answer summaries, detailed findings, and traceable evidence citations.
  - Searchable investigation workspace with debounced text search, status filters (`All`, `Active`, `Archived`), and repository selection.
  - Inline title renaming, archive/restore lifecycle toggles, and permanent deletion with confirmation dialogs.
- **Context-Aware Follow-up Question Engine**:
  - Suggests specific, grounded next questions based on touched modules and repository AST (e.g., test suites, commit histories, downstream callers, and architectural ADRs).
  - Answers follow-up inquiries with grounded findings and concrete evidence cards, appending entries in chronological order.
- **Active Stale-Evidence Detection**:
  - Revalidates referenced evidence upon reopening an investigation.
  - Detects when cited commits have been superseded by subsequent changes touching the same files in Git history, rendering warning banners with exact commit citations.
- **Data Privacy & Ownership Boundaries**:
  - Private investigations are strictly isolated by owner ID. Unauthorized attempts to view, modify, or delete another user's private investigation return HTTP 403 Forbidden.
  - No secret tokens, credentials, or raw repository blobs are persisted—only AST symbols, line ranges, and commit hashes.
- **Cross-Feature Traceability Links**:
  - Direct bi-directional links between investigations, Pre-Change Impact Analysis (`/impact`), Architecture Explorer (`/architecture`), and Decision Reports (`/reports`).

---

## Design System & Styling Tokens

CodeWhy implements a technical, high-density dark-themed engineering dashboard:

| Token | Hex Value | Usage |
|---|---|---|
| App Background | `#0B1020` | Root workspace backdrop |
| Primary Panel | `#111827` | Main sidebar, cards, and toolbars |
| Secondary Surface | `#172033` | Elevated buttons, inputs, metrics |
| Slate Border | `#273449` | Subtle structural division |
| Primary Text | `#F3F6FC` | Crisp white typography |
| Secondary Text | `#A7B2C4` | Slate prose and descriptions |
| Muted Text | `#78869B` | Metadata, tags, line numbers |
| Primary Accent | `#6485F5` | Engineering blue buttons, active tabs |
| Secondary Accent | `#9B8AFB` | Commit hashes, git provenance |
| Status Success | `#35B88A` | Verified AST links, active tests |
| Status Warning | `#E7B65C` | Knowledge gaps, tentative assumptions |
| Status Error | `#F07878` | High impact, breaking changes |
| Status Info | `#64B5F6` | Informational references |

---

## Getting Started

### Prerequisites
- Node.js `v20+` or `v24+`
- npm `v10+`

### Installation
```bash
# Clone the repository
git clone https://github.com/Kanika-Jindal20/codewhy.git
cd codewhy

# Install dependencies
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Tests
```bash
# Run unit and integration test suite
npm test
```

### Production Build
```bash
npm run build
npm start
```

---

## Analysis & Graph Limitations

In adherence to CodeWhy's core engineering principles and explainability standards:
1. **Scoped Query Limits**: To prevent browser memory exhaustion, repository graphs are never loaded monolithically. Queries default to 1-hop neighborhoods capped at 40 nodes (hard ceiling: 80 nodes). Neighborhood expansion is performed progressively.
2. **Dynamic Reflection**: Runtime `eval()`, dynamic `import(variable)`, or untyped JSON payload transformations cannot be deterministically resolved via static AST and require explicit test coverage.
3. **Non-Causality of Graph Edges**: Graph connectivity demonstrates relationship structure, not causality. Co-change edges represent statistical co-commit frequency, not guaranteed causal bugs or logical coupling.
4. **Verified vs. Inferred Relationships**: AST and static syntax links are marked with High Confidence ($\ge 0.90$), whereas commit heuristics or naming-convention matches are marked as Inferred with lower confidence.
5. **Calibrated Language**: Components are classified as *potentially affected*. CodeWhy never asserts that code *will definitely break* without runtime test execution evidence.

