# Pipeline Prompt-Build Tracker — NAV (hot)

> My map across fresh sessions. Read THIS file every run. It is a POINTER, not the archive — the bulk (resolved decisions, changelog history, stable rules) lives in cold/warm sidecars below; load those on demand, not every run.
> **Caveman register in chat. Clean prose inside the prompts I author.**

## Files (load by need, not by habit)
| File | Temp | Load when |
|---|---|---|
| `_tracker.md` (this) | HOT | every run — pointer + status + decision index + changelog rules |
| `_rules.md` | WARM | step 3 (author) — PR1–4, caveman block, DRY skeleton, AB1–6, conventions, storage, mission, specs |
| `_decisions.md` | COLD | grep the ONE `D*` your step cites — full resolved-decision bodies |
| `_changelog.md` | COLD | step 7.4 drift diff-check only — append-only shipped-prompt entries |

---

## YOU ARE HERE

- **Phase:** Phase 0 ✅ · Phase 1 ✅ 7/7 · Phase 2 ✅ 7/7 · **Phase 3 (HLD) SKELETON chain ✅ 8/8 + FROZEN** · **Phase 4 (Build) SKELETON-BUILD chain ✅ 8/8.** Every greenfield once/skeleton pass shipped. **Phase-3 INCREMENT chain: DERIVE-COMPONENTS ✅ + DEFINE-CONTRACTS ✅ + RESOLVE-LOCAL ✅ + MODEL-DATA ✅ + MAP-NFR ✅ + MODEL-FLOWS ✅ + DERIVE-TESTS ✅ (7/8).** Remaining = increment RECONCILE/CRITIQUE (role 8, D9/D14) + Phase-4 SLICE-BUILD modes (D11).

- **Last shipped: DERIVE-TESTS increment mode** → `prompts/03-hld/DERIVE-TESTS.md` (now dual-mode: skeleton|increment, dispatched on frozen-skeleton presence — D14 pattern; new calls D19). Per-slice design-layer oracle (§5.9): ONE NEW flow test `T-F*` (carried verbatim from the slice flow) + the frozen contract tests its touched seams INHERIT by reference (`new_contract_tests`=[] greenfield); NO build-DAG (skeleton-only, H7). Shipped — see Changelog; design/rules/schema/test in the `.md`.

- **Next: RECONCILE/CRITIQUE increment mode** (Phase-3 role 8/8, LAST Phase-3 increment) — per-slice adversarial gate incl. H14 skeleton-fidelity check (§8). Make `RECONCILE.md`/`CRITIQUE.md` dual-mode (D14 pattern; reuse D19 inherit-by-reference framing); seed from golden `.hld/slices/S4/{components,contracts,deferred-decisions,data-model,nfr-mechanisms,flows,test-specs}.json` + frozen skeleton set + rerank. Test BOTH directions (clean + planted-defect).

- **Deferred (forward-blocked):** Phase-4 SLICE-BUILD modes (D11 — needs a per-slice HLD increment, which the Phase-3 INCREMENT chain must produce first; built-skeleton fixture EXISTS).

- **Last updated:** 2026-06-08 (DERIVE-TESTS increment mode shipped + golden `.hld/slices/S4/test-specs.json` promoted; Phase-3 INCREMENT chain 7/8; D19 resolved).

---

## Prompt inventory & status

Status: ☐ todo · ◐ drafting · ☑ done

### Phase 0 — aPRD
- ☑ CLASSIFIER
- ☑ EXTRACT
- ☑ GAP-DETECT
- ☑ QUESTION-GEN
- ☑ SYNTHESIZE
- ☑ CRITIQUE
- ☑ EXTRACT-RULES (research sub-pipeline §7)
- ☑ RECONCILE (research)
- ☑ VERIFY (research)
- ⊘ VERIFY-OUTPUT — **MOVED to Phase 4** (D6): build/verify gate, executes test artifacts vs built software; Phase 0 has no executable artifacts pre-build. Phase 0 terminates at mechanical freeze (no authored prompt). **Phase 0 prompt set COMPLETE.**

### Phase 1 — Roadmap
- ☑ SLICE-EXTRACT
- ☑ VERTICALITY-CHECK
- ☑ SKELETON-IDENTIFY
- ☑ SEQUENCE
- ☑ FOUNDATION-CUT
- ☑ RE-RANK (living-roadmap re-ranker, out of phase order per D8 — authored after Phase 3 DAG locked)
- ☑ SEQUENCE-REVIEW (client-facing, interactive:true, two-phase)

### Phase 2 — ADR
- ☑ DECISION-EXTRACT
- ☑ TRIAGE
- ☑ OPTION-GEN
- ☑ EVALUATE-DECIDE
- ☑ RECONCILE
- ☑ SYNTHESIZE-ADR
- ☑ CRITIQUE

