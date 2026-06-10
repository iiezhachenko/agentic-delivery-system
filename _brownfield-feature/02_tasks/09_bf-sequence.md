# Task 09 — BF-SEQUENCE (OVERLAY)

> Self-contained. Everything needed embedded below — do NOT hunt other files.

## TL;DR

Add a `feature-add` DELTA block to `prompts/01-roadmap/SEQUENCE.md`. Greenfield SEQUENCE draws a dependency-legal running order (skeleton first, then value×risk/cost). Feature-add merges the NEW slices into `remaining_sequence` while existing accepted slices stay pinned in `completed[]`. `RE-RANK`, `VERTICALITY-CHECK`, `SEQUENCE-REVIEW` REUSE verbatim (RE-RANK is already the next-picker that merges new slices with `completed[]` pinned + ingests learnings). Dual-mode overlay: ONE shared `## Rules` + a feature-add delta carrying ONLY what differs (AB1). Satisfies **BF1** (completed pinned).

## Why this exists

The new feature's slices must slot into the living roadmap without re-ordering or rebuilding accepted baseline slices. The greenfield living-roadmap machinery (`08-rerank.json` with `completed[]` + `remaining_sequence[]`) already models exactly this; feature-add just supplies the new slices and pins the baseline as completed.

### Invariants served
- **BF1 — baseline immutable + additive.** Accepted baseline slices pinned in `completed[]`, never re-ordered/rebuilt.

## DAG position

- **Deps:** Task 08 (BF-SLICE-EXTRACT — new candidate slices).
- **Downstream:** BF-MATERIALIZE-ORACLE (10) and the rest of Phase 4 consume `08-rerank.json` to auto-select the target slice.
- **Sentinel:** `_fixtures/brownfield-feature/.roadmap/08-rerank.json` golden — new slice(s) in `remaining_sequence`, baseline slices in `completed[]`.

## REUSE-verbatim siblings (don't author)

`RE-RANK` (`prompts/01-roadmap/RE-RANK.md`), `VERTICALITY-CHECK`, `SEQUENCE-REVIEW` carry as-is. RE-RANK already: partitions slices into completed (pinned, `client_response:accepted`) vs remaining; projects the real component DAG onto remaining slices; re-ranks by dependency-legal topo + value×risk/cost; has an anti-thrash gate. It IS the next-picker for the feature-add living roadmap. This task overlays only SEQUENCE (the initial ordering of the new slices before RE-RANK takes over the living loop).

## EMBEDDED CANON

**Caveman block — already present in SEQUENCE; leave verbatim.**

**Anti-bloat:** AB1 (delta = only differences), AB2, AB7–AB9. **Dual-mode overlay pattern:** ONE shared `## Rules` + a `## Rules (feature-add delta)` block; class dispatched by playbook (Task 03).

## Current state — `prompts/01-roadmap/SEQUENCE.md` (greenfield)

**Role:** sequencer — draw a dependency-legal running order: walking skeleton leads (position 1), everything after ordered by value × risk / cost, constrained by `depends_on`. Dependency legality is the hard constraint. Lane: PROPOSE order only — no foundation cut, no `kind` on non-skeleton slices, no HOW, no client touch.

**ordering rule (discriminator):** (1) pin skeleton to position 1; (2) greedily fill 2..N from the ready frontier (slices whose entire `depends_on` is placed) by priority: higher value → retires-risk → lower cost-proxy (`len(requirements)+len(acceptance)`) → lowest `S*` index; (3) frontier empties early or dangling dep → no legal total order = cycle/dangling defect.

**Greenfield Rules (shared spine):** (1) sequence eligible set only, skeleton pinned position 1; (2) dependency legality hard constraint (topological); (3) order frontier by value×risk/cost soft heuristic; (4) cost = declared feature-depth proxy, never fabricated; (5) cycle/dangling/skeleton-with-deps = slicing defect → flag + route to SLICE-EXTRACT (recorded, not HALT); (6) full accounting — every eligible slice placed once; (7) carry IDs + value verbatim; (8) cheapest-source-first; (9) stay in lane.

