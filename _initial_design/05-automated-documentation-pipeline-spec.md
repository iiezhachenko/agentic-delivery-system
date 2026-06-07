# Spine D — Automated Documentation Pipeline (existing system + doc goal → verified documentation set)

> **Status:** design sketch. Built AFTER the greenfield delivery pipeline (Phases 0–4) completes, per `_tracker.md` build order. Authored prompt-by-prompt the same way (one role = one prompt, fresh-session sim, artifacts chain on disk, golden fixtures).
>
> **Register note:** clean prose inside this spec (it is a deliverable). Authored prompts carry the canonical caveman block.

---

## 1. Purpose

Take an **existing system** (code repos, IaC, resource inventories, API specs, meeting transcripts, prior docs) plus a **documentation goal** (onboarding, operational guidelines, runbooks, architecture reference, API docs) and produce a **complete, verified documentation set** that a target audience can act on.

Worked example (the request that motivated this spine): *given a set of terraform repos + an AWS resource inventory, produce a complete set of operational guidelines and onboarding documentation for the AWS Organization infrastructure.*

This is **not** the greenfield pipeline. No software is shipped. The input is an existing system (brownfield), the output is documentation. The greenfield CLASSIFIER escapes both axes (non-greenfield input, non-software output) — this pipeline owns the work it routes away.

### 1.1 Goals
- **Generalist + input-adaptive.** One spine, not one pipeline per doc type. The pipeline reads what kind of inputs it was given and what kind of doc is wanted, then toggles the relevant adapters and section set. New input kinds / doc types are playbook overlays, not new spines.
- **Grounded, never hallucinated.** Every documented claim (a command, a config value, an account boundary, a resource relationship) traces to a verified source fact. A doc that invents a flag the system does not have is a defect, not a style choice.
- **Drift-aware.** When two sources disagree (terraform declares X, live inventory shows Y), the pipeline surfaces the drift rather than silently picking one — same RECONCILE discipline as canon grounding.
- **Executable-on-paper, then executed.** Where the doc tells the reader to *do* something, the instruction is validated (dry-run, lint, replay) before the doc is accepted.

### 1.2 Non-goals
- Not building or changing the system (greenfield / feature-add / refactor pipelines own that).
- Not auditing or recommending changes (Spine A — architecture review — owns that).
- Not maintaining docs forever; terminal is an **accepted, verified doc set** at a point in time. (A refresh run re-grounds against current sources.)

---

## 2. Where Spine D sits

```
[ existing system: repos, IaC, inventories, specs, transcripts ]
                    │
                    ▼
        ┌──────────────────────────┐
        │   SPINE D (this spec)     │   ← routed here by CLASSIFIER when
        │   documentation pipeline  │     class ∈ {documentation} (a new
        └──────────────────────────┘     class added to the §4 taxonomy)
                    │
                    ▼
        [ verified documentation set ]  ← TERMINAL (accepted by client)
```

Entry: the shared **CLASSIFIER** (greenfield spec §5.1) gains a `documentation` class. A request whose deliverable is *prose about a system* (not the system) routes here. Compound requests may fan out — "build X and document it" = greenfield subrequest + documentation subrequest, the doc subrequest waiting on the build's output.

Exit: accepted doc set. Optionally feeds nothing downstream (terminal), or hands the discovered current-state model to **Spine A** if the grounding surfaced architectural concerns.

---

## 3. Core principles

Inherited from the greenfield spec (P-numbers reference `00-…-spec.md §2`), specialized for docs:

- **P5 — cheapest source first; the system is the truth.** Read the repos / inventory / specs before asking a human; ask the human only for what the artifacts cannot answer (tribal knowledge, intent, "why is this account separate"). The LLM reconciles evidence, it is never the source (P11).
- **P11 (sharpened) — transcribe, never recall.** Every fact in the doc must have verbatim evidence in a source. A "famous default" that is absent from the actual config is absent. No training-data padding into operational docs — a wrong remembered AWS default in a runbook is a production incident.
- **Done is a test (the unifying insight, §4.1).** A doc is done when every claim is grounded AND the target audience can complete the target task from the doc alone. The *test* is invariant; its *generator* differs by doc type.
- **Thin skeleton, then increments (two loops).** The orientation layer (map, glossary, conventions, account/resource topology) is established **once**; each task-complete section is an **increment** that extends the frozen skeleton. Mirrors RM3/H13.
- **Adversarial verification.** A hostile reviewer (CRITIQUE) and an execution oracle (VERIFY-DOC) gate the deliverable; the author cannot grade its own docs.

---

## 4. Documentation taxonomy & input adapters

**Doc types (the output axis — toggles which sections + which oracle):**

