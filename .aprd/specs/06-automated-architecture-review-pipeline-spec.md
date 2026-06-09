# Spine A — Automated Architecture Review Pipeline (existing system + complaints → diagnosed review + recommended changes)

> **Status:** design sketch. Built after greenfield delivery pipeline (Phases 0–4) and, by current build order, after Spine D (documentation). Authored prompt-by-prompt, same tracker-driven way.
>
> **Register note:** spec contract overrides — caveman prose inside this spec. Authored prompts carry canonical caveman block.
>
> **Change log:** 2026-06-09 — economy cut (caveman register + AB8): killed banned hedge/filler words. Substance invariant. New version = the change request (P8).

---

## 1. Purpose

Take **existing system** (e.g. agentic-system code repo) plus set of **client complaints / pain points**, produce **diagnosed architectural review with recommended architecture + process changes** — each recommendation grounded in as-built system, traced to complaint, decided among live alternatives.

Worked example (request that motivated this spine): *given agentic-system code repo + client complaints, conduct architectural review and suggest architecture + process changes that resolve complaints.*

This = **investigation** class extended with decision step. Greenfield CLASSIFIER already recognizes `investigation` ("answer question with evidence; deliverable = answer") — this spine = authored downstream for it, sharpened from *answer* to *answer + recommended change set*.

Review-**backward** over existing system, inverse of greenfield pipeline's build-**forward**. Reuses greenfield reasoning roles two distinctive ways: **Phase-3 HLD modeling roles run in reverse** to reconstruct as-built architecture, and **Phase-2 ADR engine runs verbatim** to turn diagnoses into decided recommendations.

### 1.1 Goals
- **Diagnose, don't merely describe.** Map each complaint to *root cause* in reconstructed architecture/process, distinguish symptom from cause. Complaint may have several causes, share cause with another complaint, or be non-issue.
- **Recommend with rigor.** Each remediation = ADR-grade decision: ≥2 live alternatives, evaluated against real constraints/impact/cost, one picked, consequences recorded. No hand-wave "use microservices."
- **Grounded in as-built system.** Current-state model cites real files/modules/configs (transcribe-never-recall). No assumed architecture, no diagnosis of structure that isn't there.
- **Traceable + adversarially gated.** Every recommendation traces to complaint; every complaint addressed, deferred, or explicitly declined with reason; hostile reviewer gates lot.

### 1.2 Non-goals
- Not implementing changes. Terminal = **accepted review + recommendation set**. Accepted recommendations may *feed* greenfield / feature-add / refactor pipelines as fresh input (see §2 exit) — closes loop — but applying them = those pipelines' job.
- Not documenting system for own sake (Spine D owns that), though current-state reconstruction overlaps + can be shared.
- Not generic code review for bugs; deliverable = *architectural + process* change keyed to *complaints*, not line-level lint.

---

## 2. Where Spine A sits

```
[ existing system repo ]  +  [ client complaints / pain points ]
                    │
                    ▼
        ┌──────────────────────────┐
        │   SPINE A (this spec)     │   ← routed here by CLASSIFIER when
        │  architecture review      │     class == investigation AND
        └──────────────────────────┘     deliverable == architectural change
                    │
                    ▼
   [ accepted review + recommended change set (ADRs, prioritized) ]
                    │
                    ▼  (optional hand-off — the loop closes)
   [ each accepted recommendation → aPRD input for feature-add / refactor / migration pipelines ]
```

Entry: shared **CLASSIFIER**. `investigation` whose answer = architectural/process verdict routes here. Complaint set = first-class second input (system = one input, grievances = other).

Exit: accepted review artifact. Distinctively, recommendation set shaped as **Proposed ADRs** — exactly input contract build pipelines already consume — so accepted review dispatches into delivery pipeline with no translation.

---

## 3. Core principles

- **P5 / P11 — code is truth; transcribe, never recall.** Reconstruct architecture from actual repo, not from recalled agentic-system shape. Every current-state claim cites real file/module. LLM reconciles evidence; never source.
- **Symptom ≠ cause (unifying insight, §4.1).** Complaint = observed symptom; review's job = causal trace from symptom to structural/process root that produces it. "Done" = every complaint has grounded root-cause trace.
- **Live alternatives are rule (inherited D1/D3 from Phase 2).** Recommendation only as good as alternatives it beat. Every recommended change records options it was chosen over + why — ADR engine's core discipline, reused verbatim.
- **FLAG / DIAGNOSE / RECOMMEND = separated lanes.** Reconstruction states *what is*; diagnosis states *why it hurts*; recommendation states *what to change*. Mixing them (e.g. reconstruction role that editorializes, or diagnosis that smuggles fix) = failure-isolation boundary, same as greenfield role separation.
- **Two loops.** **Reconstruction loop** (once: build current-state model) + **per-complaint loop** (×N: diagnose → recommend). Mirrors foundation-loop + slice-loop.
- **Adversarial gate.** CRITIQUE hostile + bidirectional (tested on clean + planted-defect), exactly as Phases 0/2.

