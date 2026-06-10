# Task 05 — BF-GAP-DETECT (OVERLAY)

> Self-contained. Everything needed embedded below — do NOT hunt other files.

## TL;DR

Add a `feature-add` DELTA block to `prompts/00-aprd/GAP-DETECT.md`. Greenfield GAP-DETECT is the adversarial gap hunter — finds every place a competent engineer could build two different things, blast-ranked. Feature-add measures gaps **vs the baseline** (not blank-slate): a fact the baseline already settles is NOT a gap; gaps live only in the new feature's surface + its seams to existing components. Adversarial posture stays hostile. Dual-mode overlay: ONE shared `## Rules` + a feature-add delta carrying ONLY what differs (AB1). Satisfies **BF2**.

## Why this exists

Feature-add grounds read-first (BF2). The baseline already resolved most architecture/scope forks during the greenfield run. GAP-DETECT must not re-litigate settled baseline decisions — that burns client time on non-questions. It hunts forks ONLY in the new feature and where the feature meets existing seams.

### Invariants served
- **BF2 — grounding read-first.** Gaps measured against the baseline-map + frozen baseline aPRD, not a blank slate.

## DAG position

- **Deps:** Task 04 (BF-EXTRACT — provides feature-add `02-extraction.json` with `baseline_ref`s + `baseline_map_ref`).
- **Downstream:** BF-SYNTHESIZE (06).
- **Sentinel:** gaps golden references baseline coverage — settled baseline decisions are NOT re-raised; gaps cite the new feature's `R*` + seam refs.

## EMBEDDED CANON

**Caveman block — already present in GAP-DETECT; leave verbatim.**

**Anti-bloat:** AB1 (delta carries ONLY differences from shared rules; never copy a shared rule), AB2 (guards only in escapes), AB4 (grounding folds into Rules), AB7–AB9 (every line earns place; single interpretation; fix by delete/rewrite). Adversarial roles STAY hostile (a project standing convention).

**Dual-mode overlay pattern:** ONE shared `## Rules` + a `## Rules (feature-add delta)` block. Shared rules live once; delta carries only what differs. Class dispatched by playbook (Task 03).

## Current state — `prompts/00-aprd/GAP-DETECT.md` (greenfield)

**Role:** adversarial gap hunter. Find every place a competent engineer could build two different things equally justified by spec. "Assume extraction is a trap" — even explicit items can admit two builds; an inferred item encodes a choice another engineer could make differently. Lane: find/frame/rank forks; never resolve, never author scope, never touch client.

