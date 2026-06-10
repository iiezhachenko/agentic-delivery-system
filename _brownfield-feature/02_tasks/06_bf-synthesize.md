# Task 06 — BF-SYNTHESIZE (OVERLAY)

> Self-contained. Everything needed embedded below — do NOT hunt other files.

## TL;DR

Add a `feature-add` DELTA block to `prompts/00-aprd/SYNTHESIZE.md`. Greenfield SYNTHESIZE compiles intake into an aPRD draft (one binary AC per requirement, one logged assumption per gap). Feature-add emits an aPRD **version bump** (`aprd.v2.frozen.md`) — baseline `aprd.frozen.md` stays byte-unchanged (BF1) — with new `R*/AC*` continuing above the baseline high-water-mark (BF3), PLUS a class-extension block carrying `INTEGRATION_SEAMS` (BF6), `REGRESSION_GUARD` (BF4), `CONVENTION_BASELINE` (BF5). Freeze re-signs `aprd.lock` and re-triggers only the **affected downstream** (touch-set). Dual-mode overlay: ONE shared `## Rules` + a feature-add delta carrying ONLY what differs (AB1).

## Why this exists

The feature CR resolves into a new aPRD version, not a rewrite of the frozen baseline (BF1 + P8: change = new version + change request). SYNTHESIZE is where the version bump + class-extension block + downstream re-trigger fire. This is the first real exerciser of P8's standing promise.

### Invariants served
- **BF1 — baseline immutable + additive.** Emit `aprd.v2.frozen.md`; never touch `aprd.frozen.md`.
- **BF3 — ID continuation.** New `R*/AC*/A*` above baseline high-water.
- **BF4/BF5/BF6 — class-extension block.** `REGRESSION_GUARD` / `CONVENTION_BASELINE` / `INTEGRATION_SEAMS`.
- **BF7 — re-entry = change request.** Freeze re-signs `aprd.lock`, re-triggers affected downstream.

## DAG position

- **Deps:** Task 05 (BF-GAP-DETECT — feature-add gaps), Task 04, Task 02 (baseline-map high-water + seams).
- **Downstream:** Task 07 (P2+P3 verify-only), Task 08 (BF-SLICE-EXTRACT) consume the new version.
- **Sentinel:** `_fixtures/brownfield-feature/.aprd/aprd.v2.frozen.md` golden present AND baseline `aprd.frozen.md` byte-unchanged.

## Risk R1 — touch-set (resolve here)

aPRD version bump re-triggers WHICH slices? **Touch-set = slices whose `R*/AC*` the feature alters or whose seams it extends.** Over-broad → needless rebuild; too-narrow → a stale slice ships. New `R*/AC*` introduce net-new slices (no existing slice touched). A new AC that strengthens an existing baseline `R*` touches that requirement's slice → that slice re-enters `remaining_sequence` (RE-RANK handles it). SYNTHESIZE records the touch-set; it does not itself rebuild.

## EMBEDDED CANON

**Caveman block — already present in SYNTHESIZE; leave verbatim.**

**Anti-bloat:** AB1 (delta = only differences; never copy shared rule), AB5 (schema inline comments are field docs), AB7–AB9. **Immutability (project absolute):** never overwrite a frozen artifact — a change = new version + change request re-triggering affected downstream.

**Dual-mode overlay pattern:** ONE shared `## Rules` + a `## Rules (feature-add delta)` block. Class dispatched by playbook (Task 03).

## Current state — `prompts/00-aprd/SYNTHESIZE.md` (greenfield)

**Role:** compile intake into the aPRD draft — every requirement gets a binary AC; every open gap resolves into a logged assumption traceable to that gap. Lane: ASSEMBLE + RECORD DECISIONS — don't invent requirements, re-rank gaps, overrule answers, present/approve/freeze. Authors `aprd.v1.md` draft + stops (the freeze + sign-off gate are separate downstream steps).

**Gap-resolution discriminator:** each gap resolves by exactly one path (asked+answered / asked+skipped→default / asked+escape→client free text / deferred→default / cosmetic→announced); provenance recorded.

