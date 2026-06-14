# SUB-W1b — `.adp/` containment (layout + centralize paths + re-point readers + test-residence)

> Atomic task. SELF-CONTAINED — all context inline. Register: caveman; structural data (paths, tree names) literal.

## Context — Phase SUB (substrate)

ADP 2.0 = full Go rewrite. **Delivery root = `_adp-2.0/_deliverables/adp-2.0-code/`** (engine SOURCE repo). Module path `github.com/iiezhachenko/adp-2.0`. ALL paths relative to this root.

This task = **W1b**, covering WBS sub-WPs B1+B2+B3 (one cohesive migration). **The one cross-lane hazard** of Phase SUB: it re-points the paths the frontier/context/schema layers read. Pulled INTO SUB BEFORE the schema registry (W1c) so every reader targets `.adp/` day-one — far cheaper than re-pointing after schema + frontier are built on flat roots. W1b re-points PATHS only; it does NOT build the context-assembler inversion logic (SPK) nor pack/deploy that consumes `.adp/` (BOOT).

## What `.adp/` containment is (the iron rule)

Today ADP artifact trees sit FLAT at repo root (`.aprd/ .adr/ .hld/ .roadmap/ .build/ .audit/ _streams/`). Containment = nest ALL of them under a single `.adp/` root. Rationale: clean separation of ADP's own artifacts from the product code/tests in the repo's real trees; lets `.adp/` be torn down without touching product. Iron rule: **all ADP artifacts under one `.adp/` root; product code/tests in the repo's real trees, NEVER inside `.adp/`.**

## Deliverable

1. `.adp/` containment layout — flat trees nested under one `.adp/` root.
2. ONE centralized `.adp/`-relative path-constants home (single `paths` source) — schema loader (task 06) + frontier (task 08) read the SAME roots, no scattered string literals.
3. ALL path-readers re-pointed to `.adp/`-relative; grep proves zero reader resolves a pre-containment flat root.
4. Test-residence rule documented: oracle/golden/selftests land in repo `tests/`, NEVER inside `.adp/`.

## Sentinels

- `.adp/` root populated with the nested subtree map.
- Path constants centralized in `internal/*` (single `paths` home — e.g. `internal/paths/paths.go`).
- `tests/` convention documented on disk.

## Depends on

- Task 03 (A3) — discipline scaffolds + pkg tree present; path constants get a clean home; readers exist to re-point.

## Steps

1. **Define canonical `.adp/` subtree map** (B1). Nest under one root:
   ```
   .adp/
     .aprd/      frozen requirements
     .adr/       decisions (log/ + index + lock)
     .hld/       design skeleton
     .roadmap/   build frontier
     .build/     build records
     .audit/     audit trail
     _streams/   branch/stream state
   ```
   One home per tree. Document this as the path contract every later wave honors.
2. **Centralize `.adp/`-relative path constants** (B2). Single `paths` source (recommend `internal/paths/`). Export the `.adp/` root + each subtree path as constants/functions. NO scattered string literals anywhere in `internal/*`. This is the ONE home task 06 (schema loader roots) + task 08 (frontier sentinel scan) both read.
3. **Re-point ALL path-readers** (B2). Audit every reader — the read-graph (`io/io-manifest.json` roots), schema loader roots, sentinel paths, lock paths — and re-point to `.adp/`-relative via the `paths` home. `io-manifest.json` is RETAINED (its roots re-point); the read+inline-vs-pointer INVERSION job = SPK W2c context assembler, NOT here.
4. **Grep-assert zero flat-root** — `grep -rE '"\.(aprd|adr|hld|roadmap|build|audit)/' internal/ cmd/` (and `_streams`) returns NOTHING resolving outside `.adp/`. Every reader nests.
5. **Test-residence rule** (B3) — document: oracle/golden fixtures + selftests live under repo `tests/`, NEVER inside `.adp/`. `.adp/` holds deliverable trees only (keeps the disposable workspace clean). The episodic durable-ledger exception (MEM) is NOT this task.

## Acceptance

- `.adp/` root present + populated with the nested subtree map.
- Path constants in ONE `paths` home; no scattered flat-root literals in `internal/*`.
- grep: zero reader resolves a pre-containment flat root (all `.adp/`-relative).
- No test artifact written under `.adp/`; `tests/` convention documented.
- `go build ./...` + arch-lint + depguard still green.

## Boundary — OUT of scope

- Context-assembler INVERSION (read-graph → inline-vs-pointer) = SPK W2c. W1b only re-points the roots `io-manifest.json` uses.
- Pack/deploy that consumes `.adp/` = BOOT W4a/c. Landing containment early = BOOT starts at pack with no re-point rework.
- Episodic durable-ledger (the one workspace-disposable exception) = MEM W3a.

## Risk

- **R-SUB1** `.adp/` re-point misses a reader → split-brain paths (some flat, some nested). Mitigation = step 2 centralizes path constants (ONE `paths` home); step 4 grep-asserts zero flat-root; land BEFORE schema (W1c) so all readers nest day-one.
