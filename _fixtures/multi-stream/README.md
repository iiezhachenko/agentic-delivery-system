# multi-stream — both-directions oracle for CR-007 + CR-008 multi-stream workstreams (W19 + W23)

Oracle for STEP 0.0 (enforce-non-master + branch-binding Cases A–E), STEP 0.1 (auto-reconcile), new-stream dispatch, and switch-to dispatch verifies against. `src/` = git repo state descriptions for each scenario. `expected/` = correct orchestrator behavior for each scenario. `defects/` = planted-defect variants that MUST FAIL. Known-good runs PASS; each defect FAILS. Verifier can't separate golden from defect → verifier broken; fix before trusting any multi-stream build.

## What's here

```
src/                            — git repo state descriptions (one per scenario)
  state-clean-branch.md         — workstream branch + clean fast-forward merge available
  state-master-halt.md          — master with in-flight feature/* + bugfix/* branches
  state-new-stream.md           — new-stream dispatch arg on workstream branch
  state-conflict-halt.md        — workstream branch + non-fast-forward/conflict on reconcile
  [CR-008 branch-binding — Cases A–E + switch-to]
  state-case-a-registered-proceed.md           — HEAD on registered branch → Case A proceed
  state-case-b-master-single-auto-checkout.md  — master + 1 pending → Case B auto-checkout
  state-case-c-master-zero-proceed.md          — master + 0 pending → Case C solo proceed
  state-case-d-master-multi-halt.md            — master + >1 pending → Case D HALT ambiguous
  state-case-e-unregistered-halt.md            — unregistered non-master → Case E HALT
  state-switch-to-registered.md               — switch-to <slug> → checkout + STOP

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
  [CR-008 branch-binding]
  scenario-case-a-registered-proceed/
    expected-verdict.json       — Case A: no action; proceed; no message
  scenario-case-b-master-single-auto-checkout/
    expected-verdict.json       — Case B: auto-checkout message; continue
  scenario-case-c-master-zero-proceed/
    expected-verdict.json       — Case C: solo-master proceed; no message
  scenario-case-d-master-multi-halt/
    expected-verdict.json       — Case D: HALT with all pending slug+branch listed
  scenario-case-e-unregistered-halt/
    expected-verdict.json       — Case E: HALT naming unregistered branch
  scenario-switch-to-registered/
    expected-verdict.json       — switch-to: checkout; emit; STOP

defects/                        — planted-defect variants (each MUST FAIL vs golden)
  no-enforce-non-master/        — STEP 0.0 block removed → master passes without HALT
    expected-verdict.json
  no-auto-reconcile/            — STEP 0.1 block removed → conflict not caught, proceeds
    expected-verdict.json
  new-stream-auto-push/         — new-stream path adds git push → violates G1 local-only
    expected-verdict.json
  [CR-008 branch-binding defects — one per case]
  defect-case-a-skip-registered-check/
    expected-verdict.json       — registered-set read removed → registered branch gets Case E HALT instead of Case A proceed
  defect-case-b-no-auto-checkout/
    expected-verdict.json       — Case B auto-checkout removed → master unresolved; no emit
  defect-case-c-halt-on-master-zero/
    expected-verdict.json       — Case C over-aggressive HALT on 0-pending → solo-master blocked
  defect-case-d-no-multi-halt/
    expected-verdict.json       — Case D HALT removed → multi-pending proceeds silently
  defect-case-e-no-unregistered-halt/
    expected-verdict.json       — Case E HALT removed → unregistered non-master proceeds
  defect-switch-to-no-halt-on-absent/
    expected-verdict.json       — switch-to absent-brief guard removed → proceeds on unregistered slug
```

## The behaviors under test (CR-007 / D28 / R-MW-1..R-MW-4 + CR-008 / D29 / R-MW-5)

Seven behaviors (CR-007) + six behaviors (CR-008), one oracle each:

**CR-007 behaviors:**
- **STEP 0.0 enforce-non-master (R-MW-3):** `git rev-parse --abbrev-ref HEAD` = master/main + `feature/*`/`bugfix/*` present → HALT with branch list. Workstream branch → passes silently.
- **STEP 0.1 auto-reconcile (R-MW-2):** `git fetch origin && git merge origin/main --ff-only`. Clean fast-forward → continue. Non-fast-forward or conflict → HALT with resolve instruction.
- **new-stream dispatch (R-MW-4):** `new-stream <slug> "<brief>"` → branch `feature/<slug>` created locally (no push, G1) + `_streams/<slug>/brief.md` written (ask/branch/status=pending/date) + STOP.
- **Local-only constraint (G1):** new-stream never pushes to remote. Operator pushes when ready.

**CR-008 behaviors (STEP 0.0 Cases A–E + switch-to, R-MW-5, D29):**
- **Case A:** HEAD in registered set → proceed. No action.
- **Case B:** master + exactly 1 pending → auto-checkout branch; emit message; continue.
- **Case C:** master + 0 pending → solo-master flow; proceed.
- **Case D:** master + >1 pending → HALT; list all slug+branch.
- **Case E:** HEAD not in registered set AND not master/main → HALT naming branch.
- **switch-to dispatch:** `switch-to <slug>` → read brief.md (absent → HALT); checkout branch; emit; STOP.

## Both-directions oracle — scenario → expected result

### CR-007 scenarios (regression-guarded)

| scenario | state | behavior | expected result | separates from defect by |
|---|---|---|---|---|
| clean-branch | feature/my-feature + clean ff merge | STEP 0.0 pass + STEP 0.1 clean | no HALT; frontier-scan proceeds | defect skips enforce/reconcile |
| master-halt | master + feature/my-feature + bugfix/fix-rate | STEP 0.0 fires HALT | HALT with branch list | defect proceeds on master silently |
| new-stream | feature/current-work + dispatch arg | new-stream path | branch + brief.md + STOP; no push | defect pushes to remote |
| conflict-halt | feature/my-feature + non-ff conflict | STEP 0.1 fires HALT | HALT with resolve instruction | defect skips reconcile, proceeds |

### CR-008 scenarios (branch-binding)

| scenario | state | behavior | expected result | separates from defect by |
|---|---|---|---|---|
| case-a-registered-proceed | feature/my-analytics + registered | Case A: proceed | no action; frontier-scan | defect skips registered-set read → registered branch gets Case E HALT |
| case-b-master-single-auto-checkout | master + 1 pending | Case B: auto-checkout | checkout message; continue | defect skips checkout → master unresolved |
| case-c-master-zero-proceed | master + 0 pending | Case C: solo proceed | no message; frontier-scan | defect HALTs on 0-pending → solo-master blocked |
| case-d-master-multi-halt | master + 2 pending | Case D: HALT ambiguous | HALT with slug+branch list | defect skips HALT → ambiguous proceed |
| case-e-unregistered-halt | feature/orphan-work (unregistered) | Case E: HALT | HALT naming branch | defect skips Case E → unregistered proceeds |
| switch-to-registered | switch-to my-analytics | switch-to: checkout+STOP | checkout; emit; STOP | defect skips absent-brief guard → unregistered slug proceeds |

## Defect details

### CR-007 defects

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

### CR-008 defects (branch-binding — one per case + switch-to)

### defect-case-a-skip-registered-check
**Invariant:** STEP 0.0 reads `_streams/*/brief.md` registered set; HEAD in set → Case A proceed. Removing that read means a registered branch cannot be identified as Case A — falls to Case E → HALT.

**Seed:** remove registered-set read from STEP 0.0 (set always empty). Run against state-case-a-registered-proceed (HEAD = feature/my-analytics, registered).

**Separates by:** step_0_0_halt flag on Case A state (golden: false / defect: true). Registered branch HALTed = discrimination signal. Distinct from defect-E (which tests Case E state — unregistered branch proceeds).

