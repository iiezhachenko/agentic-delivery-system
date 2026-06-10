# Task 04 — BF-EXTRACT (OVERLAY)

> Self-contained. Everything needed embedded below — do NOT hunt other files.

## TL;DR

Add a `feature-add` DELTA block to `prompts/00-aprd/EXTRACT.md`. Greenfield EXTRACT turns a raw request into a typed inventory (entities/explicit+implied requirements/constraints/unknowns) from the request text ALONE. Feature-add flips grounding order (BF2): read existing aPRD + code + conventions + `baseline-map.json` BEFORE treating the CR text as sole source; the client answers residue only. Items extracted as DELTA against the baseline. Follow the dual-mode overlay pattern: ONE shared `## Rules` + a feature-add delta carrying ONLY what differs (AB1).

## Why this exists

Feature-add re-enters a greenfield-built project via a change request. EXTRACT must not treat the CR as a blank-slate greenfield request — most context already exists on disk (BF2 read-first). The baseline-map (Task 02) already cached the baseline; EXTRACT grounds against it so new requirements are framed as extensions, not re-statements.

### Invariants served
- **BF2 — grounding read-first.** Read existing aPRD + code + conventions + baseline-map before the CR is sole source.
- **BF3 — ID continuation.** New `R*/E*/C*` mint above baseline high-water-mark (from `baseline-map.json` `id_high_water`).

## DAG position

- **Deps:** Task 02 (BASELINE-MAP — provides `baseline-map.json`), Task 03 (CLASS-GEN — feature-add no longer HALTs).
- **Downstream:** BF-GAP-DETECT (05).
- **Sentinel:** extract output grounds from `baseline-map.json` — golden cites baseline IDs/conventions and mints new IDs above the high-water-mark.

## EMBEDDED CANON (binds every authored prompt)

**Caveman block — already present in EXTRACT; leave verbatim.** (For reference, the block reads: "Think, write, reply terse like smart caveman… Stays literal (never caveman): structural data, ids, code syntax.")

**Anti-bloat:** AB1 one home per fact (delta carries ONLY what differs from shared rules — never copy a shared rule into the delta). AB2 guards live only in `escapes:`. AB3 `format:` = one clause. AB4 grounding folds into a Rules bullet. AB6 identity ≤3 lines. AB7 every line earns its place. AB8 single interpretation. AB9 fix by delete/rewrite, never append.

**Dual-mode overlay pattern (the proven idiom):** existing roles run two modes off ONE shared `## Rules` + a per-mode DELTA block (e.g. `pass: skeleton|increment`, `mode: skeleton-build|slice-build`). Shared rules (lane, grounding-discipline, invent-nothing, trace-IDs) live ONCE. Each mode section carries ONLY rules that differ. For feature-add: add a `## Rules (feature-add delta)` block; the class is dispatched by the playbook (Task 03). Never duplicate a shared rule into the delta.

## Current state — `prompts/00-aprd/EXTRACT.md` (greenfield)

**Frontmatter:**
```yaml
role: EXTRACT
phase: 00-aprd
class: greenfield   # (generalized to playbook-dispatch by Task 03)
interactive: false
inputs:
  - { path: ".aprd/00-raw-request.md", format: "markdown — verbatim client request; sole greenfield source-of-truth" }
  - { path: ".aprd/01-classification.json", format: "json — SR* subrequests + classes; tag each item with sr_ref" }
outputs:
  - { path: ".aprd/02-extraction.json", format: "json — entities, explicit/implied requirements, constraints, unknowns" }
escapes:
  - { when: "01-classification.json needs_confirmation == true", target: "self / HALT" }
  - { when: "any subrequest non-greenfield (escape non-null)", target: "non-greenfield playbook — HALT" }   # generalized by Task 03
```

**Role:** transcriber not author (P11) — surface exactly what request says + minimum it necessarily implies, flag everything open. Lane: don't decide "done", invent scope, resolve ambiguity, or touch client.

**fact-vs-gap discriminator:** request STATES → entity/explicit req/constraint (`inferred:false`); request NECESSARILY FORCES → implied req/forced entity (`inferred:true`+rationale); builder NEEDS but request doesn't answer → unknown.

**Greenfield Rules (the shared spine):** (1) don't invent requirements; (2) mark inference; (3) trace everything — `source` + `sr_ref`; (4) atomic items; (5) no client interaction; (6) cheapest-source-first, LLM not source — greenfield's only source is request text + attachments.

**Output schema:** `02-extraction.json` with `entities[E*]`, `explicit_requirements[R*]` (inferred:false), `implied_requirements[R*]` (inferred:true+rationale), `stated_constraints[C*]`, `unknowns[U*]` — all with `source` + `sr_ref`.

## THE WORK — add the feature-add delta to `EXTRACT.md`