---

## 4. Complaint & recommendation taxonomy

**Complaint axes (drive triage + which reconstruction depth needed):**
```
locus:    architecture | process | both
            (architecture = structure/contracts/data/flows; process = how the team builds/ships/operates)
symptom:  correctness | performance | cost | maintainability | reliability | velocity | onboarding-friction
evidence: measured (metric/log/incident) | reported (felt, unquantified) | inferred (we found it)
```

**Recommendation kinds (change axis):**
```
arch-change     | re-cut a boundary, change a contract kind, split/merge a component, fix a data-ownership defect
process-change  | change how decisions/builds/reviews/deploys happen (CI gate, ownership, cadence, ADR discipline)
no-change       | complaint is a non-issue or accepted trade-off; recorded with reason (anti-thrash)
```

### 4.1 Unifying insight — review = causal proof, not opinion

Mirrors greenfield "done is a test" + Phase-2 "decision is foundational iff…". Review **done** when:

> every complaint traced to grounded root cause, AND every accepted recommendation = decided-among-live-alternatives change that, if applied, removes that cause — removal stated as checkable expectation.

Gives review *oracle*: recommendation that doesn't tie back to complaint's cause = gold-plating (blocked, same as unforced ADR); complaint with no traced cause = incomplete review (blocked, same as uncovered constraint). Deliverable = executable-on-paper, same sense as HLD — claims mechanically auditable.

---

## 5. Pipeline stages

Two loops: **reconstruction** (once) then **per-complaint diagnose-and-recommend** (×N).

### 5.1 Classify & scope `[reuse: CLASSIFIER]`
`investigation` → architecture-review. Decompose complaint set into **atomic complaints** (one symptom, one locus); preserve client wording; detect scope (which subsystems in play); escape if request is build/bugfix in disguise, or if repo inaccessible.

### 5.2 Extract complaints `[reuse: EXTRACT]`
Transcribe each complaint into structured atom: `{CMP*, symptom, locus, evidence_kind, quoted_evidence, impact, source_ref}`. Transcriber-not-author: cite client's words, mark inferred impact as inferred, list unknowns as `U*`. Verbatim carry, no paraphrasing away scope.

### 5.3 Reconstruct current state `[reuse: research sub-pipeline §7 + Phase-3 HLD roles in REVERSE — the load-bearing stage]`
Distinctive capability of this spine. Read repo, build **as-built model**:
- **Ground first** (← EXTRACT-RULES / RECONCILE / VERIFY): transcribe real structure from code — modules, entrypoints, configs, dependencies, build/CI/deploy scripts, ADRs-if-any. Verbatim evidence per fact; reconcile conflicting signals (config says X, code does Y = finding); flag dead/stale code.
- **Model** (← DERIVE-COMPONENTS, DEFINE-CONTRACTS, MODEL-DATA, MODEL-FLOWS, run read-mode): cluster real modules into as-built component graph; recover real contracts on each seam (incl. implicit/undocumented ones); recover data ownership (spot two-owner / shared-write defects); walk real critical flows. Same modeling roles as Phase 3, but input = *existing code* and output = *what is*, not *what to build*. Built-in defect detectors (single-owner violations, async-on-a-sync-frame, broken contracts) become **findings** instead of escapes.

Output = **current-state HLD**: grounded, as-built architecture model, structural findings already surfaced.

### 5.4 Diagnose — complaint → root cause `[reuse: GAP-DETECT + Phase-4 DIAGNOSE pattern]`
Causal core. For each `CMP*`, trace from symptom to current-state element(s) that produce it: which component, contract, data-ownership defect, flow, or process step = root cause. Adversarial discipline (← GAP-DETECT): hunt *real* cause, not first plausible one; symptom may map to multiple causes or none (non-issue / accepted trade-off → flagged, not invented). Reuses Phase-4 DIAGNOSE role's "is this actual fault or downstream effect" reasoning. Output: `{CMP* → [root_cause{element_ref, why, confidence}]}`, every complaint accounted for (P9).

### 5.5 Generate remediation options `[reuse: OPTION-GEN]`
Per diagnosed root cause, ≥2 **live, real** remediation alternatives (arch-change and/or process-change), cheapest-source-first (existing-pattern → canon → reasoned). Anti-strawman (team-would-weigh AND viable-not-DOA AND distinct); compliance gate (option breaking stated client constraint = dead-on-arrival, excluded). OPTION-GEN's job verbatim — "decision point" now = "how to remove this cause".

