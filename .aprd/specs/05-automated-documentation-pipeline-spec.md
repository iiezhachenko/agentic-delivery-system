# Spine D — Automated Documentation Pipeline (existing system + doc goal → verified documentation set)

> **Status:** design sketch. Built AFTER greenfield delivery pipeline (Phases 0–4) done, per roadmap build order (`.roadmap/`; status derived from disk, not tracker). Authored prompt-by-prompt same way (one role = one prompt, fresh-session sim, artifacts chain on disk, golden fixtures).
>
> **Register note (judgment call:):** spec body + pipeline artifacts = caveman, absolute (T01). The produced doc-SET is the external-human-consumer deliverable T01 carves out — its reader prose owned by a restyle pass; ECONOMY still forbids repeating any fact.
>
> **Change log:** 2026-06-09 — T10 economy cut: register note aligned to T01 (caveman absolute; clean-prose exemption removed, doc-set deliverable marked judgment call), caveman reminder stated once, banned filler killed. New version = the change request (P8).

---

## 1. Purpose

Take **existing system** (code repos, IaC, resource inventories, API specs, meeting transcripts, prior docs) plus **documentation goal** (onboarding, operational guidelines, runbooks, architecture reference, API docs). Produce **complete, verified documentation set** target audience can act on.

Worked example (request that motivated this spine): *given set of terraform repos + AWS resource inventory, produce complete set of operational guidelines and onboarding documentation for AWS Organization infrastructure.*

**Not** greenfield pipeline. No software shipped. Input = existing system (brownfield), output = documentation. Greenfield CLASSIFIER escapes both axes (non-greenfield input, non-software output) — this pipeline owns work it routes away.

### 1.1 Goals
- **Generalist + input-adaptive.** One spine, not one pipeline per doc type. Pipeline reads what input kinds given + what doc wanted, then toggles relevant adapters + section set. New input kinds / doc types = playbook overlays, not new spines.
- **Grounded, never hallucinated.** Every documented claim (command, config value, account boundary, resource relationship) traces to verified source fact. Doc that invents flag system lacks = defect, not style choice.
- **Drift-aware.** When two sources disagree (terraform declares X, live inventory shows Y), pipeline surfaces drift rather than silently picking one — same RECONCILE discipline as canon grounding.
- **Executable-on-paper, then executed.** Where doc tells reader to *do* something, instruction validated (dry-run, lint, replay) before doc accepted.

### 1.2 Non-goals
- Not building or changing system (greenfield / feature-add / refactor pipelines own that).
- Not auditing or recommending changes (Spine A — architecture review — owns that).
- Not maintaining docs forever; terminal = **accepted, verified doc set** at point in time. (Refresh run re-grounds against current sources.)

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

Entry: shared **CLASSIFIER** (greenfield spec §5.1) gains `documentation` class. Request whose deliverable = *prose about a system* (not the system) routes here. Compound requests may fan out — "build X and document it" = greenfield subrequest + documentation subrequest, doc subrequest waiting on build's output.

Exit: accepted doc set. Optionally feeds nothing downstream (terminal), or hands discovered current-state model to **Spine A** if grounding surfaced architectural concerns.

---

## 3. Core principles

Inherited from greenfield spec (P-numbers reference `00-…-spec.md §2`), specialized for docs:

- **P5 — cheapest source first; system is truth.** Read repos / inventory / specs before asking human; ask human only for what artifacts cannot answer (tribal knowledge, intent, "why is this account separate"). LLM reconciles evidence, never the source (P11).
- **P11 (sharpened) — transcribe, never recall.** Every fact in doc must have verbatim evidence in source. "Famous default" absent from actual config = absent. No training-data padding into operational docs — wrong remembered AWS default in runbook = production incident.
- **Done is a test (unifying insight, §4.1).** Doc done when every claim grounded AND target audience can complete target task from doc alone. *Test* invariant; *generator* differs by doc type.
- **Thin skeleton, then increments (two loops).** Orientation layer (map, glossary, conventions, account/resource topology) established **once**; each task-complete section = **increment** extending frozen skeleton. Mirrors RM3/H13.
- **Adversarial verification.** Hostile reviewer (CRITIQUE) + execution oracle (VERIFY-DOC) gate deliverable; author cannot grade own docs.

---

