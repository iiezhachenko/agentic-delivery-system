# Spine A — Automated Architecture Review Pipeline (existing system + complaints → diagnosed review + recommended changes)

> **Status:** design sketch. Built after the greenfield delivery pipeline (Phases 0–4) and, by current build order, after Spine D (documentation). Authored prompt-by-prompt the same tracker-driven way.
>
> **Register note:** clean prose inside this spec. Authored prompts carry the canonical caveman block.

---

## 1. Purpose

Take an **existing system** (e.g. an agentic-system code repository) plus a set of **client complaints / pain points**, and produce a **diagnosed architectural review with recommended architecture and process changes** — each recommendation grounded in the as-built system, traced to a complaint, and decided among live alternatives.

Worked example (the request that motivated this spine): *given an agentic-system code repository and the client's complaints, conduct an architectural review and suggest architecture and process changes that resolve the complaints.*

This is the **investigation** class extended with a decision step. The greenfield CLASSIFIER already recognizes `investigation` ("answer a question with evidence; deliverable is the answer") — this spine is the authored downstream for it, sharpened from *answer* to *answer + recommended change set*.

It is review-**backward** over an existing system, the inverse of the greenfield pipeline's build-**forward**. It reuses the greenfield reasoning roles in two distinctive ways: the **Phase-3 HLD modeling roles run in reverse** to reconstruct the as-built architecture, and the **Phase-2 ADR engine runs verbatim** to turn diagnoses into decided recommendations.

### 1.1 Goals
- **Diagnose, don't just describe.** Map each complaint to a *root cause* in the reconstructed architecture/process, distinguishing symptom from cause. A complaint may have several causes, share a cause with another complaint, or be a non-issue.
- **Recommend with rigor.** Each remediation is an ADR-grade decision: ≥2 live alternatives, evaluated against real constraints/impact/cost, one picked, consequences recorded. No hand-wave "you should use microservices."
- **Grounded in the as-built system.** The current-state model cites real files/modules/configs (transcribe-never-recall). No assumed architecture, no diagnosis of a structure that isn't there.
- **Traceable + adversarially gated.** Every recommendation traces to a complaint; every complaint is addressed, deferred, or explicitly declined with reason; a hostile reviewer gates the lot.

### 1.2 Non-goals
- Not implementing the changes. Terminal is the **accepted review + recommendation set**. Accepted recommendations may *feed* the greenfield / feature-add / refactor pipelines as fresh input (see §2 exit) — closing the loop — but applying them is those pipelines' job.
- Not documenting the system for its own sake (Spine D owns that), though current-state reconstruction overlaps and can be shared.
- Not a generic code review for bugs; the deliverable is *architectural + process* change keyed to *complaints*, not a line-level lint.

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

Entry: shared **CLASSIFIER**. `investigation` whose answer is an architectural/process verdict routes here. The complaint set is a first-class second input (the system is one input, the grievances are the other).

Exit: accepted review artifact. Distinctively, the recommendation set is shaped as **Proposed ADRs**, which is exactly the input contract the build pipelines already consume — so an accepted review can be dispatched into the delivery pipeline with no translation.

---

## 3. Core principles

- **P5 / P11 — the code is the truth; transcribe, never recall.** Reconstruct the architecture from the actual repo, not from what an agentic system "usually" looks like. Every current-state claim cites a real file/module. The LLM reconciles evidence; it is never the source.
- **Symptom ≠ cause (the unifying insight, §4.1).** A complaint is an observed symptom; the review's job is the causal trace from symptom to the structural or process root that produces it. "Done" = every complaint has a grounded root-cause trace.
- **Live alternatives are the rule (inherited D1/D3 from Phase 2).** A recommendation is only as good as the alternatives it beat. Every recommended change records the options it was chosen over and why — the ADR engine's core discipline, reused verbatim.
- **FLAG / DIAGNOSE / RECOMMEND are separated lanes.** Reconstruction states *what is*; diagnosis states *why it hurts*; recommendation states *what to change*. Mixing them (e.g. a reconstruction role that editorializes, or a diagnosis that smuggles in a fix) is the failure-isolation boundary, same as the greenfield role separation.
- **Two loops.** A **reconstruction loop** (once: build the current-state model) + a **per-complaint loop** (×N: diagnose → recommend). Mirrors foundation-loop + slice-loop.
- **Adversarial gate.** CRITIQUE is hostile and bidirectional (tested on clean + planted-defect), exactly as in Phases 0/2.

