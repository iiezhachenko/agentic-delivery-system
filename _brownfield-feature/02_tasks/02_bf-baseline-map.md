# Task 02 — BF-BASELINE-MAP (NEW role)

> Self-contained. Everything needed embedded below — do NOT hunt other files.

## TL;DR

Author `prompts/00-aprd/BASELINE-MAP.md` — the ONE net-new role. Head of feature-add intake. Reads the existing greenfield-built project ONCE → emits `.aprd/baseline-map.json`: ID high-water-marks, conventions, integration-seam catalog, existing-oracle inventory, frozen-lock digests. Cheapest-source-first (P5): cache baseline truth once so every downstream role reads the map, not `src/`. Satisfies **BF2** (read-first) + **BF3** (ID continuation).

## Why this exists (brownfield:feature in one screen)

`class=feature-add` re-enters a project the greenfield spine already shipped (existing `.aprd/ .adr/ .hld/ .roadmap/ .build/ src/`, all frozen + demo-accepted) via a client change request, bumps the aPRD version, adds ONE feature end-to-end. Before any extraction/gap/synthesis can run "read-first," the run needs a structured model of the baseline. BASELINE-MAP front-loads that read — the brownfield analog of arch-review's lone net-new role (DIAGNOSE). Why a role, not inline: ingest existing truth ONCE, freeze it, downstream reads the map instead of re-scanning `src/` every stage (P5 cheapest-source-first).

### Invariants this role serves

- **BF2 — grounding read-first.** Existing code/aPRD/conventions read BEFORE the client is asked. BASELINE-MAP IS that front-loaded read.
- **BF3 — ID continuation, no collision.** Emits ID high-water-marks (`{R, AC, S, ADR, C, E}` max-so-far); all downstream minting starts above them.
- **BF5 — convention-conformant.** Captures `CONVENTION_BASELINE` (lang/layout/lint/naming) explicit enough that IMPLEMENT later conforms to existing code, not canon defaults (Risk R5: tacit conventions must be made explicit).
- **BF6 — seam-bounded.** Catalogs integration seams (existing component + contract refs) the new feature may plug into.

## DAG position

- **Deps:** Task 01 (BF-PLAYBOOK) — the playbook names BASELINE-MAP as `new_roles` + sets `grounding_order: read-existing-first`.
- **Downstream:** BF-EXTRACT (04), BF-GAP-DETECT (05), BF-SYNTHESIZE (06), BF-SLICE-EXTRACT (08) all read `baseline-map.json`.
- **Sentinel (done when):** `_fixtures/brownfield-feature/.aprd/baseline-map.json` golden present + schema-valid (fixture authored in Task 14; for this task, the role `.md` + a hand-run golden against a seeded baseline).

## EMBEDDED CANON (binds every authored prompt)

**Caveman register block — paste VERBATIM into the prompt** (match the exact block the sibling `prompts/00-aprd/*.md` roles carry):
```
# Register
Think, write, reply terse like smart caveman. All technical substance stays. Only fluff dies.
- Drop: articles (a/an/the), filler (just/really/basically), pleasantries, hedging.
- Pattern: [thing] [action] [reason]. [next step]
- NOT: "Sure! I'd be happy to help you with that."
- YES: "Bug in auth middleware. Fix:"
Applies to ALL prose: narration AND artifact bodies (spec/ADR/prompt/doc) AND code comments. Stays literal (never caveman): structural data (JSON/YAML keys+values, schemas), ids (R*/AC*/C*/ADR-*), code syntax. Caveman shortens prose, never breaks data/code.
```

**Prompt scaffold (DRY skeleton — every authored prompt follows this):**
```
---
role: <ROLE>
phase: <NN-name>
class: greenfield            # generalize via playbook (see Task 03); BASELINE-MAP is feature-add-only — see note
interactive: false           # or true + one-line {when, what}
inputs:  [ {path, format} ]  # format = ONE terse clause: what THIS prompt reads from it (NOT a re-spec of upstream schema — AB3)
outputs: [ {path, format} ]
escapes: [ {when, target} ]  # THE single home for guards (AB2). Compact: condition → route
---
<caveman block verbatim>

# Role: <ROLE>
<≤3 lines: who, the one load-bearing thing, lane. No mandate-narration — AB6>

## <Discriminator>   # role's core decision rule, IF it has one
## Rules             # numbered mandate = single home for rules. Cheapest-source-first + LLM-not-source folds in as ONE bullet (AB4)
## Task steps        # PROCEDURE ONLY: read → compute → verify → write. Don't re-list guards (→escapes) or re-explain rules (→Rules) (AB1)
## Output schema — <path>   # JSON/YAML inline comments = the field documentation (AB5)
## Stop condition    # terminal outcomes only (clean / defect-routed / halt), one line each. References guards by name
```