## 4. Documentation taxonomy & input adapters

**Doc types (output axis — toggles which sections + which oracle):**

```
onboarding      | a newcomer can reach first-productive-action (deploy, on-call) unaided
ops-guideline   | a runbook of procedures; each procedure is dry-runnable / replayable
reference        | exhaustive description of the system's parts (every resource/module/endpoint)
architecture     | how the parts fit + why; component/flow views over the as-built system
api-docs         | request/response/auth/error contracts a consumer integrates against
migration-guide | how to move from state A to state B (overlaps Spine A inputs)
```

**Input kinds (input axis — toggles which grounding adapter runs):**

```
iac            | terraform / CloudFormation / pulumi — declarative desired state
live-inventory | exported resource snapshot (AWS Config, `aws … describe`, asset CSV) — actual state
source-code     | application repos — behavior + structure
api-spec        | OpenAPI / proto / GraphQL schema
prose           | prior docs, wiki, meeting transcripts, tickets — partial + possibly stale
```

Run declares `{doc_types[], input_kinds[]}` at classification; spine activates only matching adapters + section templates. **This = "adjust based on inputs" mechanism** — base spine invariant, overlays toggle.

### 4.1 The unifying insight — "done" is always a test; only its *generator* differs

Same insight as greenfield pipeline (`00-…-spec.md §4.1`), applied to docs. Every doc type reduces to binary, audience-anchored acceptance test:

| Doc type | The test ("done" generator) |
|---|---|
| onboarding | Representative newcomer, given only this doc, completes first-productive-action without escalation. |
| ops-guideline | Each documented procedure executes clean in dry-run / staging replay. |
| reference | Every real system part has exactly one entry; every entry maps to real part (bijection vs inventory). |
| architecture | Every component/edge in doc traces to real module/resource; no box without referent. |
| api-docs | Each documented endpoint round-trips against live contract (status, shape, auth, errors). |

Grounding discipline supplies *facts*; oracle supplies *test*. Docs that read well but fail test = blocked — exactly like code that compiles but fails its AC.

---

## 5. Pipeline stages

Two loops, mirroring greenfield: **skeleton loop** (orientation drawn once) + **section loop** (×N task-complete sections).

### 5.1 Classify & scope `[reuse: CLASSIFIER]`
Add `documentation` class to shared taxonomy. Decompose request into atomic doc-deliverables `{doc_type, audience, scope}`; detect input kinds; escape on ambiguity (interactive, recognition-framed). Output declares which adapters + section templates rest of run uses.

### 5.2 Ground — ingest the system `[reuse: research sub-pipeline §7 — the load-bearing stage]`
Heart of pipeline, heaviest reuse. Greenfield research sub-pipeline (EXTRACT-RULES → RECONCILE → VERIFY) generalizes near-verbatim from "read coding-standards canon" to "read system":
- **EXTRACT-FACTS** (← EXTRACT-RULES): per input kind, transcribe atomic facts with verbatim evidence + `source_ref` + tier. Terraform → declared resources/modules/vars; live inventory → actual resources/state; code → modules/entrypoints/configs. Atomic (one fact = one statement), normative-vs-incidental filtered, graceful degradation on unreadable sources. **No recall.**
- **RECONCILE-FACTS** (← RECONCILE): group facts about same subject; relationship per pairing = AGREE / **DRIFT** (terraform vs live = conflict case, surfaced not hidden) / SEPARATE. Tier precedence: live-inventory = truth for *actual* state, IaC = truth for *intended* state; divergence = documented drift item, never silently resolved.
- **VERIFY-FACTS** (← VERIFY): currency/validity annotation; flag deprecated resource types, EOL versions, orphaned references. Annotate-only, never delete; `unverifiable` + low confidence when unsure.

Output = **grounded fact base**: verified, drift-annotated source of every later claim.

### 5.3 Build the system model `[reuse: EXTRACT + MODEL-DATA + DERIVE-COMPONENTS, read-mode]`
Structure fact base into navigable model: entities = accounts / resources / modules / services; relationships = depends-on, contained-in, talks-to. For architecture doc this = HLD modeling roles run in **read mode** (model as-built system from facts, rather than design toward code). Single-owner / bijection-vs-inventory discipline carries over (every model node cites real fact).

