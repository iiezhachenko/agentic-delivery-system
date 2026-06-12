---
id: ADR-0028
title: Branch-per-workstream — parallel branch isolation + auto-reconcile + enforce-non-master
status: Accepted
date: 2026-06-12
class: self-host
scope: global
mode: foundation
source: operator-approved
supersedes: null
superseded_by: null
cr: CR-007
---

## Decision

- **D28 — Each workstream runs on a dedicated branch; master is stable-only; orchestrator enforces isolation + auto-reconcile.**
  Context (CR-007): ADP previously ran all work on master (or one branch). Operator-approved model: multiple parallel workstreams, each on its own `feature/<slug>` or `bugfix/<slug>` branch. Master = stable landing zone only (promoted, gate-accepted work). Grounds R-MW-1..R-MW-4.

  **Decision:**
  1. **Branch isolation (R-MW-1).** Every workstream runs on a dedicated branch. Each branch carries exactly one in-flight CR/feature/bugfix wave. Master receives only promoted, gate-accepted work (merge by operator, not automated).
  2. **Auto-reconcile (R-MW-2).** At STEP 0, orchestrator merges main into the current workstream branch (`git fetch origin && git merge origin/main --ff-only`). Fast-forward only — rebase rejected (merge preserves history + is idempotent on re-run). Conflict or non-fast-forward → HALT, report conflict, do not proceed. Local-only runs (no remote) skip fetch, proceed with local main.
  3. **Enforce-non-master (R-MW-3).** If current branch = `master` (or `main`) AND any `feature/*` or `bugfix/*` branch exists → HALT, list in-flight branches, instruct operator to check out the target workstream branch. Rationale: running work on master while a workstream branch is in flight risks drift between the two delivery contexts; HALT is safer than silent continuation.
  4. **New-stream dispatch, local-only (R-MW-4).** Dispatch arg `new-stream <slug> "<brief>"`: create branch `feature/<slug>` off current HEAD (locally, no push), write `_streams/<slug>/brief.md` (ask, branch, status=pending, date), emit "New workstream queued on branch `feature/<slug>`. Check out that branch in a new harness session.". STOP — do not advance the current workstream. **Operator pushes when ready** (G1 gate answer, supersedes any earlier draft noting auto-push). NO auto-push at dispatch; local-only.

  **Tradeoffs considered:**
  - *Merge conflicts vs drift.* Short-lived workstream branches + frequent fast-forward reconcile keeps delta small. Operator resolves conflicts (HALT is the correct response — no automation here).
  - *Session isolation vs shared history.* Each session operates on exactly one branch; `_streams/` provides a durable cross-session registry of pending workstreams. No shared mutable state between sessions.
  - *Auto-push rejected.* Early drafts proposed auto-push for `new-stream`. G1 gate (operator, 2026-06-12) set LOCAL-ONLY definitively. Rationale: operator controls when branches become visible to CI/team; ADP's job is to queue the work, not to expose it.
  - *Rebase rejected.* Merge-only for auto-reconcile. Rebase rewrites history; idempotent re-run on clean tree is the D20 resume pattern — rebase breaks idempotency after the first run (diverged commits). Merge fast-forward is safe, reproducible, reversible.

  **Consequences:** Orchestrator STEP 0 gains two sub-steps (STEP 0.0 enforce-non-master, STEP 0.1 auto-reconcile) + new `new-stream` dispatch path. HLD gains STREAM-MANAGER component (operating-model helper, not a prompt role). Existing greenfield + bugfix + brownfield-adopt flows unchanged — STEP 0.0 is a HALT only when master is live AND workstream branches are present; solo-master repos unaffected. Generic orchestrator (`_orchestrator.generic.md`) out of scope — separate CR if multi-stream applies there.
  **Reopen if:** auto-reconcile produces unacceptable merge histories in practice (→ rebase consideration); or operator-push model causes workflow friction (→ auto-push reconsideration, but G1 must be re-answered).