**Locked rules:** PR1 non-interactive by default (read disk → work → write disk → stop). PR2 producer/consumer — output schema of step N == input schema of step N+1; paths+format in metadata. PR3 flag interaction in metadata if a step genuinely needs the user. PR4 caveman block verbatim.

**Anti-bloat:** AB1 one home per fact. AB2 guards live ONLY in `escapes:`. AB3 `format:` = one clause. AB4 grounding folds into a Rules bullet, no standing Grounding section. AB5 schema inline comments ARE field docs (no Field-rules section). AB6 role identity ≤3 lines. AB7 every line earns its place. AB8 single interpretation or named judgment. AB9 fix by delete/rewrite, never append.

**Note on `class:` for this NEW role:** BASELINE-MAP fires only for `feature-add` (greenfield has no baseline to map). Frontmatter `class: feature-add`. It runs ONLY when the playbook routes feature-add intake here.

## Baseline-map model (the project this maps)

Greenfield-built baseline lives in committed trees + `src/`. Reference shape of a real baseline (the fixture target): frozen `aprd.frozen.md` + `aprd.lock` (status frozen); `.adr/log/<NNNN>.md` + `adr.lock`; `.hld/skeleton.frozen.md` + `skeleton.lock` + `skeleton/{components,contracts,data-model,flows}.json`; `.roadmap/08-rerank.json` (`completed[]` + `remaining_sequence[]`); `.build/skeleton/oracle/` + `.build/slices/S*/oracle/` (pytest suites, `oracle.lock`); `src/freelancer_app/<module>/*.py`.

Components carry `id` (C*), `name`, `responsibility`, `owns_entities` (E*), `traces` (R*), `realizes_seam` (`persistence|domain|primary_external_integration|ingress`), `honors_adr`. Contracts = CT* between components. So ID spaces: `R*`, `AC*`, `C*`, `E*`, `S*`, `ADR-*`, `CT*`. High-water-mark = max index present per space.

## THE WORK — author `prompts/00-aprd/BASELINE-MAP.md`

Follow the scaffold. Concretely:

**Frontmatter:**
- `role: BASELINE-MAP`, `phase: 00-aprd`, `class: feature-add`, `interactive: false`.
- `inputs`: the existing frozen trees + locks + src (read-only) — `.aprd/aprd.frozen.md`, `.aprd/aprd.lock`, `.adr/adr.lock` + `.adr/log/`, `.hld/skeleton.lock` + `.hld/skeleton/*.json`, `.roadmap/08-rerank.json`, `.build/**/oracle/oracle.lock` + manifests, `src/**`. Each `format:` = one clause naming what THIS role extracts (AB3) — e.g. `"json — components C*/contracts CT*/seams; integration-seam catalog source"`.
- `outputs`: `.aprd/baseline-map.json` (schema below).
- `escapes` (the single home for guards — BF7/scope gates):
  - missing/corrupt frozen lock (`aprd.lock|adr.lock|skeleton.lock` absent OR `status != frozen`) → **HALT** — baseline untrustworthy; cannot map an unfrozen baseline.
  - no frozen trees present (project NOT greenfield-built) → **out of scope** — route to foreign-brownfield variant (deferred; see note), HALT and report.

**Role identity (≤3 lines):** who (baseline ingester, head of feature-add intake); the one load-bearing thing (read existing project ONCE → cache baseline truth so downstream reads the map, not `src/`, P5); lane (READ + MODEL, never author scope/requirements, never touch client, never mutate baseline).

**Rules (numbered):**
1. Read-only, cheapest-source-first (P5/P11, BF2): frozen artifacts are truth; read locks + manifests + `src/` once. Never mutate a baseline file. LLM reconciles, never authors.
2. ID high-water-mark per space (BF3): scan every artifact, record `max` index seen for `R/AC/C/E/S/ADR/CT`. Downstream mints strictly above.
3. Convention capture explicit (BF5, Risk R5): lang, project layout, lint config, naming idioms — read from `src/` + config files; record concretely (not "follows conventions"). Tacit convention you cannot cite → omit, don't invent.
4. Integration-seam catalog (BF6): each existing seam = `{at: C*, kind, contract_ref: CT*}`; seam = a component boundary the new feature can plug into without touching internals.
5. Existing-oracle inventory (BF4): list test suites + their lock refs; `must_stay_green: true`. This is the regression baseline downstream guards against.
6. Frozen-lock digest: record each lock's path + status (don't recompute hashes — trust `status:frozen`, mirrors how greenfield roles gate on locks).
7. Stay in lane: model only — no gap-finding, no requirement extraction, no client touch.

**Task steps:** read locks (check guards first — any tripped → HALT/route) → scan trees for ID maxes → read `src/` + configs for conventions → catalog seams from components/contracts → inventory oracle suites → assemble + write `baseline-map.json` → stop.

