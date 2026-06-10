# Task 01 — BF-PLAYBOOK (CONFIG)

> Self-contained. Everything needed embedded below — do NOT hunt other files.

## TL;DR

Author `prompts/_playbooks/feature-add.md` — NEW file in a NEW `prompts/_playbooks/` dir. One file = whole class binding for `feature-add`. Holds the playbook schema (class, grounding order, active stages, aPRD extension, oracle layers, prompt overlays, build depth, verify method). Head of the brownfield spine; every downstream task references it. Touches NO engine prompt (proves the abstraction — P3).

## Why this exists (brownfield:feature in one screen)

Brownfield:feature is NOT a new engine. It = the **change-request mechanism** frozen artifacts already promised (P8: "change = new version + change request re-triggering affected downstream"), fired for `class=feature-add`. Greenfield spine already built every hook: every role carries `class: greenfield  # class-agnostic by design; only greenfield authored yet`; CLASSIFIER emits `feature-add` but HALTs (no playbook); Phase-3 increment mode + Phase-1 RE-RANK + Phase-4 slice-build = machinery for "extend a frozen baseline with one more slice." Work = **fill reserved slots + fire reserved hooks**, not build a parallel pipeline.

A feature-add run re-enters the SAME project (existing `.aprd/ .adr/ .hld/ .roadmap/ .build/ src/`, all frozen + demo-accepted) at Phase 0 via a client change request, bumps the aPRD version, adds ONE feature end-to-end. The playbook is the pluggable config that tells the engine how to behave for this class.

### The 7 brownfield invariants (the playbook is the binding that enforces them downstream)

- **BF1 — baseline immutable + additive.** Never rewrite a frozen artifact; only extend (version-bump aPRD; new `R*/AC*/S*/ADR*/C*` continue numbering above baseline; HLD increment never redraws a frozen box).
- **BF2 — grounding read-first.** Existing code/aPRD/conventions read BEFORE the client is asked; client answers residue only.
- **BF3 — ID continuation, no collision.** New IDs start above baseline high-water-mark.
- **BF4 — regression-gated.** Nothing previously green goes red.
- **BF5 — convention-conformant.** New code matches existing conventions, not canon defaults.
- **BF6 — seam-bounded.** Feature plugs into existing components at declared seams; existing internals untouched.
- **BF7 — re-entry = change request.** Feature enters via a client CR that bumps a frozen version + re-triggers affected downstream.

This task's playbook **declares** the mechanisms; downstream tasks (02–13) realize them. BF7 is realized by the front door (Phase-0 intake routing to this playbook).

## DAG position

- **Deps:** none — head of spine.
- **Downstream:** everything references this file. BF-BASELINE-MAP (02), BF-CLASS-GEN (03) read it first.
- **Sentinel (done when):** `prompts/_playbooks/feature-add.md` present + schema-valid vs the canonical playbook schema below.

## EMBEDDED CANON (binds this artifact — caveman + economy)

This file is itself a pipeline artifact → caveman register + economy bind it (CLAUDE.md). Author the playbook body in caveman prose; keep YAML keys/values/ids literal.

**Register (the caveman block — governs all prose in the file):**
```
Think, write, and reply using terse language like smart caveman. All technical substance stay. Only fluff dies.
- Drop: articles (a/an/the),  filler (just/really/basically), pleasantries, hedging.
- Pattern: [thing] [action] [reason]. [next step]
- NOT: "Sure! I'd be happy to help you with that."
- YES: "Bug in auth middleware. Fix:"
Applies to ALL prose: narration AND artifact bodies AND code comments. Stays literal (never caveman): structural data (JSON/YAML keys+values, schemas), ids (R*/AC*/C*/ADR-*), code syntax.
```

**Economy / anti-bloat (AB1–AB9, condensed):** one home per fact (AB1); every line earns its place — delete it, does any reader's action change? No → cut (AB7); single interpretation or say "judgment call:" (AB8); fix by DELETE/REWRITE, never append a clarifying second line (AB9).

