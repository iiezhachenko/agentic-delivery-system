# Automated Delivery Pipeline — System Specification

| | |
|---|---|
| **Status** | Draft |
| **Version** | 0.4 |
| **Date** | 2026-06-08 |
| **Audience** | Engineers building system; agents executing it |
| **Scope** | Intake-to-delivery pipeline. Turns any client request into verified software |

**Change log**
- **v0.4** (2026-06-08) — P13 (artifact = downstream context, author to economy) + §2.1 economy invariant `A-ECON`/`INV-ECON` added. New version = the change request (P8); re-lock `aprd.lock` v3→v4 at next freeze; downstream re-trigger: coding-canon CITES P13, foundation-cut injects `INV-ECON`, MAP-NFR buckets economy NFR, VERIFY-OUTPUT NFR check measures it.

---

## 1. Purpose

Build pipeline. Converts **any** client request — vague, any class (new build, feature-add, bug fix, refactor, migration, perf, integration, investigation) — into **delivered, verified software**.

Three facts drive whole design:

1. **Vague input = normal case.** Clients don't know what they want until they see it. Request = hypothesis, not contract.
2. **"Done" usually undefined.** Most delivery failures = failures to define "done" in testable terms before building.
3. **WHAT mapped broad; HOW built thin.** Knowing whole WHAT up front = cheap, prevents architectural dead-ends. *Building* it whole = waterfall — client sees nothing until end. So Phase 0 captures entire WHAT, then **Phase 1 (Roadmap)** slices into vertical demoable increments. Downstream design/build loop delivers one at a time.

Pipeline job: compile vagueness → **frozen testable contract** (aPRD), hand to roadmap for slicing, then execute **one vertical slice at a time**. Build phase never sees vagueness — compiled away.

### 1.1 Goals

- Accept any request class through one entry point.
- Produce machine-executable, human-verifiable contract before any code changes.
- Minimize expensive human (client) interaction without building wrong thing.
- Make every downstream artifact traceable to requirement.
- Feed roadmap that slices WHAT into vertical demoable increments — never big-bang build.
- Add new request classes without touching engine.

### 1.2 Non-goals

- **Zero-question autonomy.** Impossible with vague input. Goal = *cheap* clarification, not none.
- **Reusing human PRDs as-is.** Prose PRDs = *input* to extract from, not executable contract.
- **Single mega-prompt.** Roles separated for failure isolation + quality.
- **Building whole WHAT at once.** aPRD broad by design but *sliced before built*. Big-bang delivery = waterfall this pipeline exists to avoid (see Phase 1 — Roadmap).

---

## 2. Core principles

Load-bearing. Violate one → breaks system.

| # | Principle | Consequence if violated |
|---|---|---|
| P1 | Treat request as hypothesis, not contract | Build wrong thing confidently |
| P2 | "Done" always testable contract, never prose | Undefined done → infinite rework |
| P3 | One spine, swappable playbooks (strategy pattern) | Pipeline becomes branching spaghetti |
| P4 | First gap to detect = request **class** | Misroute → entire wrong pipeline runs |
| P5 | Exhaust cheap truth before expensive — **read before ask** | Burn client patience on answerable questions |
| P6 | Rank gaps by **blast radius**; ask only architecture/scope gaps | Annoy client or build wrong |
| P7 | Client UX = recognition over recall (multiple-choice + defaults) | High friction, low completion |
| P8 | Frozen contract immutable; change = new version + re-trigger | Silent scope creep corrupts build |
| P9 | Stable IDs (R1, AC1, A1) thread spec → code → test | Lose traceability; can't trace drift |
| P10 | Adversarial critique before freeze | Residual ambiguity reaches build |
| P11 | LLM reconciles + verifies; **not** source of truth | Stale/hallucinated facts ship |
| P12 | WHAT mapped broad, HOW built thin — aPRD sliced into vertical increments, never built whole | Big-bang waterfall; client sees nothing until end |
| P13 | Every produced artifact is downstream context — author to context-economy | Bloat compounds along chain; each stage's output dilutes every downstream agent's attention |