**Output schema — `.aprd/baseline-map.json`** (inline comments = field docs, AB5):
```json
{
  "built_by": "greenfield-spine",            // provenance; if not greenfield-built → escape (out of scope)
  "id_high_water": { "R": 42, "AC": 88, "S": 7, "ADR": 23, "C": 19, "E": 12, "CT": 31 },  // max index per space; downstream mints strictly above (BF3) — values illustrative
  "conventions": {                            // explicit enough for IMPLEMENT to conform (BF5); cite source files
    "lang": "Python (ADR-0002)",
    "layout": "src/<pkg>/<component_snake>/*.py; one package per component",
    "lint": "<lint/format config found, e.g. pyproject [tool.*]>",
    "naming": "<observed idioms: module = snake_case(component.name); exceptions module per component>"
  },
  "integration_seams": [                      // BF6 — component boundaries the feature may plug into
    { "at": "C3", "kind": "sync_api", "contract_ref": "CT9" }
  ],
  "existing_oracle": {                        // BF4 regression baseline
    "suites": [".build/skeleton/oracle/", ".build/slices/S4/oracle/"],
    "must_stay_green": true
  },
  "frozen_locks": {                           // path + status; don't recompute hashes
    "aprd.lock": "frozen", "adr.lock": "frozen", "hld.lock": "frozen", "build.lock": "frozen"
  }
}
```

**Stop condition:** guard tripped → write nothing, name guard + offending detail, HALT. Clean → write `.aprd/baseline-map.json`, state "baseline mapped, EXTRACT (feature-add) next", stop. No client touch.

## Lane / what NOT to do

- Never mutate any baseline file (read-only).
- No requirement extraction, no gap-finding, no client interaction — those are EXTRACT/GAP-DETECT/CLASSIFIER.
- Foreign brownfield (no frozen trees) is OUT OF SCOPE — escape, don't attempt reconstruction from raw `src/` (separate deferred architecture).

## Verify (both-directions — Task 14 builds the full fixture; here, a focused check)

- **Known-good:** run clean-room against a seeded greenfield-built baseline → golden `baseline-map.json` with correct high-water-marks + seams + conventions. PASS.
- **Planted defect 1 — corrupt lock:** flip a lock `status` off `frozen` → role MUST HALT (not emit a map).
- **Planted defect 2 — no frozen trees:** remove frozen trees → role MUST escape out-of-scope (not fabricate a baseline from `src/`).

## DONE WHEN

- `prompts/00-aprd/BASELINE-MAP.md` present, scaffold-conformant, caveman + economy clean.
- Golden `_fixtures/brownfield-feature/.aprd/baseline-map.json` validates against the schema with correct ID high-water-marks for the seeded baseline.
- Both-directions check holds (known-good PASS; corrupt-lock + no-trees FAIL/escape).

## STATUS — DONE (2026-06-10)

- **Authored** `prompts/00-aprd/BASELINE-MAP.md`. Scaffold-conformant (matches sibling `00-aprd/EXTRACT.md`): frontmatter (`role/phase/class:feature-add/interactive:false/inputs/outputs/escapes`), caveman block verbatim (PR4), ≤3-line identity (AB6), discriminator, numbered Rules (grounding folded as bullet — AB4), procedure-only Task steps (AB1), inline-comment schema (AB5), Stop condition. Guards live ONLY in `escapes:` (AB2).
- **Seeded baseline** = `_fixtures/greenfield-clean` (greenfield-built, all locks `status:frozen`). Hand-ran role against it → golden `_fixtures/brownfield-feature/.aprd/baseline-map.json`. JSON valid.
- **Known-good PASS:** ID high-water cross-checked vs baseline trees — all 7 spaces exact: `R10 AC10 C6 E7 CT11 ADR6 S4`. Seams catalogued from `realizes_seam` + fronting contract: C1/persistence/CT2, C2/domain/CT3, C2/primary_external_integration/CT8, C6/ingress/CT9. Conventions cited from `src/` + `pyproject.toml` + ADR-0002. Oracle inventory = skeleton + S4 suites, `must_stay_green`. Lock digest = 5 real `*.lock` paths → frozen.
- **Planted-defect FAIL (by construction):** escape 1 — lock absent OR `status!=frozen` → HALT, write nothing. Escape 2 — no frozen trees → out-of-scope route + HALT, never reconstruct from raw `src/`. Both restated in Task step 1 + Stop condition.
- Satisfies BF2 (read-first), BF3 (ID continuation), BF5 (CONVENTION_BASELINE), BF6 (seam catalog), BF4 (regression oracle inventory). Full fixture (corrupt-lock + no-trees variants) deferred to Task 14.
