# CF-W0a-A3+A4 — CI lint + compiler HARD gate

> Atomic task. SELF-CONTAINED — all context inline. Register: caveman; structural data (job names, commands, paths) literal.

## Context — Phase CF (canon floor)

ADP 2.0 = full Go rewrite. **Delivery root = `_adp-2.0/_deliverables/adp-2.0-code/`** (engine SOURCE repo). ALL paths relative to this root.

Phase CF = tier-1 BORROWED canon at commit 0. CF gates EVERY Go commit after it — no Go lands ungoverned. This task wires the lint + compiler checks as a BLOCKING CI job. Covers WBS sub-tasks **A3** (compiler gate) + **A4** (CI hard-gate wiring) — merged: both write to the same `canon-floor.yml` lint job.

## Deliverable

Blocking CI job in `.github/workflows/canon-floor.yml` running golangci-lint + compiler-native checks. Fail = red = blocks merge.

## Sentinel

`canon-floor.yml` (lint job present + blocking).

## Depends on

- Task 01 (WP-0) — CI skeleton + pinned linter bin.
- Task 02 (A2) — `.golangci.yml` exists.

## Background — compiler-native checks (free, no config)

- Import cycles: detected by `go build ./...` (compiler rejects cyclic imports).
- `internal/` visibility: enforced by the Go compiler (packages under `internal/` importable only within the parent subtree).
- shadow/printf/struct-tag/etc.: `go vet ./...`.
So the "compiler gate" = `go build ./...` + `go vet ./...`; no extra tooling needed.

## Steps

1. In `canon-floor.yml`, fill the lint-job placeholder (from task 01 skeleton):
   - **compiler gate (A3):** `go build ./...` then `go vet ./...`. Assert these cover import-cycles + `internal/` visibility (compiler-native).
   - **lint gate (A4):** `golangci-lint run ./...` using the PINNED bin/version from task 01 (not floating latest — R-CF1).
2. Make the job BLOCKING: any non-zero exit = red = blocks merge. No `continue-on-error`.
3. Cache modules + linter bin (perf; from task 01 skeleton).
4. Operator note IN the workflow file (comment): this job must be marked a REQUIRED status check in branch protection so it actually blocks merge. (Branch-protection toggle = operator action, outside the repo file.)

## Acceptance

- Clean tree → job green (build + vet + golangci all exit 0).
- Job is blocking (no soft-fail).
- Uses pinned linter version.
- (Planted-defect → red proven in task 04.)

## Boundary — OUT of scope

- Arch checks (go-arch-lint + depguard) = separate job, task 08.
- The `.golangci.yml` content = task 02.
- Fixture pair = task 04.

## Risk

- **R-CF1** version drift → false gate. Mitigation = job uses the task-01 pinned bin, never floating latest.