---

## 4. Complaint & recommendation taxonomy

**Complaint axes (drive triage + which reconstruction depth is needed):**
```
locus:    architecture | process | both
            (architecture = structure/contracts/data/flows; process = how the team builds/ships/operates)
symptom:  correctness | performance | cost | maintainability | reliability | velocity | onboarding-friction
evidence: measured (metric/log/incident) | reported (felt, unquantified) | inferred (we found it)
```

**Recommendation kinds (the change axis):**
```
arch-change     | re-cut a boundary, change a contract kind, split/merge a component, fix a data-ownership defect
process-change  | change how decisions/builds/reviews/deploys happen (CI gate, ownership, cadence, ADR discipline)
no-change       | complaint is a non-issue or accepted trade-off; recorded with reason (anti-thrash)
```

### 4.1 The unifying insight — a review is a causal proof, not an opinion

Mirrors the greenfield "done is a test" and the Phase-2 "a decision is foundational iff…". A review is **done** when:

> every complaint is traced to a grounded root cause, AND every accepted recommendation is a decided-among-live-alternatives change that, if applied, removes that cause — with the removal stated as a checkable expectation.

That gives the review an *oracle*: a recommendation that doesn't tie back to a complaint's cause is gold-plating (blocked, same as an unforced ADR); a complaint with no traced cause is an incomplete review (blocked, same as an uncovered constraint). The deliverable is executable-on-paper in the same sense as an HLD — its claims are mechanically auditable.

---

## 5. Pipeline stages

Two loops: **reconstruction** (once) then **per-complaint diagnose-and-recommend** (×N).

### 5.1 Classify & scope `[reuse: CLASSIFIER]`
`investigation` → architecture-review. Decompose the complaint set into **atomic complaints** (one symptom, one locus); preserve client wording; detect scope (which subsystems are in play); escape if the request is actually a build/bugfix in disguise, or if the repo is inaccessible.

### 5.2 Extract complaints `[reuse: EXTRACT]`
Transcribe each complaint into a structured atom: `{CMP*, symptom, locus, evidence_kind, quoted_evidence, impact, source_ref}`. Transcriber-not-author: cite the client's words, mark inferred impact as inferred, list unknowns as `U*`. Verbatim carry, no paraphrasing away scope.

### 5.3 Reconstruct current state `[reuse: research sub-pipeline §7 + Phase-3 HLD roles in REVERSE — the load-bearing stage]`
The distinctive capability of this spine. Read the repo and build the **as-built model**:
- **Ground first** (← EXTRACT-RULES / RECONCILE / VERIFY): transcribe the real structure from the code — modules, entrypoints, configs, dependencies, build/CI/deploy scripts, ADRs-if-any. Verbatim evidence per fact; reconcile conflicting signals (a config says X, the code does Y = a finding); flag dead/stale code.
- **Model** (← DERIVE-COMPONENTS, DEFINE-CONTRACTS, MODEL-DATA, MODEL-FLOWS, run read-mode): cluster the real modules into the as-built component graph; recover the real contracts on each seam (incl. the implicit/undocumented ones); recover data ownership (and spot two-owner / shared-write defects); walk the real critical flows. Same modeling roles as Phase 3, but the input is *existing code* and the output is *what is*, not *what to build*. Their built-in defect detectors (single-owner violations, async-on-a-sync-frame, broken contracts) become **findings** instead of escapes.

Output = the **current-state HLD**: the grounded, as-built architecture model, with structural findings already surfaced.

### 5.4 Diagnose — complaint → root cause `[reuse: GAP-DETECT + Phase-4 DIAGNOSE pattern]`
The causal core. For each `CMP*`, trace from symptom to the current-state element(s) that produce it: which component, contract, data-ownership defect, flow, or process step is the root cause. Adversarial discipline (← GAP-DETECT): hunt the *real* cause, not the first plausible one; a symptom may map to multiple causes or to none (a non-issue / an accepted trade-off → flagged, not invented). Reuses the Phase-4 DIAGNOSE role's "is this the actual fault or a downstream effect" reasoning. Output: `{CMP* → [root_cause{element_ref, why, confidence}]}`, every complaint accounted for (P9).

