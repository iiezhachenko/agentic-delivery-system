You are a CTO in a software development company that builds agents that deliver software projects end-to-end.

# WHAT THIS IS
**MODE B — full-from-raw pipeline run, validates Phase 0.** It runs the WHOLE implemented chain from the true entry (`.aprd/00-raw-request.md`) through Phase 3.

**This is a thin overlay. The base harness is `_pipeline-run.md` (MODE A) — read it; it owns ALL shared mechanics** (implemented-chain table, runner spawning, per-step verification, token logging, the F2 freeze, report format, RULES, SUBAGENT CONTRACT). This file adds ONLY what MODE B does differently: the **Phase-0 prelude (steps 1–6 + F1)** and the **client-gate pin**. After Phase 0 freezes, control hands back to the base for step 7→23 — no machinery is duplicated.

# WHY A SEPARATE MODE (the Phase-0 client gate)
The chain has a **human client gate at G1 that cannot replay deterministically from a static fixture**: QUESTION-GEN asks the first min(6,N) of GAP-DETECT's *blast-sorted* gaps, and GAP-DETECT's gap ORDERING varies benignly run-to-run — so a canned `06-answers.md` keyed to golden Q-numbers can bind an answer to a *different* gap than written for, leaving an arch fork open → CRITIQUE correctly blocks at F1. (Observed: golden Q6=hosting answer landed on a reshuffled Q6=architecture gap.) MODE B resolves it by **pinning the gate's input** (below). MODE A sidesteps it entirely by seeding past Phase 0 — which is why MODE A is the default for cross-phase testing.

# INVOCATION (single-shot — one paste, runs autonomously to the end)
Paste this file's content, then append:
`RUN: MODE B (full-from-raw). Project root ./_test_bench. Follow the Phase-0 prelude here, then hand off to _pipeline-run.md from step 7. Self-drive all gates by fixture copy (pin 04-gaps, inject 06-answers, append "[CLIENT REPLY] confirm" at step 12). Do F1 + F2 freezes by hand. Log per-spawn tokens; report at end (state mode=B + the pin caveat).`
Every gate is self-driven by the orchestrator (no human pause). **Heavy:** ~23 runners + verifiers sequentially, large cumulative spend (Phase 0 alone ≈237K subagent tokens last run) — fully autonomous, just a long session.

# TASK (MODE B)
Apply the base's mechanics (run-in-fresh-step-runner, verify-against-disk, log-usage, stop-at-first-break — `_pipeline-run.md` tasks 3/6/7/8) to EVERY step below.

1. **Read `_tracker.md` + `_pipeline-run.md`** — get the implemented-chain table + all shared mechanics from the base.
2. **Clear + seed `_test_bench`:** seed ONLY `.aprd/00-raw-request.md` ← `_fixtures/greenfield-clean/.aprd/00-raw-request.md`. (Research lane optional, default OFF — the canon fixture is a different project; GAP-DETECT treats `rules-verified.json` as OPTIONAL, `grounding_ref:null`.)
3. **Run the Phase-0 prelude, steps 1→6 in spine order** (table in the base): CLASSIFIER → EXTRACT → GAP-DETECT → **[PIN]** → QUESTION-GEN → **[G1 inject]** → SYNTHESIZE → CRITIQUE. Two MODE-B-only gate actions:
   - **[PIN] before QUESTION-GEN (step 4):** copy golden `_fixtures/greenfield-clean/.aprd/04-gaps.json` over the freshly-produced `_test_bench/.aprd/04-gaps.json`. This pins the question SET so the canned answers bind to the intended gaps. **Declare the pin in the report** — it means the GAP-DETECT→QUESTION-GEN→client-binding seam runs against a GOLDEN gate input, not a fresh one (accepted trade for a deterministic Phase-0 validation). Do NOT hand-author a run-matched reply instead (fabricates the client + breaks repeatability).
   - **[G1 inject] after QUESTION-GEN:** copy golden `_fixtures/greenfield-clean/.aprd/06-answers.md` → `_test_bench/.aprd/06-answers.md`. SYNTHESIZE reads it.
4. **F1 freeze (mechanical, by hand)** — on step-6 CRITIQUE `verdict:clean`: render `.aprd/aprd.frozen.md` (PROJECT/CLASS/ENTITIES/REQUIREMENTS/CONSTRAINTS/ASSUMPTIONS/OUT_OF_SCOPE/ACCEPTANCE from `aprd.v1.md` + `07-assumptions.json`) + write `.aprd/aprd.lock` (status:frozen + manifest). Mirror golden `_fixtures/greenfield-clean/.aprd/aprd.frozen.md` + `aprd.lock` shape. If CRITIQUE is `blocked` → stop-at-break (record it; F1 not reached).
5. **HAND OFF to the base.** With `.aprd/aprd.frozen.md` now on disk, follow **`_pipeline-run.md` from step 7 onward** — its task-2 handoff guard detects the frozen aPRD present, skips re-seeding, and continues 7→23 (including the step-12 gate + the F2 freeze) under all the base's mechanics.
6. **Report** — use the base's report format (per-step token table + TOTALS), covering steps 1→23. State **mode = B**, the **pin caveat**, the research-lane mode, the first break (if any), terminal step, and the end-to-end ID-thread verdict.

# NOTES
- RULES + SUBAGENT CONTRACT: inherited verbatim from `_pipeline-run.md` (caveman register; cwd `./`; every subagent via `step-runner`; log usage). Not repeated here.
- Long-term fixture hardening (removes the need for the pin): re-key client-gate replies by `G*`/gap-ref instead of `Q<n>` so they survive GAP-DETECT reordering.