**Placement context:** the playbook is a sibling to `prompts/_orchestrator.md`, `prompts/_step-runner.md`, `prompts/_economy-audit.md`. It is config the engine reads, not an executable role prompt — so it has NO role/inputs/outputs/escapes frontmatter; it IS the schema instance below.

## THE WORK — author `prompts/_playbooks/feature-add.md`

1. Create dir `prompts/_playbooks/`.
2. Write `feature-add.md`. Open with a one-line caveman thesis: "Class binding for feature-add. One file = whole class. Touches no engine (P3)." Then the schema instance (this is the deliverable core — keep keys/values exactly):

```yaml
class: feature-add
classifier_hints:    "new behavior into existing codebase"
grounding_order:     read-existing-first   # flips greenfield ask-first (BF2); read .aprd/.adr/.hld/.build + src/ + conventions BEFORE client
grounding_corpus:    [existing .aprd/.adr/.hld/.build, src/, conventions, canon-for-NEW-tech-only]
active_stages:       { skeleton_identify: off, foundation_cut: off, scaffold: off }   # foundation + harness already built — don't re-cut/re-scaffold
aprd_extension:      [INTEGRATION_SEAMS, REGRESSION_GUARD, CONVENTION_BASELINE]       # class-extension block SYNTHESIZE emits (BF6/BF4/BF5)
oracle_layers:       [contract, flow, acceptance, regression]   # regression layer MANDATORY (BF4)
prompt_overlays:     { EXTRACT, GAP-DETECT, SYNTHESIZE, SLICE-EXTRACT, SEQUENCE,
                       MATERIALIZE-ORACLE, IMPLEMENT, INTEGRATE, VERIFY-OUTPUT }       # roles carrying a feature-add delta block
new_roles:           [BASELINE-MAP]                              # net-new role, head of feature-add intake
build_depth:         per-slice-no-scaffold                       # MODE=slice; harness exists, no scaffold
verify_method:       inherited ladder + regression-must-stay-green
```

3. After the YAML, add a short caveman section per non-obvious field stating what it BINDS (one home — don't restate the engine, don't re-document downstream schemas):
   - `grounding_order: read-existing-first` → why: BF2; baseline truth read once, client spends only on residue.
   - `active_stages` all off that are off → why: foundation + harness already shipped by greenfield; re-cutting = redraw frozen box (BF1 violation).
   - `aprd_extension` → the 3 blocks SYNTHESIZE adds at version-bump (BF6 seams, BF4 regression guard, BF5 convention baseline).
   - `oracle_layers += regression` → BF4; scope to touched surface + seams, NOT full inherited suite (Risk R4).
   - `build_depth: per-slice-no-scaffold` → MODE=slice; no scaffold.

4. Keep it ONE file. Do not scatter overlay blocks into roles here (that's tasks 04–13); the playbook only NAMES which roles overlay.

## Lane / what NOT to do

- Touch NO engine prompt. If wiring this class seems to force editing a role's engine logic (not its class-delta), the abstraction leaked → fix the spine once, flag it; do not hack the playbook.
- Author no role logic here — this is config, not a role.
- Invent no new schema field beyond the canonical set above.

## DONE WHEN

- `prompts/_playbooks/feature-add.md` exists, dir `prompts/_playbooks/` created.
- File is schema-valid: carries every key in the canonical schema, values as specified, caveman + economy clean.
- No engine prompt modified by this task.

## STATUS — DONE (2026-06-10)

- `prompts/_playbooks/` dir created.
- `prompts/_playbooks/feature-add.md` written: caveman thesis + Register + schema instance (11 canonical keys, values verbatim) + per-field bindings (BF1–BF6 mapped).
- Schema-valid: all keys present — class, classifier_hints, grounding_order, grounding_corpus, active_stages, aprd_extension, oracle_layers, prompt_overlays, new_roles, build_depth, verify_method.
- Zero engine prompts touched (P3 abstraction holds — playbook only NAMES overlay roles, scatters no overlay blocks).
