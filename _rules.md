# Authoring Rules & Conventions (stable)

> Stable reference for authoring a prompt. Loaded at step 3 (author), not every run. Pointer lives in `_tracker.md`. Edits here are rare (a new PR/AB rule or convention).

---

## Mission

Turn the **5 greenfield-delivery design specs** (`_initial_design/00`–`04`) into **executable AI prompts**. Operator pastes each into a **fresh harness session** to manually simulate the agentic system before it is built. Output of one prompt = input to the next (artifacts chain, IDs thread).

Building IS NOT running the pipeline. I am authoring the prompt set, one prompt at a time.

> **Scope note (2026-06-07):** `_initial_design/` now also holds `05` (documentation pipeline, Spine D) + `06` (architecture-review pipeline, Spine A) — sibling pipelines that reuse this role library. **THIS tracker covers ONLY the greenfield delivery pipeline (specs 00–04).** Spines D + A are out of current scope; they get authored AFTER the greenfield buildout completes (build order: greenfield → Spine D → Spine A), each with its own tracker. Do not author their prompts here.

## Source specs (read-only input)

**In scope here — greenfield delivery pipeline (00–04):**

| Phase | File | Produces | Key prompts |
|---|---|---|---|
| 0 aPRD | `_initial_design/00-automated-aprd-pipeline-spec.md` | frozen aPRD set (WHAT) | CLASSIFIER, EXTRACT, GAP-DETECT, QUESTION-GEN, SYNTHESIZE, CRITIQUE, research(EXTRACT-RULES/RECONCILE/VERIFY). [VERIFY-OUTPUT → Phase 4 per D6; freeze = mechanical, no prompt] |
| 1 Roadmap | `_initial_design/01-automated-roadmap-pipeline-spec.md` | vertical slice sequence + foundation cut | SLICE-EXTRACT, VERTICALITY-CHECK, SKELETON-IDENTIFY, SEQUENCE, FOUNDATION-CUT, RE-RANK, SEQUENCE-REVIEW |
| 2 ADR | `_initial_design/02-automated-adr-pipeline-spec.md` | ADR log (WHY-this-HOW) | DECISION-EXTRACT, TRIAGE, OPTION-GEN, EVALUATE-DECIDE, RECONCILE, SYNTHESIZE-ADR, CRITIQUE |
| 3 HLD | `_initial_design/03-automated-hld-pipeline-spec.md` | skeleton HLD + per-slice increments | DERIVE-COMPONENTS, DEFINE-CONTRACTS, RESOLVE-LOCAL, MODEL-DATA, MAP-NFR, MODEL-FLOWS, DERIVE-TESTS, RECONCILE/CRITIQUE |
| 4 Build | `_initial_design/04-automated-build-pipeline-spec.md` | verified staging software (TERMINAL) | BUILD-PLAN, MATERIALIZE-ORACLE, IMPLEMENT, INTEGRATE, DIAGNOSE, VERIFY-OUTPUT, CRITIQUE, DEMO-GEN |

**Out of current scope — sibling spines (NOT built by this tracker):**

| Spine | File | Produces | Reuse posture |
|---|---|---|---|
| D Documentation | `_initial_design/05-automated-documentation-pipeline-spec.md` | verified documentation set (TERMINAL) | overlays on the research sub-pipeline + slicing + CRITIQUE/VERIFY; mostly OVERLAY, near-zero new code |
| A Arch-review | `_initial_design/06-automated-architecture-review-pipeline-spec.md` | accepted review + recommended ADRs (TERMINAL) | HLD roles read-mode + Phase-2 ADR engine verbatim; new work = DIAGNOSE only |

Pipeline shape: **two loops** — foundation loop (once, thin) + slice loop (×N). Phase 1 is the controller. Phase 4 terminal at accepted staging demo.

## Build order

Phases 0→1→2→3→4 in sequence. Each phase consumes prior phase's artifact format, so authoring downstream prompts needs upstream output schema locked first. Within a phase: author prompts in spine-stage order.


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

> **DRY skeleton — every fact has ONE home (D10).** The old skeleton gave each fact 3–5 homes (mandate + task-steps + grounding + field-rules all restating one rule; escapes + step-1 + stop all restating one guard). That tripled prompt size for zero substance. The cure mirrors the Changelog anti-bloat rules: single-source-of-truth per fact-type. **Authoring rules (AB1–AB6) below are binding; an author who adds a second home for a fact is introducing bloat, not clarity.**

