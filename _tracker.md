# Pipeline Prompt-Build Tracker

> My map across fresh sessions. Read this first, skip re-reading every spec.
> **Caveman register in chat. Clean prose inside the prompts I author.**

---

## YOU ARE HERE

- **Phase being built:** Phase 0 (aPRD) — IN PROGRESS
- **Last prompt completed:** QUESTION-GEN → `prompts/00-aprd/QUESTION-GEN.md`
- **Next action:** author Phase 0 / SYNTHESIZE (reads `04-gaps.json` + `06-answers.md` [client answers, not yet fixtured] + `05-questions.md` deferred-assumptions block → aPRD draft `drafts/aprd.v1.md` per §6 schema: PROJECT, CLASS, ENTITIES, REQUIREMENTS R*, CONSTRAINTS, ASSUMPTIONS A* [each `gap_ref` → G*], OUT_OF_SCOPE, ACCEPTANCE AC* [binary/testable, `req_ref` → R*] + greenfield class block; every requirement gets a testable AC or is flagged; every assumption traces to a gap [answered question OR deferred default OR cosmetic gap]; also write `07-assumptions.json`. NOTE: need a golden `06-answers.md` fixture before SYNTHESIZE isolated test — author one answering the golden `05-questions.md`)
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
- ☑ CLASSIFIER
- ☑ EXTRACT
- ☑ GAP-DETECT
- ☑ QUESTION-GEN
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

