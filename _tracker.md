# Pipeline Prompt-Build Tracker

> My map across fresh sessions. Read this first, skip re-reading every spec.
> **Caveman register in chat. Clean prose inside the prompts I author.**

---

## YOU ARE HERE

- **Phase being built:** Phase 0 (aPRD) — IN PROGRESS
- **Last prompt completed:** EXTRACT-RULES → `prompts/00-aprd/EXTRACT-RULES.md` (research sub-pipeline §7, head role)
- **Next action:** author **RECONCILE** (research §7, role 2 of 3). Reads `03-grounding/rules-extracted.json` (golden fixture exists: `_fixtures/greenfield-canon/`). Job: dedupe/merge same-topic rules across sources into `agreed[]`, detect contradictions into `conflicts[]` (golden has 2 planted conflicts: quotes single↔double, indent 2sp↔4sp; 1 planted agreement: semicolons ×2). Must NOT currency-check (VERIFY's job) and NOT invent. Output schema must feed VERIFY then the canon cache + GAP-DETECT. **RESEARCH-BRANCH FORK RESOLVED (see changelog):** branch runs PRE-GAP, emits `03-grounding/`; GAP-DETECT already reads it (OPTIONAL input, step 2 folds resolved values into `recommended_default`). EXTRACT-RULES is a pure transcriber (analog of EXTRACT): reads pre-fetched manifests on disk, never recalls/fetches/reconciles. After research branch: VERIFY-OUTPUT closes Phase 0.
- **Last updated:** 2026-06-07

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
- ☑ SYNTHESIZE
- ☑ CRITIQUE
- ☑ EXTRACT-RULES (research sub-pipeline §7)
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

**Totals:** 7 / 40 done.

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

- **D5 — Research branch placement (RESOLVED 2026-06-07).** Greenfield canon-grounding sub-pipeline (§7) runs **PRE-GAP**: emits `03-grounding/`, which GAP-DETECT consumes as its OPTIONAL input (already wired — GAP-DETECT step 2 folds canon-resolved values into `recommended_default`, drops gaps canon closes). Not a parallel synthesizer-cited corpus. Rationale: §5.2 spine order is ground→gap; closing gaps from the cheapest capable corpus (canon) before client ask is exactly P5 (read-before-ask). The three research roles are EXTRACT-RULES→RECONCILE→VERIFY; the allowlist+fetch ahead of them is **mechanical (non-LLM)**, so it is not an authored prompt — EXTRACT-RULES consumes pre-fetched manifests on disk.

_D1–D5 resolved. Reopen here if new forks appear._

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
- 2026-06-06 — Authored golden `06-answers.md` (client gate, hand-authored fixture answering golden `05`): Q1=A, Q2=B (non-recommended OAuth override), Q3=A, Q4=A, Q5=skipped (→default), Q6=Something-else (escape free-text). Deliberately exercises all four SYNTHESIZE resolution paths in one fixture. Promoted to `_fixtures/greenfield-clean/.aprd/06-answers.md`.
- 2026-06-06 — Authored SYNTHESIZE (`prompts/00-aprd/SYNTHESIZE.md`). interactive:false (authors the aPRD DRAFT, not the sign-off gate). In: `02-extraction.json` + `04-gaps.json` + `05-questions.md` + `06-answers.md` (4 inputs — 02 needed for the E*/R*/C* id-space; tracker's old note omitted it). Out: `drafts/aprd.v1.md` (§6 dual-audience contract) + `07-assumptions.json` (machine log). Design calls: (1) **join logic** — resolve each gap G* via one of four paths: asked+answered-letter→interpretations[index] (A=0,B=1,…, last opt=escape), asked+skipped→recommended_default, asked+escape→client free-text verbatim, deferred→recommended_default; (2) **one assumption A* per gap, full coverage** (gap_refs == all G* in 04), provenance source ∈ {client-confirmed, default-applied, client-described, cosmetic-announced}; (3) **carry E*/R*/C* ids verbatim from 02** (P9), author fresh A*/AC* spaces; (4) **OUT_OF_SCOPE = declined interpretations** (load-bearing negative space, flips correctly on client override); (5) **CONSTRAINTS = exactly 02's stated_constraints, never synthesized from a gap answer** — gap-fills are ASSUMPTIONS not CONSTRAINTS, no double-recording [Mandate 6, hardened after defect]; (6) greenfield = NO class-extension block (§6.1 lists only the 7 non-greenfield classes; tracker's old "+greenfield class block" note was wrong); (7) every R gets ≥1 binary AC or is flagged.
- 2026-06-06 — TESTED SYNTHESIZE. Isolated (Sonnet/high) on golden 02/04/05/06: fresh separate verifier each round, no self-grade. Round 0 → 2 AC-quality defects (AC1 "fully operable" vague; AC12 disjunctive "either rejects or returns empty" + invented empty-month edge case). Hardened Mandate 4: one-AC-one-outcome no-disjunction + name-concrete-observable-not-adjective + bound-AC-to-requirements (no fabricated edge cases). Round 1 (retry 1) → 3 defects: C4 synthesized from G6 escape text violating "no-strong-preference≠constraint" + double-recorded with A6; AC1 swapped "fully operable"→"functional interface" (ban-list whack-a-mole); AC14 disjunctive "currency code or symbol". Hardened Mandate 6 (CONSTRAINTS = exactly 02's, gap-fills always ASSUMPTIONS, never duplicate a gap's decision) + Mandate 4 (positive "name concrete observable" rule beats word-ban; disjunction = two materially-different acceptable OUTPUTS, examples-of-one-thing OK). Round 2 (retry 2) → fresh verifier verdict **SHIP**, all 12 criteria green: ids carried, 13 assumptions cover G1–G13, G2 override honored, G5 skip→default, G6 escape→client-described, no C4, ACs all binary/concrete, OUT_OF_SCOPE flips on override. Within 3-retry budget.
- 2026-06-06 — E2E TESTED CLASSIFIER→EXTRACT→GAP-DETECT→QUESTION-GEN→[client gate]→SYNTHESIZE (fresh Sonnet/high per step, seed only `00-raw-request.md`, each step reads PRIOR on-disk output). Chain's own variant this run: SR1 atomic greenfield, EXTRACT E1–E7/R1–R9/**C1–C2 only** (2 constraints, vs golden's 3)/12 U, GAP-DETECT 14 gaps (9 arch/5 scope), QUESTION-GEN Q1–Q6=G1–G6 + G7–G14 deferred. Operator authored e2e `06` against the chain's OWN `05` (Q3=B external-FX override, Q5 skip, Q6 escape). SYNTHESIZE: 14 assumptions (=14 gaps), R1–R9 each ≥1 AC, **C1–C2 carried exactly (no invented C3 under the variance)** — Mandate 6 held; G3 override honored, OUT_OF_SCOPE excluded the declined manual-rate interp. Fresh verifier raised 2 findings, both adjudicated **false-positive/judgment-noise**: (a) AC1 folds the SPA decision into R1's AC — but Mandate 4 *instructs* folding decisions in, and it's binary/observable; (b) "no AC tests API-rate-applied-to-totals" — but G13 (project-level single currency) means each invoice is single-currency, nothing to convert, so AC coverage is correct; the orphaned G3↔G13 tension is an upstream GAP-DETECT framing artifact, not SYNTHESIZE's. No prompt defect → no cascade. SYNTHESIZE shipped.
- 2026-06-06 — Golden fixture extended: promoted validated golden SYNTHESIZE output (built from golden 02/04/05/06, shipped prompt) to `_fixtures/greenfield-clean/.aprd/07-assumptions.json` + `drafts/aprd.v1.md`. Golden chain now 00→01→02→04→05→06→07+draft — ready as CRITIQUE's upstream fixture.
- 2026-06-06 — Authored CRITIQUE (`prompts/00-aprd/CRITIQUE.md`). interactive:false (adversarial review — reads disk, writes issues list, stops; does NOT re-run SYNTHESIZE or touch client — loop-back + sign-off are external orchestration). In: `drafts/aprd.v1.md` + `07-assumptions.json` + `04-gaps.json` (all 3 required; 04+07 = traceability ground truth). Out: `08-critique.json` (new numbered intermediate, not in §10 tree — fits convention). Schema decided: `{aprd_ref, assumptions_ref, gaps_ref, class, verdict(clean|blocked), issues[]{id I*, category, target_ref, problem, fix_hint}, issue_count}`. **Replaced tracker's tentative `severity` field with `category`** — §5.6 "blocking issues ONLY" makes severity degenerate (everything emitted is a blocker); `category` (the 5 hunt dimensions) is the useful field for loop-back + coverage. verdict deterministic from issues (blocked iff non-empty). Design calls: (1) **5 blocking categories** — ambiguous-requirement, non-binary-ac, unbounded-scope, untraceable-assumption, broken-id-thread; (2) **resolution test is load-bearing** — read WHOLE contract before blocking a requirement; a fork closed by assumption+AC+OUT_OF_SCOPE is NOT a defect (R10 "per project or per time entry" canonical not-a-defect); (3) **anti-false-positive discipline section** — don't re-litigate logged decisions, don't demand ACs for unraised edge cases, don't demand OUT_OF_SCOPE for unraised scope, correct flags compliant, greenfield has no extension block; (4) hostile bar — on the line AFTER resolution test → block (P10: missed defect costlier than a cheap re-run loop), but resolution test comes first.
- 2026-06-06 — TESTED CRITIQUE. Isolated (Sonnet/high), BOTH directions. **Positive** (golden clean draft+07+04 → expect verdict=clean): Round 0 → FALSE POSITIVE — blocked AC9 ("currency identifier" not pinned to ISO-code-vs-symbol) as non-binary. Adjudicated PROMPT DEFECT not genuine catch: code-vs-symbol is COSMETIC (P6 — GAP-DETECT dismissed currency-form via U1, raised no gap); AC9 has a defined present/absent observable; blocking it violates "blocking issues only" + cosmetic-is-safe. FIX: added "cosmetic latitude in an otherwise-binary AC is not a defect" carve-out to non-binary-ac criterion + anti-FP list (block only for no-observable / unmeasurable-adjective / two-different-acceptable-OUTCOMES; never for cosmetic variation within one passing result). Retry 1 → fresh runner, verdict=clean, issues=[] (R10 resolution test correctly NOT fired). **Negative** (golden draft with 5 planted defects: AC1 adjective, AC3 disjunction, AC8 req_ref→R99, removed G5 OOS line, A9 gap_ref→G99 in draft+07 → expect blocked): caught all 5, correctly categorized (2 non-binary-ac, 1 broken-id-thread, 1 unbounded-scope, 1 untraceable-assumption), contiguous I1–I5, concrete fix_hints, no false extras. Both directions schema-exact. Defects graded against known ground truth (planted), no separate verifier needed.
- 2026-06-06 — WINDOWED E2E TESTED QUESTION-GEN→[client gate]→SYNTHESIZE→CRITIQUE (window N-2→N-1→N; fresh Sonnet/high per step). Seeded window-external deps from golden: `02-extraction.json` (SYN needs the E*/R*/C* id-space) + `04-gaps.json` (QG head input). QG→`05` (Q1–Q6=G1–G6 all-arch, G7–G13 deferred). Operator authored e2e `06` against chain's OWN `05` exercising all 4 resolution paths: Q1=A, Q2=B (OAuth override of recommended A), Q3=A, Q4=A, Q5=skip→default, Q6=escape free-text. SYN→draft+07: 13 assumptions (=13 gaps), R1–R10 each ≥1 AC (12 ACs), C1–C3 carried exact (no invented C from gap answers), G2 override honored (email+pwd→OUT_OF_SCOPE), R10 fork closed by A8+OOS+AC12. CRITIQUE→`08` verdict=clean, 0 issues — **correctly cleared the chain's own draft incl. the R10 resolution-test trap under the OAuth-override variance**. PR2 producer/consumer held across the window; no defect → no cascade. CRITIQUE shipped.
- 2026-06-06 — Golden fixture extended: promoted clean `08-critique.json` (verdict=clean, empty issues — deterministic for the golden clean draft) to `_fixtures/greenfield-clean/.aprd/08-critique.json`. Golden chain now 00→01→02→04→05→06→07+draft→08. **Main intake spine (CLASSIFIER→EXTRACT→GAP-DETECT→QUESTION-GEN→[gate]→SYNTHESIZE→CRITIQUE) COMPLETE + windowed-tested end to end.** Next branch: research sub-pipeline (§7) EXTRACT-RULES/RECONCILE/VERIFY, then VERIFY-OUTPUT.
- 2026-06-07 — Resolved D5 (research-branch placement): runs PRE-GAP, emits `03-grounding/`, GAP-DETECT consumes as OPTIONAL input. Allowlist+fetch ahead of the 3 research roles is mechanical (non-LLM) → not an authored prompt; EXTRACT-RULES consumes pre-fetched manifests on disk. See Open decisions.
- 2026-06-07 — Authored EXTRACT-RULES (`prompts/00-aprd/EXTRACT-RULES.md`), research §7 head role. interactive:false (pure manifest parsing — transcriber analog of EXTRACT). In: `03-grounding/sources.json` (curated allowlist+fetch index: class, stack, sources[] w/ SRC* + tier/tool/tool_version_pinned/file) + `03-grounding/manifests/` (raw fetched configs/style-guides). Out: `03-grounding/rules-extracted.json` = flat `rules[]` {id RULE*, source_ref→SRC*, tier, tool, tool_version_pinned, kind(config|opinion), topic, rule, setting(verbatim config k:v | null), evidence(verbatim snippet)} + `unfetched_sources[]` + `extraction_meta`. Design calls: (1) **transcribe-never-recall is THE load-bearing prop (P11/§7.2)** — every rule needs verbatim `evidence` from a fetched file; a famous-but-absent rule is absent; no padding from training; (2) **no reconcile/dedupe/merge/conflict-detect** (RECONCILE's job) — same rule from 2 sources → 2 RULE*, contradictions kept both, per-source separation preserved so RECONCILE can find conflicts; (3) **no currency-check** (VERIFY's job) — copy pinned version, don't flag deprecation; (4) **atomic** — 1 setting/directive = 1 rule, compound prose split; (5) **config vs prose modes** — config keys→setting verbatim; prose→prescriptive directives only, skip rationale/examples/history; (6) **graceful degradation** — missing source file → `unfetched_sources[]`, continue, never invent; (7) SRC*→RULE* threads provenance.
- 2026-06-07 — Authored golden research fixture `_fixtures/greenfield-canon/.aprd/03-grounding/` (no upstream golden existed — window head; per run-step 5.4 authored one). TS/React/Node canon: sources.json (4 SRC, SRC4/prettier deliberately file-absent) + manifests eslint.config.json (env+parserOptions plumbing + 5 rules) / tsconfig.base.json (4 compilerOptions) / style-guide.md (4 prose directives incl. 1 compound + 1 explicitly-non-normative section). Planted: 2 cross-source CONFLICTS (quotes single↔double, indent 2sp↔4sp), 1 AGREEMENT (semicolons ×2), 1 missing source, plumbing-to-skip, compound-to-split, non-normative-to-skip.
- 2026-06-07 — TESTED EXTRACT-RULES. Isolated (Sonnet/high) on golden canon fixture. Round 0 → **1 PROMPT DEFECT**: runner extracted ESLint `env`(×3) + `parserOptions`(×2) as rules (RULE1–5) — toolchain plumbing, not best-practice canon (would pollute the client approval block). Cause: "parse each rule/option key" too broad. FIX: added Mandate 6 "extract only NORMATIVE prescriptions — skip tooling plumbing" w/ explicit skip-list (env/parserOptions/parser/plugins/extends; tsconfig path/output plumbing) + keep-list (eslint `rules`, tsconfig strictness/quality, prettier formatting, all prose) + client-approval-list discriminator; split old config/prose mandate into Mandate 7. Retry 1/3 → clean: 15 rules (SRC1=5, SRC2=4, SRC3=6), plumbing gone. **Fresh separate verifier** (no self-grade), 10 criteria all PASS → SHIP: schema-exact, RULE1–15 contiguous, every evidence verbatim in-source (anti-hallucination), normative-only, compound const/var split (RULE14/15), both conflicts + the agreement preserved unmerged, non-normative line-length section skipped, no stage-leak fields, SRC4 in unfetched_sources w/ 0 invented rules, meta arithmetic correct. Lone verifier note (RULE13 evidence joins a source line-break) = faithful-content normalization, not a defect.
- 2026-06-07 — WINDOWED E2E for EXTRACT-RULES: N is the research sub-pipeline HEAD — downstream RECONCILE/VERIFY unauthored, upstream allowlist+fetch is mechanical (not an LLM prompt), and EXTRACT-RULES does NOT consume the main spine's `02`. Per clamp rule window collapses to {N} seeded from golden = the isolated run already executed + verified. No authored downstream → no cascade. Window passes. Promoted validated `rules-extracted.json` into `_fixtures/greenfield-canon/` as RECONCILE's upstream golden. EXTRACT-RULES shipped.