### 2.1 Economy invariant (P13 enforced) — cross-cutting NFR

P13 = principle. Engine enforces it as cross-cutting NFR injected into every project, threaded `R → AC → gate` like security/auth:

- **id `A-ECON`** — NFR-force assumption (like security `A2`, scale `A13`). Cross-slice invariant `INV-ECON` foundation-cut carries → decided once, every slice inherits, never per-slice re-derived.
- **Gate** — VERIFY-OUTPUT NFR check measures each stage's emitted artifact against `A-ECON` (same hook `M*` mechanisms use). Bloat in any stage's output = next agent's prompt bloat one step removed, same cost — compounds along chain (more reads, more agents than a single prompt).
- **Acceptance (testable — P2):** for artifact X — every load-bearing fact appears exactly once; every statement maps to a downstream-reader action; no statement readable two ways (else marked `judgment call:`). Both-directions: planted-duplicate FAILs, planted-omission FAILs. Substance floor: economy ≠ truncation.
- **Universal vs stack-local split** (one home each):
  - **Universal (spec, here):** the economy RULE — invariant across stacks (prompt, terraform, typescript).
  - **Stack-local (code-canon profile):** only what "one home" MEANS per stack — a prompt section vs a `.tf` resource vs a TS module. Profile CITES `A-ECON`; never re-owns it.
- **Distinct from caveman register** (CLAUDE.md / coding-canon PR4): register = terse style, economy = substance discipline. Both absolute, both consumer-independent, bind independently — terse-but-repetitive fails economy; DRY-but-full-prose fails register.

---

## 3. Architecture overview

### 3.1 Whole pipeline — two loops, not one waterfall

Pipeline **not** single linear pass (= waterfall). One broad WHAT, then thin **foundation loop** run once, then **slice loop** run per vertical increment. Each slice ends in something client can see run.

```mermaid
flowchart TD
    REQ["Raw client request"] --> P0["Phase 0 — Intake → aPRD set<br/>(whole WHAT, frozen)"]
    P0 --> P1["Phase 1 — Roadmap<br/>slice WHAT into vertical, value-ordered sequence"]
    P1 --> FND["FOUNDATION LOOP — once, thin:<br/>Phase 2 foundational ADRs + Phase 3 skeleton HLD"]
    FND --> RR{"Roadmap re-rank<br/>(real dependency DAG now known)"}
    RR --> SL
    subgraph SL["SLICE LOOP — ×N, one vertical slice per pass"]
        direction LR
        S["Next slice<br/>= one flow"] --> A["Phase 2<br/>local ADRs"] --> H["Phase 3<br/>HLD increment"] --> B["Phase 4<br/>build"] --> DM["DEMO<br/>client sees it run"]
    end
    DM -->|more slices| RR
    DM -.aPRD/decision defect.-> P0
```

**Foundation decided once + thin** (only what first slice needs + obvious cross-slice invariants). **Everything else built one vertical slice at a time** — each slice cuts through every layer it needs to become demoable. Structure keeps phase chain from collapsing into waterfall; Phase 1 (Roadmap) = controller.

### 3.2 Intake spine

One **spine** (written once) + per-class **playbooks** (pluggable config). Spine runs every request. Playbook injects what differs.

```mermaid
flowchart TD
    REQ["Raw client request"] --> CLS["Classify + Decompose"]
    CLS --> PB{"Select Playbook"}
    PB -.-> PBDEF["Playbook config:<br/>grounding corpus<br/>prompt overlays<br/>AC template<br/>verify method"]
    CLS --> GND["Ground (cheapest to most expensive source)"]
    GND --> GAP["Gap-detect + rank by blast radius"]
    GAP --> CLR["Clarify (residue only, batched)"]
    CLR --> SYN["Synthesize aPRD"]
    SYN --> CRT["Critique (adversarial)"]
    CRT --> FRZ["Freeze + store + lock"]
    FRZ --> RM["→ Phase 1: Roadmap<br/>(slice + sequence + drive downstream loop)"]
    PBDEF -.-> GND
    PBDEF -.-> GAP
    PBDEF -.-> SYN
```

