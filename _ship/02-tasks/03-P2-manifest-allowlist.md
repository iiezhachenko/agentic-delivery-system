# Task P2 — Manifest + allowlist (leak guard)

> SELF-CONTAINED. Everything inline.

## Register (binds task + every file you write)
Terse caveman. Substance stays, fluff dies. [thing] [action] [reason]. Literal/uncorrupted: JSON keys+values, identifiers, code syntax.

## Context — what system is
**Agentic Delivery Pipeline (ADP)** ships as npm package `agentic-delivery-pipeline`. `manifest.json` = SINGLE SOURCE OF TRUTH for both pack (maintainer builds tarball) and install (`adp init`). Pack COPIES ONLY manifest-listed files → ALLOWLIST not blacklist → build scaffolding + self-host content CANNOT leak by accident. This repo is ADP-on-itself; must not ship self-host internals as if they were user content.

## Runtime split — what SHIPS vs STAYS (the allowlist law)
Rule: include = "pipeline READS it to act on a foreign project." Exclude = "input that PRODUCED the prompts."

**SHIP (allowlist rows):**
| src (repo) | payload path (dest) | harness | note |
|---|---|---|---|
| `prompts/0*/<ROLE>.md` (39 roles) | `prompts/<phase>/<ROLE>.md` | all | THE deliverable |
| `prompts/_step-runner.md` | `prompts/_step-runner.md` | all | executor |
| `prompts/_economy-audit.md` | `prompts/_economy-audit.md` | all | Layer-2 auditor |
| `prompts/_orchestrator.generic.md` (P0.2) | `prompts/_orchestrator.md` | all | **path-map**: generic sibling → canonical name |
| `code-canon/*.md` EXCEPT `agentic-delivery-pipeline.md` | `code-canon/*.md` | all | whole stack lib (today: `typescript.md`) |
| `tools/economy-lint/{lint,selftest}.mjs` + `README.md` | same | all | Layer-1 gate, zero-dep |
| `tools/fixtures/economy-lint/reference.md` | same | all | selftest golden |
| `tools/economy-audit/README.md` | same | all | auditor doc |
| `docs/generic-usage-guide.md`, `docs/generic-workflow.md` | `docs/*` | all | operator docs |
| `canon/CLAUDE.generic.md` (P0.1) | `canon/CLAUDE.generic.md` | all | generic always-on rules |
| `adapters/claude/**` (P1.1) | `adapters/claude/**` | claude | Claude wiring |
| `adapters/kiro/**` (P1.2) | `adapters/kiro/**` | kiro | Kiro wiring |

**EXCLUDE (stay in repo for devs, NEVER packed):**
`.aprd .adr .hld .roadmap _fixtures _test_bench* _ship _brownfield-feature` · `code-canon/agentic-delivery-pipeline.md` (self-host stack) · `docs/self-host-*` · ALL self-host wiring (`.claude/skills/self-host`, `.claude/agents/step-runner.md`, `.kiro/agents/selfhost.json`, `.kiro/agents/step.json`, self-host steering) · self-host `prompts/_orchestrator.md` · root `CLAUDE.md`.

## Scope

### P2.1 — `manifest.json` schema
`{ version, files:[ {src, path, sha256, harness} ], harness-matrix }`.
- `src` = repo source path. `path` = payload dest path. Separate fields ENABLE path-mapping (e.g. `prompts/_orchestrator.generic.md`→`prompts/_orchestrator.md`) so generic siblings ship under canonical names WITHOUT renaming self-host originals.
- `sha256` = hash of `src` content (integrity for install re-hash).
- `harness` ∈ {`all`,`claude`,`kiro`} — which adapter set a file belongs to.
- `harness-matrix` = which paths install per harness.

### P2.2 — generator script (e.g. `tools/pack/gen-manifest.mjs`)
Zero-dep (node:fs/path/crypto only — match lint tool). Walk the SHIP allowlist rows above, sha256 each `src`, tag harness, emit path-mapped dest, write `manifest.json`. Must be allowlist-driven (enumerate includes), NEVER walk-all-then-blacklist.

### P2.3 — version derive
semver = `git describe` + content-hash(`prompts/`) + lock-hash. Lock-hash = hash of `*.lock` files → pins which frozen-artifact generation produced this build (audit trail). Embed in `manifest.version`.

## Steps
1. Read this allowlist; confirm src files exist (`ls` the SHIP rows). Note P0/P1 outputs (`_orchestrator.generic.md`, `CLAUDE.generic.md`, `adapters/`) must exist first.
2. Author `manifest.json` schema doc/sample + generator script.
3. Run generator → `manifest.json`.
4. Verify: `grep -iE '\.aprd|\.adr/|\.hld|\.roadmap|_fixtures|_test_bench|agentic-delivery-pipeline\.md|self-host|selfhost|/CLAUDE\.md"' manifest.json` → EMPTY (no exclude term).
5. Run generator twice on clean tree → byte-identical `manifest.json` (sha256 reproducible).

## Done-bar
- Generator emits `manifest.json` listing ONLY allowlist SHIP files.
- grep manifest for any EXCLUDE term = empty.
- sha256 reproducible across two runs on clean tree.
- Path-mapping present: `_orchestrator.generic.md`→`prompts/_orchestrator.md`, `CLAUDE.generic.md`→canonical dest.

## Deps
Needs P0 (lists re-skinned files) + ideally P1 (lists adapter files). Parallel with P1. Feeds P3 (installer reads manifest) + P4 (pack walks manifest).