**blast-radius discriminator (ranks every gap):** `architecture` (data-model shape / stack / deliverable-platform / external dep / how-capability-fundamentally-implemented → `disposition: ask`); `scope` (same structure, what's in/out moves → `ask`); `cosmetic` (neither structure nor scope → `assume`).

**Greenfield Rules (shared spine):** (1) find divergence not mere absence — hunt 5 places: unknowns `U*`, requirements `R*` (scope fork + implementation fork), inferred items, constraints `C*`, missing negative space; don't re-litigate a word the client explicitly chose; (2) ≥2 concrete buildable interpretations per gap, bounded to what extraction supports; (3) rank by blast radius, disposition deterministic from tier; (4) recommend a default per gap (verbatim one interpretation); (5) account for every unknown (each `U*` feeds a gap or is dismissed with reason); (6) thread IDs — mint `G*`, cite `refs`; (7) no client interaction; (8) cheapest-source-first, evidence is extraction in front of you, never invent requirements.

**Output:** `04-gaps.json` — `gaps[]` (id `G*`, gap line, `refs`, `interpretations[≥2]`, `recommended_default`, `blast_radius`, `disposition`, `reason`), `dismissed_unknowns[]`, `gap_counts`.

## THE WORK — add the feature-add delta to `GAP-DETECT.md`

1. **Frontmatter:** add feature-add input `{ path: ".aprd/baseline-map.json", format: "json — baseline decisions/conventions/seams already settled; NOT re-litigated as gaps (BF2)" }`. Add feature-add input for the frozen baseline aPRD `{ path: ".aprd/aprd.frozen.md", format: "markdown — baseline REQUIREMENTS/ASSUMPTIONS/OUT_OF_SCOPE already decided; a settled fork is not a gap" }`. Class gate routes feature-add here (Task 03).
2. **Shared `## Rules`:** keep greenfield rules. Rule 1's "don't re-litigate a word the client explicitly chose" already generalizes — extend the SHARED principle's source set so "explicitly chosen" includes baseline decisions for feature-add (one home; the delta states the corpus).
3. **Add `## Rules (feature-add delta — shared Rules above also bind):`**
   - **Gaps measured vs baseline (BF2).** A fork the baseline already settled (existing ADR, existing OUT_OF_SCOPE, established convention) is NOT a gap — never re-raise it. Hunt forks ONLY in: the new feature's `R*/E*` (from feature-add extraction, IDs above high-water) and the **seams** where the feature meets existing components (integration-seam catalog in baseline-map).
   - **Seam-fork is a first-class hunt site (BF6 precursor).** For each place the feature plugs into an existing seam, ask: does it plug in two materially different ways (e.g. extend existing contract vs new contract)? If so → architecture or scope gap citing the seam (`at: C*`, `contract_ref: CT*`).
   - **Convention-conformance is settled, not a gap.** New code matching existing conventions is a baseline fact (BF5), not a fork to ask about. Don't manufacture a "which style?" gap when the baseline convention answers it.
   - **Stay hostile, bounded to the delta.** Adversarial posture unchanged; the SCOPE narrows to the feature + seams, the rigor does not.
4. **Output schema:** add `class: "feature-add"`, `baseline_map_ref`, `baseline_aprd_ref`; allow a gap to carry an optional `seam_ref` ({at, contract_ref}) when the fork is at an integration seam. Gaps reference only new-feature IDs + seams.
5. **Task steps:** add a feature-add branch: read baseline-map + frozen baseline aPRD first → identify settled decisions (exclude from hunt) → hunt forks in new `R*/E*` + seams → rank/default → write. Keep greenfield steps intact.

## Lane / what NOT to do

- Don't re-raise a baseline-settled fork as a gap.
- Don't resolve gaps or touch client (still adversarial-find-only).
- Don't duplicate shared rules into the delta (AB1).

## Verify (both-directions)

- **Known-good:** feature-add CR → gaps cover only the new feature + its seams; settled baseline decisions absent from `gaps[]`. PASS.
- **Planted defect — re-litigation:** a gap re-asking a baseline-settled ADR/scope decision → MUST FAIL (BF2 / wasted client time).
- **Planted defect — missed seam fork:** the feature plugs into an existing seam two ways but no seam gap raised → MUST FAIL.

## DONE WHEN

- [x] `GAP-DETECT.md` carries a feature-add delta (shared Rules substance untouched; delta = only differences).
- [x] Golden feature-add `04-gaps.json` measures gaps vs baseline, raises seam forks, omits settled decisions.
- [x] Both-directions check holds.

## STATUS — DONE (2026-06-10)

Edits to `prompts/00-aprd/GAP-DETECT.md`:
- **Frontmatter inputs:** grouped `# — shared (both classes) —` / `# — feature-add —`; added `baseline-map.json` (settled decisions/seams, BF2) + `aprd.frozen.md` (settled REQUIREMENTS/OUT_OF_SCOPE).
- **Escapes:** added feature-add guard — baseline-map missing/unparseable → BASELINE-MAP (cannot measure gaps vs baseline read-first, BF2).
- **Shared Rule 1 generalized (one home, AB1):** "re-litigate word client chose" → "re-litigate already-settled fact"; settled-source set declared class-dependent — greenfield = explicit client words, feature-add **also** = baseline decisions on disk. Delta names the baseline corpus; greenfield substance untouched.
- **New `## Rules (feature-add delta …)`:** (1) gaps measured vs baseline — settled fork NOT a gap, hunt only new `R*/E*` + seams (BF2); (2) seam-fork first-class hunt site w/ `seam_ref` (BF6 precursor); (3) convention-conformance settled, not a gap (BF5). Only differences carried (AB1) — discriminator/Rules 2–8 not restated.
- **Output schema:** added `class:"feature-add"`, `baseline_map_ref`, `baseline_aprd_ref`; per-gap optional `seam_ref {at, contract_ref}`; `refs` note narrowed for feature-add (only new-feature IDs, never settled baseline ID). Greenfield path = null/omit.
- **Task steps:** added feature-add branch (read baseline-map + frozen aPRD FIRST → catalog settled, exclude → hunt new `R*/E*` + touched seams → seam-fork test → rank/default/reconcile → write w/ refs). Greenfield steps + guards intact (no re-list, AB1/AB2).
- **Stop condition:** "Valid greenfield" → "Valid (greenfield OR feature-add)".

Golden (`_fixtures/brownfield-feature/.aprd/04-gaps.json`): gaps for CR-001 (tag + filter time entries).
- **G1 architecture** (free-text string field vs first-class Tag entity/table) — carries `seam_ref {at:C1, contract_ref:CT2}` (persistence seam: extend CT2 vs new contract). refs E8/U2/R13.
- **G2 scope** (one label vs multi-tag — optional-additional-capability fork on CR's singular "a label"). refs U1/R11.
- **G3 scope** (single-tag filter vs multi-tag AND/OR). refs U3/R12.
- `class=feature-add`, `baseline_map_ref` + `baseline_aprd_ref` set. `dismissed_unknowns:[]` (U1/U2/U3 all fed gaps). `gap_counts {architecture:1, scope:2, cosmetic:0, total:3}`.
- **Settled-baseline absent:** no gap re-asks stack/DB/auth/web-framework (frozen ADRs) or tag-module naming (convention BF5). All `refs` = new-feature IDs strictly above high-water (R>10, E>7, fresh U); never a settled baseline ID.

Both-directions (validated by script — JSON parses; refs⊆new-feature IDs; all R/E above high-water; disposition deterministic from tier; recommended_default verbatim ∈ interpretations; every U* fed-or-dismissed; seam_ref ∈ baseline seam catalog):
- **Known-good** golden → gaps cover only new feature + its persistence seam; settled decisions absent → PASS.
- **Planted re-litigation** (gap re-asking a frozen ADR/scope decision, e.g. "which DB?") → cites a settled baseline ID / non-new ID → violates delta Rule 1 + refs∉new-IDs → FAIL ✓.
- **Planted missed-seam-fork** (drop G1's `seam_ref`, frame Tag persistence as blank-slate ignoring CT2 at C1) → seam fork unraised → violates delta Rule 2 → FAIL ✓.