### 5.6 Evaluate & decide `[reuse: EVALUATE-DECIDE]`
Score each option set against impact-on-complaint, cost/effort, blast radius, client constraints; pick one; record consequences + rejected-with-reason. Live-alternatives-assessed-before-pick discipline verbatim (structure that forces real alternatives). Output = one decided recommendation per root cause.

### 5.7 Reconcile `[reuse: RECONCILE (Phase 2)]`
Cross-recommendation coherence + coverage: recommendations don't contradict each other; **every complaint covered** (addressed / deferred / declined-with-reason — bidirectional coverage check, complaints as target set instead of C*). Conflicts or uncovered complaints → blocked, route back to 5.6/5.4. Flag-never-re-decide lane.

### 5.8 Prioritize change set `[reuse: SEQUENCE + FOUNDATION-CUT]`
Order recommended changes by dependency + impact-per-effort into remediation roadmap (fix data-ownership defect before feature that depends on it). Dependency legality = hard constraint, value/impact = soft order — SEQUENCE verbatim. FOUNDATION-CUT identifies which changes = prerequisites for rest ("fix once, unblocks many").

### 5.9 Synthesize review `[reuse: SYNTHESIZE-ADR + SYNTHESIZE]`
Render deliverable: (a) current-state summary (from 5.3), (b) per-complaint diagnosis (from 5.4), (c) recommended change set as **Proposed ADRs** (from 5.6, SYNTHESIZE-ADR verbatim — transcribe-decision-never-re-decide), (d) prioritized remediation roadmap (from 5.8). Clean deliverable register.

### 5.10 Critique (adversarial) `[reuse: CRITIQUE (Phase 2)]`
Hostile gate on rendered review. Blocking categories (adapted from Phase-2 CRITIQUE): **ungrounded-diagnosis** (root cause cites no real element), **uncovered-complaint** (complaint with no recommendation + no decline reason), **strawman-remediation** (fabricated losing alternative), **untraced-recommendation** (change tied to no complaint = gold-plating), **constraint-breaking-recommendation** (violates stated client constraint), **symptom-not-cause** (recommendation treats symptom while cause stands). Anti-false-positive resolution test verbatim (read whole trace before blocking; accepted-trade-off "no-change" ≠ uncovered complaint). Blocking → loop.

### 5.11 Client accept `[reuse: SEQUENCE-REVIEW two-phase pattern, D8]`
Present current-state + diagnoses + prioritized recommendations; PAUSE; on reply accept / redline / defer. Phase A lands disk deliverable (clean-room testable); Phase B writes accepted review.

### 5.12 State machine (sketch)
```
classify → extract-complaints → reconstruct(current-state HLD)
   → for each complaint: diagnose → option-gen → evaluate-decide
   → reconcile(coherence + full complaint coverage)
   → prioritize → synthesize-review → critique → [loop] → accept gate → DONE
   → (optional) dispatch accepted recommendations into delivery pipeline
```

---

## 6. The review artifact

### 6.1 Schema (reconstruction once + per-complaint increments)
```
# RECONSTRUCTION (once) — the as-built model everything is judged against
current_state:   { components[], contracts[CT*], data_model, flows[F*], process_observations[] }
                  # = a Phase-3-shaped HLD, read-mode, with structural findings[] surfaced
findings:        [ { FND*, element_ref, what, evidence(source_ref), severity } ]

# PER-COMPLAINT (×N)
complaint:       { id: CMP*, symptom, locus, evidence_kind, quoted_evidence, impact, source_ref }
diagnosis:       { CMP*, root_causes[ { element_ref, why, confidence, finding_ref? } ] }
recommendation:  { REC*, addresses[CMP*], kind, decision(ADR-shaped: chosen, alternatives[], why, consequences),
                   expected_effect, effort, depends_on[REC*] }
roadmap:         [ ordered REC* with prerequisite cuts ]
coverage:        { every CMP* → covered | deferred | declined(reason) }
```

IDs thread: `CMP → root_cause(element_ref) → REC → ADR`, so coverage + traceability mechanically auditable — same property that enables Phase-2 CRITIQUE to verify ADR coverage.

### 6.2 Why this form
Review = **executable-on-paper**: recommendation with no `addresses[CMP*]` = gold-plating by schema; complaint not in `coverage` = incomplete review by schema; diagnosis with no `element_ref` = ungrounded by schema. Defects structural, not matters of taste — and recommendation set already in ADR shape, so drops straight into delivery pipeline.

---

## 7. Prompt library — reuse map

`VERBATIM` · `OVERLAY` · `NEW` as in Spine D §7.