**Totals:** 4 / 40 done.

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
- 2026-06-06 — Authored CLASSIFIER (`prompts/00-aprd/CLASSIFIER.md`). interactive:true conditional (confirm only on low-confidence/compound/non-greenfield). Out: `01-classification.json` w/ stable SR* ids, overall_confidence=min(subreq), escape block for non-greenfield. Threshold 0.80 (tunable). Next: EXTRACT.
- 2026-06-06 — TESTED CLASSIFIER in 2 Sonnet/high subagents (fresh-session sim) against fixtures in `_sim/` (greenfield-clean, compound-mixed). Both: valid schema-exact JSON, correct routing. Happy path silent→EXTRACT; hard path decomposed 4 subreqs, halted w/ 4 MCQs + full escape. HARDENED prompt from debriefs: (1) explicit compound test — multi-class OR multi-system = compound; N features of ONE new system = atomic [load-bearing, was invented by agents]; (2) MCQ default 1:1 per subreq; (3) escape all-non-greenfield case + default-marker + text-stripping rules.
- 2026-06-06 — Fixtures relocated. `_sim/` never existed on disk; durable test fixtures now live in `_fixtures/{greenfield-clean,compound-mixed}/.aprd/` (raw request + known-good `01-classification.json`). `_test_bench/` is scratch — cleared/seeded per run, never the fixture home.
- 2026-06-06 — Authored EXTRACT (`prompts/00-aprd/EXTRACT.md`). interactive:false (pure structural transcription, no client touch). In: `00-raw-request.md` + `01-classification.json`. Out: `02-extraction.json` = {entities E*, explicit_requirements, implied_requirements, stated_constraints C*, unknowns U*}. Design calls: (1) single contiguous stable `R*` id-space across explicit→implied [P9, threads to aPRD]; (2) `inferred` flag + mandatory `rationale` on implied/inferred items; (3) strict explicit-vs-implied-vs-unknown split — implied = NECESSARY consequence only, merely-plausible → unknown (e.g. "must authenticate"=implied R, "which auth mechanism"=unknown U); (4) every item cites `source` (real request words) + `sr_ref` [traceability, P11 transcriber-not-author]; (5) guard escapes — HALT if `needs_confirmation:true` OR any non-greenfield subreq, write nothing.
- 2026-06-06 — TESTED EXTRACT. Isolated (Sonnet/high): greenfield-clean → schema-exact, R1–R11 contiguous, all sr_ref/source/rationale valid, 12 unknowns feed GAP-DETECT, clean explicit/implied/unknown split. Guard test (compound-mixed, non-greenfield) → correctly HALTed, wrote nothing. E2E (Sonnet/high, fresh sessions): CLASSIFIER→EXTRACT chained off-disk with no manual fixup, both stop-conditions hit, EXTRACT output schema-valid (10 reqs this run vs 11 isolated — benign LLM variance, both faithful, zero invented reqs). No flaws found; prompt shipped as authored.
- 2026-06-06 — Golden mid-pipeline fixture added: promoted the validated isolated EXTRACT output to `_fixtures/greenfield-clean/.aprd/02-extraction.json` (seed for GAP-DETECT isolated test). Later added `04-gaps.json` golden too. `_fixtures/greenfield-clean/.aprd/` now holds 00→01→02→04 chain.
- 2026-06-06 — Authored GAP-DETECT (`prompts/00-aprd/GAP-DETECT.md`). interactive:false (adversarial analysis, no client touch — QUESTION-GEN asks later). In: `02-extraction.json` (+ OPTIONAL `03-grounding/`, gracefully absent since grounding stage unauthored). Out: `04-gaps.json` = ranked `gaps[]` {id G*, gap, refs→extraction IDs, interpretations[≥2], recommended_default(verbatim ∈ interpretations), blast_radius, disposition(ask/assume derived), reason} + `dismissed_unknowns[]` + `gap_counts`. Design calls: (1) adversarial — treat extraction as trap, hunt 5 sources (U*, R* scope+IMPLEMENTATION forks, inferred items, C*, missing negative space); (2) every U* accounted (fed a gap OR dismissed w/ reason) — no silent drop, threads P9; (3) recommended_default per gap feeds QUESTION-GEN's marked default (P7) + cosmetic announce; (4) blast tier is the load-bearing output — sharp architecture(data-model SHAPE/stack/platform/external-dep/impl-mechanism) vs scope(in/out, same structure) discriminator; (5) sort arch→scope→cosmetic; disposition deterministic from tier.
- 2026-06-06 — TESTED GAP-DETECT. Isolated (Sonnet/high) on golden 02: 3 verifier rounds (separate fresh subagent each, no self-grade). Round 1 → 4 real PROMPT defects, all fixed by editing prompt (never the artifact): (a) tier broke BOTH ways — date-filter inflated to arch, mandated-host demoted to scope → added sharp arch↔scope discriminator (data-model SHAPE = tables/relationships, NOT query params); (b) missed IMPLEMENTATION forks (PDF server-side vs client-side render) → added explicit impl-fork hunt to Mandate 1; (c) `refs` padding → "directly arises from"; (d) re-litigated explicit client word "monthly" as ambiguous → added "don't re-litigate chosen words; frame as optional-extra=scope". Round 2 → 1 objective (R10 cross-cited into wrong gap; freemium scope invented) → added "one gap=one topic, no sibling-driver cross-cite" + "keep interpretations inside extraction, no invented product models". Round 3 → CONVERGED: residual FIX verdict was a verifier FALSE-POSITIVE (G11 "cap" is grounded in U4's literal "is there a limit?") + prose-nuance + cross-verifier DISAGREEMENT on compliance/hosting tier (judgment variance, not defect). Shipped: objective findings → 0 across rounds; remaining = adversarial-verifier steady-state noise. Mechanical checks (schema, contiguous G*, valid+relevant refs, default-verbatim, disposition-from-tier, tier-sort, counts, full U coverage) all green.
- 2026-06-06 — E2E TESTED CLASSIFIER→EXTRACT→GAP-DETECT (3 fresh Sonnet/high sessions, seed only `00-raw-request.md`, each step reads PRIOR on-disk output, no re-seed). All stop-conditions hit; all schemas valid; IDs threaded. GAP-DETECT bound to the chain's OWN extraction (this run: R1–R7/E1–E6/U1–U9, 13 gaps = 9 arch/3 scope/1 cosmetic) not the golden's — PR2 producer/consumer holds under benign LLM variance. This run surfaced a cosmetic gap (disposition=assume), exercising the announce path. No downstream defect → no cascade. GAP-DETECT shipped.
- 2026-06-06 — Authored QUESTION-GEN (`prompts/00-aprd/QUESTION-GEN.md`). interactive:false (AUTHORS the question doc; does NOT run interview — clarify-loop gate presents `05` + collects `06` later). In: `04-gaps.json`. Out: `05-questions.md` (client-facing MD). Design calls: (1) **filter `disposition:ask` only** — cosmetic gaps skip (SYNTHESIZE announces them), no question invented; (2) **hard ≤6 cap (P7/§9)** — golden has 13 ask-gaps, can't ask all → SELECTION is mechanical: walk `04` order (GAP-DETECT already blast-sorted arch→scope), take first min(6,N) as questions = exactly the 6 highest-blast; (3) **deferred-defaults mechanism** — every over-budget ask-gap becomes an announced assumption bullet (gap_ref + recommended_default in plain language) → no silent drop (P9), each ask-gap is EITHER a question OR a deferred assumption; (4) one gap=one question (no compound merge); (5) options = gap's interpretations rendered client-plain but faithful (no invent/drop/merge), **index→letter mapping is load-bearing** (downstream maps answer letter→interpretation); (6) recommended marker = gap's `recommended_default` marked in place; (7) escape option `Something else` always last, never recommended; (8) edge cases: 0 ask-gaps → "no questions" line; <6 → ask all; 3-interp gap → 3 options+escape.
- 2026-06-06 — TESTED QUESTION-GEN. Isolated (Sonnet/high) on golden `04` (13 ask/0 cosmetic): fresh verifier, all 9 criteria green first try — 6 Q (G1–G6) + 7 deferred (G7–G13), full coverage, faithful options, correct recommended markers, no ID leakage. E2E (4 fresh Sonnet/high sessions, seed only `00-raw-request.md`): CLASSIFIER→EXTRACT→GAP-DETECT→QUESTION-GEN. Chain's own gaps this run = 18 (11 arch/6 scope/1 cosmetic), 17 ask. QUESTION-GEN: 6 Q (G1–G6) + 11 deferred (G7–G17), cosmetic G18 excluded, Q6 correctly rendered a 3-interpretation gap (3 opts+escape). **1 PROMPT DEFECT caught by e2e (golden couldn't surface it — all golden defaults were interpretation[0]):** runner HOISTED the recommended_default to option A in Q4(G4) + Q6(G6) where recommended was interp[1], breaking the load-bearing index→letter contract. FIX: hardened Mandate 4+5 + schema field rules — "options stay in `interpretations[]` order, index 0→A/1→B/2→C; recommended marker moves IN PLACE to wherever that interpretation sits (frequently B/C); letter A ≠ 'recommended'; never hoist." Rerun (retry 1/3) → fresh verifier re-grade, all 9 green incl. Q4=B/Q6=B markers in place. No cascade (terminal step). QUESTION-GEN shipped.
- 2026-06-06 — Golden fixture extended: promoted validated isolated `05-questions.md` (built from golden `04`, hardened prompt) to `_fixtures/greenfield-clean/.aprd/05-questions.md`. Golden chain now 00→01→02→04→05. NOTE for SYNTHESIZE: still need a golden `06-answers.md` (client answers to golden `05`) before SYNTHESIZE can be isolated-tested.