### 5.4 Gap detection & ranking `[reuse: GAP-DETECT]`
Adversarial: what does target audience need that fact base cannot answer? Undocumented intent, missing tribal knowledge, contradictory sources tier rule can't break, procedures with no captured steps. Rank by **blast** (wrong onboarding step that locks engineer out > cosmetic naming gap). Every unknown accounted for (P9).

### 5.5 Clarify — the SME loop `[reuse: QUESTION-GEN, interactive]`
Ask SME/client only `disposition: ask` gaps, ≤6, recognition-framed, recommended default in place. Tribal-knowledge questions ("why is prod account isolated — compliance or blast-radius?") no artifact answers. Skippable gaps fall to documented assumptions, never silent drops.

### 5.6 Outline & sequence — the doc skeleton `[reuse: SLICE-EXTRACT + VERTICALITY-CHECK + SKELETON-IDENTIFY + SEQUENCE]`
Cut doc set into **sections**, where section = **reader-completable unit** (task audience can finish end-to-end), not layer dump. Phase-1 verticality test transfers directly: section "vertical" iff has audience-observable acceptance ("reader can deploy", not "reader has read about deploys"). Identify **walking-skeleton doc** = minimal must-read orientation path (map + glossary + conventions + topology); sequence rest by prerequisite dependency (read account-setup before deploy). This = skeleton-loop output.

### 5.7 Synthesize sections `[reuse: SYNTHESIZE]`
Render each section in clean prose from grounded fact base. **Every claim carries source trace** (`fact_ref`); sentence with no traceable fact flagged, not written. Skeleton section first (frozen), then per-section increments extending it. Deliverable prose per §-register note above.