**Inputs:** `.roadmap/04-skeleton.json`, `.roadmap/02-slices.json`, `.roadmap/03-verticality.json`. **Output:** `.roadmap/05-sequence.json` — `sequence[]` (position, id, name, skeleton bool, value, retires_risk, depends_on, cost_proxy, rationale), `verdict`, `dependency_check`, `coverage`.

## THE WORK — add the feature-add delta to `SEQUENCE.md`

1. **Frontmatter:** add feature-add inputs — feature-add `.roadmap/02-slices.json` (new candidate slices + `baseline_completed_slices`), baseline `.roadmap/08-rerank.json` (`completed[]` = accepted baseline slices to pin). Output: contributes to the living `.roadmap/08-rerank.json` (new slices merged into `remaining_sequence`, baseline pinned in `completed[]`) — note RE-RANK owns the living roadmap re-ranking; SEQUENCE emits the initial feature-add order. Class gate routes feature-add here.
2. **Shared `## Rules`:** keep greenfield rules. Rule 1 ("skeleton pinned to position 1") generalizes — for feature-add there is no NEW skeleton (foundation built); the delta states there's no position-1 skeleton pin, the order starts from the new slices' frontier.
3. **Add `## Rules (feature-add delta — shared Rules above also bind):`**
   - **No new skeleton pin (BF1).** Foundation + walking skeleton already built (baseline). New feature has no skeleton slice — skip the position-1 skeleton pin; order new slices by the same value×risk/cost frontier discriminator.
   - **Pin accepted baseline slices in `completed[]` (BF1).** Baseline slices with `client_response:accepted` are immutable, pinned — never sequenced/re-ordered. New slices fill `remaining_sequence` after them.
   - **`depends_on` may cite completed baseline slices.** A dependency on a `completed[]` slice is already satisfied — list it for legality, it doesn't gate the new-slice frontier (mirrors RE-RANK's projection rule).
   - **Hand off to RE-RANK for the living loop.** After this initial order, the per-slice demo loop re-ranks remaining slices via RE-RANK (reused verbatim) with `completed[]` pinned + learnings ingested. SEQUENCE produces the first order only.
4. **Output schema:** the feature-add sequence merges into `08-rerank.json` shape — `completed[]` (pinned baseline slices) + `remaining_sequence[]` (new slices, dependency-legal, value×risk/cost ordered). Carry `class:"feature-add"`, `roadmap_version` bumped.
5. **Task steps:** add a feature-add branch: read new candidate slices + baseline completed → pin baseline in `completed[]` → order new slices by the frontier discriminator (no skeleton pin), dependencies on completed slices pre-satisfied → write merged `08-rerank.json` → stop. Keep greenfield steps intact.

## Lane / what NOT to do

- Don't re-order or rebuild any `completed[]` baseline slice (BF1).
- Don't pin a position-1 skeleton (none for feature-add).
- Don't re-author RE-RANK/VERTICALITY-CHECK/SEQUENCE-REVIEW (they reuse verbatim).
- Don't touch client (SEQUENCE-REVIEW is the order gate).

## Verify (both-directions)

- **Known-good:** feature-add candidate slices + accepted baseline → `08-rerank.json` with new slices in `remaining_sequence`, baseline in `completed[]`, dependency-legal. PASS.
- **Planted defect — baseline re-order:** a `completed[]` slice moved into `remaining_sequence` / re-ordered → MUST FAIL (BF1).
- **Planted defect — dangling dep:** new slice depends on a slice in neither `completed[]` nor the new set → MUST FAIL (dependency defect).

## DONE WHEN

- `SEQUENCE.md` carries a feature-add delta (shared Rules substance untouched).
- Golden `08-rerank.json` pins baseline in `completed[]`, orders new slices in `remaining_sequence`.
- RE-RANK/VERTICALITY-CHECK/SEQUENCE-REVIEW confirmed to run verbatim (no edit).
- Both-directions check holds.