**Spine** (invariant, Phase 0): classify, ground, gap-detect, clarify, synthesize, critique, freeze. Execution downstream + **per slice** (Phases 2–4), driven by roadmap.
**Playbook** (variant): grounding corpus, prompt overlays, AC template, verify method.

Test of correct abstraction: *adding new request class = adding playbook file, never editing engine.*

---

## 4. Request taxonomy & playbooks

Four axes shift per class. Everything else shared.

| Class | Source of truth | Grounding action | Acceptance shape ("done") | Dominant risk |
|---|---|---|---|---|
| **Greenfield** | Client intent | Research **external** canon | New behavior testable | Scope creep |
| **Feature-add** | Existing code + conventions + client intent | Read existing code/patterns first → ask residue → canon for new tech | New behavior testable; **no regression; matches conventions** | Regression; convention drift; integration break |
| **Bugfix** | Existing code + reproduction | Reproduce → localize → root-cause | Failing test now passes; **no regression** | Wrong root cause; regression |
| **Refactor** | **Current behavior** | Characterize; build safety net | Behavior **identical**; quality metric improved | Silent behavior change |
| **Migration** | Source + target contracts | Inventory + compatibility matrix | Parity across all; nothing breaks | Partial/hidden incompatibility |
| **Perf** | Current metrics | Profile; baseline | Metric ≥ target; behavior unchanged | Optimizing wrong thing; correctness loss |
| **Integration** | External API contract + our seams | Read API + read our code | Data flows end-to-end; failures handled | API misunderstood |
| **Investigation** | Reality (code/data/runtime) | Explore | Question answered **with evidence** | Answer without evidence |

### 4.1 Unifying insight — "done" always a test; only its *generator* differs

```
Greenfield   →  generate tests from INTENT
Feature-add  →  generate tests for NEW behavior + REGRESSION tests for touched surface
Bugfix       →  generate a REPRODUCTION test (red → green)
Refactor     →  generate CHARACTERIZATION / golden tests from CURRENT behavior
Migration    →  generate PARITY tests (old output == new output)
Perf         →  generate a BENCHMARK with a threshold
Integration  →  generate end-to-end CONTRACT tests
Investigation→  evidence is the deliverable (no code AC)
```

Verify stage universal *because* acceptance criteria universal. That's why one spine accommodates every class.

---

## 5. Pipeline stages

### 5.1 Intake & Classify (+ decompose)

First gap = class itself. Real requests often **compound** ("app crashes on upload, and while you're there make it faster and support PDFs" = bugfix + perf + feature). Decompose into atomic subrequests, classify each, route each.

```mermaid
flowchart TD
    R["Raw request"] --> C["Classifier"]
    C --> Q{"Compound?"}
    Q -->|yes| D["Split into atomic subrequests"]
    D --> L["Classify each subrequest"]
    Q -->|no| L
    L --> CF{"Confidence >= threshold?"}
    CF -->|no| ASK["Ask client to confirm class"]
    ASK --> L
    CF -->|yes| OUT["Route each subrequest to its playbook"]
```

- **Input:** raw request text + any attachments.
- **Output:** `{class, confidence, is_compound, subrequests[]}`.
- **Rule:** never guess class silently. Low confidence or compound → confirm with client first.

### 5.2 Ground — exhaust cheap truth before expensive

Close gaps using cheapest capable source. Client = **most expensive** source (human latency). Read before ask; ask only residue codebase/runtime cannot answer.

```mermaid
flowchart LR
    A["Code"] --> B["Tests"] --> C["Git history"] --> D["Runtime / repro"] --> E["Docs"] --> F["External canon"] --> G["CLIENT (most expensive)"]
```