**Greenfield Rules (shared spine):** (1) carry upstream id-space forward unchanged — `E*/R*/C*` from extraction, no renumber/drop/invent; (2) log one assumption per gap, traceable `gap_ref→G*`, fresh `A*`; (3) every requirement gets ≥1 binary testable `AC*` (`req_ref→R*`) or is `[FLAGGED]` — one observable per AC, no disjunction, concrete observable not adjective, bound to requirements; (4) OUT_OF_SCOPE derived from declined interpretations; (5) CONSTRAINTS = exactly extraction's stated constraints, never synthesize a constraint from a gap answer; (6) **greenfield adds NO class-extension block** (§6.1 extensions exist for feature-add/bugfix/refactor/migration/perf/integration/investigation — greenfield not in that list); (7) dual-audience; (8) cheapest-source-first, reconcile not author.

**Output:** `.aprd/drafts/aprd.v1.md` (PROJECT, CLASS, ENTITIES, REQUIREMENTS R*, CONSTRAINTS C*, ASSUMPTIONS A*, OUT_OF_SCOPE, ACCEPTANCE AC*) + `.aprd/07-assumptions.json`.

> Note Rule 6: greenfield explicitly adds no extension block, but the schema already RESERVES one for feature-add. This task fires that reserved slot.

## THE WORK — add the feature-add delta to `SYNTHESIZE.md`

1. **Frontmatter:** add feature-add inputs — `.aprd/baseline-map.json` (high-water + conventions + seams), `.aprd/aprd.frozen.md` (baseline version, read-only — its `R*/AC*/E*/C*` carried forward unchanged), the feature-add `02-extraction.json` + `04-gaps.json`. Add feature-add outputs — `.aprd/aprd.v2.frozen.md` (the version bump; bump the suffix per the existing baseline version, e.g. v3 if baseline is v2) and an updated `.aprd/aprd.lock` re-sign. Escapes: class gate routes feature-add here; add `{ when: "feature-add but baseline aprd.frozen.md / aprd.lock not present+frozen", target: "BASELINE-MAP / HALT — nothing to version-bump" }`.
2. **Shared `## Rules`:** keep greenfield rules. Rule 6 currently says "greenfield adds no class-extension block." Keep that statement true for greenfield; the feature-add delta supplies the block — don't contradict, the shared rule already scopes itself to greenfield.
3. **Add `## Rules (feature-add delta — shared Rules above also bind):`**
   - **Version-bump, never rewrite (BF1).** Emit a NEW `aprd.v<N+1>.frozen.md`. Baseline `aprd.frozen.md` stays byte-identical — read it, carry its `R*/AC*/E*/C*` forward by REFERENCE (don't re-emit them in the new version's body except as a baseline pointer). The new version's body = baseline pointer + the NEW `R*/AC*/E*/C*/A*` only.
   - **New IDs above high-water (BF3).** New `R*/AC*/A*` continue strictly above `baseline-map.json` `id_high_water`. Never reuse/renumber a baseline ID.
   - **Class-extension block (the reserved slot — BF4/BF5/BF6).** Emit a `## CLASS_EXTENSION (feature-add)` section in the new version with three sub-blocks:
     - `INTEGRATION_SEAMS` — which existing seams (`at: C*`, `contract_ref: CT*`) the feature plugs into; existing internals untouched (BF6).
     - `REGRESSION_GUARD` — which existing ACs/suites must stay green (BF4); scope to touched surface + seams, not the whole inherited suite (Risk R4).
     - `CONVENTION_BASELINE` — the conventions new code must conform to (BF5), carried from `baseline-map.json` `conventions`.
   - **Touch-set + re-trigger (BF7, Risk R1).** Record the touch-set (slices whose `R*/AC*` the feature alters; net-new requirements → net-new slices, no existing slice touched). Freeze re-signs `aprd.lock` against the new version. The new version invalidates downstream sentinels for the touch-set ONLY; untouched slices stay `completed[]`.
4. **Output schema:** `aprd.v<N+1>.frozen.md` carries `CLASS: feature-add`, a `BASELINE` pointer (which version it extends), the NEW `R*/AC*/E*/C*/A*` above high-water, and the `CLASS_EXTENSION` block. `07-assumptions.json` adds `class:"feature-add"`, `baseline_aprd_ref`, `aprd_version`, `touch_set[]`. `aprd.lock` re-signed (`version: v<N+1>`, `status: frozen`).
5. **Task steps:** add a feature-add branch: read baseline aPRD + baseline-map + feature-add gaps/extraction → resolve gaps (same discriminator) → assemble the NEW version (baseline pointer + new IDs + class-extension block) → compute touch-set → write `aprd.v<N+1>.frozen.md` + re-sign `aprd.lock`; baseline file untouched → stop.