```
onboarding      | a newcomer can reach first-productive-action (deploy, on-call) unaided
ops-guideline   | a runbook of procedures; each procedure is dry-runnable / replayable
reference        | exhaustive description of the system's parts (every resource/module/endpoint)
architecture     | how the parts fit + why; component/flow views over the as-built system
api-docs         | request/response/auth/error contracts a consumer integrates against
migration-guide | how to move from state A to state B (overlaps Spine A inputs)
```

**Input kinds (the input axis — toggles which grounding adapter runs):**

```
iac            | terraform / CloudFormation / pulumi — declarative desired state
live-inventory | exported resource snapshot (AWS Config, `aws … describe`, asset CSV) — actual state
source-code     | application repos — behavior + structure
api-spec        | OpenAPI / proto / GraphQL schema
prose           | prior docs, wiki, meeting transcripts, tickets — partial + possibly stale
```

A run declares its `{doc_types[], input_kinds[]}` at classification; the spine activates only the matching adapters and section templates. **This is the "adjust based on inputs" mechanism** — base spine invariant, overlays toggle.

### 4.1 The unifying insight — "done" is always a test; only its *generator* differs

Same insight as the greenfield pipeline (`00-…-spec.md §4.1`), applied to docs. Every doc type reduces to a binary, audience-anchored acceptance test:

| Doc type | The test ("done" generator) |
|---|---|
| onboarding | A representative newcomer, given only this doc, completes the first-productive-action without escalation. |
| ops-guideline | Each documented procedure executes clean in a dry-run / staging replay. |
| reference | Every real system part has exactly one entry; every entry maps to a real part (bijection vs the inventory). |
| architecture | Every component/edge in the doc traces to a real module/resource; no box without a referent. |
| api-docs | Each documented endpoint round-trips against the live contract (status, shape, auth, errors). |

The grounding discipline supplies the *facts*; the oracle supplies the *test*. Docs that read well but fail the test are blocked — exactly like code that compiles but fails its AC.

---

## 5. Pipeline stages

Two loops, mirroring greenfield: a **skeleton loop** (orientation drawn once) and a **section loop** (×N task-complete sections).

### 5.1 Classify & scope `[reuse: CLASSIFIER]`
Add `documentation` class to the shared taxonomy. Decompose the request into atomic doc-deliverables `{doc_type, audience, scope}`; detect input kinds; escape on ambiguity (interactive, recognition-framed). Output declares which adapters + section templates the rest of the run uses.

### 5.2 Ground — ingest the system `[reuse: research sub-pipeline §7 — the load-bearing stage]`
The heart of this pipeline, and the heaviest reuse. The greenfield research sub-pipeline (EXTRACT-RULES → RECONCILE → VERIFY) generalizes almost verbatim from "read a coding-standards canon" to "read a system":
- **EXTRACT-FACTS** (← EXTRACT-RULES): per input kind, transcribe atomic facts with verbatim evidence + `source_ref` + tier. Terraform → declared resources/modules/vars; live inventory → actual resources/state; code → modules/entrypoints/configs. Atomic (one fact = one statement), normative-vs-incidental filtered, graceful degradation on unreadable sources. **No recall.**
- **RECONCILE-FACTS** (← RECONCILE): group facts about the same subject; relationship per pairing = AGREE / **DRIFT** (terraform vs live = the conflict case, surfaced not hidden) / SEPARATE. Tier precedence: live-inventory is truth for *actual* state, IaC is truth for *intended* state; a divergence is a documented drift item, never silently resolved.
- **VERIFY-FACTS** (← VERIFY): currency/validity annotation; flag deprecated resource types, EOL versions, orphaned references. Annotate-only, never delete; `unverifiable` + low confidence when unsure.

Output = the **grounded fact base**: the verified, drift-annotated source of every later claim.

### 5.3 Build the system model `[reuse: EXTRACT + MODEL-DATA + DERIVE-COMPONENTS, read-mode]`
Structure the fact base into a navigable model: entities = accounts / resources / modules / services; relationships = depends-on, contained-in, talks-to. For an architecture doc this is the HLD modeling roles run in **read mode** (model the as-built system from facts, rather than design toward code). Single-owner / bijection-vs-inventory discipline carries over (every model node cites a real fact).

### 5.4 Gap detection & ranking `[reuse: GAP-DETECT]`
Adversarial: what does the target audience need that the fact base cannot answer? Undocumented intent, missing tribal knowledge, contradictory sources the tier rule can't break, procedures with no captured steps. Rank by **blast** (a wrong onboarding step that locks an engineer out > a cosmetic naming gap). Every unknown accounted for (P9).