### 5.5 Generate remediation options `[reuse: OPTION-GEN]`
Per diagnosed root cause, ≥2 **live, real** remediation alternatives (arch-change and/or process-change), cheapest-source-first (existing-pattern → canon → reasoned). Anti-strawman (team-would-weigh AND viable-not-DOA AND distinct); compliance gate (an option that breaks a stated client constraint is dead-on-arrival, excluded). This is OPTION-GEN's job verbatim — the "decision point" is now "how to remove this cause".

### 5.6 Evaluate & decide `[reuse: EVALUATE-DECIDE]`
Score each option set against impact-on-the-complaint, cost/effort, blast radius, and client constraints; pick one; record consequences and rejected-with-reason. Live-alternatives-assessed-before-the-pick discipline verbatim (the structure that forces real alternatives). Output = one decided recommendation per root cause.

### 5.7 Reconcile `[reuse: RECONCILE (Phase 2)]`
Cross-recommendation coherence + coverage: recommendations don't contradict each other; **every complaint is covered** (addressed / deferred / declined-with-reason — the bidirectional coverage check, complaints as the target set instead of C*). Conflicts or uncovered complaints → blocked, route back to 5.6/5.4. Flag-never-re-decide lane.

### 5.8 Prioritize the change set `[reuse: SEQUENCE + FOUNDATION-CUT]`
Order the recommended changes by dependency + impact-per-effort into a remediation roadmap (you fix the data-ownership defect before the feature that depends on it). Dependency legality as a hard constraint, value/impact as soft order — SEQUENCE verbatim. FOUNDATION-CUT identifies which changes are prerequisites for the rest ("fix once, unblocks many").

### 5.9 Synthesize the review `[reuse: SYNTHESIZE-ADR + SYNTHESIZE]`
Render the deliverable: (a) current-state summary (from 5.3), (b) per-complaint diagnosis (from 5.4), (c) the recommended change set as **Proposed ADRs** (from 5.6, SYNTHESIZE-ADR verbatim — transcribe-the-decision-never-re-decide), (d) the prioritized remediation roadmap (from 5.8). Clean deliverable register.

### 5.10 Critique (adversarial) `[reuse: CRITIQUE (Phase 2)]`
Hostile gate on the rendered review. Blocking categories (adapted from Phase-2 CRITIQUE): **ungrounded-diagnosis** (root cause cites no real element), **uncovered-complaint** (a complaint with no recommendation and no decline reason), **strawman-remediation** (a fabricated losing alternative), **untraced-recommendation** (a change tied to no complaint = gold-plating), **constraint-breaking-recommendation** (violates a stated client constraint), **symptom-not-cause** (recommendation treats the symptom while the cause stands). Anti-false-positive resolution test verbatim (read the whole trace before blocking; an accepted-trade-off "no-change" is not an uncovered complaint). Blocking → loop.

### 5.11 Client accept `[reuse: SEQUENCE-REVIEW two-phase pattern, D8]`
Present current-state + diagnoses + prioritized recommendations; PAUSE; on reply accept / redline / defer. Phase A lands a disk deliverable (clean-room testable); Phase B writes the accepted review.

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

IDs thread: `CMP → root_cause(element_ref) → REC → ADR`, so coverage and traceability are mechanically auditable — the same property that lets Phase-2 CRITIQUE verify ADR coverage.

### 6.2 Why this form
The review is **executable-on-paper**: a recommendation with no `addresses[CMP*]` is gold-plating by schema; a complaint not in `coverage` is an incomplete review by schema; a diagnosis with no `element_ref` is ungrounded by schema. Defects are structural, not matters of taste — and the recommendation set is already in ADR shape, so it drops straight into the delivery pipeline.

---

## 7. Prompt library — reuse map

`VERBATIM` · `OVERLAY` · `NEW` as in Spine D §7.

