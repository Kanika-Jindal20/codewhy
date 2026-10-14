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

## Analysis Limitations & Honesty Standards

In adherence to CodeWhy's core engineering principles:
1. **Dynamic Reflection**: Runtime `eval()`, dynamic `import(variable)`, or untyped JSON payload transformations cannot be deterministically resolved via static AST.
2. **Co-Change Statistical Nature**: Frequent commit co-change indicates historical developer workflow correlation, not necessarily hard functional coupling.
3. **Calibrated Language**: Components are classified as *potentially affected*. CodeWhy never asserts that code *will definitely break* without runtime test execution evidence.