### 5.5 Clarify — the SME loop `[reuse: QUESTION-GEN, interactive]`
Ask the SME/client only `disposition: ask` gaps, ≤6, recognition-framed, recommended default in place. Tribal-knowledge questions ("why is the prod account isolated — compliance or blast-radius?") that no artifact answers. Skippable gaps fall to documented assumptions, never silent drops.

### 5.6 Outline & sequence — the doc skeleton `[reuse: SLICE-EXTRACT + VERTICALITY-CHECK + SKELETON-IDENTIFY + SEQUENCE]`
Cut the doc set into **sections**, where a section is a **reader-completable unit** (a task the audience can finish end-to-end), not a layer dump. The Phase-1 verticality test transfers directly: a section is "vertical" iff it has an audience-observable acceptance ("reader can deploy", not "reader has read about deploys"). Identify the **walking-skeleton doc** = the minimal must-read orientation path (map + glossary + conventions + topology); sequence the rest by prerequisite dependency (you read account-setup before you read deploy). This is the skeleton-loop output.

### 5.7 Synthesize sections `[reuse: SYNTHESIZE]`
Render each section in clean prose from the grounded fact base. **Every claim carries a source trace** (`fact_ref`); a sentence with no traceable fact is flagged, not written. Skeleton section first (frozen), then per-section increments that extend it. Clean deliverable register (caveman governs narration only).