This **flips stage order by class**:

- **Greenfield:** no code exists → ask client first, then research external canon.
- **Brownfield** (feature-add/bug/refactor/perf/integration): read code first (reproduce / root-cause / characterize per class) → then ask only residue.

"Research" generalizes to: *close gaps from cheapest available corpus.* Greenfield closes via external canon (§7); bugfix closes via code + reproduction. Same function, different corpus.

### 5.3 Gap detection & ranking

Find every place competent engineer could build two different things. Rank by **blast radius**:

- **architecture** — changes structure / stack / deliverable → **must ask**
- **scope** — changes what's in/out → **must ask**
- **cosmetic** — safe to assume → **assume + announce, never ask**

- **Output:** ranked `gaps[]` with `{gap, interpretations[], blast_radius, reason}`.

### 5.4 Clarify — client loop

Batched, minimal-touch, recognition over recall.

```mermaid
sequenceDiagram
    participant Sys as Pipeline
    participant C as Client
    Sys->>Sys: ground + gap-detect + rank
    Sys->>C: batched multiple-choice questions (high-blast only)
    Note over Sys,C: low-blast gaps stated as assumptions, not asked
    C-->>Sys: answers
    Sys->>Sys: synthesize aPRD draft
    Sys->>C: draft aPRD for sign-off
    C-->>Sys: approve / redline
    alt redline
        Sys->>Sys: revise draft
        Sys->>C: updated draft
        C-->>Sys: approve
    end
    Sys->>Sys: freeze + lock
```

Rules: ≤ ~6 questions per batch, each multiple-choice with recommended default; propose concrete options instead of open questions; one review gate on draft; assume + announce everything low-blast.

### 5.5 Synthesize aPRD

Produce contract (§6). Every requirement gets binary testable acceptance criterion. Every assumption traces to gap. Requirement that cannot get testable AC = flagged, not shipped.

### 5.6 Critique (adversarial)

Hostile-reviewer pass before freeze. Finds: requirements that could build two ways, ACs not binary-testable, scope not bounded by OUT_OF_SCOPE. Emits blocking issues only; loops back to synthesize until clean.

### 5.7 Freeze

On client sign-off: render immutable `aprd.frozen.md` + `aprd.lock` (content hash + signer + timestamp + version). After freeze, no edits — scope change = **new version** + change request, re-triggers affected downstream stages.

### 5.8 Hand off to roadmap + downstream loop

Phase 0 ends at freeze. Frozen aPRD set handed to **Phase 1 (Roadmap)**, slices into vertical increments + drives downstream phases. Design (Phases 2–3), build (Phase 4), verification happen **per slice**, not over whole product at once. "Done" for slice = its acceptance-criteria artifacts (AC tests / benchmarks / parity checks) pass **and** client saw it demoed. Build phase reads **only** frozen aPRD (by R/AC id) + slice's design — never original vagueness.

### 5.9 Pipeline state machine

```mermaid
stateDiagram-v2
    [*] --> Intake
    Intake --> Classified
    Classified --> Grounded
    Grounded --> GapsRanked
    GapsRanked --> AwaitingClient: high-blast gaps exist
    GapsRanked --> Drafting: no blocking gaps
    AwaitingClient --> Drafting: answers received
    Drafting --> Critiqued
    Critiqued --> Drafting: blocking issues
    Critiqued --> AwaitingSignoff: clean
    AwaitingSignoff --> Drafting: redline
    AwaitingSignoff --> Frozen: signed
    Frozen --> Roadmapped: → Phase 1 (slice + sequence)
    Roadmapped --> [*]: downstream loop (Phases 2–4, per slice)
    Frozen --> ChangeRequest: client changes scope
    ChangeRequest --> Drafting: new version
```

---

## 6. The aPRD artifact

Frozen spec — single source of truth every downstream agent reads. Structured + typed (not prose) so machine can execute it; rendered readable so client can sign it. Dual audience.

