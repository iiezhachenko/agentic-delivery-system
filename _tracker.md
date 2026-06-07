# Pipeline Prompt-Build Tracker

> My map across fresh sessions. Read this first, skip re-reading every spec.
> **Caveman register in chat. Clean prose inside the prompts I author.**

---

## YOU ARE HERE

- **Phase being built:** **Phase 0 COMPLETE.** Phase 1 (Roadmap) — IN PROGRESS.
- **Last prompt completed:** SEQUENCE → `prompts/01-roadmap/SEQUENCE.md` (Phase 1 role 4/7; draws the dependency-legal running order — skeleton pinned to position 1 [RM4], remaining slices greedily filled from the ready frontier by value→risk-retiring→lower-cost-proxy→lowest-index [RM5], dependency legality the HARD constraint; cycle/dangling/skeleton-with-deps = slicing defect routed back to SLICE-EXTRACT). Out: `.roadmap/05-sequence.json` (D7 numbering). Tested + full-3-step windowed-e2e passed; golden roadmap chain now 02→03→04→05.
- **Next action:** author **FOUNDATION-CUT** (`prompts/01-roadmap/FOUNDATION-CUT.md`), Phase 1 role 5/7. §8: "From the walking skeleton + cross-slice invariants, name the MINIMUM to decide and build once: foundational_decisions (→ Phase 2) and skeleton_seams (→ Phase 3). Defer everything else to the slice that first needs it. Bias thin — under-cut, not over-cut." (§5.7, RM9.) In (per D7): `.roadmap/04-skeleton.json` (the skeleton + its `skeleton_seams[]` named-not-designed — the contract Phase 3 establishes) + `.roadmap/05-sequence.json` (the running order — the first slices that drive what the cut must cover) + likely `.aprd/aprd.frozen.md` (CONSTRAINTS/ASSUMPTIONS = the cross-slice-invariant oracle: auth model, error strategy, observability, single-currency, single-tenant scale). Out: `.roadmap/06-foundation-cut.json` (D7: FOUNDATION-CUT shifts to 06; §10 tree pinned `04-foundation-cut.json` but D7 numbers by spine order). Schema TBD at authoring — §6.1 FOUNDATION_CUT block = `{foundational_decisions[] (→Phase 2 categories: style/stack/persistence/boundary), skeleton_seams[] (→Phase 3 contracts — carry/refine from 04), cross_slice_invariants[] (auth model, error strategy, observability — decided once)}`. **Caution (RM9/RM11):** name the MINIMUM (bias thin — under-cut not over-cut; widening later is cheaper than wrong foundation, §5.7); name categories/decisions-to-make, NEVER make the decision (no stack pick, no schema, no vendor — that is Phase 2/3 HOW); `skeleton_seams` carried/refined from 04 stay named-not-designed (same RM11 boundary that bit SKELETON-IDENTIFY — no components/stack/vendor in seam text); cross_slice_invariants come from the aPRD's actual constraints/assumptions, never invented (P11); FOUNDATION-CUT is interactive:false (the client gate is SEQUENCE-REVIEW, role 7/7). Upstream golden: `_fixtures/greenfield-clean/.roadmap/{04-skeleton,05-sequence}.json` + `.aprd/aprd.frozen.md`. Window for its e2e: N=FOUNDATION-CUT, N-1=SEQUENCE, N-2=SKELETON-IDENTIFY (all authored) — full 3-step window, head seeds from golden `02-slices.json`+`03-verticality.json`+`aprd.frozen.md`.
- **Last updated:** 2026-06-07

---

## Mission

Turn the 5 design specs in `_initial_design/` into **executable AI prompts**. Operator pastes each into a **fresh harness session** to manually simulate the agentic system before it is built. Output of one prompt = input to the next (artifacts chain, IDs thread).

Building IS NOT running the pipeline. I am authoring the prompt set, one prompt at a time.

## Source specs (read-only input)

| Phase | File | Produces | Key prompts |
|---|---|---|---|
| 0 aPRD | `_initial_design/00-automated-aprd-pipeline-spec.md` | frozen aPRD set (WHAT) | CLASSIFIER, EXTRACT, GAP-DETECT, QUESTION-GEN, SYNTHESIZE, CRITIQUE, research(EXTRACT-RULES/RECONCILE/VERIFY). [VERIFY-OUTPUT → Phase 4 per D6; freeze = mechanical, no prompt] |
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
- ☑ RECONCILE (research)
- ☑ VERIFY (research)
- ⊘ VERIFY-OUTPUT — **MOVED to Phase 4** (D6): build/verify gate, executes test artifacts vs built software; Phase 0 has no executable artifacts pre-build. Phase 0 terminates at mechanical freeze (no authored prompt). **Phase 0 prompt set COMPLETE.**

