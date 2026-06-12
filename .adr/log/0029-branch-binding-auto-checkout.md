---
id: ADR-0029
title: Branch-binding policy — brief.md authoritative binding + auto-checkout (Amendment-1 to D28)
status: Accepted
date: 2026-06-12
class: self-host
scope: global
mode: foundation
source: operator-approved
supersedes: null
superseded_by: null
amends: ADR-0028
cr: CR-008
---

## Decision

- **D29 — Amendment-1 to D28: `_streams/<slug>/brief.md` `branch:` field is the authoritative binding for workstream branch association; STEP 0.0 auto-checks out the correct branch when unambiguous; new HALT classes for wrong-branch and no-registration cases.**
  Context (CR-008): D28 introduced `brief.md` with a `branch:` field but STEP 0.0 only guarded master-with-in-flight. A session on a feature branch other than the one a pending workstream expects (wrong-branch case) proceeded silently. Brief record names the expected branch; binding that record to runtime enforcement closes the gap. Option B selected (operator gate Q2, 2026-06-12): unambiguous auto-checkout — highest ergonomic value, reconciles cleanly with D28 enforce-non-master invariant.

  **Amendment decisions (extend D28; D28 points 1–4 unchanged):**

  5. **Authoritative branch binding (R-MW-5).** `_streams/<slug>/brief.md` `branch:` field is not documentation — it is the authoritative binding between a workstream and its branch. STEP 0.0 reads all `_streams/*/brief.md` where `status: pending` → collects their `branch:` values (the registered set). This is the enforcement source; no other branch registry exists.

  6. **STEP 0.0 Option-B auto-checkout logic.** After the existing master-with-in-flight HALT, STEP 0.0 evaluates:
     - **Case A — HEAD in registered set** → correct branch, proceed. No action.
     - **Case B — HEAD = master/main + exactly 1 pending stream** → auto create-or-checkout that stream's `branch:` value (`git checkout -B <branch>` if absent, `git checkout <branch>` if present), emit "Auto-checked out branch `<branch>` for workstream `<slug>`.", continue.
     - **Case C — HEAD = master/main + 0 pending streams** → proceed. Solo-master flow (D28 §3 unchanged).
     - **Case D — HEAD = master/main + >1 pending streams** → HALT. Ambiguous; list pending streams + branches; instruct operator to check out target manually. (D28 §3 enforce-non-master invariant preserved.)
     - **Case E — HEAD not in registered set AND not master/main** → HALT. Emit: "Branch `<HEAD>` not registered in `_streams/`; run `new-stream` or check out a registered workstream branch." New HALT class — wrong-branch with no matching brief.

  **Tradeoffs considered:**
  - *Option A (slug dispatch) rejected.* Zero-arg default-advance ergonomics lost; operator must always name a stream. High friction for the common single-stream case.
  - *Option C (switch-to only) deferred-not-rejected.* Purely additive; zero regression surface; composable with Option B. CR-008 §C notes it as additive regardless of Q2 — can be added alongside B in the same W22 build.
  - *Option B inference surface.* Reading `_streams/*/brief.md` at STEP 0.0 adds I/O before the frontier scan. Bounded: only reads YAML front-matter `status:` + `branch:` fields; no LLM involvement; deterministic. Zero-match case (Case E) routes to HALT — inference never silently proceeds on unregistered branches.
  - *D28 §3 invariant preserved.* Case D (master + >1 pending) → HALT, same behavior as D28 §3. Case C (master + 0 pending) → proceed, same as D28 §3 solo-master pass. Cases A/B/E are additive logic that do not alter the existing master-multi-in-flight HALT path.

  **Consequences:** STEP 0.0 gains branch-match logic (Cases A–E) after existing master-with-in-flight HALT. HLD STREAM-MANAGER `step-0-precondition` contract updated to reflect branch-match constraint (R-MW-5). `_fixtures/multi-stream/` gains 3 new scenarios (wrong-branch-auto-checkout, master-single-pending-auto-checkout, master-multi-pending-halt) + 1 new defect (no-wrong-branch-checkout). Existing CR-007 oracle scenarios (clean-branch, master-halt, new-stream, conflict-halt) regression-guarded.
  **Reopen if:** multiple active workstreams per session become a supported model (→ Option A or explicit slug dispatch becomes preferable; Case D HALT would become a friction point).
