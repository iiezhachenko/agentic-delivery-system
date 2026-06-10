# Task 13 — BF-VERIFY-OUTPUT (OVERLAY)

> Self-contained. Everything needed embedded below — do NOT hunt other files.

## TL;DR

Add a `feature-add` DELTA to the SLICE-BUILD mode of `prompts/04-build/VERIFY-OUTPUT.md`. Greenfield VERIFY-OUTPUT runs the full verification ladder (contract + flow + acceptance, incl. held-out) and certifies the slice. Feature-add ADDS the **regression layer run** — nothing previously green goes red (BF4). Inherited ladder + regression-must-stay-green is the bar. MODE=slice. Dual-mode overlay on the existing slice-build part: ONE shared Rules + a feature-add delta carrying ONLY what differs (AB1). Satisfies **BF4**.

## Why this exists

Feature-add's defining guarantee is that the existing accepted behavior keeps working (BF4). VERIFY-OUTPUT is the gate that runs the oracle — so it must also run the regression layer MATERIALIZE-ORACLE added (Task 10), assert it green, and fail the slice if any previously-green existing AC/suite goes red.

### Invariants served
- **BF4 — regression-gated.** Regression layer run; nothing previously green goes red, or the slice fails.

## DAG position

- **Deps:** Task 12 (BF-INTEGRATE — flow layer green), Task 10 (regression layer materialized in the slice oracle). **Hard gate:** greenfield `VERIFY-OUTPUT` SLICE-BUILD part shipped.
- **Downstream:** Task 14 (BF-FIXTURE-ORACLE).
- **Sentinel:** regression-green `verify-output.json` / `build-record.json` golden — the regression layer ran and passed alongside the full ladder.

## EMBEDDED CANON

**Caveman block — already present in VERIFY-OUTPUT; leave verbatim.**

**Anti-bloat:** AB1 (delta = only differences), AB2, AB7–AB9. **Dual-mode overlay pattern:** role runs `mode: skeleton-build|slice-build` off ONE shared `## Rules` + per-mode deltas. Add the feature-add regression delta to the slice-build part; class dispatched by playbook (`oracle_layers` includes `regression`; `verify_method: inherited ladder + regression-must-stay-green`).

## Current state — `prompts/04-build/VERIFY-OUTPUT.md` (greenfield, slice-build mode)

**Role:** Phase 4 role 6/8. Run the full verification ladder against the frozen oracle and certify the slice: contract layer (IMPLEMENT greened it) + flow layer (INTEGRATE greened it) + acceptance layer including the GATE-ONLY held-out tests (the structural anti-cheat — builder never saw them, B7). The authoritative execution: where IMPLEMENT recorded `static-trace`, VERIFY-OUTPUT owes the real run. A red here routes to DIAGNOSE (self-heal vs escape adjudication). The oracle is frozen — run it, never edit it (B4).

**SLICE-BUILD mode:** auto-select the target slice from `08-rerank.json`; run the slice oracle's full ladder (inheriting the frozen skeleton oracle greens by reference, not re-run); output `.build/slices/<id>/verify-output.json`.

## THE WORK — add the feature-add delta to the slice-build part of `VERIFY-OUTPUT.md`

1. **Frontmatter:** add feature-add inputs — the slice `oracle.json` `class_ext` regression layer (from Task 10), `.aprd/baseline-map.json` `existing_oracle` (the suites that must stay green), `.aprd/aprd.v2.frozen.md` `REGRESSION_GUARD` (the scoped guard). Class dispatched by playbook.
2. **Shared `## Rules`:** keep verbatim. The "run the full ladder, oracle is frozen" rule stays; the delta adds the regression layer to the ladder for feature-add (one home, AB1).
3. **Add a `### feature-add delta (slice-build)` block:**
   - **Run the regression layer; must stay green (BF4).** After the contract/flow/acceptance ladder passes, run the regression layer (the scoped existing suites named in `REGRESSION_GUARD` / `class_ext`). EVERY previously-green test in scope must still pass. Any regression red = the slice FAILS — route to DIAGNOSE (the feature broke existing behavior).
   - **Regression red is a hard fail, not a flake.** A previously-green test going red after the feature lands is a real regression (BF4) unless DIAGNOSE proves it flaky. Never weaken/skip a regression test to pass — that's a frozen-test edit (B4), escape instead.
   - **Scope = touched surface + seams (Risk R4).** Run the SCOPED regression layer Task 10 materialized, not the whole inherited suite — same scope basis, kept fast.
   - **Held-out + regression together = the bar.** The acceptance held-out (anti-cheat) AND the regression layer must both be green for the slice to certify.
4. **Output schema:** slice `verify-output.json` adds `class:"feature-add"`, `regression: { ran: true, scope, suites_run[], verdict: "green|red", reds[] }`, and the slice certifies only when `regression.verdict == "green"` AND the full ladder passes. `regression_guard_ref`.
5. **Task steps:** add a feature-add branch: after the standard ladder, run the scoped regression layer → if any red, set slice not-certified + route to DIAGNOSE → else certify. Keep slice-build steps intact.

## Lane / what NOT to do

- Don't weaken/skip/edit any regression or frozen test to pass (B4 — escape instead).
- Don't run the whole inherited suite unscoped (Risk R4).
- Don't certify a slice with a regression red (BF4).
- Don't edit the oracle.

## Verify (both-directions)

- **Known-good:** feature-add slice, no regression → full ladder + scoped regression both green → slice certifies. PASS.
- **Planted defect — regression (the headline BF4 test):** the feature breaks an existing AC → a previously-green regression test goes red → slice MUST FAIL (not certify).
- **Planted defect — regression skipped:** feature-add slice certified without running the regression layer → MUST FAIL.
- **Planted defect — weakened regression test:** a regression test edited to pass → MUST FAIL (B4 breach).

## DONE WHEN

- `VERIFY-OUTPUT.md` slice-build part carries a feature-add regression delta (shared/slice-build Rules substance untouched).
- Golden feature-add slice `verify-output.json` runs the scoped regression layer green alongside the full ladder.
- Both-directions check holds (esp. the planted-regression FAIL — the headline BF4 guarantee).
