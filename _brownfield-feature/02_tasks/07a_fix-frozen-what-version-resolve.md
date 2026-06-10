# Task 07a — SPINE-FIX: resolve frozen-WHAT via lock, not hardcoded path

> Self-contained. Everything needed embedded below — do NOT hunt other files.

## TL;DR

Spine defect surfaced by Task 07 (P2+P3 VERIFY-ONLY). Every Phase-2/Phase-3 role binds its frozen-WHAT input to the literal path `.aprd/aprd.frozen.md` and treats `aprd.lock` as a freeze-signature only. Greenfield: `lock.artifact == aprd.frozen.md` → works by coincidence. Feature-add (P8 version bump): `lock.artifact == aprd.v2.frozen.md ≠ aprd.frozen.md` → every consumer walks the STALE v1 baseline; the feature (new `R*/AC*/E*/A*`) is invisible and `CLASS` re-reads `greenfield`. **Fix = REWRITE the input binding to resolve the frozen aPRD through `aprd.lock.artifact`** (read lock → open the file it names) across the 13 frozen-WHAT consumers, + a version-mismatch guard. Class-agnostic, single fix (P3 — fix spine once). Keeps P2/P3 posture = REUSE; NOT a feature-add overlay. Then re-run Task 07's checkpoint to PASS.

## Why this exists

Task 07 ran `DECISION-EXTRACT` clean-room on a feature-CR bench. It walked v1 `aprd.frozen.md`, reported `class: greenfield`, and re-extracted **DP1–DP10 = baseline forks already frozen as ADR-0001..0006** — never seeing the tag feature (R11–R13 / E8 / A14–A16). Downstream that re-mints ADRs for settled decisions = **BF1 immutability violation produced by the spine itself**. Phase-3 inherits identically (`MODEL-DATA` reads v1 `ENTITIES` E1–E7, never E8). The reuse-ledger claim "Phases 2+3 entirely free, run verbatim" is FALSE until the frozen-WHAT input resolves the CURRENT version. This is spine, not overlay — the lock already names the current artifact; consumers just don't follow it.

### Invariants protected
- **P8 / BF7** — change = new version; `aprd.lock` re-signed to the new version is the single source of "current frozen WHAT." Consumers must honor it.
- **BF1** — never re-decide a frozen ADR; scoping to the current version is what keeps Phase 2 additive.
- **P3** — engine stays class-agnostic; one shared rewrite, no per-class branch in the binding.
- **AB9 / P1** — fix is REWRITE of the input binding, never ADD an instruction. No new prose rule bolted on.

## DAG position

- **Deps:** Task 07 (surfaced the leak + exact roles/failure). No code dep — pure binding rewrite.
- **Downstream:** Task 07 PASS (re-run, §Verify) + Task 14 (BF-FIXTURE-ORACLE) — both consume a clean P2/P3 run. Must land BEFORE Task 07's golden can be recorded.
- **Sentinel:** all 13 roles resolve frozen-WHAT via `aprd.lock.artifact` (no hardcoded `aprd.frozen.md` as the WHAT path) + version-mismatch guard present + Task-07 re-run clean-room reads the CURRENT version (feature-add → `aprd.v2.frozen.md`; greenfield → `aprd.frozen.md`).

## Scope — the 13 frozen-WHAT consumers (+ 2 inheritors)

`prompts/02-adr/`: `DECISION-EXTRACT`, `OPTION-GEN`, `EVALUATE-DECIDE`, `RECONCILE`, `CRITIQUE`.
`prompts/03-hld/`: `MODEL-DATA`, `DERIVE-COMPONENTS`, `DEFINE-CONTRACTS`, `MODEL-FLOWS`, `MAP-NFR`, `DERIVE-TESTS`, `RESOLVE-LOCAL`, `RECONCILE-CRITIQUE`.
Inherit-by-scope (no direct aPRD read, fix by correctness of upstream): `TRIAGE`, `SYNTHESIZE-ADR`.

## The fix (REWRITE, do NOT add a parallel rule)