### 6.1 Schema — shared skeleton + class extensions

```yaml
# ALWAYS present
PROJECT:        <one line>
CLASS:          greenfield | feature-add | bugfix | refactor | migration | perf | integration | investigation
ENTITIES:       [ ... ]                 # data-model seeds
REQUIREMENTS:                           # numbered, atomic
  - id: R1
    text: <requirement>
CONSTRAINTS:    [ stack, scale, region, compliance ]
ASSUMPTIONS:                            # gap-fills, each traceable to a gap
  - id: A1
    text: <assumption>
    gap_ref: <gap id>
OUT_OF_SCOPE:   [ ... ]                 # explicit negative space
ACCEPTANCE:                             # binary, testable
  - id: AC1
    text: <observable pass/fail condition>
    req_ref: R1

# CLASS EXTENSIONS (only the matching block is added)
# feature-add:  INTEGRATION_SEAMS, REGRESSION_GUARD, CONVENTION_BASELINE
# bugfix:       REPRO_STEPS, ROOT_CAUSE, BLAST_RADIUS, REGRESSION_GUARD
# refactor:     BEHAVIOR_BASELINE, INVARIANTS, QUALITY_TARGET
# migration:    SOURCE_STATE, TARGET_STATE, COMPAT_MATRIX, ROLLBACK
# perf:         BASELINE_METRICS, TARGET_METRICS, WORKLOAD
# integration:  EXTERNAL_CONTRACT, OUR_SEAMS, FAILURE_MODES
# investigation:QUESTION, EVIDENCE_REQUIRED   # no code AC
```

### 6.2 Why this form

- **Acceptance criteria = real payload** — they *are* contract. Build = make AC pass. Test = verify AC. Without them "done" undefined.
- **Assumptions logged, not buried** — audit trail; client challenges cheaply; wrong assumptions traceable to decision, not hidden in code.
- **Out-of-scope load-bearing** — bounds agent, stops gold-plating + creep.
- **Stable atomic IDs** — architecture cites R3, test cites AC2, commit cites both. Drift = any code not traceable to requirement.
- **Atomic requirements = sliceable units** — Phase 1 (Roadmap) groups R*/AC* into vertical increments. Atomicity lets slice cut cleanly through stack; monolithic requirement cannot be sliced vertically.

---

## 7. Research sub-pipeline (greenfield + feature-add canon grounding)

When grounding requires **external canon** (e.g. "follow TypeScript best practices"), not open-ended web search. = **manifest mining + reconciliation**, because best practices already exist as code (lint rule configs, tsconfig bases). Fetch authoritative manifests; LLM reconciles + verifies but never source.

```mermaid
flowchart TD
    S["Fixed source allowlist (tiered, curated)"] --> F["Fetch manifests in parallel"]
    F --> X["Extract atomic rules to schema"]
    X --> R["Reconcile: dedupe / merge / detect conflicts"]
    R --> V["Verify currency vs pinned tool versions"]
    V --> E["Emit ruleset: agreed[] + conflicts[]"]
    E --> CACHE[("Versioned canon cache")]
    CACHE -.reuse next project.-> F
    E --> AGREE["agreed[] -> approval block"]
    E --> CONF["conflicts[] -> client decisions"]
```

### 7.1 Source tiers

- **Tier 1 — canonical, machine-readable** (parse directly): tool rule configs, config bases, official docs.
- **Tier 2 — expert human** (extract opinions): style guides, reference books.
- **Tier 3 — empirical signal** (optional, expensive): configs from high-star OSS repos.

### 7.2 Efficiency levers

| Lever | Win |
|---|---|
| Bounded, curated allowlist | Kills web-search noise + latency |
| Fetch code/manifests, not prose | Ground truth, no summarization loss |
| **Cache canon, version it** | Research once, reuse every project (biggest lever) |
| Parallel fetch | Wall-clock |
| LLM reconciles/verifies, never recalls | No stale or hallucinated rules |
| Verify against pinned tool versions | Output actually runs |