### 5.8 Critique (adversarial) `[reuse: CRITIQUE]`
Hostile review on the rendered docs. Blocking categories (mirroring Phase-0 CRITIQUE's): **ungrounded-claim** (no `fact_ref` → suspected hallucination), **uncovered-audience-task** (a target task the doc set never lets the reader complete), **broken-cross-ref**, **stale-or-contradicted-fact** (claim contradicts a VERIFY drift/deprecation flag), **untestable-instruction** (a procedure no oracle can replay). Blocking → loop to SYNTHESIZE or back to GROUND.

### 5.9 Verify — the doc oracle (terminal test) `[reuse: VERIFY-OUTPUT pattern from Phase 4]`
The analog of "execute tests against built software." Where the doc tells the reader to act, **execute the doc** against a safe target:
- ops-guideline → each procedure dry-runs (e.g. `terraform plan`, `--dry-run`, staging replay) clean.
- onboarding → walk the steps in a clean environment; reach first-productive-action.
- reference / architecture → bijection check against the live inventory (no documented resource absent, no live resource undocumented).
- api-docs → replay each documented call against the live contract.
This is the **terminal gate**, the doc-world equivalent of the build pipeline's verification ladder. Pass → client accept; fail → diagnosed back to GROUND (fact wrong) or SYNTHESIZE (instruction wrong).

### 5.10 Client accept `[reuse: SEQUENCE-REVIEW two-phase interactive pattern, D8]`
Present the verified doc set + the drift report + the documented assumptions; PAUSE; on reply apply redlines / accept. Phase A always lands a disk deliverable (clean-room testable); Phase B writes the accepted set.

### 5.11 State machine (sketch)
```
classify → ground → model → gap → [clarify gate] → outline/skeleton
   → (skeleton frozen) → for each section: synthesize → critique → [loop]
   → verify-doc oracle → [fail → diagnose → ground|synthesize] → accept gate → DONE
```

---

## 6. The documentation artifact

### 6.1 Schema (skeleton + per-section increments)
```
# SKELETON (once) — orientation + the fact base it stands on
doc_set:        { goal, doc_types[], audiences[], input_kinds[] }
fact_base:      [ { FACT*, statement, source_ref, tier, verification, drift_ref? } ]
drift_report:   [ { DRIFT*, subject, iac_says, live_says, disposition } ]
topology:       { entities[], relationships[] }      # the system model
section_map:    [ { SEC*, title, audience, depends_on[], acceptance } ]  # vertical sections, sequenced
skeleton_doc:   SEC* of the must-read orientation path
assumptions:    [ { A*, statement, because_gap, source: sme|default } ]

# INCREMENT (per section) — one reader-completable unit
section:        { id: SEC*, body(markdown), claims[ {text, fact_ref} ], oracle_result }
```

IDs thread end-to-end: `SRC → FACT → SEC → claim`, mirroring the greenfield `R → AC → S → …` thread, so CRITIQUE and VERIFY-DOC can audit traceability mechanically.

### 6.2 Why this form
Same rationale as the greenfield aPRD: the artifact is **executable on paper** (claims trace to facts, sections trace to oracle results), so verification is mechanical and hallucination is structurally detectable — a claim without a `fact_ref` is a defect by schema, not by taste.

---

## 7. Prompt library — reuse map

`VERBATIM` = use the greenfield prompt as-is · `OVERLAY` = same role, input/output adapter swapped · `NEW` = genuinely new role.

| Stage | New role | Source role | Reuse | What transfers / what changes |
|---|---|---|---|---|
| 5.1 | CLASSIFY-DOC | CLASSIFIER | OVERLAY | Add `documentation` class + doc-type/input-kind decomposition; the decompose-and-escape machinery is verbatim. |
| 5.2 | EXTRACT-FACTS | EXTRACT-RULES | OVERLAY | transcribe-never-recall + verbatim-evidence + graceful-degradation transfers; "rule" → "system fact", per-input-kind adapters added. |
| 5.2 | RECONCILE-FACTS | RECONCILE | OVERLAY | merge/conflict/separate + tier-precedence transfers; conflict case renamed DRIFT (iac vs live), kept not resolved. |
| 5.2 | VERIFY-FACTS | VERIFY | OVERLAY | annotate-only currency check, flag-never-delete, unverifiable-when-unsure — near-verbatim. |
| 5.3 | MODEL-SYSTEM | MODEL-DATA + DERIVE-COMPONENTS | OVERLAY | read-mode: model the as-built system from facts; single-owner / bijection discipline transfers. |
| 5.4 | GAP-DETECT | GAP-DETECT | OVERLAY | blast-ranking + full-accounting verbatim; blast tiers re-anchored to audience impact. |
| 5.5 | QUESTION-GEN | QUESTION-GEN | VERBATIM | ≤6, recognition-framed, default-in-place — unchanged. |
| 5.6 | OUTLINE / SECTION-CUT | SLICE-EXTRACT + VERTICALITY-CHECK + SKELETON-IDENTIFY + SEQUENCE | OVERLAY | slice = reader-completable section; verticality test = audience-observable acceptance; skeleton = must-read path; sequence = prerequisite order. |
| 5.7 | SYNTHESIZE-DOC | SYNTHESIZE | OVERLAY | assemble-from-grounded-source + carry-IDs-verbatim transfers; output is prose sections with per-claim `fact_ref`. |
| 5.8 | CRITIQUE-DOC | CRITIQUE | OVERLAY | adversarial gate + resolution-test + anti-false-positive transfers; blocking categories re-specced for docs. |
| 5.9 | VERIFY-DOC | VERIFY-OUTPUT (Phase 4) | OVERLAY | "execute against the real thing" transfers; executes the doc (dry-run/replay/bijection) instead of test code. |
| 5.10 | ACCEPT-REVIEW | SEQUENCE-REVIEW | OVERLAY | the two-phase interactive pattern (D8) verbatim; presents the doc set + drift report. |

**Net new code = almost none.** The only genuinely new work is the per-input-kind grounding *adapters* (terraform parser, live-inventory reader, OpenAPI reader) and the per-doc-type oracle generators. Every reasoning role is an overlay on an existing, tested prompt.

---

## 8. Interaction & gate model
Two human gates, both `interactive: true`, both the D8 two-phase pattern: **clarify** (5.5, SME closes artifact-unanswerable gaps) and **accept** (5.10, client signs off the verified set). Everything else runs silent (PR1).

## 9. Extensibility — adding a doc type or input kind
Mirrors greenfield §11 (playbook-toggled). A new **doc type** adds a section template + an oracle generator (the §4.1 test row). A new **input kind** adds one grounding adapter (an EXTRACT-FACTS reader + its tier rule). The spine, the reasoning roles, and the gates are untouched. This is what makes the pipeline generalist rather than a family of one-offs.

## 10. Failure modes & guardrails
- **Hallucinated config** → blocked by the `fact_ref` schema requirement + CRITIQUE ungrounded-claim + VERIFY-DOC bijection. A claim with no fact cannot pass three gates.
- **Silent drift resolution** → RECONCILE-FACTS forbids picking a side; drift is an artifact item (`drift_report`) the client sees.
- **Stale doc accepted** → VERIFY-FACTS currency flags + VERIFY-DOC execution against *live* targets catch facts that compiled-on-paper but are no longer true.
- **Layer-dump instead of usable doc** → verticality test rejects sections with no audience-observable acceptance (same gate that rejects horizontal slices).

## 11. Open questions
- **OQ-D1 — oracle safety.** ops-guideline verification wants to *execute* procedures; against what target? (dry-run only / dedicated sandbox account / read-only replay). Per-input-kind safety policy needed before VERIFY-DOC is authored.
- **OQ-D2 — skeleton/increment split for docs.** Confirm the orientation-once / section-per-increment split is worth the two-mode complexity for small doc sets, or collapse to single-pass below a size threshold (mirrors greenfield D9 deliberation).
- **OQ-D3 — refresh vs first-run.** Is a doc *refresh* (re-ground against changed sources, diff, patch) a mode of this spine or its own thing? (analogous to skeleton vs increment).
- **OQ-D4 — where the live-inventory adapter gets credentials** in a clean-room sim vs a real run.