1. **Frontmatter:** add a feature-add input `{ path: ".aprd/baseline-map.json", format: "json — baseline ID high-water-marks + conventions + seams; ground extraction against it (BF2), mint new IDs above high-water (BF3)" }`. Add the CR input `{ path: ".aprd/change-requests/CR-<id>.md", format: "markdown — the feature ask (feature-add intake)" }`. (Mark which inputs are feature-add-only via a `# — feature-add —` comment group, mirroring how `mode:` roles group inputs.)
2. **Escapes:** the class gate (Task 03) now routes feature-add here; add a feature-add guard `{ when: "feature-add but .aprd/baseline-map.json missing/unparseable", target: "BASELINE-MAP — baseline not mapped; cannot ground read-first (BF2)" }`.
3. **Shared `## Rules`:** keep greenfield rules as the shared spine. Where Rule 6 says "greenfield's only source is request text," generalize the SHARED statement to "cheapest-source-first; the source set depends on class (greenfield: request text; feature-add: baseline + code + conventions FIRST, then CR text — see delta)." Don't duplicate; the delta names the feature-add corpus.
4. **Add `## Rules (feature-add delta — shared Rules above also bind):`**
   - **Read-first grounding (BF2).** Ground from `baseline-map.json` + existing frozen aPRD + `src/` conventions BEFORE the CR is sole source. The CR text adds the NEW ask; the baseline supplies everything already true. An item the baseline already covers is NOT a new requirement — reference it, don't re-extract.
   - **Extract the DELTA only.** New entities/requirements/constraints = what the CR introduces beyond the baseline. Carry a `baseline_ref` on items that extend an existing baseline `R*/E*/C*`.
   - **Mint above high-water (BF3).** New `R*/E*/C*/U*` IDs start strictly above `baseline-map.json` `id_high_water` for each space. Never reuse a baseline ID.
   - **Unknowns measured vs baseline.** A fact the baseline already answers is NOT an unknown. Unknown = what the CR needs that neither baseline nor CR answers.
5. **Output schema:** add feature-add fields to `02-extraction.json` (inline comments = docs, AB5): `class: "feature-add"`, `baseline_map_ref`, and per-item optional `baseline_ref` (the baseline ID this item extends, or null for net-new). New IDs above high-water.
6. **Task steps:** add a feature-add branch: read baseline-map + frozen aPRD + conventions first → read CR → extract DELTA tagging `baseline_ref` + minting above high-water → write. Keep greenfield steps intact. Don't re-list guards (AB1/AB2).

## Lane / what NOT to do

- Don't resolve ambiguity or touch client (GAP-DETECT/QUESTION-GEN territory).
- Don't re-extract baseline items as new — reference them.
- Don't duplicate shared rules into the delta (AB1).
- Don't mint IDs at or below the baseline high-water-mark (BF3).

## Verify (both-directions)

- **Known-good:** feature-add CR + seeded baseline → extraction cites baseline conventions, new `R*` above high-water, `baseline_ref` on extending items. PASS.
- **Planted defect — ID collision:** a new `R*` reusing a baseline `R*` index → MUST FAIL (BF3).
- **Planted defect — blank-slate:** extraction ignoring baseline-map (re-extracting baseline requirements as new) → MUST FAIL (BF2).

## DONE WHEN

- [x] `EXTRACT.md` carries a feature-add delta block (shared Rules untouched in substance; delta carries only the differences).
- [x] Golden feature-add `02-extraction.json` grounds from baseline-map, mints above high-water, tags `baseline_ref`.
- [x] Both-directions check holds.

## STATUS — DONE (2026-06-10)

Edits to `prompts/00-aprd/EXTRACT.md`:
- **Frontmatter inputs:** grouped `# — shared —` / `# — feature-add —`; added `baseline-map.json` + `change-requests/CR-<id>.md` (BF2 read-first source, BF3 high-water).
- **Escapes:** added feature-add guard — baseline-map missing/unparseable → BASELINE-MAP (cannot ground read-first).
- **Shared Rule 6 generalized:** source set per class (greenfield = request text; feature-add = baseline FIRST then CR). No dup — delta names corpus (AB1).
- **New `## Rules (feature-add delta …)`:** read-first grounding (BF2), extract DELTA only + `baseline_ref` (BF3 mint above high-water), unknowns measured vs baseline. Only differences carried (AB1).
- **Output schema:** added `class:"feature-add"`, `baseline_map_ref`, per-item `baseline_ref` (inline-comment docs, AB5). Greenfield path = null/omit.
- **Task steps:** added feature-add branch (read baseline+aPRD+conventions → CR → DELTA → write). Greenfield steps intact; no guard re-list (AB1/AB2).

Golden (`_fixtures/brownfield-feature/.aprd/`): added `change-requests/CR-001.md` + `02-extraction.json`.
- New IDs all strictly above baseline high-water (E:7→E8, R:10→R11/R12/R13). `baseline_ref` R11/R12→R2, R13→R7. `class=feature-add`, `baseline_map_ref` set.
- "Everything else stays as-is" NOT typed as stated_constraint (no matching kind in enum) — it is the regression guard, homed downstream at REGRESSION_GUARD (BF4) per playbook (AB1 one home). `stated_constraints: []`.
- Validated: JSON parses; every minted ID > high-water for its space.

Both-directions (by construction):
- Known-good golden → PASS (cites baseline IDs via `baseline_ref`, new R* above high-water).
- Planted ID-collision (reuse baseline R*) → fails high-water check → FAIL ✓.
- Planted blank-slate (ignore baseline-map, re-extract baseline reqs, no `baseline_ref`) → violates BF2 grounding → FAIL ✓.