### Phase 1 — Roadmap
- ☑ SLICE-EXTRACT
- ☑ VERTICALITY-CHECK
- ☑ SKELETON-IDENTIFY
- ☑ SEQUENCE
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

**Totals:** 13 / 39 done. (VERIFY-OUTPUT counted once, in Phase 4 — D6 de-duplicated the Phase-0 listing; inventory 40→39.)

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

- **D5 — Research branch placement (RESOLVED 2026-06-07).** Canon-grounding sub-pipeline (§7) runs **PRE-GAP**: emits `03-grounding/`, consumed by GAP-DETECT as OPTIONAL input (folds canon-resolved values into `recommended_default`, drops gaps canon closes). Why: spine order is ground→gap = P5 read-before-ask. Roles EXTRACT-RULES→RECONCILE→VERIFY; the allowlist+fetch ahead of them is **mechanical (non-LLM)**, not an authored prompt — EXTRACT-RULES consumes pre-fetched manifests on disk.

- **D6 — VERIFY-OUTPUT placement (RESOLVED 2026-06-07).** VERIFY-OUTPUT is the **Phase 4 build/verify gate**, NOT Phase 0. Why: it executes test CODE against BUILT software (§8/§4.1); Phase 0 emits the frozen aPRD (WHAT) — AC are statements, no executable artifacts pre-build. Tests get authored (MATERIALIZE-ORACLE) + run (VERIFY-OUTPUT) in Phase 4. Phase 0 terminates at **freeze** (§5.7) = mechanical render (frozen.md + lock), non-LLM → not an authored prompt. **Consequence:** Phase 0 prompt set = CLASSIFIER→EXTRACT→GAP-DETECT→QUESTION-GEN→[gate]→SYNTHESIZE→CRITIQUE + research branch EXTRACT-RULES→RECONCILE→VERIFY. Author VERIFY-OUTPUT in Phase 4 once oracle/build schemas lock.

- **D7 — Phase-1 file numbering past 03 (RESOLVED 2026-06-07).** **Number by spine order, not §10's pinned slots:** SKELETON-IDENTIFY=`04-skeleton.json`, SEQUENCE=`05-sequence.json`, FOUNDATION-CUT=`06-foundation-cut.json` (shifted from §10's `04`). Why: §10's tree is illustrative not binding (precedent: CRITIQUE took `08-critique.json`; research branch invented `03-grounding/`); PR2 cares about spine ORDER + a stable declared path, and no authored prompt yet consumes the literal `04-foundation-cut.json`. **Consequence:** FOUNDATION-CUT reads `04-skeleton.json`+`05-sequence.json`, writes `06-foundation-cut.json`.

_D1–D7 resolved. Reopen here if new forks appear._

---

## Changelog

> **Per-prompt design calls live in the prompt `.md` files** — this log keeps milestones, load-bearing rules, golden state, ship status. Full per-run test narratives (ID lists, round-by-round defect logs, FP adjudications) were summarized 2026-06-07 to cut tokens.
>
> **Recurring test protocol** (applies to every shipped prompt unless noted): isolated test (Sonnet/high) on golden fixture w/ **fresh separate verifier, no self-grade** → fix the PROMPT never the artifact → **windowed e2e** (head-clamp: window head = phase-first authored step; mechanical/non-LLM upstream excluded; fresh session per step reads PRIOR on-disk output, no re-seed) → golden output promoted to `_fixtures/`. Adversarial prompts tested BOTH directions (positive=clean + negative=planted-defects, graded vs ground truth). "PR2 held / no defect / no cascade / window passes" = the standard pass. e2e output carrying benign LLM variance is NOT promoted; goldens are regenerated from golden inputs.