| Stage | New role | Source role | Reuse | What transfers / what changes |
|---|---|---|---|---|
| 5.1 | CLASSIFY | CLASSIFIER | VERBATIM | `investigation` class already exists; decompose-and-escape unchanged. |
| 5.2 | EXTRACT-COMPLAINTS | EXTRACT | OVERLAY | transcriber-not-author + cite-source + unknowns transfers; atoms = complaints not requirements. |
| 5.3 | RECONSTRUCT (ground) | EXTRACT-RULES + RECONCILE + VERIFY | OVERLAY | transcribe-never-recall + reconcile + currency over *code* instead of *canon*. |
| 5.3 | RECONSTRUCT (model) | DERIVE-COMPONENTS + DEFINE-CONTRACTS + MODEL-DATA + MODEL-FLOWS | OVERLAY | modeling roles run **read-mode**; their defect detectors become `findings[]`. |
| 5.4 | DIAGNOSE | GAP-DETECT + DIAGNOSE (Phase 4) | OVERLAY | adversarial root-cause hunt + symptom-vs-cause discipline; output = complaint→cause traces. |
| 5.5 | OPTION-GEN | OPTION-GEN | VERBATIM | ≥2 live alternatives, anti-strawman, compliance gate — unchanged; "decision" = "how to remove this cause". |
| 5.6 | EVALUATE-DECIDE | EVALUATE-DECIDE | VERBATIM | live-alternatives-before-pick, force-traced rejection — unchanged. |
| 5.7 | RECONCILE | RECONCILE | OVERLAY | coherence + bidirectional coverage; target set = complaints instead of C*. |
| 5.8 | PRIORITIZE | SEQUENCE + FOUNDATION-CUT | OVERLAY | dependency-legal-hard + impact-soft ordering; foundation cut = prerequisite changes. |
| 5.9 | SYNTHESIZE-REVIEW | SYNTHESIZE-ADR + SYNTHESIZE | OVERLAY | transcribe-decision-never-re-decide verbatim; wraps ADRs in review narrative. |
| 5.10 | CRITIQUE | CRITIQUE (Phase 2) | OVERLAY | adversarial + resolution-test + anti-FP transfers; blocking categories re-specced for reviews. |
| 5.11 | ACCEPT-REVIEW | SEQUENCE-REVIEW | OVERLAY | D8 two-phase interactive pattern verbatim. |

**Net new code = near zero.** Three roles VERBATIM. Genuinely new reasoning concentrated in **DIAGNOSE** (symptom→cause trace) + **read-mode** flip of HLD modeling roles; everything else = Phase-2 decision engine + Phase-1 sequencing applied to new input. Strongest reuse of all three spines — architecture review mostly "run ADR pipeline backward over existing system."

---

## 8. Interaction & gate model
Optionally one early clarify gate if complaints too vague to diagnose (reuse QUESTION-GEN); always one **accept** gate (5.11). Both `interactive: true`, D8 two-phase. Everything else silent (PR1).

## 9. Extensibility — depth per complaint
Mirrors greenfield §11. Reconstruction depth toggles by complaint locus: pure `process` complaint set skips most HLD modeling (only `process_observations[]`); `architecture` set runs full read-mode HLD; `both` runs both. Adding new symptom type or recommendation kind = taxonomy entry + CRITIQUE category, not new role.

## 10. Failure modes & guardrails
- **Architecture-by-assumption** → blocked by `element_ref` + `source_ref` schema requirement + CRITIQUE ungrounded-diagnosis. Cannot diagnose structure you didn't cite.
- **Symptom-treating recommendations** → CRITIQUE symptom-not-cause + expected_effect-ties-to-root-cause schema.
- **Gold-plating ("rewrite it all")** → every REC must `addresses[CMP*]`; untraced recommendations blocked (same lever as unforced-ADR in Phase 2).
- **Recommendation thrash / pet architectures** → live-alternatives discipline + compliance gate + no-change-with-reason for accepted trade-offs.
- **Unbounded review** → scope fixed at classification; complaint set = coverage target, not "everything wrong with repo".

## 11. Open questions
- **OQ-A1 — repo-scale reconstruction.** Read-mode HLD over large repo may not fit one session; needs chunking / map-reduce strategy for DERIVE-COMPONENTS read-mode (mirrors docs OQ-D2 size threshold).
- **OQ-A2 — process-locus grounding.** Architecture grounds in code; what grounds *process* findings? (CI configs, PR history, incident logs, transcripts). Define process-evidence sources before DIAGNOSE authored.
- **OQ-A3 — recommendation → delivery-pipeline hand-off contract.** Accepted ADRs shaped for build pipeline, but do they re-enter at Phase 0 (re-aPRD) or Phase 2 (already-decided)? Pick re-entry point to avoid re-litigating decided changes.
- **OQ-A4 — confidence floors.** Low-confidence root cause should not silently spawn high-effort recommendation; define confidence gate between DIAGNOSE and OPTION-GEN.
