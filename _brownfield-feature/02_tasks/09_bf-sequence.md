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

- [x] `SEQUENCE.md` carries a feature-add delta (shared Rules substance untouched).
- [x] Golden `08-rerank.json` pins baseline in `completed[]`, orders new slices in `remaining_sequence`.
- [x] RE-RANK/VERTICALITY-CHECK/SEQUENCE-REVIEW confirmed to run verbatim (no edit).
- [x] Both-directions check holds.

## STATUS — DONE

What changed:
- **`prompts/01-roadmap/SEQUENCE.md`** — feature-add delta overlaid (AB1: ONE shared `## Rules` + delta carrying only differences):
  - Frontmatter: greenfield/feature-add input grouping (feature-add reads `02-slices.json` new candidates + `baseline_completed_slices` and baseline `08-rerank.json` `completed[]`; `04` skeleton==null expected). Output adds `08-rerank.json` for feature-add. Escapes split greenfield/feature-add — `04` skeleton==null is HALT only greenfield; feature-add HALTs on missing baseline frontier; dangling generalized to "neither new set nor `completed[]`".
  - Shared Rule 1 generalized (no NEW skeleton → no position-1 pin for feature-add).
  - New `## Rules (feature-add delta)`: (1) no new skeleton pin (BF1); (2) pin accepted baseline in `completed[]`, never re-order (BF1); (3) `depends_on` may cite `completed[]` (pre-satisfied, doesn't gate frontier); (4) hand off to RE-RANK for living loop (reused verbatim).
  - Feature-add Task-steps branch + feature-add output schema delta + Stop-condition line.
- **`_fixtures/brownfield-feature/.roadmap/08-rerank.json`** — golden feature-add output: `class:feature-add`, `roadmap_version:3`, baseline S1–S4 pinned verbatim in `completed[]`, NEW S5→S6 in `remaining_sequence` (dependency-legal: S5 leads — dep S2 completed/pre-satisfied, high value + retires risk; S6 waits behind S5; value×risk/cost ordered), `dependency_check` clean.

Reused verbatim (NOT authored): `RE-RANK.md`, `VERTICALITY-CHECK.md`, `SEQUENCE-REVIEW.md` — `git status` shows only `SEQUENCE.md` + the fixture changed.

Both-directions oracle (machinery present in prompt):
- **Known-good** → golden above: baseline pinned + new slices ranked, legal. PASS.
- **Defect (baseline re-order)** → `completed[]` slice moved into `remaining_sequence` trips delta Rule 2 + coverage (`base_slices`==`completed`, `remaining_ranked`==new ids only). FAIL.
- **Defect (dangling dep)** → new-slice dep in neither `completed[]` nor new set trips delta Rule 3 + `dependency_check.dangling_depends_on`. FAIL.

BF1 satisfied (baseline immutable + additive).
