# Phase 1 — Automated Roadmap Pipeline (aPRD set → vertical slice sequence)

| | |
|---|---|
| **Status** | Draft |
| **Version** | 0.1 |
| **Date** | 2026-06-06 |
| **Audience** | Engineers building system; agents executing it |
| **Scope** | Stage slices frozen aPRD set into vertical demoable increments, sequences them, controls foundation + slice delivery loops |
| **Predecessor** | Phase 0 — `00-automated-aprd-pipeline-spec.md` (produces frozen aPRD set this phase slices) |

---

## 1. Purpose

Phase 0 froze **whole WHAT**. Build whole = waterfall — design every layer, build every layer, integrate at end, client sees nothing until then. Phase 1 prevents that. Slices WHAT into **vertical demoable increments**, orders by value + risk under dependency constraints, names **walking skeleton**, then acts as **controller** running downstream phases in two loops: **foundation loop** (once, thin) and **slice loop** (one vertical increment per pass).

Four facts drive design:

1. **Horizontal slicing = waterfall.** Cut by layer/artifact — all data models, then all services, then all UI; or all ADRs, then full HLD, then build everything — defers all value to end. Cut **vertically** (one user-visible capability through every layer it needs) yields demoable each pass.
2. **Not everything changes at slice speed.** Foundational decisions + architectural skeleton decided **once**; per-slice behavior built **repeatedly**. Blast-radius lever (Phase 0 P6) sorts foundation from slice.
3. **Slice vertical iff it has passing black-box acceptance test.** Horizontal cut ("all DB tables") has no user-observable AC, cannot pass one. Phase 0 done-is-a-test contract (P2) is *enforcer* of verticality — no new machinery needed.
4. **Roadmap living, not frozen-once.** Slices reveal information — above all, walking skeleton firms real dependency graph. Re-rank remaining slices each pass.

### 1.1 Goals

- Slice frozen aPRD set into vertical increments — each demoable, each tracing to ≥1 AC.
- Sequence by value × risk, dependency-constrained; walking skeleton first.
- Define **foundation cut** — minimal foundational decisions + skeleton structure to build once, before slicing.
- Drive foundation loop, dispatch slices through Phases 2–4; re-rank as slices complete + reveal information.
- Give client artifact they care about most: order, and what they see first.

### 1.2 Non-goals

- **Designing or building.** Phase 1 decides *which slice, what order*. Phases 2–4 decide HOW + build. Controller, not designer.
- **Detailing whole HOW up front.** Only foundation cut resolved before slicing; per-slice design/build just-in-time.
- **Freezing sequence forever.** Roadmap versioned + *living* — re-ranks on learning. (Completed-slice records immutable; *sequence* not.)
- **Single mega-prompt.** Roles separated for failure isolation + quality, as Phase 0.

---

## 2. Where Phase 1 sits

```mermaid
flowchart LR
    P0["Phase 0<br/>aPRD set<br/>(whole WHAT)"] --> P1["Phase 1<br/>Roadmap<br/>(slice + sequence + control)"]
    P1 --> FND["Foundation loop — once<br/>Phase 2 foundational ADRs<br/>+ Phase 3 skeleton HLD"]
    FND --> RR{"Re-rank<br/>(real dep DAG)"}
    RR --> SLICE["Slice loop ×N<br/>Phase 2 local ADR → Phase 3 HLD increment<br/>→ Phase 4 build → DEMO"]
    SLICE -->|next slice + learning| RR
    P1 -. aPRD defect → change request .-> P0
    SLICE -. defect surfaced in a slice .-> P0
```

- **Input:** frozen aPRD set (`aprd.frozen.md` + `aprd.lock` per subrequest).
- **Output:** **roadmap** — vertical slice sequence + foundation cut — plus per-slice dispatch into Phases 2–4 and continuous re-ranking.
- **Controller role:** Phase 1 does **not** end when sequence first drawn. Runs for life of delivery: triggers foundation loop once, then dispatches each slice and re-ranks remainder after every demo.