## Lane / what NOT to do

- **NEVER touch `aprd.frozen.md`** (BF1 — verifier checks byte-equality).
- Don't mint IDs at/below high-water (BF3).
- Don't synthesize a constraint from a gap answer (shared Rule 5 still binds).
- Don't run the sign-off gate or freeze beyond re-signing the lock per spec — author the version, re-sign, stop.

## Verify (both-directions)

- **Known-good:** feature-add CR + seeded baseline → `aprd.v2.frozen.md` with new `R*/AC*` above high-water + class-extension block; `aprd.frozen.md` byte-unchanged; `aprd.lock` re-signed. PASS.
- **Planted defect — frozen-overwrite:** mutates baseline `aprd.frozen.md` instead of versioning → MUST FAIL (BF1).
- **Planted defect — ID collision:** new `R*` reuses baseline index → MUST FAIL (BF3).
- **Planted defect — missing class-extension block:** version emitted without INTEGRATION_SEAMS/REGRESSION_GUARD/CONVENTION_BASELINE → MUST FAIL (BF4/5/6).

## DONE WHEN

- `SYNTHESIZE.md` carries a feature-add delta (shared Rules substance untouched).
- Golden `aprd.v2.frozen.md` validates (new IDs above high-water, class-extension block present); baseline `aprd.frozen.md` byte-unchanged; `aprd.lock` re-signed; `07-assumptions.json` carries touch-set.
- Both-directions check holds.

## STATUS — DONE

**`prompts/00-aprd/SYNTHESIZE.md` overlay added:**
- Frontmatter: feature-add `inputs` (`baseline-map.json`, `aprd.frozen.md` read-only) + `outputs` (`aprd.v<N+1>.frozen.md`, re-signed `aprd.lock`) + the baseline-not-frozen escape.
- `## Rules (feature-add delta — shared Rules above also bind)` — 5 rules: version-bump-never-rewrite (BF1), new-ids-above-high-water (BF3), CLASS_EXTENSION reserved slot (BF4/5/6), touch-set + re-trigger (BF7/R1), re-freeze lock (BF7). Shared Rule 6 left true (scopes itself to greenfield).
- Feature-add branch in `## Task steps`; `aprd.v<N+1>.frozen.md` + `aprd.lock` output schemas; `07` gains `class`/`baseline_aprd_ref`/`aprd_version`/`touch_set[]`; feature-add stop condition.

**Golden fixtures — `_fixtures/brownfield-feature/.aprd/`:**
- `aprd.frozen.md` + (pre-bump) `aprd.lock` seeded from greenfield-clean baseline (byte-identical — BF1 byte-equality target).
- `aprd.v2.frozen.md` — BASELINE pointer + new `E8`/`R11–R13`/`A14–A16`/`AC11–AC13` (all above high-water R10/AC10/E7/A13) + `CLASS_EXTENSION` (INTEGRATION_SEAMS C1·CT2 / REGRESSION_GUARD AC2·AC7 + oracle suites / CONVENTION_BASELINE).
- `07-assumptions.json` — class `feature-add`, `aprd_version: v2`, 3 assumptions (all `default-applied` — no `05`/`06` answers in fixture), `touch_set[]` (net-new R11–R13 + seam-extended C1·CT2).
- `aprd.lock` re-signed v2 (sha of new file) with `supersedes` pinning v1.

Gaps resolved by `recommended_default` (deferred path) since fixture carries no questions/answers.

**Verify (both-directions):**
- Known-good golden: new IDs above high-water, CLASS_EXTENSION complete, baseline byte-unchanged (`diff` clean), lock re-signed → PASS.
- frozen-overwrite (mutate `aprd.frozen.md`) → byte-equality breaks → FAIL.
- ID-collision (new `R*` at/below high-water) → FAIL.
- missing CLASS_EXTENSION sub-block → FAIL.