**Cache = real efficiency answer.** First project pays full research cost; later projects load `canon.vN.json` + fetch only deltas. Per-project research collapses to retrieval. **Verify stage mandatory** — catches hallucinated rule names + deprecated/superseded flags training recall introduces.

**First application of canon lever**, reused at every downstream phase — slicing patterns (Phase 1), decision option-sets (Phase 2), reference architectures (Phase 3), coding scaffolds (Phase 4) — system-wide efficiency engine.

---

## 8. Prompt library

Roles separated. Each downstream role = *same role* with playbook-injected domain block + AC template — engine not rewritten per class.

**CLASSIFIER**
```
Classify request into: greenfield|feature-add|bugfix|refactor|migration|perf|integration|investigation.
Output {class, confidence, is_compound, subrequests[]}.
If compound: split into atomic subrequests, classify each.
If confidence < threshold: emit a clarifying question. Do not guess.
```

**EXTRACT**
```
Extract structure from the request.
Output JSON: {entities[], explicit_requirements[], implied_requirements[], stated_constraints[], unknowns[]}.
Do not invent requirements. Mark inferred items inferred:true. No prose.
```

**GAP-DETECT** (load-bearing)
```
Find ambiguity a competent engineer could resolve two different ways.
For each gap: {gap, interpretations[], blast_radius: architecture|scope|cosmetic, reason}.
Rank by blast_radius. architecture = changes structure/stack/deliverable. cosmetic = safe to assume.
Be adversarial. Assume the spec is a trap.
```

**QUESTION-GEN**
```
Input: gaps where blast_radius in [architecture, scope].
Produce <= 6 questions. Each MUST be multiple-choice with a recommended default marked.
Phrase for recognition, not recall. Never ask what can be safely assumed.
```

**SYNTHESIZE**
```
Produce the aPRD. Sections: PROJECT, CLASS, ENTITIES, REQUIREMENTS(R*), CONSTRAINTS,
ASSUMPTIONS(A*), OUT_OF_SCOPE, ACCEPTANCE(AC*) + the class-extension block.
Every AC binary/testable. Every assumption traceable to a gap.
If a requirement cannot get a testable AC, flag it; do not ship it.
```

**CRITIQUE** (adversarial)
```
You are a hostile reviewer. Find every requirement that could build two ways.
Find every AC that is not binary-testable. Find scope not bounded by OUT_OF_SCOPE.
Output blocking issues only.
```

**Research roles** (greenfield grounding): EXTRACT-RULES, RECONCILE, VERIFY — see §7.

**VERIFY-OUTPUT**
```
Execute the artifacts of "done" for this class (AC tests / benchmark / parity check).
Report pass/fail per AC id. On any fail, return to execute with the failing AC.
```

---

## 9. Client interaction model

- **Batch**, don't drip. Client attention = scarce resource.
- **Multiple-choice > open-ended.** Offer options + recommended default.
- **Propose, don't interrogate.** For canon approval, show concrete list; client edits/deletes faster than authors.
- **One review gate** on draft aPRD; sign-off = freeze.
- **Assume + announce** everything low-blast.

Principle: autonomous promise not *zero* questions — *cheap* questions. Two minutes of client time should remove bulk of build risk.

---

## 10. Artifact storage & versioning

Everything in version control. aPRD = repository's root of truth.

```
project/
  .aprd/
    00-raw-request.md        # verbatim client input
    01-classification.json   # class + subrequests
    02-extraction.json
    03-grounding/            # code reads, repro logs, or research output
    04-gaps.json             # ranked
    05-questions.md
    06-answers.md
    07-assumptions.json      # traceable to gaps
    drafts/
      aprd.v1.md
      aprd.v2.md             # post-redline
    aprd.frozen.md           # SIGNED, immutable
    aprd.lock                # content hash + signer + timestamp + version
  ...                        # build output references aprd.frozen by R/AC id
```

**Rules**

