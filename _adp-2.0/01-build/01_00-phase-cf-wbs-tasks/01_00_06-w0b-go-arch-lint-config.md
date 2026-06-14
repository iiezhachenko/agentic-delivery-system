# CF-W0b-B1 — `.go-arch-lint.yml` (P-TOOL layers + dep directions)

> Atomic task. SELF-CONTAINED — all context inline. Register: caveman; structural data (paths, layer names, keys) literal.

## Context — Phase CF (canon floor)

ADP 2.0 = full Go rewrite. **Delivery root = `_adp-2.0/_deliverables/adp-2.0-code/`** (engine SOURCE repo). ALL paths relative to this root.

Phase CF lane W0b = adopt the FROZEN P-TOOL arch profile at commit 0. Architecture is pre-frozen in the design input — hardest decisions done; ADOPT, don't re-derive. This task encodes the layer boundaries + allowed dep directions in `.go-arch-lint.yml` (tool: `fe3dback/go-arch-lint`, standalone binary, pinned in task 01). WBS sub-task **B1**.

## Background — P-TOOL arch invariants to encode

- **core** = `internal/...` — pure IO-free deterministic logic.
- **adapter** = `cmd/adp-server` — thin MCP/stdio protocol adapter.
- **cli** = `cmd/adp` — thin init/pack/deploy CLI.
- Allowed deps: `adapter → core` ONLY. `cli → core` ok. NEVER `core → adapter`. Acyclic.
- (depguard, task 07, handles the IO/protocol-import-in-core forbid; go-arch-lint here handles structural layer/direction. Overlap with compiler acyclic check from task 03 is intentional defense-in-depth.)

## Deliverable

`.go-arch-lint.yml` encoding P-TOOL layers (`components`) + allowed dep directions (`deps`): core ⊥ adapter; adapter→core only; acyclic.

## Sentinel

`.go-arch-lint.yml` (at delivery root).

## Depends on

- Task 01 (WP-0) — module + pinned go-arch-lint version.
- Task 05 (arch fixture tree) — the clean target to validate `exit 0` against. Use the layer names task 05 chose.

## Steps

1. Map the P-TOOL layout → go-arch-lint `components` + `deps` rules. Match the config schema of the pinned go-arch-lint version (v3/v4 schema differs — confirm against pinned version).
   - component `core` → `internal/...` (+ the fixture's `internal/core` path under `_canon-floor/arch/clean/`).
   - component `adapter` → `cmd/adp-server` (+ fixture `cmd/adapter`).
   - component `cli` → `cmd/adp`.
2. `deps` rules: `adapter` may import `core`; `cli` may import `core`; `core` may import NOTHING upward. Forbid `core → adapter`. Enforce acyclic.
3. Point the config at the fixture tree (task 05) so `clean → exit 0` is verifiable now; structure rules so the REAL W1a tree satisfies them day-one (roadmap §3: "core⊥adapter boundary arch-lint green").

## Acceptance

- Clean fixture tree (task 05) → `go-arch-lint check` exit 0.
- (planted import-direction defect → red proven in task 09.)

## Boundary — OUT of scope

- IO/protocol import forbid in core = depguard, task 07.
- CI wiring = task 08.
- Planted defect fixture = task 09.
- Real W1a tree = SUB; this config must SATISFY it day-one but CF does not build it (R-CF3).

## Risk

- **R-CF3** go-arch-lint needs packages → don't pull W1a forward; check against task-05 fixture only.