```
---
role: <ROLE>
phase: <NN-name>
class: greenfield            # first pass; generalize later
pass: skeleton|increment     # Phase-3 only (D9)
interactive: false           # or true + one-line {when, what} (PR3)
inputs:  [ {path, format} ]  # format = ONE terse clause: what THIS prompt reads from it (NOT a re-spec of the upstream schema — AB3)
outputs: [ {path, format} ]
escapes: [ {when, target} ]  # THE single home for guards (AB2). Compact: condition → route. Not paragraphs.
---
<canonical caveman block, verbatim>          # PR4

# Role: <ROLE>
<≤3 lines: who, the one load-bearing thing, lane. No mandate-narration — AB6.>

## <Discriminator>            # the role's core decision rule (ownership rule / skeleton test / verticality test …), IF the role has one
## Rules                       # the numbered mandate = single home for rules. Cheapest-source-first + LLM-not-source folds in as one bullet (AB4). No separate Grounding section.
## Task steps                  # PROCEDURE ONLY: read → compute → verify → write, in order. Do NOT re-list guards (→ escapes) or re-explain rules (→ Rules). AB1.
## Output schema — <path>      # JSON/YAML w/ inline comments = the SINGLE field documentation (AB5). Constraints that don't fit a comment go in the comment-adjacent line, NOT a separate Field-rules section.
## Stop condition              # terminal outcomes only (clean / defect-routed / halt), one line each. References guards by name; does NOT re-list them. Clean line states the write path (no separate Write-to-disk section).
```

**Anti-bloat authoring rules (AB1–AB6, binding — same cure that de-bloated this tracker):**
- **AB1 — No double-bookkeeping.** A fact lives in exactly one section. Task steps don't restate Rules; Stop condition doesn't restate escapes. If you're tempted to repeat, you're bloating — link by name instead.
- **AB2 — Guards have ONE home: `escapes:` frontmatter.** Task step 1 may say "check guards (frontmatter), else continue" — it does NOT re-enumerate them. Stop condition says "guard tripped → HALT" — it does NOT re-list which guards.
- **AB3 — `format:` is one clause, not an essay.** Name the artifact + what THIS prompt consumes from it (`"json — owns_entities[] = proposed owner to formalize"`). Do NOT re-document the upstream schema; the producing prompt already did.
- **AB4 — Grounding folds into Rules.** The cheapest-source-first + LLM-verifies-not-authors discipline (P5/P11) is ONE Rules bullet, not a standing section. Role-specific grounding (which source is truth) is part of the relevant rule.
- **AB5 — No Field-rules section.** The JSON schema's inline comments ARE the field documentation. A constraint that can't fit a comment (reciprocity, walk-to-count) attaches to that field's comment line. Never re-list every field in prose after the schema.
- **AB6 — Role identity ≤3 lines, no mandate-narration.** State who/the-one-thing/lane. The mandate is the Rules section — don't prose-narrate it first.

## Conventions for authored prompts (decided)

- **One role = one prompt** (D1). Role separation is load-bearing (failure isolation, every spec §8). May split a role further if justified — decide per case.
- **Greenfield class first** (D4). Author full vertical greenfield path (Phase 0→4) before generalizing to other classes via playbook overlays.
- Each prompt is self-contained for a fresh session: role identity + **required input artifacts (paths on disk)** + task + output schema + **where to write output on disk** + escape/route rules.
- **Artifacts land on disk, not just printed** (D3). Every prompt instructs its agent to WRITE its output to the spec-defined path. Manual sim runs against a real project workspace; operator hand-passes by pointing the next session at the files.
- Output JSON/YAML schema explicit so next prompt can consume it. IDs thread end-to-end: `R → AC → S → ADR → C → CT → F → commit`.
- Adversarial roles (GAP-DETECT, CRITIQUE, anti-cheat) stay hostile.
- LLM reconciles/verifies, never source of truth (P11) — bake into grounding prompts.
- **DRY / anti-bloat (D10)** — author against the DRY skeleton; one home per fact (AB1–AB6 above). The substance (rules, schema, guards) is invariant; only the duplication dies.

## Storage layout (decided, D2)

- **Authored prompts:** `agentic-systems/prompts/<NN-phase>/<ROLE>.md` (e.g. `prompts/00-aprd/CLASSIFIER.md`).
- **Sim project workspace** (where the operator's runs write artifacts): a project dir holding the spec-defined trees `.aprd/`, `.roadmap/`, `.adr/`, `.hld/`, `.build/`, `src/`. Path chosen at sim time; prompts reference paths relative to project root.
