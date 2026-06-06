# Pipeline Prompt-Build Tracker

> My map across fresh sessions. Read this first, skip re-reading every spec.
> **Caveman register in chat. Clean prose inside the prompts I author.**

---

## YOU ARE HERE

- **Phase being built:** Phase 0 (aPRD) — NOT STARTED
- **Last prompt completed:** none
- **Next action:** author Phase 0 / CLASSIFIER (greenfield class)
- **Last updated:** 2026-06-06

---

## Mission

Turn the 5 design specs in `_initial_design/` into **executable AI prompts**. Operator pastes each into a **fresh harness session** to manually simulate the agentic system before it is built. Output of one prompt = input to the next (artifacts chain, IDs thread).

Building IS NOT running the pipeline. I am authoring the prompt set, one prompt at a time.

## Source specs (read-only input)

| Phase | File | Produces | Key prompts |
|---|---|---|---|
| 0 aPRD | `_initial_design/00-automated-aprd-pipeline-spec.md` | frozen aPRD set (WHAT) | CLASSIFIER, EXTRACT, GAP-DETECT, QUESTION-GEN, SYNTHESIZE, CRITIQUE, research(EXTRACT-RULES/RECONCILE/VERIFY), VERIFY-OUTPUT |
| 1 Roadmap | `_initial_design/01-automated-roadmap-pipeline-spec.md` | vertical slice sequence + foundation cut | SLICE-EXTRACT, VERTICALITY-CHECK, SKELETON-IDENTIFY, SEQUENCE, FOUNDATION-CUT, RE-RANK, SEQUENCE-REVIEW |
| 2 ADR | `_initial_design/02-automated-adr-pipeline-spec.md` | ADR log (WHY-this-HOW) | DECISION-EXTRACT, TRIAGE, OPTION-GEN, EVALUATE-DECIDE, RECONCILE, SYNTHESIZE-ADR, CRITIQUE |
| 3 HLD | `_initial_design/03-automated-hld-pipeline-spec.md` | skeleton HLD + per-slice increments | DERIVE-COMPONENTS, DEFINE-CONTRACTS, RESOLVE-LOCAL, MODEL-DATA, MAP-NFR, MODEL-FLOWS, DERIVE-TESTS, RECONCILE/CRITIQUE |
| 4 Build | `_initial_design/04-automated-build-pipeline-spec.md` | verified staging software (TERMINAL) | BUILD-PLAN, MATERIALIZE-ORACLE, IMPLEMENT, INTEGRATE, DIAGNOSE, VERIFY-OUTPUT, CRITIQUE, DEMO-GEN |

Pipeline shape: **two loops** — foundation loop (once, thin) + slice loop (×N). Phase 1 is the controller. Phase 4 terminal at accepted staging demo.

## Build order

Phases 0→1→2→3→4 in sequence. Each phase consumes prior phase's artifact format, so authoring downstream prompts needs upstream output schema locked first. Within a phase: author prompts in spine-stage order.

---

## Prompt inventory & status

Status: ☐ todo · ◐ drafting · ☑ done

### Phase 0 — aPRD
- ☐ CLASSIFIER
- ☐ EXTRACT
- ☐ GAP-DETECT
- ☐ QUESTION-GEN
- ☐ SYNTHESIZE
- ☐ CRITIQUE
- ☐ EXTRACT-RULES (research sub-pipeline §7)
- ☐ RECONCILE (research)
- ☐ VERIFY (research)
- ☐ VERIFY-OUTPUT

### Phase 1 — Roadmap
- ☐ SLICE-EXTRACT
- ☐ VERTICALITY-CHECK
- ☐ SKELETON-IDENTIFY
- ☐ SEQUENCE
- ☐ FOUNDATION-CUT
- ☐ RE-RANK
- ☐ SEQUENCE-REVIEW (client-facing)

### Phase 2 — ADR
- ☐ DECISION-EXTRACT
- ☐ TRIAGE
- ☐ OPTION-GEN
- ☐ EVALUATE-DECIDE
- ☐ RECONCILE
- ☐ SYNTHESIZE-ADR
- ☐ CRITIQUE

### Phase 3 — HLD
- ☐ DERIVE-COMPONENTS
- ☐ DEFINE-CONTRACTS
- ☐ RESOLVE-LOCAL (emits local ADR)
- ☐ MODEL-DATA
- ☐ MAP-NFR
- ☐ MODEL-FLOWS
- ☐ DERIVE-TESTS
- ☐ RECONCILE/CRITIQUE

