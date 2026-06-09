# M12 — Full validation: structural conformance + deliverable-agnosticism — tasks (SELF-CONTAINED)

> **Self-contained:** all context in THIS file. Do NOT read `migration-spec.md` (gone after M11.14) or other M-task files. **Precondition: M11 cleared** (M11.1–M11.14 — tree caveman-normalized, `_self-host-migration/` deleted). The final milestone — proves the repo is canonical AND the engine is deliverable-agnostic (not agentic-delivery-pipeline-special). **NO COMMIT** unless explicitly asked.

## Goal

Two independent proofs:
1. **Structural conformance** — the on-disk tree is *identical to what the pipeline emits for any project* (a canonical Agentic Delivery Pipeline layout), with zero strays, zero migration trace, zero deleted-source refs, one register (caveman).
2. **Agnosticism** — a *second* canon profile (different deliverable type) runs the **unchanged** spine and passes its own verify. Any forced spine edit = a leaked abstraction.

## Part 1 — structural conformance

Diff the repo tree against the canonical layout below. The deliverable here is a prompt library, so `prompts/` plays the `src/` role; everything else is the same canonical skeleton a code project gets.

### Canonical target tree (the conformance reference)
```
agentic-systems/                  ← canonical pipeline project (deliverable = prompts)
├── CLAUDE.md                     ← always-on rules
├── .aprd/                        ← frozen requirements
│   ├── aprd.frozen.md + aprd.lock
│   └── specs/00..06-*.md
├── .adr/                         ← decisions
│   ├── log/<NNNN>.md
│   ├── adr.lock + adr-index.json   (index here, NOT a markdown header)
│   └── drafts/
├── .hld/                         ← design skeleton
│   ├── skeleton.frozen.md + skeleton.lock
│   └── skeleton/{components,build-dag,contracts}.json + coding-canon.md + prompt-skeleton.md
├── .roadmap/                     ← roadmap + RE-RANK input
│   └── roadmap.md + 08-rerank.json
├── prompts/<NN-phase>/<ROLE>.md  ← THE DELIVERABLE (the "src/"): role library + _orchestrator.md + _step-runner.md
├── code-canon/                   ← per-stack canon store (agentic-delivery-pipeline.md; +2nd profile in Part 2)
├── _fixtures/                    ← the oracle baseline
├── docs/                         ← operating manual (workflow + usage guides, clean + caveman)
├── .claude/{settings.json,agents/step-runner.md,skills/self-host/SKILL.md}
├── .kiro/{agents/selfhost.json,steering/{00-exclusive,10-self-host}.md}
└── .gitignore                    ← only the clean-room sandbox `_test_bench/` (gitignored working dir)
```

### MUST NOT appear (zero hits)
Strays/cache/scaffolding: `_self/`, `freeze.mjs`, `freeze-check.mjs`, `_decisions.md`, `_rules.md`, `_initial_design/`, `agent.log`, `_self-host-scratch/`, `_pipeline-run-mode{A,B}.md`, `_self-host-migration/`, `_m2-acceptance-mock/`. Plus: zero migration-vocabulary refs, zero deleted-source path refs (`_decisions.md`/`_rules.md`/`_initial_design`), one register (caveman) tree-wide.

### Two reference points to diff against
1. A clean fixture's artifact layout: `_fixtures/greenfield-clean/{.aprd,.adr,.hld,.roadmap,.build,src}` — for the artifact trees.
2. `docs/generic-usage-guide.md` §A1 (Claude) / §B1 (Kiro) deploy layouts — for the harness wiring.

> Canonical deliverable-difference (NOT strays): `prompts/` instead of `src/`; `_fixtures/` as the oracle instead of an in-tree `.build/skeleton/oracle/`; `code-canon/agentic-delivery-pipeline.md` as the active stack profile. Each is a legitimate prompts-not-code difference.

