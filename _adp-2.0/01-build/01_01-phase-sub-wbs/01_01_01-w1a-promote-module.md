# SUB-W1a-A1 — promote fixture module → real module + retire/fold CF fixtures

> Atomic task. SELF-CONTAINED — all context inline. Register: caveman; structural data (ids, paths, module path) literal.

## Context — Phase SUB (substrate)

ADP 2.0 = full rewrite of ADP into Go. Deliverable = deployed Go MCP engine. **Delivery root = `_adp-2.0/_deliverables/adp-2.0-code/`** (engine SOURCE repo; ≠ deployed build). ALL paths below relative to this root.

Phase SUB lays load-bearing substrate every later wave imports: real P-TOOL Go pkg tree · `.adp/` containment · embedded+locked schema registry · stateless frontier deriver · booting MCP adapter shell. Zero upstream; maximal downstream fan-out. Written UNDER the canon floor (CF) — every Go commit gated by golangci + arch-lint + depguard.

This task = **W1a-A1**, first task on the SUB critical path. CF (now green at M-Floor) shipped a MINIMAL fixture-scale module + the canon configs. W1a writes the REAL P-TOOL tree those configs govern day-one. A1 = the module-promotion step: confirm the real module path, then resolve the CF leftover fixtures so the real gate runs clean on the real tree.

## Current state (what CF left on disk)

- `go.mod` already present: `module github.com/iiezhachenko/adp-2.0`, `go 1.24.4`, `require golang.org/x/tools v0.30.0`. **Module path already real — do NOT rename** (renaming churns every future import).
- `internal/version/version.go` (stub const), `internal/canon/analysistest/` (throwaway analysistest harness + testdata — KEEP, it's the rig tier-2 rules use later).
- `canon-rules/` (`schema.json` + `_samples/` + empty `rules/.gitkeep`).
- `_canon-floor/` fixtures: `lint/{clean,planted}/`, `arch/{clean,planted}/` (planted = a SELF-CONTAINED nested module with its OWN `.go-arch-lint.yml`). These are CF's both-directions lint/arch fixtures.
- `.golangci.yml` (8 linters + inline depguard block), `.go-arch-lint.yml` (P-TOOL layers; ALREADY declares the real W1a dirs `internal/**`, `cmd/adp-server/**`, `cmd/adp/**` with `ignoreNotFoundComponents: true`), `depguard.yml` (decision-record doc, NOT loaded).

## Deliverable

Real module confirmed + buildable; CF `_canon-floor/` fixtures resolved (retire-or-fold decided + executed) so the main golangci + arch-lint gates run GREEN on the real tree with zero false-red from intentional planted defects.

## Sentinels (on disk, under delivery root)

- `go.mod` (real path `github.com/iiezhachenko/adp-2.0`, unchanged).
- `_canon-floor/` either removed OR explicitly excluded from main lint/arch scope (decision documented on disk).
- CF gate configs (`.golangci.yml`, `.go-arch-lint.yml`) still green.

## Depends on

- CF M-Floor (task `01_00_12`) GREEN — lint + arch + harness all pass before any SUB Go lands.

## Steps

1. Confirm module path `github.com/iiezhachenko/adp-2.0` is the decided stable path. It is already real (not a placeholder). Document: this is final; never rename.
2. **Close R-CF6 / R-SUB9 — decide `_canon-floor/` disposition.** The planted fixtures (`lint/planted/`, `arch/planted/`) carry INTENTIONAL defects. If the main golangci/arch gate scans them → FALSE RED. Two options:
   - **(a) RETIRE** — delete `_canon-floor/` now that CF's M-Floor proved both directions. The planted defects served their one-time both-directions proof; SUB no longer needs them in-tree.
   - **(b) FOLD/EXCLUDE** — keep as a permanent regression fixture but EXCLUDE `_canon-floor/planted/` (and `_canon-floor/lint/`) from the main gate scope. Note: `.go-arch-lint.yml` ALREADY excludes `_canon-floor/lint` + `_canon-floor/arch/planted`; `.golangci.yml` must do the same for `_canon-floor/lint/planted` if kept.
   - **Recommendation: (b) exclude** — keeps the both-directions regression fixture available, costs only an exclude entry. Whichever chosen, document the decision on disk (e.g. in the README or a short note) so the planted-defect intent is unambiguous.
3. Verify CF gates still green after the decision: `go build ./...`, golangci, arch-lint all pass on the real tree with NO false-red from `_canon-floor/`.
4. Leave `internal/version/`, `internal/canon/analysistest/`, `canon-rules/` in place — they are real engine homes, not fixtures.

## Acceptance

- `go build ./...` green.
- golangci main gate green (zero false-red from intentional planted defects).
- arch-lint green (core⊥adapter; real W1a globs already declared, still satisfied).
- `_canon-floor/` disposition decision recorded on disk.

## Boundary — OUT of scope

- Full `internal/*` + `cmd/*` pkg tree = task 02 (A2). A1 only confirms module + resolves fixtures.
- P-TOOL discipline scaffolds (ifaces, atomic-write helper) = task 03 (A3).
- NO business logic, NO MCP surface, NO schema embed.

## Risk

- **R-SUB9** CF `_canon-floor/` planted fixtures linted by the real gate → false red on intentional defects. Mitigation = step 2 (retire or exclude `_canon-floor/planted/` from main scope); document intent.
- **R-CF6** (forwarded from CF) retire-or-fold decision was left OPEN by CF for SUB to close — this task closes it.