### Phase 4 — Build
- ☐ BUILD-PLAN
- ☐ MATERIALIZE-ORACLE (test-author role — distinct from builder)
- ☐ IMPLEMENT (builder — cannot edit oracle)
- ☐ INTEGRATE
- ☐ DIAGNOSE (self-heal vs escape)
- ☐ VERIFY-OUTPUT
- ☐ CRITIQUE (anti-cheat)
- ☐ DEMO-GEN

**Totals:** 0 / 40 done.

---

## Locked requirements (apply to EVERY authored prompt)

- **PR1 — Non-interactive by default.** Prompt runs autonomously start→finish, no back-and-forth. Agent reads inputs from disk, does work, writes outputs to disk, stops. No mid-run questions unless PR3.
- **PR2 — Producer/consumer contract.** Each prompt writes results in the exact place + format the *next* prompt reads. Output schema of step N == input schema of step N+1. Path + format declared in metadata.
- **PR3 — Interaction flagged in metadata.** If a step genuinely needs the user (interview, sign-off, redline, demo accept), the prompt's metadata header states `interactive: true` + what interaction + when. Silent prompts must be `interactive: false`.
- **PR4 — Caveman block verbatim.** Every prompt embeds the canonical caveman block (below) verbatim. Governs agent narration/reasoning; **artifact content stays clean prose/structured** (caveman is register, not data corruption).

### Canonical caveman block (paste verbatim into every prompt)

```
# Register
Think, write, reply terse like smart caveman. All technical substance stays. Only fluff dies.
- Drop: articles (a/an/the), filler (just/really/basically), pleasantries, hedging.
- Pattern: [thing] [action] [reason]. [next step]
- NOT: "Sure! I'd be happy to help you with that."
- YES: "Bug in auth middleware. Fix:"
Exception: artifact content (specs, JSON/YAML, ADR bodies) stays clean and complete. Caveman governs narration, not the deliverable.
```

### Standard prompt skeleton (every authored prompt follows)

```
---
role: <ROLE>
phase: <NN-name>
class: greenfield            # first pass; generalize later
interactive: false          # or true + describe (PR3)
inputs:  [ {path, format} ] # what it reads from disk (PR2)
outputs: [ {path, format} ] # what it writes to disk (PR2, D3)
escapes: [ {target_phase, when} ]
---
<canonical caveman block, verbatim>          # PR4
<role identity + mandate>
<task steps>
<grounding rules (cheapest-source-first; LLM verifies, not source)>
<output schema, explicit>
<write-to-disk instruction (exact path)>      # PR1/D3
<stop condition>
```

## Conventions for authored prompts (decided)

- **One role = one prompt** (D1). Role separation is load-bearing (failure isolation, every spec §8). May split a role further if justified — decide per case.
- **Greenfield class first** (D4). Author full vertical greenfield path (Phase 0→4) before generalizing to other classes via playbook overlays.
- Each prompt is self-contained for a fresh session: role identity + **required input artifacts (paths on disk)** + task + output schema + **where to write output on disk** + escape/route rules.
- **Artifacts land on disk, not just printed** (D3). Every prompt instructs its agent to WRITE its output to the spec-defined path. Manual sim runs against a real project workspace; operator hand-passes by pointing the next session at the files.
- Output JSON/YAML schema explicit so next prompt can consume it. IDs thread end-to-end: `R → AC → S → ADR → C → CT → F → commit`.
- Adversarial roles (GAP-DETECT, CRITIQUE, anti-cheat) stay hostile.
- LLM reconciles/verifies, never source of truth (P11) — bake into grounding prompts.

## Storage layout (decided, D2)

- **Authored prompts:** `agentic-systems/prompts/<NN-phase>/<ROLE>.md` (e.g. `prompts/00-aprd/CLASSIFIER.md`).
- **Sim project workspace** (where the operator's runs write artifacts): a project dir holding the spec-defined trees `.aprd/`, `.roadmap/`, `.adr/`, `.hld/`, `.build/`, `src/`. Path chosen at sim time; prompts reference paths relative to project root.

## Open decisions

_All resolved (D1–D4). Reopen here if new forks appear._

---

## Changelog
- 2026-06-06 — Studied all 5 specs. Created tracker. Inventory = 40 prompts across 5 phases.
- 2026-06-06 — Resolved D1 (per-role, split if justified), D2 (`prompts/<NN-phase>/<ROLE>.md`), D3 (artifacts to disk, manual pass), D4 (greenfield first). Next: author Phase 0 CLASSIFIER.
- 2026-06-06 — Locked PR1 (non-interactive default), PR2 (producer/consumer contract), PR3 (interaction flagged in metadata), PR4 (caveman block verbatim). Defined canonical caveman block + standard prompt skeleton.