---

## 3. Core principles

Inherits Phase 0 P-series. Roadmap-specific additions; each load-bearing.

| # | Principle | Consequence if violated | Echoes |
|---|---|---|---|
| RM1 | Slice **vertically**, never horizontally — each slice cuts through every layer it needs to be demoable | Waterfall; value only at end | P2 |
| RM2 | Slice valid **iff** maps to ≥1 black-box, user-observable acceptance test (AC) | Horizontal cuts masquerade as progress | P2 |
| RM3 | **Two loops** — foundation (once, thin) vs slice (×N); split by blast radius | Re-decide foundations every slice, or big-bang whole HOW | P6 |
| RM4 | First slice = **walking skeleton** — thinnest end-to-end path touching every foundational seam once | Integration risk discovered last, when most expensive | — |
| RM5 | Sequence by **value × risk, dependency-constrained** — riskiest-valuable first (after skeleton) | Low-value or blocked work built first; risk deferred | P6 |
| RM6 | Roadmap **living** — re-rank remaining slices as each completes + reveals information | Stale plan drives build off cliff | — |
| RM7 | Slice **is a flow** — vertical path traverses component graph along one flow F*, not across a layer | Slices drift back to horizontal (layer) cuts | — |
| RM8 | **WHAT broad, HOW thin** — detail each slice's design/build just-in-time | Premature full design = waterfall | P12 |
| RM9 | **Foundation minimal** — decide only what first slices + cross-slice invariants need; defer rest to slice that needs it | Over-decided up front (waterfall), or under-decided (slice blocked) | P6 |
| RM10 | **Slice size by INVEST** — smallest increment demoable AND delivers value or retires named risk | Too big → mini-waterfall; too small → integration thrash | — |
| RM11 | Roadmap is **controller**, not builder — drives loops + dispatches slices; never designs or implements | Phase boundaries blur; slicer starts deciding HOW | P3 |

---

## 4. What a slice is

Slice is **vertical** increment: one user-visible capability, built through every layer it needs (data → logic → interface), demoable on its own. Not a layer, component, or sprint of "backend work."

### 4.1 The unifying insight — verticality is a test property, not a judgment call

```
Horizontal cut   →  "all of layer X"               →  no user-observable AC      →  INVALID slice
Vertical cut     →  "one capability, end-to-end"    →  ≥1 black-box AC goes green  →  valid slice
Walking skeleton →  thinnest vertical cut that touches every foundational seam once  →  slice #1
```

Acceptance oracle from Phase 0 (P2) is discriminator. Slice you **cannot write passing black-box AC for is not vertical** — "all DB tables" has no user-facing pass/fail condition. No separate verticality machinery needed: same test defining "done" defines "demoable." Why slicing reuses aPRD `AC*` directly as slice gate.

### 4.2 Slice catalog

| Kind | Purpose | Example |
|---|---|---|
| **walking_skeleton** | Prove architecture composes end-to-end; retire integration risk first | One request flows ingress → domain → store → response; everything else hardcoded |
| **capability** | Deliver one user-visible capability | "User can reset their password" |
| **risk_spike** | Retire specific named risk early | "Prove third-party rate limit survivable under expected load" |
| **hardening** | Pay non-functional debt prior slice deferred | "Add cache latency NFR requires" |

### 4.3 Vertical vs horizontal

```mermaid
flowchart TB
    subgraph H["❌ Horizontal (waterfall) — demoable only at the end"]
        direction TB
        H1["all data models"] --> H2["all services"] --> H3["all APIs"] --> H4["all UI"] --> HD["DEMO (finally)"]
    end
    subgraph V["✅ Vertical — demoable every slice"]
        direction TB
        V1["S1: data+logic+iface for ONE capability → DEMO"]
        V2["S2: next capability → DEMO"]
        V3["S3: … → DEMO"]
        V1 --> V2 --> V3
    end
```

