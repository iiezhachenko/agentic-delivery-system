# CF-W0b-B3 — arch CI gate (go-arch-lint + depguard blocking)

> Atomic task. SELF-CONTAINED — all context inline. Register: caveman; structural data (job names, commands, paths) literal.

## Context — Phase CF (canon floor)

ADP 2.0 = full Go rewrite. **Delivery root = `_adp-2.0/_deliverables/adp-2.0-code/`** (engine SOURCE repo). ALL paths relative to this root.

Phase CF lane W0b = adopt FROZEN P-TOOL arch at commit 0; CF gates EVERY Go commit after. This task wires go-arch-lint + depguard as a BLOCKING CI job. WBS sub-task **B3**.

## Deliverable

Blocking arch job in `.github/workflows/canon-floor.yml`: runs go-arch-lint + depguard. Fail = red = blocks merge.

## Sentinel

`canon-floor.yml` (arch job present + blocking).

## Depends on

- Task 06 (`.go-arch-lint.yml`).
- Task 07 (depguard config).
- (Shares the workflow file with task 03's lint job — add the arch job alongside; task 01 skeleton has the placeholder.)

## Steps

1. Fill the arch-job placeholder in `canon-floor.yml`:
   - `go-arch-lint check` using the PINNED go-arch-lint bin (task 01).
   - depguard run — via `golangci-lint run ./...` (depguard is a golangci linter, task 07) OR the standalone wiring chosen in task 07.
2. Make the job BLOCKING — non-zero exit = red, blocks merge. No `continue-on-error`.
3. Cache the arch-lint bin (perf).
4. Operator note IN the workflow (comment): mark this job a REQUIRED status check in branch protection (operator action, outside the file).

## Acceptance

- Clean fixture tree (task 05) → arch job green (go-arch-lint + depguard exit 0).
- Job is blocking.
- Uses pinned go-arch-lint version (R-CF1).
- (Planted import-direction defect → red proven in task 09.)

## Boundary — OUT of scope

- Config CONTENT = tasks 06 + 07.
- Lint/compiler job = task 03 (separate job, same workflow).
- Planted fixture = task 09.

## Risk

- **R-CF1** version drift → false gate. Mitigation = pinned bin from task 01.