### Phase 3 — HLD
- ☑ DERIVE-COMPONENTS — **SKELETON + INCREMENT both done + tested + golden promoted.** Dual-mode prompt (dispatch on frozen-skeleton presence; D14).
- ☑ DEFINE-CONTRACTS — **SKELETON + INCREMENT both done + tested + golden promoted.** Dual-mode prompt (dispatch on frozen-skeleton presence; D14).
- ☑ RESOLVE-LOCAL (emits local ADR) — **SKELETON + INCREMENT both done + tested + golden promoted.** Dual-mode prompt (dispatch on frozen-skeleton presence; D14/D15).
- ☑ MODEL-DATA — **SKELETON + INCREMENT both done + tested + golden promoted.** Dual-mode prompt (dispatch on frozen-skeleton presence; D14/D16).

> **D10 retrofit (2026-06-07):** ALL Phase 0–3 prompt TEXTS rewritten to the DRY skeleton (−29% total). Re-test pending across all (skipped by operator); goldens unchanged, behavior assumed preserved until re-run. New full-chain test harness: `_pipeline-run.md`.
- ☑ MAP-NFR — **SKELETON + INCREMENT both done + tested + golden promoted.** Dual-mode prompt (dispatch on frozen-skeleton presence; D14/D17).
- ☑ MODEL-FLOWS — **SKELETON + INCREMENT both done + tested + golden promoted.** Dual-mode prompt (dispatch on frozen-skeleton presence; D14/D18).
- ☑ DERIVE-TESTS — **SKELETON + INCREMENT both done + tested + golden promoted.** Dual-mode prompt (dispatch on frozen-skeleton presence; D14/D19).
- ◐ RECONCILE/CRITIQUE — **SKELETON pass done + tested BOTH directions + golden promoted.** Increment mode (per-slice gate incl. H14 skeleton-fidelity) not yet authored (see D9).