### 2026-06-06 — setup + Phase 0 intake spine
- Studied 5 specs, created tracker. Inventory 40 prompts / 5 phases. Resolved D1–D4 (see Conventions); locked PR1–PR4 + caveman block + prompt skeleton. Fixtures live in `_fixtures/{greenfield-clean,compound-mixed}/`; `_test_bench/` is scratch.
- **CLASSIFIER** → `01-classification.json` (SR* ids, overall_confidence=min(subreq), threshold 0.80, escape non-greenfield). interactive:true conditional (low-confidence/compound/non-greenfield). Hardened: compound test = multi-class OR multi-system; N features of ONE new system = atomic.
- **EXTRACT** → `02-extraction.json` {E*, R*(explicit+implied, contiguous), C*, U*}. Implied = NECESSARY consequence only, merely-plausible→unknown; every item cites source+sr_ref (transcriber not author). HALT on needs_confirmation or non-greenfield.
- **GAP-DETECT** → `04-gaps.json` (ranked gaps{G*, refs, ≥2 interpretations, recommended_default verbatim∈interpretations, blast_radius, disposition ask/assume} + dismissed_unknowns + counts). Adversarial; every U* accounted (P9). Load-bearing: **blast tier** = arch (data-model SHAPE/stack/platform/external-dep/impl-mechanism) vs scope vs cosmetic, sort arch→scope→cosmetic, disposition deterministic from tier; hunt impl-forks; one gap=one topic; don't re-litigate chosen client words.
- **QUESTION-GEN** → `05-questions.md` (client-facing). Filter disposition:ask only (cosmetic skipped); **hard ≤6 cap**, mechanical select = first min(6,N) of blast-sorted 04; over-budget→deferred assumption (no silent drop). Load-bearing: **options stay in interpretations[] order, index 0→A/1→B/2→C; recommended marker moves IN PLACE, NEVER hoisted to A**; escape "Something else" last, never recommended.
- **SYNTHESIZE** → `drafts/aprd.v1.md` + `07-assumptions.json`. In: 02+04+05+06 (02 needed for E*/R*/C* id-space). 4 resolution paths: answered-letter→interpretations[index] / skipped→recommended_default / escape→client free-text verbatim / deferred→recommended_default. One A* per gap, full coverage. Load-bearing: carry E*/R*/C* verbatim, author A*/AC*; **CONSTRAINTS = exactly 02's stated_constraints, gap-fills are ASSUMPTIONS never CONSTRAINTS (no double-record)**; OUT_OF_SCOPE=declined interpretations (flips on override); ACs binary/one-outcome/concrete-observable, no fabricated edge cases; greenfield has NO class-extension block.
- **CRITIQUE** → `08-critique.json` {verdict clean|blocked, issues{I*, category, target_ref, fix_hint}}. 5 blocking categories: ambiguous-requirement, non-binary-ac, unbounded-scope, untraceable-assumption, broken-id-thread (`category` not severity — emit blockers only). Load-bearing: **resolution test** — read WHOLE contract before blocking; a fork closed by assumption+AC+OUT_OF_SCOPE is NOT a defect; cosmetic latitude within a passing AC is not a defect; anti-false-positive discipline (don't re-litigate logged decisions / demand ACs for unraised edges / OOS for unraised scope).
- **Main intake spine COMPLETE + windowed-e2e.** Golden chain 00→01→02→04→05→06→07+draft→08. (`06-answers.md` is a hand-authored client-gate fixture exercising all 4 resolution paths.)

### 2026-06-07 — Phase 0 research branch (§7) + Phase 1 start
- Resolved **D5** (research branch PRE-GAP), **D6** (VERIFY-OUTPUT→Phase 4), **D7** (Phase-1 numbering by spine order). See Open decisions. **Phase 0 prompt set COMPLETE** (9 prompts); ends at mechanical freeze (no prompt); inventory de-dup'd 40→39.
- **EXTRACT-RULES** → `03-grounding/rules-extracted.json` (flat rules{RULE*, source_ref→SRC*, tier, tool, tool_version_pinned, kind, topic, setting verbatim|null, evidence verbatim} + unfetched_sources + meta). Load-bearing: **transcribe-never-recall** (every rule needs verbatim evidence; famous-but-absent = absent; no training padding); NO reconcile/dedupe/currency-check (downstream); atomic (1 directive=1 rule); **extract NORMATIVE only — skip toolchain plumbing** (env/parserOptions/parser/plugins/extends, tsconfig path/output); graceful degradation (missing file→unfetched_sources). Golden canon fixture `_fixtures/greenfield-canon/` authored (TS/React/Node; planted 2 conflicts + 1 agreement + 1 missing source + plumbing/compound/non-normative traps).
- **RECONCILE** → `03-grounding/rules-reconciled.json` (agreed[AGR*] + conflicts[CONF* w/ positions[]] + carried unfetched + meta). Load-bearing: **topic is grouping HINT not decision key** — per-pairing relationship MERGE (same prescription) / CONFLICT (mutually exclusive) / SEPARATE (compatible-distinct; test: can one piece of code satisfy both?); a topic may yield a mix. Conflict by SEMANTICS not text; single-source=uncontested→agree; NO currency-check/NO invent (carry verbatim = VERIFY feed); recommend default per conflict by **TIER precedence** (tier1 config>tier2 prose; same-tier→null = genuine client decision, both positions stay); full accounting; **ordering by each entry's own lowest contributing RULE* index** (not topic-appearance).
- **VERIFY** → `03-grounding/rules-verified.json` = FINAL canon = RECONCILE structure carried VERBATIM + a `verification` block per agreed entry & per conflict position. Block = {status (current|deprecated|renamed|superseded|unknown-flag|not-version-bound|unverifiable), checked|null, finding, replacement, source_of_truth, confidence}. Load-bearing: **annotate-only, never re-reconcile** (same ids/order/positions/recommended_position); LLM NOT source of truth — flag never delete, `unverifiable`+low-confidence when unsure, never fabricate a verdict; null-setting prose→not-version-bound (no invented flag); **replacement is a suggestion, NEVER overwrite setting/rule** (append-only); currency does NOT change recommended_position; **sibling rules of one tool+version deprecate as a category** (consistency heuristic); re-count status_counts PER-STATUS (a swap that still sums right is the classic miscount).
- **Research sub-pipeline §7 COMPLETE + windowed-e2e.** Golden canon chain sources→manifests→extracted→reconciled→verified.
- Phase-1 head fixture authored: `aprd.frozen.md` + `aprd.lock` (mechanical freeze of golden draft; R1–R10/AC1–AC10/E1–E7/C1–C3).
- **SLICE-EXTRACT** (role 1/7) → `.roadmap/02-slices.json` (slices{S*, requirements, acceptance, value, value_basis, retires_risk, depends_on} + unsliceable + coverage + counts). Load-bearing: **verticality test** (slice vertical iff ≥1 AC black-box/user-observable, reuse aPRD AC* as oracle); **cluster by capability not layer**; full R*+AC* coverage no orphans (un-placeable→unsliceable+escape); depends_on coarse+acyclic (provisional, pending HLD re-rank); value proposed/client-owned (no fabricated model); retires_risk concrete-or-null; **controller-not-builder** — regroup existing IDs verbatim, never mint, never decide HOW; emission by lowest R* index. Guards: no frozen aPRD / non-frozen lock / non-greenfield → HALT (lock check = present+names-artifact, not hash recompute).
- **VERTICALITY-CHECK** (role 2/7) → `.roadmap/03-verticality.json` (valid[]/rejected[]{category}, verdict all_vertical|horizontal_found, counts). Adversarial reject-horizontal gate. Two inputs: 02 (AC ids) + frozen aPRD (**AC TEXT oracle — judge on AC text, not slice name**). Load-bearing: existential test (≥1 qualifying AC), record qualifying_acceptance as proof; 3 reject categories (horizontal_cut / no_acceptance / unresolved_acceptance=AC id not in aPRD); anti-FP (persistence ACs visible through surface ARE vertical; mildly-technical surface still black-box; **stay in lane = verticality only**); full accounting; no invent. Tested both directions.
- **SKELETON-IDENTIFY** (role 3/7) → `.roadmap/04-skeleton.json` (D7). Three inputs (JOIN): 03 valid[]=ELIGIBILITY + 02 bodies + frozen aPRD (seam oracle). **4 foundational seams** ingress/domain/persistence/primary-external-integration (last CONDITIONAL: absent→present:false, never invented). Skeleton test = ordered discriminator: crosses-every-present-seam-once → first-to-exercise-riskiest → dep-root (min depends_on) → thinnest. Load-bearing **RM11 boundary**: name seams, never DESIGN — NO components/stack/libs/db-engine/schema/endpoint/contract/**vendor** in ANY seam text field (even aPRD-cited "Google/GitHub" → functional TYPE only; vendor names may survive only in verbatim-carried `retires_risk`). No-fit→skeleton:null+uncovered_seams+escape; full accounting; carry IDs verbatim; stay in lane.
- **SEQUENCE** (role 4/7) → `.roadmap/05-sequence.json` (D7) {verdict sequenced|dependency_defect, sequence[]{position,id,skeleton,value,retires_risk,depends_on,cost_proxy,rationale}, ordering_basis, dependency_check, coverage, counts}. Three inputs: 04+02+03. **Skeleton pinned position 1** regardless of score; **dependency legality = HARD constraint** (greedy topological frontier fill); soft order of ready frontier = value(carried, never re-scored) → retires_risk!=null first → lower cost → lowest-S*; **cost_proxy = len(requirements)+len(acceptance)** (declared in ordering_basis, never estimated); cycle/dangling-depends_on/skeleton-with-deps → verdict:dependency_defect + route to SLICE-EXTRACT; full accounting; stay in lane (only `skeleton:true` flag on pos1). Golden roadmap chain now 02→03→04→05. **Next: FOUNDATION-CUT (role 5/7)** — reads 04+05(+aprd.frozen.md), writes `06-foundation-cut.json`.
