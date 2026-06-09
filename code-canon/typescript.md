# Coding-canon profile — `typescript`

> Per-stack coding-canon store (spec `04-automated-build-pipeline-spec.md` §10 — `code-canon.vN/`, canon lever at code layer). **Sibling of `agentic-delivery-pipeline.md`**, NOT a new registry — fills same six fields against a real TS toolchain. Selected by stack ADR `D23` (`stack = typescript`). Proof artifact for M12 Part 2: spine reads THIS profile unchanged; wiring it forced no spine edit (invariant #1) → deliverable-agnostic abstraction held. Spine special-cases neither profile; if it did, abstraction leaked → fix spine once (P3), never patch profile.

---

## The six fields

| Field | Resolves to (real, existing mechanism) | Source on disk |
|---|---|---|
| **scaffold** | **DRY project skeleton** — `tsconfig.json` (`strict: true`, `noEmit` for typecheck), `package.json` (test + typecheck scripts), `src/<area>/<module>.ts` module layout, one barrel `index.ts` per area. New modules author against it. Skeleton = frozen `.hld/skeleton/` (components/build-dag/contracts) of the TS project. | `<proj>/tsconfig.json`, `<proj>/package.json`, `<proj>/.hld/skeleton/*` |
| **coding canon** | **TS idioms** — `strict` everywhere (no implicit `any`, `exactOptionalPropertyTypes`), exported symbol = one home per fact (no re-export drift), pure functions where possible, errors via discriminated unions not `throw`-strings, ESLint+Prettier as the format/lint config. Analog of the prompt-stack's AB1–AB9 + caveman block. | `<proj>/.eslintrc.json`, `<proj>/.prettierrc`, `<proj>/.hld/skeleton/coding-canon.md` |
| **"code" unit** | **One `.ts` module** at `src/<area>/<module>.ts` — the atomic deliverable a single Build invocation produces. Analog of one prompt `.md` (this self-host repo) or one `.tf` resource (terraform profile). | `src/<area>/<module>.ts` |
| **oracle materialization** | **Declared types/interfaces (the contract) + test fixtures** — each module ships its public type signature (the schema) + a colocated `*.test.ts` whose fixtures = the golden. Fixture product = oracle, not a separate "is this code good?" judge. | `src/<area>/<module>.ts` exported types; `src/<area>/<module>.test.ts` (`node:test`/`vitest` fixtures) |
| **build idiom** | **Synthesize TS source from its HLD-increment contract + per-role spec §.** Contract (types in/out, the acceptance the module must satisfy) comes from Phase-3 increment design; mandate from the matching `.aprd/specs/0N` §. LLM specializes canon to contract — canon never source of truth (B11). | `.aprd/specs/00–04` per-role §; increment contract (D14 dual-mode; D15–D19 calls) |
| **verify mechanism** | **`tsc --noEmit` (typecheck) THEN `node --test`/`vitest` (contract+unit tests) against the LIVE build** — the prompt-domain clean-room sim's analog under a real toolchain (D21 names `pytest` as the `stack=python` analog; this is the `stack=typescript` one). Module PASSes iff typecheck clean AND tests green AND acceptance satisfied. **Both directions** mandatory: known-good module PASSes, planted-defect copy FAILs (the verifier must discriminate). **PRECEDED by deterministic pre-filters** (P5 cheapest-first, D22): Layer-1 `eslint` + `prettier --check` + the shared `tools/economy-lint/` parameterized `{artifact-type: ts, thresholds below}` → `lint.json`; `blocked` short-circuits the tsc/test pass → re-author. Layer-2 ECONOMY-AUDIT (`prompts/_economy-audit.md`) on residue. **Register tools; invent no new judge** (B4). | `<proj>/package.json` scripts (`typecheck`, `test`); `tools/economy-lint/`, `prompts/_economy-audit.md`; the runner = `step-runner` agent shelling the scripts |

---

## Verbatim shape (usage §A1 Step 2)

```
scaffold              tsconfig (strict, noEmit) + package.json scripts + src/<area>/<module>.ts layout
coding canon          strict TS idioms + ESLint/Prettier + one-home-per-exported-symbol
"code" unit           one .ts module at src/<area>/<module>.ts
oracle materialization declared types/interfaces (the schema) + colocated *.test.ts fixtures (the golden)
build idiom           synthesize the TS source from its HLD-increment contract + the per-role spec §
verify mechanism      tsc --noEmit (typecheck) THEN node --test / vitest against the live build; both
                      directions (known-good PASS + planted-defect FAIL), PRECEDED by the deterministic
                      pre-filter gate: eslint + prettier --check + economy-lint {artifact-type: ts}
                      (lint.json), then ECONOMY-AUDIT; blocked short-circuits the tsc/test pass
```

---

## Notes binding profile to engine

- **Verify is value-first, parity-second.** Module judged by whether typecheck+tests deliver correct acceptance (right behavior, types satisfied), not byte-equality to a hand-authored twin (usage §C1). Parity = convenience cross-check, not gate.
- **Both-directions discrimination mandatory:** known-good PASS + planted-defect FAIL, proving the verifier (the `tsc`+test pass) discriminates before any self-build trusted.
- **Outputs promoted, never written in place.** Self-authored module lands in a scratch path, verified, only on gate-accept promoted to `src/` (shipped modules immutable — invariant #2).
- **No new state file.** Status derived from disk (scan `src/` + tests + locks); profile names no tracker (D20). `lint.json` + `economy-audit.json` are gate VERDICTS (disk-in/disk-out), not trackers.
- **Same orchestrator, same role prompts.** IMPLEMENT authors the `.ts` unit; VERIFY-OUTPUT runs the profile's verify mechanism; the deterministic pre-filter is the registered tool layer (D22). Spine reads `verify mechanism`/`build idiom` from THIS field table — never hard-codes `pytest` or the clean-room sim. That read-from-target is the whole agnosticism abstraction.

## Stack profile contract (universal — every sibling profile MUST honor)

Economy is engine-universal (spec-00 `P13` + `A-ECON`/`INV-ECON`, §2.1), NOT owned here. This profile MUST:
- **(a) CITE `P13` + `A-ECON`** — never re-state the rule (meta-AB1: economy rule has ONE home = the spec).
- **(b) fill the stack-local "one home" definition** — what unit a fact lives in ONCE for THIS stack.
- **(c) supply per-artifact-type lint thresholds** — `lint.mjs` reads `{artifact-type, thresholds}`.

- **This stack's "one home" (field b) = one exported symbol in one module.** A fact (type, constant, function) lives in exactly one `export` in one `src/<area>/<module>.ts` — the TS analog of one prompt SECTION / one `.tf` resource. Re-export drift (same fact exported from two barrels) = the bloat AB1 forbids. Cites `P13`/`A-ECON`, never re-owns.
- **Per-artifact-type lint thresholds (field c).** Shared `tools/economy-lint/lint.mjs` reads `{artifact-type: ts, thresholds}`; RULE (economy) fixed + universal, only this MEASURE flexes:

  | artifact-type | token warn/block | dup-phrase warn/block | checks |
  |---|---|---|---|
  | ts (module) | 4000 / 8000 | 3 / 4 | C1·C4·C7 (one-home/dup-export) ; tsc+eslint own the structural/format checks (C2/C3/C5/C6 = prompt-frontmatter only, skipped) |

  C1 budgets TOKENS not lines (lines gameable). Tune per type w/ justification.
- **New stack REUSES the shared auditor — never re-authors it.** This profile does NOT write its own auditor/lint; it PARAMETERIZES `prompts/_economy-audit.md` + `tools/economy-lint/` with `{artifact-type: ts, thresholds}`. ONE auditor, every project. `INV-ECON` is cut into every project's foundation-cut (spec-01 §5.7 / `FOUNDATION-CUT`), so VERIFY-OUTPUT's NFR check measures economy in any stack — not wired per project.
