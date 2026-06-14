# CF-W0a-A2 — `.golangci.yml` (8-linter tier-1 stack)

> Atomic task. SELF-CONTAINED — all context inline. Register: caveman; structural data (linter names, keys, paths) literal.

## Context — Phase CF (canon floor)

ADP 2.0 = full Go rewrite. **Delivery root = `_adp-2.0/_deliverables/adp-2.0-code/`** (engine SOURCE repo). ALL paths relative to this root.

Phase CF = tier-1 BORROWED canon at commit 0. golangci-lint stack = the borrowed, pre-grounded, decorrelated second opinion (mitigates risk #10: single-Opus canon) governing engine's own code from line 0. This task authors the linter config only. ZERO custom/authored rules (those = tier-2, BULK phase) — tier-1 DEFAULTS only.

Lane W0a = golangci stack + compiler gate. This = sub-task **A2** (the config file). CI wiring = task 03; fixture pair = task 04.

## Deliverable

`.golangci.yml` enabling EXACTLY 8 linters: `staticcheck` · `govet` · `gosec` · `errcheck` · `ineffassign` · `unused` · `gocritic` · `revive`.

## Sentinel

`.golangci.yml` (at delivery root).

## Depends on

- Task 01 (WP-0 module bootstrap) — needs a Go module + pinned golangci-lint version to lint against.

## Steps

1. Author `.golangci.yml`. Match the schema of the golangci-lint version pinned in task 01 (golangci-lint v2 uses top-level `version: "2"` + `linters.enable`; confirm against pinned version — schema differs across major versions).
2. `linters.enable` = the exact 8 names above. No more (avoid premature tier-2), no fewer.
3. No silent truncation — set `max-issues-per-linter: 0` + `max-same-issues: 0` (report ALL). Fail on any issue (non-zero exit).
4. Per-linter settings — keep MINIMAL / tier-1 defaults; document each choice inline:
   - `gosec`: defaults only. NO custom rules (security custom rules = BULK GC-SEC). `gosec` overlap with future SUB security concerns = intentional tier-1 floor.
   - `revive`: lean default ruleset; avoid premature tier-2 authoring.
   - `gocritic`: enabled default checks only; do NOT hand-pick an expansive set.
   - `errcheck` / `ineffassign` / `unused` / `staticcheck` / `govet`: defaults.
5. Exclude the planted-defect fixture dir from the MAIN lint scope so intentional defects don't red the real gate (R-CF6): exclude `_canon-floor/**/planted/**`. (Task 04 lints the planted copy explicitly on demand.)

Example shape (adapt to pinned version):
```yaml
version: "2"
linters:
  enable:
    - staticcheck
    - govet
    - gosec
    - errcheck
    - ineffassign
    - unused
    - gocritic
    - revive
issues:
  max-issues-per-linter: 0
  max-same-issues: 0
# exclude planted-defect fixtures from main scope (intentional defects)
# (use the run.skip-dirs / issues exclusion mechanism of the pinned version)
```

## Acceptance

- Clean tree → `golangci-lint run ./...` exit 0 (green).
- (Both-directions proof = task 04: planted copy → exit 1. This task = clean-direction + config correctness.)

## Boundary — OUT of scope

- NO custom rules of any linter — tier-1 defaults ONLY. Custom rules = tier-2 = BULK W5d–f.
- CI wiring (blocking job, pinned bin) = task 03.
- depguard config = task 07 (separate sentinel; do NOT add depguard block here unless task 07 decides the inline placement).

## Risks

- **R-CF2** premature tier-2 authoring (custom revive/gocritic/gosec rules creep in). Mitigation = defaults only.
- **R-CF6** planted fixtures linted by real gate → false red. Mitigation = exclude `_canon-floor/**/planted/**` from main scope.