1. **Input binding.** In each consumer's frontmatter `inputs:`, the frozen-WHAT entry currently reads `path: ".aprd/aprd.frozen.md"`. REWRITE to: the frozen aPRD = the artifact named by `aprd.lock.artifact` (read `.aprd/aprd.lock` first; open the file it names). For greenfield that resolves to `aprd.frozen.md`; for feature-add to `aprd.v<N+1>.frozen.md`. Keep the lock entry's existing freeze-gate role; ADD its resolver role to the SAME line (rewrite the note, don't add a second input).
2. **Schema echo.** Any output field that echoes the source (e.g. `aprd_ref` in `DECISION-EXTRACT`) records the RESOLVED path, not the literal `aprd.frozen.md`.
3. **Guard (rewrite the existing lock guard, don't add).** `lock` present but the artifact it names is missing/unparseable → HALT. The current `lock_verified` semantics ("lock present + names frozen artifact") become real: verify the named artifact exists and is the one walked. Version-mismatch (walked file ≠ `lock.artifact`) is now impossible by construction, not a silent no-op.
4. **CLASS source.** `CLASS` is read from the RESOLVED frozen aPRD body (feature-add version carries `CLASS: feature-add`), so the playbook dispatch is correct. No separate class input.
5. **Lane.** Touch only the input binding + its guard + the source-echo field. Do NOT alter any role's logic, output schema shape, or `## Rules` substance. One home per fact (AB1) — the resolver lives in the input-binding note, restated nowhere.

## EMBEDDED CANON (for the verify discipline)

**Both-directions oracle:** a verify is trustworthy only if known-good PASSes AND a planted-defect FAILs. **Disk is the deliverable** — verify the artifact on disk, not the runner's chat reply. **Clean-room:** runner gets the prompt verbatim + the `_test_bench` path; no pipeline context leaks in. **Fix the spine once (P3):** if wiring a class forces an engine edit, the abstraction leaked — this task IS that one spine fix; never patch per-class.

## Verify (both-directions, two benches — feature-add AND greenfield)

Re-run the surfaced role(s) clean-room (step-runner, prompt verbatim) on each bench; verify the artifact on disk.

- **Feature-add known-good (the regression that exposed the leak):** bench = greenfield-clean trees + post-CR `.aprd` (`aprd.frozen.md` v1 + `aprd.v2.frozen.md` + `aprd.lock`→v2). `DECISION-EXTRACT` MUST now: read `aprd.v2.frozen.md`, emit `class: feature-add`, scope to NEW forks only (tag feature → all closed by A14–A16 → **zero new DPs / clean skip**, OR any new fork numbered fresh — NEVER DP re-mapping a frozen ADR). PASS.
- **Greenfield no-regression:** bench = `_fixtures/greenfield-clean/` as-is (`lock.artifact == aprd.frozen.md`). Same role MUST emit the SAME baseline result it always did (DP1–DP10, `class: greenfield`). Byte-equal to the existing golden. PASS — proves the rewrite is class-agnostic, greenfield untouched.
- **Planted defect — stale-version walk:** a copy that ignores `lock.artifact` and opens `aprd.frozen.md` on the feature-add bench → re-derives baseline DPs / `class: greenfield` → MUST FAIL (this is the exact pre-fix behavior; the oracle must now reject it).
- **Planted defect — missing named artifact:** `lock.artifact` names a file not on disk → MUST HALT (guard), never silently fall back to `aprd.frozen.md`.

## Then unblock Task 07 (its real DONE)

After this fix PASSes both benches: re-run Task 07 end-to-end — P2 (clean skip or fresh-numbered ADRs >0006) + P3 increment (new `.hld/slices/S<new>/`, `skeleton.frozen.md`+`skeleton.lock` byte-unchanged, seams declared at C1/CT2), record the golden, arm Task-07's three planted defects. Task 07 cannot record its golden until 07a lands.

## Lane / what NOT to do

- Do NOT add a feature-add delta block to any P2/P3 role — this is a class-agnostic spine fix, posture stays REUSE.
- Do NOT add a new input or a new prose rule — REWRITE the existing binding + guard in place (AB9/P1).
- Do NOT touch any frozen artifact or any role's logic/output-schema substance.
- Do NOT record a Task-07 golden from a pre-fix run — that launders the defect.

## DONE WHEN

- All 13 consumers resolve frozen-WHAT via `aprd.lock.artifact`; no role hardcodes `aprd.frozen.md` as the WHAT path; version-mismatch guard real (not a no-op).
- Feature-add bench: surfaced role reads `aprd.v2.frozen.md`, `class: feature-add`, scopes to new forks. PASS.
- Greenfield bench: byte-equal to existing golden (no regression). PASS.
- Both planted defects (stale-version walk, missing named artifact) FAIL/HALT.
- No feature-add overlay added; no new input/rule; frozen artifacts byte-unchanged.
- Task 07 re-runnable to PASS (golden recordable) — noted, executed under Task 07.
