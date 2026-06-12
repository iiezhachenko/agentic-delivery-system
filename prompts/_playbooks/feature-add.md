# Playbook — feature-add (class binding)

> Class binding for feature-add. One file = whole class. Touches no engine (P3).

# Register
Think, write, reply terse like smart caveman. All technical substance stays. Only fluff dies.
- Drop: articles (a/an/the), filler (just/really/basically), pleasantries, hedging.
- Pattern: [thing] [action] [reason]. [next step]
- NOT: "Sure! I'd be happy to help you with that."
- YES: "Bug in auth middleware. Fix:"
Applies to ALL prose: narration AND artifact bodies AND code comments. Stays literal (never caveman): structural data (JSON/YAML keys+values, schemas), ids (R*/AC*/C*/ADR-*), code syntax.

# What this is
Config engine reads, NOT a role. No role/inputs/outputs/escapes frontmatter — file IS the schema instance below. Sibling to `_orchestrator.md`, `_step-runner.md`, `_economy-audit.md`. Selected when CLASSIFIER emits `class=feature-add`; before this file existed, that emit HALTed.

feature-add = change-request mechanism frozen canon already promised (P8), fired for one class. Re-enters SAME project (existing `.aprd/.adr/.hld/.roadmap/.build/ src/`, all frozen + demo-accepted) at Phase 0 via client CR, bumps aPRD version, adds ONE feature end-to-end. Playbook = pluggable config telling engine how to behave for this class. Declares mechanisms; downstream tasks 02–13 realize them.

# Schema instance (deliverable core — keys/values literal)

```yaml
class: feature-add
has_adp_artifacts:   true                # guard: ADP foundation (.aprd/.hld/.adr/) must exist before playbook activates; false -> HALT (CLASSIFIER Rule 2 checks upstream — CR-004 §B)
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

# Field bindings (one home each — no engine restate, no downstream-schema re-doc)

- `has_adp_artifacts: true` — pre-check guard. CLASSIFIER verifies `.aprd/`, `.hld/`, `.adr/` all present before routing here (Rule 2, CR-004 §B). Reached only when true; reached with foundation absent (edge case) → HALT: "ADP foundation absent. Run `adopt` dispatch first, then re-run."
- `grounding_order: read-existing-first` — binds BF2. Baseline truth (`.aprd/.adr/.hld/.build` + `src/` + conventions) read ONCE up front; client asked only for residue existing artifacts can't answer. Flips greenfield ask-first.
- `active_stages` all off — foundation + harness already shipped by greenfield. Re-cutting skeleton/foundation/scaffold = redraw frozen box = BF1 violation. Stay additive.
- `aprd_extension` — 3 blocks SYNTHESIZE adds at version-bump: INTEGRATION_SEAMS (BF6 — where feature plugs into existing components), REGRESSION_GUARD (BF4 — what stays green), CONVENTION_BASELINE (BF5 — existing conventions new code matches).
- `oracle_layers += regression` — binds BF4. Regression layer MANDATORY but scoped to touched surface + declared seams, NOT full inherited suite (Risk R4 — full re-run blows cost/time).
- `build_depth: per-slice-no-scaffold` — MODE=slice; harness exists so no scaffold step. New IDs (`R*/AC*/S*/ADR*/C*`) continue above baseline high-water-mark (BF3); each slice integrates at a declared seam (BF6).
