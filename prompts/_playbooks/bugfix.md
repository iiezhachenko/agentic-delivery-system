# Playbook — bugfix (class binding)

> Class binding for bugfix. One file = whole class. Touches no engine (P3).

# Register
Think, write, reply terse like smart caveman. All technical substance stays. Only fluff dies.
- Drop: articles (a/an/the), filler (just/really/basically), pleasantries, hedging.
- Pattern: [thing] [action] [reason]. [next step]
- NOT: "Sure! I'd be happy to help you with that."
- YES: "Bug in auth middleware. Fix:"
Applies to ALL prose: narration AND artifact bodies AND code comments. Stays literal (never caveman): structural data (JSON/YAML keys+values, schemas), ids (R*/AC*/C*/ADR-*), code syntax.

# What this is
Config engine reads, NOT a role. No role/inputs/outputs/escapes frontmatter — file IS the schema instance below. Sibling to `_orchestrator.md`, `_step-runner.md`, `_economy-audit.md`. Selected when CLASSIFIER emits `class=bugfix`.

bugfix = brownfield repair class, re-enters SAME project (existing `.aprd/.adr/.hld/.roadmap/.build/ src/`, all frozen + demo-accepted) at Phase 0 via defect report. Existing behavior wrong/crash/incorrect-output; repair to spec, adds NO new behavior + NO new tech. Reuses brownfield invariants (BF1-BF6) feature-add already proved. Declares mechanisms; downstream tasks 02–13 realize them.

# Schema instance (deliverable core — keys/values literal)

```yaml
class: bugfix
classifier_hints:    "existing behavior wrong/crash/incorrect-output — repair to spec, no new behavior"
grounding_order:     read-existing-first   # BF2; action = reproduce → localize → root-cause BEFORE client
grounding_corpus:    [existing code, tests, git-history, runtime-repro]   # NO external canon — bugfix adds no new tech
active_stages:       { skeleton_identify: off, foundation_cut: off, scaffold: off }   # harness already built — don't re-cut/re-scaffold
depth_collapse:      { adr: blast-radius, hld: blast-radius }   # decision/design COLLAPSE by blast radius (D10/H11) — not hard-off
aprd_extension:      [REPRO_STEPS, ROOT_CAUSE, BLAST_RADIUS, REGRESSION_GUARD]   # class-extension block SYNTHESIZE emits
oracle_layers:       [reproduction, regression]   # reproduction (red→green) + regression BOTH mandatory
prompt_overlays:     { BASELINE-MAP, GAP-DETECT, SYNTHESIZE, DIAGNOSE,
                       DERIVE-TESTS, MATERIALIZE-ORACLE, IMPLEMENT, VERIFY-OUTPUT }   # roles carrying a bugfix delta block
new_roles:           []                              # BASELINE-MAP + DIAGNOSE already shipped — no net-new role
build_depth:         single-unit-no-scaffold         # B13; single unit, typically no new component, harness exists
verify_method:       inherited ladder + reproduction-must-flip-red→green + regression-must-stay-green
```

# Field bindings (one home each — no engine restate, no downstream-schema re-doc)

- `grounding_order: read-existing-first` — binds BF2. Truth = existing code + reproduction; client asked only for residue repro can't answer.
- `grounding_corpus` — distinguishes from feature-add, which pulls canon-for-NEW-tech.
- `active_stages` all off — harness already shipped by greenfield. Re-cutting skeleton/foundation/scaffold = redraw frozen box = BF1 violation.
- `depth_collapse` — decision/design SCALE to blast radius (D10/H11), NOT hard-toggled like the three build-once stages. Typically 0 ADR / no HLD; boundary-moving or decision-reversing fix still earns ONE ADR / seam sketch.
- `aprd_extension` — 4 blocks SYNTHESIZE adds at version-bump: REPRO_STEPS (how to trip defect), ROOT_CAUSE (DIAGNOSE verdict), BLAST_RADIUS (touched surface, scopes BF4 guard), REGRESSION_GUARD (BF4 — what stays green).
- `oracle_layers` — reproduction REPLACES feature-add's new-behavior layers (contract/flow/acceptance): bugfix asserts no new contract, makes ONE failing repro test flip red→green. Inherited contract tests on touched surface still run inside regression scope. Regression scoped to blast-radius + seams, NOT full suite (Risk R4).
- `prompt_overlays` — DIAGNOSE = headline role (localize/root-cause); DERIVE-TESTS/MATERIALIZE-ORACLE author the reproduction test; IMPLEMENT = minimal fix at root cause; VERIFY-OUTPUT asserts repro green + regression green.
- `build_depth: single-unit-no-scaffold` — new IDs (`R*/AC*/C*`) continue above baseline high-water-mark (BF3). Fix DOES edit existing src — that's the repair, scoped + regression-guarded (BF4). BF1 binds the FROZEN UPSTREAM (aprd.frozen/adr.log/locks) which never mutate; defect route there = new aPRD version + CR. NOT new-namespace-only.