---

## 5. Pipeline stages

One **spine** (written once), per-class **playbook** overlays (§11) — identical philosophy as Phase 0.

```mermaid
flowchart TD
    IN["Frozen aPRD set + locks"] --> LOAD["1 Load + verify"]
    LOAD --> DEP["2 Build requirement dependency graph (coarse)"]
    DEP --> CLU["3 Cluster R*/AC* into candidate vertical slices"]
    CLU --> VC{"4 Verticality check<br/>≥1 black-box AC?"}
    VC -->|no| CLU
    VC -->|yes| SK["5 Identify walking skeleton"]
    SK --> SEQ["6 Score + sequence<br/>(value × risk, dependency-constrained)"]
    SEQ --> FC["7 Define foundation cut"]
    FC --> CR["8 Client review of sequence"]
    CR --> BL["9 Baseline roadmap (living)"]
    BL --> FND["10 Drive FOUNDATION LOOP once<br/>→ Phase 2 foundational + Phase 3 skeleton"]
    FND --> RR["11 Re-rank with real dependency DAG"]
    RR --> DISP
    subgraph DISP["12 SLICE LOOP ×N"]
        direction LR
        NS["next slice"] --> D2["Phase 2<br/>local ADRs"] --> D3["Phase 3<br/>HLD increment"] --> D4["Phase 4<br/>build"] --> DEMO["demo"]
    end
    DEMO -->|capture learning| RR
    DISP -. cannot slice / aPRD defect .-> ESC["escape → Phase 0<br/>or widen foundation cut"]
```

### 5.1 Load & verify
Read frozen aPRD set; verify each `aprd.lock` (tamper-evident). Assemble full `R*` / `AC*` / `ENTITIES` / `CONSTRAINTS` inventory to slice.

### 5.2 Build the requirement dependency graph (coarse)
Derive first-pass dependency graph from aPRD alone: shared `ENTITIES`, `INTEGRATION_SEAMS`, explicit "R depends on R" references. **Coarse** — authoritative dependency DAG only exists after HLD skeleton (§5.11). Good enough to sequence provisional plan.

### 5.3 Cluster into candidate vertical slices
Group `R*`/`AC*` into candidate slices, each coherent demoable capability. Slice pulls *some* of every layer it needs — never "all of one layer." Each candidate carries `requirements`, `acceptance` (demo gate), value, and any named risk it retires.

### 5.4 Verticality check
Reject any candidate without ≥1 black-box, user-observable AC (§4.1) — that is horizontal cut. Send back to clustering to re-cut or merge into vertical neighbor. Gate mechanically prevents horizontal slicing.

### 5.5 Identify the walking skeleton
Find thinnest end-to-end slice touching **every foundational seam once** (ingress, domain, persistence, primary external integration). Carries minimal behavior — job is prove architecture composes and retire integration risk before any feature depth built. Becomes slice #1.

### 5.6 Score & sequence
Order remaining slices by **value × risk / cost**, constrained by dependency graph (slice never precedes one it depends on). Riskiest-and-most-valuable first; skeleton always leads. Output sequence + one-line rationale per position.

### 5.7 Define the foundation cut
From slice-1 (skeleton) + obvious cross-slice invariants, name **minimum** to decide and build once:
- `foundational_decisions` → categories Phase 2 must resolve in **foundation pass** (style, stack, persistence, boundary strategy, cross-cutting invariants).
- `skeleton_seams` → contracts Phase 3 must establish in **skeleton pass**.
Everything not in cut deferred to slice that first needs it (RM9). Cut deliberately thin — widening later cheaper than building wrong foundation.

### 5.8 Client review of the sequence
Sequence is client's prerogative — they pay and care intensely what comes first. Present recognition-over-recall (here is order + first demo; reorder?). One gate. (Contrast: *decisions* + *structure* downstream internal — see §9.)

