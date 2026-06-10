# Task 08 — BF-SLICE-EXTRACT (OVERLAY)

> Self-contained. Everything needed embedded below — do NOT hunt other files.

## TL;DR

Add a `feature-add` DELTA block to `prompts/01-roadmap/SLICE-EXTRACT.md`. Greenfield SLICE-EXTRACT clusters the frozen aPRD's requirements into candidate vertical slices. Feature-add slices ONLY the NEW feature's `R*/AC*` (those above the baseline high-water-mark, from `aprd.v2.frozen.md`); existing slices are pinned baseline (`completed[]`), never re-sliced. `SKELETON-IDENTIFY` + `FOUNDATION-CUT` stay OFF (the playbook's `active_stages` — foundation already built). Dual-mode overlay: ONE shared `## Rules` + a feature-add delta carrying ONLY what differs (AB1). Satisfies **BF1** (baseline slices untouched) + **BF3**.

## Why this exists

The feature adds new requirements above the baseline. Roadmap must slice only those into new candidate slices and leave every accepted baseline slice pinned. Re-slicing the baseline would violate BF1 and re-trigger already-shipped work.

### Invariants served
- **BF1 — baseline immutable + additive.** Existing slices pinned; only new `R*/AC*` sliced.
- **BF3 — ID continuation.** New slices mint `S*` above the baseline `S*` high-water-mark.

## DAG position

- **Deps:** Task 06 (BF-SYNTHESIZE — `aprd.v2.frozen.md` + class-extension block), Task 02 (baseline-map high-water + completed slices).
- **Downstream:** BF-SEQUENCE (09).
- **Sentinel:** golden slice covers only the new feature's IDs; baseline slices absent from the candidate set (they're pinned `completed[]`).

## EMBEDDED CANON

**Caveman block — already present in SLICE-EXTRACT; leave verbatim.**

**Anti-bloat:** AB1 (delta = only differences), AB2 (guards only in escapes), AB7–AB9. **Dual-mode overlay pattern:** ONE shared `## Rules` + a `## Rules (feature-add delta)` block; class dispatched by playbook (Task 03). **Active-stages from playbook:** `feature-add.md` sets `active_stages: { skeleton_identify: off, foundation_cut: off, scaffold: off }` — SLICE-EXTRACT must honor that; do NOT name a new skeleton or cut foundation.

## Current state — `prompts/01-roadmap/SLICE-EXTRACT.md` (greenfield)

**Role:** the slicer — head of roadmap pipeline. Cluster frozen aPRD requirements into candidate vertical slices: each = one user-visible capability built through every layer it needs to be demoable. Lane: produce candidates only — don't sequence, name skeleton, define foundation cut, decide HOW, or touch client.

**verticality test (discriminator):** slice is vertical iff ≥1 acceptance criterion is black-box/user-observable. No user-observable AC → horizontal → re-cut/merge.

**Greenfield Rules (shared spine):** (1) cluster by capability not layer; (2) every slice carries ≥1 AC; (3) cover every `R*` AND every `AC*` — no orphans; (4) slice atomic (INVEST); (5) `depends_on` coarse slice-level prerequisites from aPRD, acyclic; (6) `value` proposed (high/med/low) from centrality; (7) `retires_risk` named or null; (8) cheapest-source-first, never invent — slices regroup existing `R*/AC*`, never mint new; (9) thread IDs — mint `S*`, carry `R*/AC*` verbatim; (10) stay in lane.

**Inputs:** `.aprd/aprd.frozen.md` + `.aprd/aprd.lock` (freeze gate). **Output:** `.roadmap/02-slices.json` — `slices[]` (id `S*`, name, `requirements[R*]`, `acceptance[AC*]`, `value`, `retires_risk`, `depends_on[S*]`), `unsliceable[]`, `coverage`, `slice_counts`. Escapes: no frozen aPRD / invalid lock → HALT; non-greenfield class → playbook (generalized Task 03); requirement unsliceable → Phase 0 change request.

## THE WORK — add the feature-add delta to `SLICE-EXTRACT.md`

1. **Frontmatter:** add feature-add inputs — `.aprd/aprd.v2.frozen.md` (the new version with new `R*/AC*` + class-extension block), `.aprd/baseline-map.json` (`S*` high-water + completed slices), and the baseline `.roadmap/08-rerank.json` (`completed[]` = pinned baseline slices). Class gate routes feature-add here.
2. **Shared `## Rules`:** keep greenfield rules. Coverage Rule 3 ("cover every `R*`/`AC*`") generalizes — for feature-add the cover set is the NEW `R*/AC*` only (above high-water); state the corpus in the delta (one home, AB1).
3. **Add `## Rules (feature-add delta — shared Rules above also bind):`**
   - **Slice only the new feature's IDs (BF1).** Cover set = `R*/AC*` above the baseline high-water-mark (the new version's net-new requirements). Baseline `R*/AC*` belong to pinned `completed[]` slices — NEVER re-slice them, never put a baseline `R*` in a new slice's `requirements`.
   - **New slice IDs above high-water (BF3).** Mint `S*` strictly above the baseline `S*` high-water from `baseline-map.json`. Never reuse a baseline `S*`.
   - **`depends_on` may cite baseline slices.** A new slice can depend on an accepted baseline slice (it plugs into existing capability). Those baseline `S*` are already satisfied (`completed[]`) — list them for legality, they don't gate the frontier.
   - **No new skeleton, no foundation cut (playbook `active_stages`).** Foundation + walking skeleton already exist. Don't name a skeleton or cut foundation — those stages are OFF for feature-add. A new feature needing NEW foundation → widen-cut escape (Phase-4→Phase-1 target), not a fresh skeleton here.
4. **Output schema:** `02-slices.json` adds `class: "feature-add"`, `aprd_version`, `baseline_completed_slices[S*]` (pinned, carried for reference), and the candidate `slices[]` cover only new IDs. `coverage.requirements_total`/`acceptance_total` = the NEW ID set, not the whole aPRD.
5. **Task steps:** add a feature-add branch: read new version + baseline-map + baseline rerank → inventory ONLY new `R*/AC*` (above high-water) → cluster into candidate vertical slices minting `S*` above high-water → derive `depends_on` (may cite baseline `S*`) → coverage over the new ID set → write. Keep greenfield steps intact.

## Lane / what NOT to do

- Don't re-slice or re-cut any baseline slice (BF1).
- Don't name a skeleton / cut foundation (stages OFF).
- Don't mint `S*` at/below the baseline high-water (BF3).
- Don't sequence (SEQUENCE) or touch client.

## Verify (both-directions)

- **Known-good:** feature-add `aprd.v2.frozen.md` → candidate slices cover only new `R*/AC*`, `S*` above high-water, baseline slices pinned in `baseline_completed_slices`. PASS.
- **Planted defect — baseline re-slice:** a candidate slice containing a baseline `R*` → MUST FAIL (BF1).
- **Planted defect — S* collision:** new slice reuses a baseline `S*` → MUST FAIL (BF3).

## DONE WHEN

- `SLICE-EXTRACT.md` carries a feature-add delta (shared Rules substance untouched).
- Golden feature-add `02-slices.json` slices only new IDs, mints `S*` above high-water, pins baseline slices.
- Both-directions check holds.
