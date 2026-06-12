# multi-stream — both-directions oracle for CR-007 multi-stream workstreams (W19)

Oracle for STEP 0.0 (enforce-non-master), STEP 0.1 (auto-reconcile), and new-stream dispatch verifies against. `src/` = git repo state descriptions for each scenario. `expected/` = correct orchestrator behavior for each scenario. `defects/` = planted-defect variants that MUST FAIL. Known-good runs PASS; each defect FAILS. Verifier can't separate golden from defect → verifier broken; fix before trusting any multi-stream build.

## What's here

```
src/                            — git repo state descriptions (one per scenario)
  state-clean-branch.md         — workstream branch + clean fast-forward merge available
  state-master-halt.md          — master with in-flight feature/* + bugfix/* branches
  state-new-stream.md           — new-stream dispatch arg on workstream branch
  state-conflict-halt.md        — workstream branch + non-fast-forward/conflict on reconcile

expected/                       — expected orchestrator outputs per scenario
  scenario-clean-branch/
    expected-verdict.json       — no HALT; reconcile succeeds; frontier-scan proceeds
  scenario-master-halt/
    expected-verdict.json       — HALT: master + in-flight branches listed
  scenario-new-stream/
    expected-verdict.json       — branch created; brief.md written; STOP; no push
    _streams/analytics-pipeline/
      brief.md                  — golden brief.md (ask/branch/status=pending/date)
  scenario-conflict-halt/
    expected-verdict.json       — HALT: non-fast-forward/conflict against origin/main

defects/                        — planted-defect variants (each MUST FAIL vs golden)
  no-enforce-non-master/        — STEP 0.0 block removed → master passes without HALT
    expected-verdict.json
  no-auto-reconcile/            — STEP 0.1 block removed → conflict not caught, proceeds
    expected-verdict.json
  new-stream-auto-push/         — new-stream path adds git push → violates G1 local-only
    expected-verdict.json
```

## The behaviors under test (CR-007 / D28 / R-MW-1..R-MW-4)

Four behaviors, one oracle each:

- **STEP 0.0 enforce-non-master (R-MW-3):** `git rev-parse --abbrev-ref HEAD` = master/main + `feature/*`/`bugfix/*` present → HALT with branch list. Workstream branch → passes silently.
- **STEP 0.1 auto-reconcile (R-MW-2):** `git fetch origin && git merge origin/main --ff-only`. Clean fast-forward → continue. Non-fast-forward or conflict → HALT with resolve instruction.
- **new-stream dispatch (R-MW-4):** `new-stream <slug> "<brief>"` → branch `feature/<slug>` created locally (no push, G1) + `_streams/<slug>/brief.md` written (ask/branch/status=pending/date) + STOP.
- **Local-only constraint (G1):** new-stream never pushes to remote. Operator pushes when ready.

## Both-directions oracle — scenario → expected result

| scenario | state | behavior | expected result | separates from defect by |
|---|---|---|---|---|
| clean-branch | feature/my-feature + clean ff merge | STEP 0.0 pass + STEP 0.1 clean | no HALT; frontier-scan proceeds | defect skips enforce/reconcile |
| master-halt | master + feature/my-feature + bugfix/fix-rate | STEP 0.0 fires HALT | HALT with branch list | defect proceeds on master silently |
| new-stream | feature/current-work + dispatch arg | new-stream path | branch + brief.md + STOP; no push | defect pushes to remote |
| conflict-halt | feature/my-feature + non-ff conflict | STEP 0.1 fires HALT | HALT with resolve instruction | defect skips reconcile, proceeds |

## Defect details

### no-enforce-non-master
**Invariant:** STEP 0.0 (R-MW-3) — branch = master + workstream branches present → HALT. Missing = orchestrator runs on master silently.

**Seed:** remove STEP 0.0 block from orchestrator. Run against state-master-halt (master + feature/my-feature + bugfix/fix-rate).

**Separates by:** step_0_0_halt flag (golden: true / defect: false). Any frontier-scan output on a master-with-workstreams bench = discrimination signal.

### no-auto-reconcile
**Invariant:** STEP 0.1 (R-MW-2) — merge origin/main --ff-only; non-ff → HALT. Missing = orchestrator proceeds on unreconciled/stale tree.

**Seed:** remove STEP 0.1 block from orchestrator. Run against state-conflict-halt (non-fast-forward).

**Separates by:** step_0_1_halt flag (golden: true / defect: false). Any frontier-scan output despite non-ff state = discrimination signal.

### new-stream-auto-push
**Invariant:** G1 local-only — new-stream creates branch locally, no push. Auto-push = G1 violation (gate answer persisted, D20 guarantee 6).

**Seed:** add `git push origin feature/<slug>` to new-stream path. Run against state-new-stream.

**Separates by:** remote_push_performed flag (golden: false / defect: true). Branch visible on remote = discrimination signal.

## How to seed a scenario

1. Read the `src/state-<scenario>.md` — git state description + behavior triggered.
2. Set up a bench matching that git state (branch, remote config, conflict state as described).
3. Run the orchestrator clean-room (step-runner, Sonnet/High — prompt verbatim + bench path; no pipeline context leaks).
4. Assert on-disk output + emitted messages match `expected/<scenario>/expected-verdict.json` `expected_signal`.
5. For defect runs: apply the `seed[]` steps from `defects/<defect>/expected-verdict.json`, then confirm the opposite signal — value-parity FAIL.

## Both-directions mandate

Known-good orchestrator run against each scenario PASSES. Defect orchestrator (STEP 0.0 removed / STEP 0.1 removed / new-stream auto-push) FAILS. Verifier that cannot distinguish them is broken — fix it before trusting any multi-stream delivery.

> **e2e-validated (2026-06-12)** — W18 clean-room both-directions: FORWARD (all 4 properties present+correct: STEP 0.0 HALT emitted on master scenario; STEP 0.1 reconcile block present; new-stream path writes brief.md + no push; conflict-halt HALT emitted). DEFECT (STEP 0.0 HALT removal detected by verifier). Oracle discriminates all three defect classes: enforce-non-master removal → master proceeds silently; auto-reconcile removal → conflict undetected; auto-push → G1 violated.

Verify discipline (EMBEDDED CANON): both-directions mandatory · disk is the deliverable · clean-room (no pipeline context leaks) · caveman + economy bind all fixture prose.