### 5.9 Baseline the roadmap (living)
Version + store roadmap. Unlike aPRD/ADR/HLD, **not frozen-immutable** — living, versioned plan. Re-ranks bump version; history append-only. Completed-slice records, once accepted, immutable.

### 5.10 Drive the foundation loop (once)
Dispatch foundation cut: Phase 2 resolves foundational ADRs; Phase 3 draws skeleton HLD (component graph + foundational contracts + NFR mechanisms). Runs **once**. Output = frame every slice extends.

### 5.11 Re-rank with the real dependency DAG
Skeleton HLD yields true component dependency graph (= build DAG). Replace coarse graph from §5.2; re-rank remaining slices against real dependencies before dispatching them.

### 5.12 Dispatch the slice loop (×N)
For each slice in order: Phase 3 extends skeleton (HLD increment, emitting local ADRs via Phase 2), Phase 4 builds against frozen contracts, verify (slice's AC tests + design-layer tests), **demo**. After each demo: mark slice accepted, capture learning (new dependencies, scope discoveries, risk outcomes), re-rank remainder (§5.11 loop).

### 5.13 Escape hatches
- **Capability cannot be cut into demoable vertical slice** (AC depends on un-built foundation): either fold missing foundation into cut / skeleton extension, or re-slice.
- **Slice's AC reveals aPRD ambiguous or wrong:** change request → Phase 0 → new aPRD version → re-slice. Phase 1 never patches WHAT.
- **Flood of mid-slice foundational surprises** = foundation cut too thin → re-open foundation mini-pass (Phase 2 foundational) + tune cut. This is feedback HLD spec's "local-ADR flood" signal feeds.

### 5.14 Pipeline state machine

```mermaid
stateDiagram-v2
    [*] --> Loaded
    Loaded --> DepGraphed
    DepGraphed --> Sliced
    Sliced --> Sliced: re-cut horizontal candidate
    Sliced --> Verticalized: every slice has a black-box AC
    Verticalized --> SkeletonNamed
    SkeletonNamed --> Sequenced
    Sequenced --> ClientApproved
    ClientApproved --> FoundationBuilt: foundation loop (once)
    FoundationBuilt --> ReRanked
    ReRanked --> SliceInFlight: dispatch next slice
    SliceInFlight --> ReRanked: demoed + accepted
    SliceInFlight --> APRDChange: AC reveals bad WHAT
    APRDChange --> [*]: → Phase 0
    ReRanked --> Done: no slices remain
    Done --> [*]
```

---

## 6. The roadmap artifact

Dual audience: machine-readable slice list downstream phases dispatch from; rendered sequence + demo plan client signs off.

### 6.1 Schema

```yaml
SLICES:
  - id: S1
    name: <demoable capability, one line>
    kind: walking_skeleton | capability | risk_spike | hardening
    requirements: [R1, R3]          # subset of aPRD R*
    acceptance:    [AC1, AC2]        # REQUIRED — the demo gate; proves verticality
    flow_ref:      F1                # the vertical path (bound once the HLD skeleton exists)
    value:         high | med | low  # from the client
    retires_risk:  <named risk | null>
    depends_on:    [ ]               # slice-level prerequisites
    demo:          <what the client will watch run>
    status:        planned | in_progress | demoed | accepted
FOUNDATION_CUT:
  foundational_decisions: [ <categories the first slices need> ]   # → Phase 2 foundation pass
  skeleton_seams:         [ <contracts the skeleton must establish> ] # → Phase 3 skeleton pass
  cross_slice_invariants: [ <auth model, error strategy, observability — decided once> ]
SEQUENCE: [S1, S2, S3, …]            # value/risk-ordered, dependency-legal, LIVING
COVERAGE: <every aPRD R* lands in >=1 slice>   # no requirement orphaned
VERSION:  <roadmap version; re-ranks bump it>
```

### 6.2 Example — slice sequence with dependencies

```mermaid
flowchart LR
    F["Foundation cut<br/>(once, thin)"] --> S1["S1 walking skeleton<br/>→ DEMO"]
    S1 --> S2["S2 capability A<br/>→ DEMO"]
    S1 --> S3["S3 capability B<br/>→ DEMO"]
    S2 --> S4["S4 capability C<br/>(needs S2)<br/>→ DEMO"]
    S3 --> S4
```

### 6.3 Why this form

- **Acceptance is verticality proof.** Slice without black-box AC is not a slice (RM2). Reusing aPRD `AC*` keeps demo gate honest + traceable.
- **Sequence living.** Re-ranking on learning is feature, not drift (RM6). Versioning plan (not freezing) is deliberate contrast with every other phase artifact.
- **Coverage prevents orphans.** Every `R*` must land in ≥1 slice, or never built. Coverage = slice-layer analog of Phase 0 requirement-completeness check.
- **Foundation cut = anti-waterfall lever.** Naming *minimum* to decide once lets rest stay thin + incremental (RM8, RM9).

---

## 7. Grounding — value, dependency, and risk sourcing

Sequencing is grounding problem: value, dependencies, risk each come from cheapest capable source.

```mermaid
flowchart TD
    SL["Candidate slice"] --> VAL{"Value"}
    SL --> DEP{"Dependencies"}
    SL --> RSK{"Risk retired"}
    VAL -->|client's prerogative| CLI["from the client"]
    DEP -->|coarse| APRD["from aPRD (R refs, ENTITIES, SEAMS)"]
    DEP -->|refined| HLD["from HLD skeleton (real component DAG)"]
    RSK --> UNP["unproven foundational decisions / integrations"]
    CLI --> SCORE["score = value × risk / cost"]
    APRD --> SCORE
    HLD --> SCORE
    UNP --> SCORE
    SCORE --> SEQ["dependency-constrained ordering"]
    CAN[("Slicing-pattern canon<br/>(versioned, reused)")] -. templates .-> SL
```

- **Value = the one input client owns.** Decisions (Phase 2) + structure (Phase 3) internal, but *order* belongs to client (§9).
- **Dependencies coarse then refined.** aPRD gives first pass; HLD skeleton gives authoritative DAG — why roadmap re-ranks after foundation loop (§5.11). Same exploratory-sketch → baseline pattern ADR↔HLD boundary uses.
- **Canon lever, second reuse.** Slicing patterns recur (auth-first, walking-skeleton-first, CRUD-per-entity, read-before-write). Cache reference slice plans per project archetype as versioned canon — second application of lever after Phase 0 best-practice canon (Phases 2–4 extend it: decision option-sets, reference architectures, coding scaffolds).

---

## 8. Prompt library

Roles separated, same as Phase 0. Each is same role with playbook-injected class block.

**SLICE-EXTRACT**
```
Input: the frozen aPRD set (R*, AC*, ENTITIES, CONSTRAINTS).
Cluster requirements into candidate VERTICAL slices: each is one user-visible
capability cutting through every layer it needs. Per slice:
{id, name, requirements:[R*], acceptance:[AC*], value, retires_risk, depends_on}.
Never group "all of one layer" — that is horizontal. Pull only what one capability needs.
```

**VERTICALITY-CHECK**
```
For each candidate slice, confirm >=1 acceptance criterion is black-box and
user-observable (a client could watch it pass). Reject any slice without one as a
horizontal cut; return it to be re-cut or merged. Output: valid[] + rejected[] with reason.
```

**SKELETON-IDENTIFY**
```
Find the thinnest end-to-end slice that touches every foundational seam once
(ingress, domain, persistence, primary integration) with minimal behavior.
This is the walking skeleton — slice #1. Output it + the seams it must establish.
```

**SEQUENCE**
```
Order slices by value × risk / cost, constrained by depends_on (no slice before its
prerequisite). Skeleton leads. Output the ordered sequence + one-line rationale per
position. Flag any dependency cycle as a slicing defect.
```

**FOUNDATION-CUT**
```
From the walking skeleton + cross-slice invariants, name the MINIMUM to decide and
build once: foundational_decisions (→ Phase 2) and skeleton_seams (→ Phase 3).
Defer everything else to the slice that first needs it. Bias thin — under-cut, not over-cut.
```

**RE-RANK**
```
Input: completed slices + their learnings + the real dependency DAG (from the HLD skeleton).
Re-order the remaining slices. Preserve dependency legality. Note any slice whose value or
risk changed and why. Do not thrash: re-order only on material new information.
```

**SEQUENCE-REVIEW** (client-facing)
```
Present the slice sequence as recognition-over-recall: the order, what the first demo shows,
and the value rationale. Offer reordering as multiple-choice, not an open prompt.
Capture the client's priority overrides.
```

---

## 9. Interaction & gate model

- **Client-facing — by design, unlike Phases 2–3.** Roadmap is where client re-engages after sign-off, because **order is their prerogative**: what gets built first, what they see demoed, where value lands soonest.
- **One gate** on initial sequence; subsequent re-ranks surfaced as updates (and fresh demo each slice), not re-negotiated from scratch.
- **Phase symmetry:** Phase 0 client-facing (WHAT), **Phase 1 client-facing (order/WHEN)**, Phases 2–3 internal (HOW), Phase 4 client-facing again at demo (RESULT). Client owns what, when, sign-off on result; delivery team owns how.
- **Defects route, not patch.** Bad WHAT goes back to Phase 0 (§5.13); roadmap never silently reinterprets contract.

Principle carried from Phase 0: cheap human touch, not zero. Client spends minutes ordering value, not hours specifying build.

---

## 10. Artifact storage & versioning

Sibling to `.aprd/`. Roadmap = delivery plan's root of truth.

```
project/
  .aprd/                          # Phase 0 (frozen aPRDs)
  .roadmap/
    00-inputs.json                # loaded aPRD set + lock verification
    01-dep-graph.json             # requirement dependency graph (coarse → refined)
    02-slices.json                # candidate + accepted slices
    03-verticality.json           # check results (valid / rejected + reason)
    04-foundation-cut.json        # → Phase 2 foundational + Phase 3 skeleton
    roadmap.md                    # human-facing sequence + demo plan (living)
    roadmap.v1.json               # versioned snapshots; re-ranks bump the version
    roadmap.v2.json
    slice-log/                    # per-slice records: planned → demoed → accepted (immutable once accepted)
      S1-walking-skeleton.md
    roadmap.lock                  # current baseline: content hash + signer + version
```

**Rules**

- **Plan living; records not.** *Sequence* re-ranks (versioned, append-only history). *Completed slice's* record immutable once accepted — audit trail of what was demoed + signed off.
- **Coverage enforced.** Every aPRD `R*` must appear in ≥1 slice; orphan requirement is slicing defect.
- **Foundation cut = contract** with Phases 2 and 3 — explicit minimum to build once.
- **Machine + human form** — JSON slice list for dispatch; rendered Markdown sequence + demo plan for client.
- **Lock = current baseline signature** foundation loop + slice loop dispatch against.

---

## 11. Extensibility — depth per class (playbook-toggled)

Roadmap depth scales with class blast radius, set by same playbook driving Phase 0.

| Class | Phase 1 depth |
|---|---|
| **Greenfield / large feature-add** | Full roadmap — many slices, skeleton-first, full foundation cut |
| **Migration** | Slices = parity-by-module increments; skeleton = thinnest end-to-end migrated path |
| **Integration** | Slices = per-endpoint / per-flow; each demoable against external API |
| **Bugfix / Perf / small refactor** | Single slice — change already thin vertical increment; roadmap trivial |
| **Investigation** | No slices; investigation plan is the artifact (skip) |

```mermaid
flowchart LR
    NEW["New class"] --> PB["Author playbook overlay"]
    PB --> GRAN["Set slice granularity + skeleton rule"]
    PB --> CANON["Bind slicing-pattern canon slice"]
    PB --> DEPTH["Set roadmap depth (full | single-slice | skip)"]
    GRAN --> REG["Register with the spine"]
    CANON --> REG
    DEPTH --> REG
    REG --> DONE["Engine unchanged"]
```

If new class forces engine edit, abstraction wrong — fix spine, not playbook. (Same test as Phase 0.)

---

## 12. Failure modes & guardrails

| Failure mode | Guardrail |
|---|---|
| Horizontal slicing (by layer) | Verticality check (RM2); slice needs black-box AC or rejected |
| Big-bang waterfall | Two-loop split (RM3); foundation thin (RM9), then slice-by-slice with demo gate |
| Foundation too thin (mid-slice surprises) | Re-rank + foundation gap escape (§5.13); local-ADR flood signal from Phase 3 |
| Foundation too thick (over-decided up front) | Cut covers only first slices + invariants (RM9); bias thin |
| Slice too big (mini-waterfall) | INVEST sizing (RM10); split until demoable-and-small |
| Slice too small (integration thrash) | INVEST sizing (RM10); merge into vertical neighbor |
| Sequence ignores dependencies (slice blocked) | Dependency-constrained ordering (RM5); cycle flagged as defect |
| Integration risk discovered late | Walking skeleton first (RM4) retires it up front |
| Requirement never built (orphan) | Coverage check — every R* in ≥1 slice |
| Client surprised by order | Client gate on sequence (§9) |
| Plan frozen too hard, can't adapt | Living, versioned roadmap (RM6); re-rank on learning |
| Roadmap starts deciding HOW | Controller-not-builder boundary (RM11); HOW belongs to Phases 2–4 |

---

## 13. Glossary

- **Vertical slice** — thin increment cutting through every layer it needs to deliver one demoable capability. Unit Phase 1 emits + sequences.
- **Horizontal slice** — by-layer cut (all data, all services, …) with no user-observable AC; waterfall antipattern this phase rejects.
- **Walking skeleton** — thinnest vertical slice touching every foundational seam once; slice #1, retires integration risk.
- **Foundation loop / slice loop** — once-only thin foundation pass (foundational ADRs + skeleton HLD) vs per-slice design/build/demo loop.
- **Foundation cut** — minimum to decide + build once before slicing; contract with Phases 2 and 3.
- **Verticality check** — gate rejecting any slice lacking black-box AC.
- **INVEST** — slice-quality canon: Independent, Negotiable, Valuable, Estimable, Small, Testable.
- **Living roadmap** — versioned, re-rankable sequence (not frozen artifact); completed-slice records immutable.
- **Demo gate** — slice done only when AC passes *and* client has seen it run.

---

## 14. Open questions

- **Slice granularity threshold** — how small is "demoable and small enough," who calibrates per class (mirrors Phase 0 classifier-confidence open question).
- **Foundation-cut sizing** — how much to decide once vs defer; cut/defer threshold ties directly to Phase 2 foundational/local boundary.
- **Re-rank stability** — how to re-rank on learning without thrashing plan every slice; minimum-material-change rule.
- **Value elicitation** — cheapest way to extract value ranking from client (MoSCoW? pairwise? buy-a-feature?).
- **Walking-skeleton scope** — how thin is too thin; must touch every foundational seam, but how much behavior is minimum to prove composition.
- **Shared-contract slices** — when two slices touch same contract, build-order + mock strategy (ties to Phase 3 contracts-frozen / parallel-build property).
- **Slice-level rollback** — semantics when demoed slice rejected by client post-demo: re-slice, supersede, or revert.
