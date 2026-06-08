# T05 — Author the Layer-2 ECONOMY-AUDIT adversarial role (+ PROMPT-AUDIT instantiation)

> Do-not-commit. Caveman register. SELF-CONTAINED.

## WHY (problem)

Lint (T04) can't judge MEANING. Three violation classes need a READER:
- **semantic duplication** — same fact, different words (e.g. "design-layer oracle NOT aPRD oracle" stated 12 ways across DERIVE-TESTS; lint's n-gram only catches verbatim copies).
- **no-objective (P2 general)** — decorative narration, motivational prose, mandate restated for emphasis.
- **ambiguity (P3 general)** — readable two ways beyond the hedge wordlist.

That reader = a new HOSTILE adversarial role, modeled on the project's existing CRITIQUE roles. It is the general **ECONOMY-AUDIT** capability; its prompt-stack instantiation is **PROMPT-AUDIT** (audits `.md` prompts). The general capability is parameterized `{artifact, economy-canon}` and is invoked by EVERY phase's existing verify gate (T06 wires it).

## SCOPE

Author the ECONOMY-AUDIT role (one role = one prompt). Adversarial, blocking-grade, FLAG-not-fix, routes ALWAYS to re-author (never patch). Includes both-directions + substance-floor self-test. Oracle = AB1–AB9 (T03) + spec P13/INV (T02).

Does NOT wire it into orchestrator/phase gates (T06). Does NOT do the cheap structural checks (those are lint, T04 — AUDIT runs only on lint-clean residue).

## GIVEN (why a NEW role, not extend CRITIQUE)

- One-role-one-prompt is load-bearing canon (D1, failure isolation).
- Build-CRITIQUE (`prompts/04-build/CRITIQUE.md`) hunts CODE cheats (hardcode/swallow/stub/under-complexity/gold-plating) — wrong category set for prose.
- RECONCILE-CRITIQUE (`prompts/03-hld/`) gates DESIGN coherence. Neither owns prose economy.
- Merged role would blur two failure lanes. New role, same adversarial idiom.
- Worst semantic-dup evidence: DERIVE-TESTS "design-layer oracle NOT aPRD oracle" ×12; MODEL-DATA "never mints E*" ×6; MAP-NFR anti-gold-plating ×5; INTEGRATE "carry framework, don't re-pick" ×4.

## DO — author the role

### Frontmatter / shape (general form, then prompt-stack instantiation)
```
role: ECONOMY-AUDIT          # general capability; PROMPT-AUDIT = its prompt-stack caller-view
phase: <invoked at every phase's verify step>   # see T06 wiring
interactive: false
inputs:
  - the artifact under review (the DIFF) — e.g. scratch .md prompt
  - economy canon = AB1–AB9 (.hld/skeleton/coding-canon.md) + spec P13/INV  (the ORACLE)
  - the DRY scaffold (.hld/skeleton/prompt-skeleton.md) = home-map
  - lint.json (Layer-1 verdict — pre-cleared structural; AUDIT does MEANING only)
outputs:
  - economy-audit.json {verdict:clean|blocked, issues[]{category, target file:line, finding, routes_to:<producing stage>, fix:DELETE|REWRITE}}
```

### Blocking categories (the discriminator, hostile)
| Category | Practice | Fires when |
|---|---|---|
| `duplicate-fact` | P1/AB1 | Same fact in ≥2 sections; SEMANTIC not just literal. Names the home it belongs in + the N-1 copies to delete. |
| `no-objective` | P2/AB7 | Statement serves no purpose — decorative narration, motivational prose, mandate restated for emphasis. |
| `mandate-narration` | P2/AB6 | Role identity narrates the mandate Rules already own; >3 lines. |
| `ambiguous` | P3/AB8 | Wording readable two ways; hedge w/ no crisp test, not marked `judgment call:`. |
| `re-spec` | P2/AB3 | `format:` clause re-documents upstream schema (lint flags length; AUDIT confirms re-spec vs legit consume-clause). |
| `starvation` | substance floor | Load-bearing fact DELETED / ambiguity from over-terseness (the UNDER direction — economy ≠ truncation). |

### Discipline (inherited from CRITIQUE roles)
- **Blocking-grade ONLY.** A clean artifact is the EXPECTED outcome; do NOT manufacture issues.
- **FLAG + route, never edit.** AUDIT writes issues; never rewrites the artifact (P11 — LLM verifies, never authors truth).
- **Every issue routes to the PRODUCING stage with `fix: DELETE | REWRITE` — NEVER `ADD`.** Keystone. The loop offers no patch path (T06 enforces).
- Cite concrete `file:line` + which AB rule + the home the fact belongs in.
- **Anti-false-positive:** a fact that legitimately appears in two PARTS of a dual-mode prompt with a real per-pass DELTA is NOT a duplicate — but the SHARED part must be factored up (per dual-mode skeleton rule, T03). Only flag the un-factored shared copy.

### Substance floor (both directions — economy ≠ shortest)
Goal = RIGHT-SIZED-for-consumer, not shortest. Over-compression that drops a load-bearing fact is ALSO a defect — WORSE (a missing requirement ships silently; a duplicate only wastes tokens). The bar: **"every fact present exactly once, stated precisely, nothing decorative."** `starvation` category catches the UNDER direction.

## ACCEPTANCE — both-directions self-test (mirror verify mandate)

- tight reference artifact → `clean`.
- planted-bloat copy (one fact duplicated into a 4th home, reworded so lint's n-gram misses it) → `blocked`, names the duplicate + the home + N-1 to delete.
- planted-omission copy (a dropped `R*` / constraint / edge-case) → `blocked` via `starvation`.
- If AUDIT can't tell tight from bloated, OR misses the omission, AUDIT is broken — fix before trusting (same bar as the behavior verifier).
- Issues NEVER carry `fix: ADD`. Schema-reject any issue that tries.

## DEPENDS ON / BLOCKS

- Depends on: T02 (P13/INV oracle), T03 (AB1–AB9 oracle + dual-mode rule for anti-false-positive), T04 (consumes `lint.json`; runs on residue only).
- Blocks: T06 (wiring + routing keystone), T07 (the shared auditor every project inherits).

## OUT OF SCOPE

Deterministic structural checks (T04). Orchestrator/phase-gate wiring (T06). Re-authoring prompts (T08–T10).

---

## DONE (2026-06-08, not committed)

Authored Layer-2 ECONOMY-AUDIT role + both-directions self-test. Discriminates tight vs bloat vs omission clean-room.

### Deliverable — `prompts/_economy-audit.md`
- Role `ECONOMY-AUDIT` (general capability `{artifact, economy-canon}`); `PROMPT-AUDIT` = prompt-stack caller-view. Underscore-prefix = cross-cutting (like `_orchestrator`/`_step-runner`); invoked every phase verify step (T06 wires). Only prompt-stack instantiation authored (greenfield-first idiom); other stacks via T07 profile + non-prompt-type guard.
- Hostile, blocking-grade, FLAG-not-fix. Six categories: `duplicate-fact` (AB1, SEMANTIC — names home + N-1 copies), `no-objective` (AB7, delete-test), `mandate-narration` (AB6, >3 lines), `ambiguous` (AB8, two-way / unmarked hedge), `re-spec` (AB3), `starvation` (§2.1 floor — UNDER direction, dropped load-bearing fact).
- Keystone: every issue routes PRODUCING stage (default `RE-AUTHOR`; `canon` only when root = wrong AB), `fix: DELETE|REWRITE` — **never ADD** (enforced in schema). Loop offers no patch path (T06).
- Lane vs lint: lint = STRUCTURE (Layer-1, runs first), AUDIT = MEANING on lint-clean residue (P5). Guards HALT if lint absent/not-clean.
- Anti-false-positive: dual-mode shared-vs-delta (only flag un-factored SHARED copy, never genuine per-pass delta); consume-clause vs schema re-spec.

### Self-test — PASS (record in `tools/economy-audit/README.md`; mirrors `economy-lint/`)
Fixtures live under `_fixtures/economy/audit/{reference-tight,planted-bloat,planted-omission}.md` — clean-room/prompt oracle (AUDIT is an LLM role, not a deterministic tool), so they sit in `_fixtures/` beside the `greenfield-*` trees. (Lint IS a deterministic tool → its golden lives under `tools/fixtures/economy-lint/` instead; operator directive — fixture LOCATION signals deterministic-tool vs clean-room oracle.) Each fixture lint-CLEAN first (residue precondition — Layer-1's n-gram misses semantic dup; omission isn't a bloat trigger). Clean-room run (fresh step-runner per fixture, against FINAL prompt):

| fixture | lint | AUDIT | category | discrimination |
|---|---|---|---|---|
| reference-tight | clean | **clean** | — | tight → clean ✓ |
| planted-bloat | clean | **blocked** | `duplicate-fact` (+bonus `ambiguous`) | Rule-2 fact reworded into 3 extra homes so n-gram misses; names home (Rules) + copies, fix DELETE ✓ |
| planted-omission | clean | **blocked** | `starvation` | `skeleton.lock` input decl dropped (escapes + role still depend); flags dropped load-bearing fact, fix REWRITE ✓ |

Held across 3 rounds. No issue ever `fix: ADD` (schema-checked). Auditor prompt itself lint-CLEAN (98 lines, 0 violations) — exemplary; dropped a non-load-bearing resumability guard (T06 owns re-invocation) to clear C6, fixed 2 own prose defects.

### ACCEPTANCE — MET
- tight → clean ✓ · planted-bloat (reworded, lint-missed) → blocked, names dup + home + copies ✓ · planted-omission → blocked via `starvation` ✓ · issues never carry `fix: ADD` (schema-reject) ✓ · discriminates tight-from-bloat + catches omission ✓.

### Notes for downstream
- T06 consumes `economy-audit.json` contract (= `tools/economy-audit/README.md`): blocked → route re-author (DELETE/REWRITE), skip sim; clean → clean-room sim. Wires after lint in STEP-4 verify.
- T07 inherits same role + fixtures; stack-local profile defines what "one home" MEANS per stack (prompt section vs `.tf` resource vs TS module) — CITES `A-ECON`, never re-owns.
- Borderline-phrase variance: hostile auditor sometimes adds an `ambiguous` flag (e.g. "state units ordered") on bloat run — bonus catch, doesn't break discrimination (reference stays clean across runs).
- DO-NOT-COMMIT honored.