### 5.8 Critique (adversarial) `[reuse: CRITIQUE]`
Hostile review on rendered docs. Blocking categories (mirroring Phase-0 CRITIQUE's): **ungrounded-claim** (no `fact_ref` → suspected hallucination), **uncovered-audience-task** (target task doc set leaves reader unable to complete), **broken-cross-ref**, **stale-or-contradicted-fact** (claim contradicts VERIFY drift/deprecation flag), **untestable-instruction** (procedure no oracle can replay). Blocking → loop to SYNTHESIZE or back to GROUND.

### 5.9 Verify — the doc oracle (terminal test) `[reuse: VERIFY-OUTPUT pattern from Phase 4]`
Analog of "execute tests against built software." Where doc tells reader to act, **execute the doc** against safe target:
- ops-guideline → each procedure dry-runs (e.g. `terraform plan`, `--dry-run`, staging replay) clean.
- onboarding → walk steps in clean environment; reach first-productive-action.
- reference / architecture → bijection check against live inventory (no documented resource absent, no live resource undocumented).
- api-docs → replay each documented call against live contract.
This = **terminal gate**, doc-world equivalent of build pipeline's verification ladder. Pass → client accept; fail → diagnosed back to GROUND (fact wrong) or SYNTHESIZE (instruction wrong).

### 5.10 Client accept `[reuse: SEQUENCE-REVIEW two-phase interactive pattern, D8]`
Present verified doc set + drift report + documented assumptions; PAUSE; on reply apply redlines / accept. Phase A always lands disk deliverable (clean-room testable); Phase B writes accepted set.

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

IDs thread end-to-end: `SRC → FACT → SEC → claim`, mirroring greenfield `R → AC → S → …` thread, so CRITIQUE + VERIFY-DOC can audit traceability mechanically.

### 6.2 Why this form
Same rationale as greenfield aPRD: artifact **executable on paper** (claims trace to facts, sections trace to oracle results), so verification mechanical + hallucination structurally detectable — claim without `fact_ref` = defect by schema, not by taste.

---

## 7. Prompt library — reuse map

`VERBATIM` = use greenfield prompt as-is · `OVERLAY` = same role, input/output adapter swapped · `NEW` = genuinely new role.

| Stage | New role | Source role | Reuse | What transfers / what changes |
|---|---|---|---|---|
| 5.1 | CLASSIFY-DOC | CLASSIFIER | OVERLAY | Add `documentation` class + doc-type/input-kind decomposition; decompose-and-escape machinery verbatim. |
| 5.2 | EXTRACT-FACTS | EXTRACT-RULES | OVERLAY | transcribe-never-recall + verbatim-evidence + graceful-degradation transfers; "rule" → "system fact", per-input-kind adapters added. |
| 5.2 | RECONCILE-FACTS | RECONCILE | OVERLAY | merge/conflict/separate + tier-precedence transfers; conflict case renamed DRIFT (iac vs live), kept not resolved. |
| 5.2 | VERIFY-FACTS | VERIFY | OVERLAY | annotate-only currency check, flag-never-delete, unverifiable-when-unsure — near-verbatim. |
| 5.3 | MODEL-SYSTEM | MODEL-DATA + DERIVE-COMPONENTS | OVERLAY | read-mode: model as-built system from facts; single-owner / bijection discipline transfers. |
| 5.4 | GAP-DETECT | GAP-DETECT | OVERLAY | blast-ranking + full-accounting verbatim; blast tiers re-anchored to audience impact. |
| 5.5 | QUESTION-GEN | QUESTION-GEN | VERBATIM | ≤6, recognition-framed, default-in-place — unchanged. |
| 5.6 | OUTLINE / SECTION-CUT | SLICE-EXTRACT + VERTICALITY-CHECK + SKELETON-IDENTIFY + SEQUENCE | OVERLAY | slice = reader-completable section; verticality test = audience-observable acceptance; skeleton = must-read path; sequence = prerequisite order. |
| 5.7 | SYNTHESIZE-DOC | SYNTHESIZE | OVERLAY | assemble-from-grounded-source + carry-IDs-verbatim transfers; output = prose sections with per-claim `fact_ref`. |
| 5.8 | CRITIQUE-DOC | CRITIQUE | OVERLAY | adversarial gate + resolution-test + anti-false-positive transfers; blocking categories re-specced for docs. |
| 5.9 | VERIFY-DOC | VERIFY-OUTPUT (Phase 4) | OVERLAY | "execute against the real thing" transfers; executes doc (dry-run/replay/bijection) instead of test code. |
| 5.10 | ACCEPT-REVIEW | SEQUENCE-REVIEW | OVERLAY | two-phase interactive pattern (D8) verbatim; presents doc set + drift report. |

**Net new code = almost none.** Only genuinely new work = per-input-kind grounding *adapters* (terraform parser, live-inventory reader, OpenAPI reader) + per-doc-type oracle generators. Every reasoning role = overlay on existing, tested prompt.

---

## 8. Interaction & gate model
Two human gates, both `interactive: true`, both D8 two-phase pattern: **clarify** (5.5, SME closes artifact-unanswerable gaps) + **accept** (5.10, client signs off verified set). Everything else runs silent (PR1).

## 9. Extensibility — adding a doc type or input kind
Mirrors greenfield §11 (playbook-toggled). New **doc type** adds section template + oracle generator (§4.1 test row). New **input kind** adds one grounding adapter (EXTRACT-FACTS reader + its tier rule). Spine, reasoning roles, gates untouched. This makes pipeline generalist rather than family of one-offs.

## 10. Failure modes & guardrails
- **Hallucinated config** → blocked by `fact_ref` schema requirement + CRITIQUE ungrounded-claim + VERIFY-DOC bijection. Claim with no fact cannot pass three gates.
- **Silent drift resolution** → RECONCILE-FACTS forbids picking side; drift = artifact item (`drift_report`) client sees.
- **Stale doc accepted** → VERIFY-FACTS currency flags + VERIFY-DOC execution against *live* targets catch facts that compiled-on-paper but no longer true.
- **Layer-dump instead of usable doc** → verticality test rejects sections with no audience-observable acceptance (same gate that rejects horizontal slices).

## 11. Open questions
- **OQ-D1 — oracle safety.** ops-guideline verification wants to *execute* procedures; against what target? (dry-run only / dedicated sandbox account / read-only replay). Per-input-kind safety policy needed before VERIFY-DOC authored.
- **OQ-D2 — skeleton/increment split for docs.** Confirm orientation-once / section-per-increment split worth two-mode complexity for small doc sets, or collapse to single-pass below size threshold (mirrors greenfield D9 deliberation).
- **OQ-D3 — refresh vs first-run.** Is doc *refresh* (re-ground against changed sources, diff, patch) a mode of this spine or its own thing? (analogous to skeleton vs increment).
- **OQ-D4 — where the live-inventory adapter gets credentials** in clean-room sim vs real run.
