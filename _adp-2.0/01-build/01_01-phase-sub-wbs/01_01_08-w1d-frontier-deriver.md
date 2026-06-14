# SUB-W1d — frontier deriver (stateless disk scan · re-derivable task_id · resume)

> Atomic task. SELF-CONTAINED — all context inline. Register: caveman; structural data (pkg paths, field names) literal.

## Context — Phase SUB (substrate)

ADP 2.0 = full Go rewrite. **Delivery root = `_adp-2.0/_deliverables/adp-2.0-code/`** (engine SOURCE repo). Module path `github.com/iiezhachenko/adp-2.0`. ALL paths relative to this root.

This task = **W1d** (WBS sub-WPs D1+D2+D3 — one cohesive deliverable). Forks off W1c (∥ W1e). The frontier deriver is the stateless engine that figures out "what's the next unit of work" by scanning disk — NO RAM state, NO tracker, NO DB. `adp_task` (SPK W2e) cannot derive work without it. W1d builds the deriver STANDALONE; it does NOT assemble context (W2c), project forms (W2b), or compose the `adp_task` packet (W2e) — those are SPK consumers of this frontier.

## D20 — disk is the sole source of truth (the governing invariant)

Engine stateless. ALL state derived from on-disk trees + locks — NEVER from a hand-maintained tracker. Writes atomic; **resume re-derives the frontier** by re-scanning disk. Kill the process mid-run, re-run → identical frontier, because nothing was persisted in RAM. This is the load-bearing property W1d must realize.

## What the frontier is

Frontier = the **first** `remaining_sequence` entry whose `done_sentinel` is ABSENT or schema-INVALID on disk. The scanner walks the ordered sequence; per entry it tests: does the done-sentinel file exist AND validate against its schema (via the W1c registry)? First entry that FAILS that test = the frontier. Everything before it is done; it is the next work.

Frontier result shape: `{id, unit, class, schemaId}`.

## Deliverable

`internal/frontier` stateless disk scanner: returns the frontier `{id,unit,class,schemaId}` from disk alone; a deterministic re-derivable `task_id = {role, frontier-key}`; resume re-derives (no persisted RAM state). IO confined to a thin injected reader iface (consumer-side, per A3) so derivation logic stays pure + fixture-testable.

## Sentinels

- `internal/frontier/` — scanner + `task_id` derivation + unit tests (fixture disk states).

## Depends on

- Task 07 (C3) — schema registry + lock; the scanner uses the registry to test each `done_sentinel` for schema-validity.
- Task 04 (W1b) — `.adp/` containment + centralized path constants; the scanner reads sentinels via the `.adp/`-aware `paths` home.
- Task 03 (A3) — injected-reader iface pattern; frontier's disk IO goes through it.

## Steps

1. **Stateless scanner** (D1) — walk `remaining_sequence` (the ordered list of units). Per entry: resolve its `done_sentinel` path (`.adp/`-relative via the `paths` home); test PRESENT on disk AND schema-valid (call the W1c registry to validate against the entry's `schemaId`). First entry whose sentinel is absent/invalid = the frontier. Return `{id, unit, class, schemaId}`. NO tracker, NO DB, NO cached state.
2. **IO seam** — frontier MUST read disk, but core stays IO-free. Confine ALL disk reads behind a thin INJECTED reader iface (consumer-side, declared in `frontier`, concrete `os`-backed impl wired by the adapter at task 09). Keep derivation logic pure: given a fake reader returning a fixture disk state, the scanner is fully unit-testable (CP3). Document the IO seam.
3. **`task_id` derivation** (D2) — `task_id = {role, frontier-key}`, a PURE function of disk state. Same disk state → same `task_id` (deterministic, re-derivable). The frontier-key carries the `unit` so it's re-derivable.
4. **Resume re-derives** (D3) — NO open-task RAM state. Re-scanning disk re-derives the frontier. Prove: kill + re-run against the same fixture disk state → identical frontier + identical `task_id`. No persisted tracker file written by the deriver.
5. **Flag the seam, don't build it** — `task_id` collision/concurrency across parallel branches = SPK risk #5, resolved in SPK BEFORE any parallel-branch work. W1d lands the re-derivable KEY SHAPE only; it does NOT build branch-concurrency logic. Note the seam in a doc comment.

## Acceptance

- Scan returns the frontier `{id,unit,class,schemaId}` from disk alone (fixture disk state → expected frontier).
- Same disk state → same `task_id` (deterministic).
- Kill + re-run → identical frontier; NO persisted RAM/tracker.
- Derivation logic pure + fixture-testable (fake reader); IO confined to the injected seam.
- `go build ./...` + `go test ./internal/frontier/...` + arch-lint + depguard green (zero `os`/IO import in the pure logic — only behind the injected iface).

## Boundary — OUT of scope

- Context assembly (W2c), form projection (W2b), `adp_task` packet composition (W2e) = SPK. Frontier is an INPUT to `adp_task`, built here standalone.
- `task_id` branch-concurrency / collision resolution = SPK risk #5. W1d lands the re-derivable key shape only.
- The concrete `os`-backed reader impl + MCP exposure = task 09/10 (adapter).

## Risk

- **R-SUB5** `task_id` collision / branch-concurrency speculation pulled forward into SUB. Mitigation = D2 lands the re-derivable KEY SHAPE only; collision resolution = SPK risk #5; §7 boundary binds it.
- **R-SUB4** IO leaks into core. Mitigation = confine disk reads to a thin injected reader iface; pure derivation logic; depguard catches leaks.