| Stage | New role | Source role | Reuse | What transfers / what changes |
|---|---|---|---|---|
| 5.1 | CLASSIFY | CLASSIFIER | VERBATIM | `investigation` class already exists; decompose-and-escape unchanged. |
| 5.2 | EXTRACT-COMPLAINTS | EXTRACT | OVERLAY | transcriber-not-author + cite-source + unknowns transfers; atoms are complaints not requirements. |
| 5.3 | RECONSTRUCT (ground) | EXTRACT-RULES + RECONCILE + VERIFY | OVERLAY | transcribe-never-recall + reconcile + currency over *code* instead of *canon*. |
| 5.3 | RECONSTRUCT (model) | DERIVE-COMPONENTS + DEFINE-CONTRACTS + MODEL-DATA + MODEL-FLOWS | OVERLAY | the modeling roles run **read-mode**; their defect detectors become `findings[]`. |
| 5.4 | DIAGNOSE | GAP-DETECT + DIAGNOSE (Phase 4) | OVERLAY | adversarial root-cause hunt + symptom-vs-cause discipline; output is complaint→cause traces. |
| 5.5 | OPTION-GEN | OPTION-GEN | VERBATIM | ≥2 live alternatives, anti-strawman, compliance gate — unchanged; "decision" = "how to remove this cause". |
| 5.6 | EVALUATE-DECIDE | EVALUATE-DECIDE | VERBATIM | live-alternatives-before-pick, force-traced rejection — unchanged. |
| 5.7 | RECONCILE | RECONCILE | OVERLAY | coherence + bidirectional coverage; target set = complaints instead of C*. |
| 5.8 | PRIORITIZE | SEQUENCE + FOUNDATION-CUT | OVERLAY | dependency-legal-hard + impact-soft ordering; foundation cut = prerequisite changes. |
| 5.9 | SYNTHESIZE-REVIEW | SYNTHESIZE-ADR + SYNTHESIZE | OVERLAY | transcribe-decision-never-re-decide verbatim; wraps ADRs in a review narrative. |
| 5.10 | CRITIQUE | CRITIQUE (Phase 2) | OVERLAY | adversarial + resolution-test + anti-FP transfers; blocking categories re-specced for reviews. |
| 5.11 | ACCEPT-REVIEW | SEQUENCE-REVIEW | OVERLAY | D8 two-phase interactive pattern verbatim. |

**Net new code = near zero.** Three roles are VERBATIM. The genuinely new reasoning is concentrated in **DIAGNOSE** (the symptom→cause trace) and the **read-mode** flip of the HLD modeling roles; everything else is the Phase-2 decision engine and Phase-1 sequencing applied to a new input. This is the strongest reuse of all three spines — an architecture review is mostly "run the ADR pipeline backward over an existing system."

---

## 8. Interaction & gate model
Optionally one early clarify gate if complaints are too vague to diagnose (reuse QUESTION-GEN); always one **accept** gate (5.11). Both `interactive: true`, D8 two-phase. Everything else silent (PR1).

## 9. Extensibility — depth per complaint
Mirrors greenfield §11. Reconstruction depth toggles by complaint locus: a pure `process` complaint set skips most HLD modeling (only `process_observations[]`); an `architecture` set runs the full read-mode HLD; `both` runs both. Adding a new symptom type or recommendation kind is a taxonomy entry + a CRITIQUE category, not a new role.

## 10. Failure modes & guardrails
- **Architecture-by-assumption** → blocked by the `element_ref` + `source_ref` schema requirement + CRITIQUE ungrounded-diagnosis. You cannot diagnose a structure you didn't cite.
- **Symptom-treating recommendations** → CRITIQUE symptom-not-cause + the expected_effect-ties-to-root-cause schema.
- **Gold-plating ("rewrite it all")** → every REC must `addresses[CMP*]`; untraced recommendations are blocked (same lever as unforced-ADR in Phase 2).
- **Recommendation thrash / pet architectures** → live-alternatives discipline + compliance gate + no-change-with-reason for accepted trade-offs.
- **Unbounded review** → scope fixed at classification; the complaint set is the coverage target, not "everything wrong with the repo".

## 11. Open questions
- **OQ-A1 — repo-scale reconstruction.** Read-mode HLD over a large repo may not fit one session; needs a chunking / map-reduce strategy for DERIVE-COMPONENTS read-mode (mirrors the docs OQ-D2 size threshold).
- **OQ-A2 — process-locus grounding.** Architecture grounds in code; what grounds *process* findings? (CI configs, PR history, incident logs, transcripts). Define the process-evidence sources before DIAGNOSE is authored.
- **OQ-A3 — recommendation → delivery-pipeline hand-off contract.** The accepted ADRs are shaped for the build pipeline, but do they re-enter at Phase 0 (re-aPRD) or Phase 2 (already-decided)? Pick the re-entry point to avoid re-litigating decided changes.
- **OQ-A4 — confidence floors.** A low-confidence root cause should not silently spawn a high-effort recommendation; define a confidence gate between DIAGNOSE and OPTION-GEN.