### Part-1 checks
- `ls` root = canonical members only (+ gitignored `_test_bench/`); no stray.
- `.aprd/ .adr/ .hld/ .roadmap/` committed source (un-gitignored), schema-valid against their consuming prompts.
- 3 locks valid (recompute == lock): `aprd`, `adr` (count 21), `skeleton`.
- grep deleted-source paths = 0; grep migration vocabulary = 0 (carve-outs: NFR `M*` ids, domain `migration`/`parity`, engine `frozen`/`freeze`/`skeleton`/`self-host`).
- register: no `Exception: artifact content …` carve-out line anywhere; spot-check caveman.

## Part 2 — agnosticism (second canon profile through the unchanged spine)

After the agentic-delivery-pipeline loop drains, prove the spine is deliverable-agnostic:
1. Author a **second** canon profile: `code-canon/terraform.md` OR `code-canon/typescript.md` — same 6-field shape as `code-canon/agentic-delivery-pipeline.md` (scaffold, canon, "code" unit, oracle materialization, build idiom, verify mechanism). Add its **stack ADR** (next free id, e.g. `D22`/`ADR-0022`) pinning `stack = <terraform|typescript>`.
2. Run a tiny greenfield through the **UNCHANGED** spine (the same orchestrator + role prompts) targeting the new profile.
3. **Pass condition:** it passes its own verify (the profile's verify mechanism — e.g. `terraform validate`/`tsc`+tests, NOT the clean-room sim) with **zero engine edits**.

**Leak rule (invariant #1):** if wiring the 2nd profile forces a spine edit, the deliverable-agnostic abstraction leaked. Fix the spine **once** (the abstraction, P3) so verify-method/build-idiom is read from the target — NEVER patch the profile to dodge it. Re-run.

## Tasks

| # | Task | Acceptance | Status |
|---|---|---|---|
| T0 | Confirm M11 cleared (tree caveman + canonical; `_self-host-migration/` gone) | M11.14 done | ☑ M11.14 cleared; dir-delete (T2/T3) DEFERRED by design → runs AFTER M12 (spec self-conflict: delete wipes self-contained `M12-tasks.md`). Tree caveman + canonical. |
| T1 | Part-1 structural conformance: diff tree vs canonical layout + 2 reference points | `ls` canonical-only; 3 locks valid; grep deleted-source=0; grep migration=0; one register | ☑ PASS — see run log. 2 stale-spec reconciles (legit, post-date M12): `tools/` now canonical (ADR-0022/D22); adr count 22 not "21". |
| T2 | Part-2: author 2nd canon profile + its stack ADR | profile has all 6 fields → real mechanisms; stack ADR pins the stack | ☑ `code-canon/typescript.md` (6 fields, real toolchain) + `ADR-0023`/`D23` pins `stack=typescript`; adr re-locked v6 count 23 (recompute==lock). |
| T3 | Part-2: run tiny greenfield through the UNCHANGED spine; pass its own verify | passes with zero engine edits; any forced spine edit fixed once as the abstraction (P3), not a profile patch | ☑ tiny TS greenfield (`_test_bench/ts-greenfield/`) PASS `tsc --noEmit` + `node --test` (5/5); both directions held; ZERO spine edits (no forced edit → no leak). |

## M12 acceptance — MET when

- [x] tree matches canonical structure: zero strays, zero migration trace, zero deleted-source refs, uniform caveman register, 3 locks valid
- [x] a second deliverable type ships through the unchanged engine and passes its own verify

## Migration DONE

When M12 clears: the operating-manual docs in `docs/` are no longer a future-state description — they are the literal manual for how the system builds itself, inside a repo indistinguishable from any other canonical Agentic Delivery Pipeline project, and the spine is proven deliverable-agnostic.

```
M12 [x] structural-conformance check passes (tree == canonical; zero strays, zero migration trace, zero deleted-source refs, one caveman register)
    [x] second canon profile runs the unchanged spine and passes its own verify
```

## Notes

- **NO COMMIT** unless explicitly asked. Caveman governs this file too.
- Part 2 is greenfield + additive (new profile, new stack ADR, throwaway test project) — it never edits the spine; a forced edit is the signal, not the fix.

### Run log (2026-06-09) — M12 MET

**Stale-spec reconcile (both legit, both post-date M12 authoring — NOT strays/leaks):**
- `tools/` now a canonical root member, sanctioned by **ADR-0022 / D22** (deterministic helper tools = component class; first instance `tools/economy-lint/`). M12's canonical tree drawing predates D22 → `tools/` reads as canonical, not stray.
- adr count = **22** at Part-1 (lock v5), not M12 T1's literal "21" — D22 added ADR-0022 after M12 authored. Part 2 adds ADR-0023 → count **23** (lock v6). All additive (task §Notes: Part 2 is additive).
- `_self-host-migration/` still present = M11.14 T2/T3 DEFERRED delete (spec self-conflict: delete wipes self-contained `M12-tasks.md`). Delete = absolute final act, runs after M12.

**Part 1 — structural conformance: PASS**
- `ls` root = canonical members only + `tools/` (D22) + `_test_bench/` (gitignored sandbox) + `_self-host-migration/` (deferred delete). MUST-NOT-appear strays scan = 0 (incl. `_authoring-improvements/` — removed at commit `76b3376`).
- 3 locks recompute == lock: **aprd** `678590f9…` (v3) ✓; **adr** `509c2bb4…` (v5, count 22) ✓ → post-Part-2 `db94b71b…` (v6, count 23) ✓; **skel** `46e4e73c…` (v4, 5-artifact documented algo — M11.14's "+skeleton.frozen.md" formula was stale; lock's own `content_sha256_algo` is authoritative) ✓.
- grep deleted-source paths (`_decisions.md|_rules.md|_initial_design`) = **0**. grep migration vocab = **0** (`"id":"M1"` + MAP-NFR `M*` = NFR-id carve-outs, legit; `D-[1-6]` = 0). OLD register carve-out line `Exception: artifact content …` = **0** tree-wide. One register (caveman).

**Part 2 — agnosticism: PASS (zero spine edits → no leak)**
- T2: `code-canon/typescript.md` fills all 6 fields → real mechanisms (scaffold=tsconfig strict+layout; canon=strict-TS idioms+ESLint/Prettier; unit=one `.ts` module; oracle=declared types+colocated `*.test.ts` fixtures; build-idiom=synthesize from HLD-increment+spec §; verify=`tsc --noEmit`+`node --test`, pre-filtered by registered tools per D22). Honors universal contract (cite P13/A-ECON; one-home=one exported symbol; per-type lint thresholds `{artifact-type: ts}`). `ADR-0023`/`D23` pins `stack=typescript`; index + lock updated, recompute==lock.
- T3: tiny greenfield `_test_bench/ts-greenfield/` (`money/split.ts` + oracle `split.test.ts`). Verify mechanism = the profile's own (`tsc`+tests), NOT the clean-room sim.
  - **known-good:** `tsc --noEmit` PASS; `node --test` 5/5 pass.
  - **planted-defect (both directions held):** behavior bug (remainder dropped) → tests 2/5 FAIL; type-contract bug → `tsc` FAIL (TS2322 ×2). Verifier discriminates.
  - **Leak check:** `git status` on spine (`prompts/ .hld/ tools/ .claude/ .kiro/ docs/ .aprd/ CLAUDE.md`) = EMPTY. No forced spine edit → abstraction held (invariant #1). Spine read verify-method/build-idiom FROM the target profile; never special-cased. `tools/economy-lint/selftest.mjs` still green (untouched).

**Verdict: M12 MET.** Tree == canonical (3 locks valid, zero strays/migration/deleted-source refs, one register) AND a second deliverable type (TypeScript) shipped through the UNCHANGED engine and passed its own verify. Migration DONE pending the M11.14 closing-act delete of `_self-host-migration/` (the absolute final act).