### defect-case-b-no-auto-checkout
**Invariant:** Case B auto-checks out the single pending stream branch + emits message. Removing = master state unresolved; no checkout.

**Seed:** remove Case B checkout + emit from STEP 0.0. Run against state-case-b-master-single-auto-checkout.

**Separates by:** auto_checkout_performed flag + emit message presence (golden: true / defect: false).

### defect-case-c-halt-on-master-zero
**Invariant:** Case C (0 pending) proceeds silently — solo-master flow. Over-aggressive HALT on 0-pending breaks greenfield.

**Seed:** make Case C emit HALT. Run against state-case-c-master-zero-proceed.

**Separates by:** step_0_0_halt flag (golden: false / defect: true). HALT on solo-master bench = discrimination signal.

### defect-case-d-no-multi-halt
**Invariant:** Case D (>1 pending) → HALT with slug+branch list. Removing = ambiguous multi-pending proceeds silently.

**Seed:** remove Case D HALT. Run against state-case-d-master-multi-halt.

**Separates by:** Case D HALT absent in defect output. Multi-pending bench proceeds to frontier-scan = discrimination signal.

### defect-case-e-no-unregistered-halt
**Invariant:** Case E (unregistered non-master) → HALT naming branch. Removing = unregistered branches proceed.

**Seed:** remove Case E HALT. Run against state-case-e-unregistered-halt.

**Separates by:** HALT message with branch name (golden: present / defect: absent). Frontier-scan on unregistered-branch bench = discrimination signal.

### defect-switch-to-no-halt-on-absent
**Invariant:** switch-to checks brief.md exists; absent → HALT. Removing = switch-to proceeds on unregistered slug.

**Seed:** remove absent-brief guard from switch-to. Run switch-to with absent slug.

**Separates by:** halt_on_absent flag (golden: true / defect: false). Checkout attempt on undefined slug = discrimination signal.

## How to seed a scenario

1. Read the `src/state-<scenario>.md` — git state description + behavior triggered.
2. Set up a bench matching that git state (branch, remote config, conflict state as described).
3. Run the orchestrator clean-room (step-runner, Sonnet/High — prompt verbatim + bench path; no pipeline context leaks).
4. Assert on-disk output + emitted messages match `expected/<scenario>/expected-verdict.json` `expected_signal`.
5. For defect runs: apply the `seed[]` steps from `defects/<defect>/expected-verdict.json`, then confirm the opposite signal — value-parity FAIL.

## Both-directions mandate

Known-good orchestrator run against each scenario PASSES. Each defect orchestrator FAILS on exactly the signal it plants. Verifier that cannot distinguish golden from defect is broken — fix it before trusting any multi-stream delivery.

> **CR-007 e2e-validated (2026-06-12)** — W18/W19 clean-room both-directions: FORWARD (all 4 properties present+correct: STEP 0.0 HALT emitted on master scenario; STEP 0.1 reconcile block present; new-stream path writes brief.md + no push; conflict-halt HALT emitted). DEFECT (STEP 0.0 HALT removal detected by verifier). Oracle discriminates all three CR-007 defect classes: enforce-non-master removal → master proceeds silently; auto-reconcile removal → conflict undetected; auto-push → G1 violated.

> **CR-008 branch-binding section (W23)** — 6 new scenarios (Cases A–E + switch-to) + 6 defects. Each defect flips exactly one signal vs golden. Discriminators: A=registered-set-check-present; B=auto-checkout-performed; C=solo-master-proceeds; D=multi-halt-fires; E=unregistered-halt-fires; switch-to=absent-brief-guard-present. Regression-guard: CR-007 scenarios (clean-branch/master-halt/new-stream/conflict-halt) unchanged — W22 orchestrator handles all 10 cases. Await W23 clean-room both-directions validation.

Verify discipline (EMBEDDED CANON): both-directions mandatory · disk is the deliverable · clean-room (no pipeline context leaks) · caveman + economy bind all fixture prose.