### Phase 4 — Build
- ◐ BUILD-PLAN — **SKELETON-BUILD pass done + tested + golden promoted.** SLICE-BUILD mode not yet authored (per-slice path, real-vs-mock against a built prior slice; see D11).
- ◐ MATERIALIZE-ORACLE — **SKELETON-BUILD pass done + tested + golden promoted.** SLICE-BUILD mode not yet authored (per-slice oracle against a built prior slice + per-slice HLD increment; see D11).
- ◐ IMPLEMENT (builder — cannot edit oracle) — **SKELETON-BUILD pass done + tested + golden promoted** (built skeleton `src/` + `build-record.json`). SLICE-BUILD mode not yet authored (a slice's path against a built prior slice + per-slice HLD increment; see D11).
- ◐ INTEGRATE (integrator — composes the path, greens the flow test) — **SKELETON-BUILD pass done + tested + golden promoted** (composition root `src/freelancer_app/wsgi.py` + `oauth_provider.py` + `integration-record.json`). SLICE-BUILD mode not yet authored (a slice's flow against a built prior slice + per-slice HLD increment; see D11).
- ◐ DIAGNOSE (self-heal vs escape) — **skeleton-build pass done + tested + golden promoted.** Standalone adjudicator on a verification red; SLICE-BUILD mode not yet authored (D11).
- ◐ VERIFY-OUTPUT (authoritative ladder gate) — **skeleton-build pass done + tested BOTH directions + golden promoted.** SLICE-BUILD mode not yet authored (D11).
- ◐ CRITIQUE (anti-cheat) — **SKELETON-BUILD pass done + tested BOTH directions + golden promoted.** SLICE-BUILD mode not yet authored (a slice's diff against a built prior slice; see D11).
- ◐ DEMO-GEN (client demo+accept gate, interactive:true) — **SKELETON-BUILD pass done + tested BOTH Phase-B paths + golden promoted.** SLICE-BUILD mode not yet authored (a slice's demo against a built prior slice; see D11).

**Totals:** 30 / 39 fully done (DERIVE-COMPONENTS + DEFINE-CONTRACTS + RESOLVE-LOCAL + MODEL-DATA + MAP-NFR + MODEL-FLOWS + DERIVE-TESTS both modes) + 1 Phase-3 skeleton-only role (◐×1 — RECONCILE/CRITIQUE; increment mode pending D9/D14) + **Phase-4 ALL 8 roles (◐×8, skeleton-build pass COMPLETE; slice-build pending D11).** (VERIFY-OUTPUT counted once, in Phase 4 — D6 de-duplicated the Phase-0 listing; inventory 40→39. **Phase 1: 7/7 COMPLETE — RE-RANK shipped.** **Phase 2: 7/7 COMPLETE.** **Phase 3: SKELETON chain 8/8 COMPLETE + frozen.** **Phase 4: SKELETON-BUILD chain 8/8 COMPLETE.** Every greenfield phase's skeleton/once-pass authored + the deferred RE-RANK; remaining = increment/slice modes only — Phase-3 INCREMENT D9, Phase-4 SLICE-BUILD D11.)


## Decision index (bodies → `_decisions.md`; grep the id)

D1–D4 — foundational conventions (one-role-one-prompt, greenfield-first, self-contained, artifacts-on-disk) → `_rules.md` Conventions.

- **D5** — research branch placement (PRE-GAP). RESOLVED.
- **D6** — VERIFY-OUTPUT → Phase 4 not Phase 0. RESOLVED.
- **D7** — Phase-1 file numbering by spine order. RESOLVED.
- **D8** — author SEQUENCE-REVIEW now, defer RE-RANK; interactive two-phase pattern; data-chain window rule. RESOLVED.
- **D9** — Phase-3 skeleton/increment mode split + baselined-`.adr/log` input form. RESOLVED (reopened by D14).
- **D10** — prompt-bloat root cause + DRY skeleton + AB1–6. RESOLVED (retrofit done; re-test owed).
- **D11** — Phase-4 mode split (skeleton-build vs slice-build) + mechanical skeleton freeze. RESOLVED.
- **D12** — IMPLEMENT scope + per-SUT contract-test partition + scaffold + verification method. RESOLVED.
- **D13** — DIAGNOSE input form + standalone adjudicator + failure-only test approach. RESOLVED.
- **D14** — Phase-3 INCREMENT authoring pattern (dual-mode dispatch + touched-set exclusion). RESOLVED.
- **D15** — RESOLVE-LOCAL increment calls (inherit-by-reference + foundational-route-out). RESOLVED.
- **D16** — MODEL-DATA increment calls (owned/referenced scope + carry-by-reference). RESOLVED.
- **D17** — MAP-NFR increment calls (inherit-governing-by-reference + frame-fidelity). RESOLVED.
- **D18** — MODEL-FLOWS increment calls (compose-against-frozen + flow-is-new). RESOLVED.
- **D19** — DERIVE-TESTS increment calls (inherit-tests-by-reference + flow-test-is-new + DAG-is-skeleton-only). RESOLVED.
- **D20** — pipeline idempotency & crash-safe resume (atomic writes + immutable-frozen + validate-frontier-on-resume + persist-gate-replies); binds BUILD-phase prompts + orchestrator. RESOLVED.

_D1–D20 resolved. Reopen forks in `_decisions.md`; add the index line here._

---

## Changelog maintenance rules (entries → `_changelog.md`)

> Shipped-prompt entries live in `_changelog.md` (append-only, COLD). These RULES stay hot — step 7 enforces them on every entry you append.
>
> **Per-prompt design + full test narratives live in the prompt `.md` files.** This log = one compact entry per shipped prompt: output, role, load-bearing invariants, ship status.
>
> **Anti-bloat rules (this file ballooned once; these prevent recurrence):**
> 0. **An entry is a POINTER, not a home — the root rule (mirrors AB1).** It holds ONLY what lives nowhere else: output path (one clause) + the ONE load-bearing line + verdict + golden ref. Everything else already has a home — full schema → the `.md` + golden fixture; the full invariant/Rules set → the `.md` mandate; decisions/rules → `D*`; test narrative + variance reasoning → the `.md`. If a fact has a home elsewhere, **cite by name, never re-record.** Re-recording "so it's not lost" IS the bloat instinct — it's not lost, it's in the `.md`. Rules 1–4 below are this rule applied per fact-type.
> 1. **No double-bookkeeping** — a shipped prompt is described ONCE, here. YOU ARE HERE holds only the CURRENT pointer (last shipped + next), never a stack of superseded full descriptions.
> 2. **One entry ≤ ~5 lines** — invariants as a terse semicolon list, not prose. Don't dump full output schemas (they live in the `.md` + golden fixture).
> 3. **Test result = verdict + one clause per REAL fix** (`PASS Nretries — what the retry killed`). No blow-by-blow rounds, FP adjudications, or schema materializations. **0 fixes → just `PASS (0 retries)`, no narrative** (a clean run has nothing to record — proof-of-work is not a fact).
> 4. **Variance note = one clause**, not a paragraph re-listing the invariants.
>
> **Protocol** (every shipped prompt unless noted): isolated test (fresh separate verifier, no self-grade) → fix the PROMPT never the artifact → windowed e2e (head-clamp: window head = phase-first authored step; mechanical/non-LLM upstream excluded; fresh session per step reads PRIOR on-disk output, no re-seed) → golden promoted to `_fixtures/`. Adversarial prompts tested BOTH directions (clean + planted-defect). e2e output with benign variance is NOT promoted; goldens regenerate from golden inputs.