- **Intermediates kept, append-only.** = audit trail: dispute resolution ("why build X?" → trace to `06-answers.md`), agent debugging, run resumability.
- **Frozen aPRD immutable.** Change = new version + change request + re-trigger of affected downstream stages. Stops silent scope creep.
- **Stable IDs everywhere.** Plan cites R3, test cites AC2, commit cites both — spec → code → test stays threaded.
- **Machine + human form.** JSON for agent stages; rendered Markdown for client. aPRD itself = structured Markdown serving both readers.
- **Lock file = signature.** Tamper-evident contract.

---

## 11. Extensibility — adding a request class

```mermaid
flowchart LR
    NEW["New class identified"] --> PBF["Author playbook file"]
    PBF --> G["Define grounding corpus + source order"]
    PBF --> P["Author prompt overlays (domain blocks)"]
    PBF --> AC["Define AC template + verify method"]
    PBF --> EXT["Define aPRD class-extension fields"]
    G --> REG["Register playbook with classifier"]
    P --> REG
    AC --> REG
    EXT --> REG
    REG --> DONE["Engine unchanged"]
```

Playbook = `{classifier hints, active stages, grounding corpus, prompt overlays, AC template, verify method, aPRD extension fields}`. If new class forces engine edit, abstraction wrong — fix spine, not playbook.

---

## 12. Failure modes & guardrails

| Failure mode | Guardrail |
|---|---|
| Build on assumptions (vague in, confident wrong out) | P1 + freeze gate; nothing executes pre-freeze |
| Misrouted request (wrong playbook) | Classifier confidence threshold + class confirmation |
| Compound request handled as one | Decompose into atomic subrequests before routing |
| Burned client patience | Read-before-ask; blast-radius filter; batched MCQ |
| Undefined "done" | Mandatory binary AC; requirement without AC is flagged |
| Residual ambiguity reaches build | Adversarial critique pass before freeze |
| Silent scope creep | Immutable frozen aPRD; change = new version |
| Stale / hallucinated research facts | Manifest mining + verify against pinned versions |
| Lost traceability | Stable IDs; build output cites R/AC |
| Refactor/migration changes behavior silently | Characterization/parity tests as the AC |
| Feature-add breaks existing behavior or drifts conventions | Regression guard + convention baseline as AC; brownfield read-first |
| Big-bang waterfall (client sees nothing until the end) | Roadmap slices WHAT vertically (Phase 1); foundation built once + thin, then slice-by-slice with a demo gate (P12) |

---

## 13. Glossary

- **aPRD** — agent-PRD. Frozen, typed, testable contract; compiled output of intake.
- **Playbook** — per-class config plugged into spine (corpus, prompts, AC template, verify method).
- **Spine** — invariant pipeline written once, run for every request.
- **Blast radius** — how much unresolved gap changes build (architecture / scope / cosmetic).
- **Acceptance criterion (AC)** — binary testable statement defining part of "done."
- **Canon** — cached, versioned external best-practice ruleset used for greenfield grounding.
- **Grounding** — closing gaps from cheapest capable source before asking client.
- **Vertical slice** — thin increment cutting through every layer it needs to deliver one demoable, user-visible capability (opposite of horizontal/by-layer cut). Defined + sequenced in Phase 1 (Roadmap).
- **Foundation loop / slice loop** — once-only thin foundation pass (foundational ADRs + skeleton HLD) vs per-slice design/build/demo loop; see Phase 1.

---

## 14. Open questions

- Threshold values: classifier confidence cutoff, max questions per batch.
- Canon cache invalidation policy (time-based vs tool-release-triggered).
- Human gate placement for high-risk brownfield changes (does freeze need second reviewer?).
- Multi-subrequest sequencing: parallel vs dependency-ordered execution of decomposed compound requests.
- **Scope (resolved):** pipeline terminates at accepted STAGING demo (Phase 4 terminal). Production release, client-environment handoff, post-handoff rollback out of scope.
