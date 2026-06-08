# Coding-canon profile — `agentic-delivery-pipeline`

> Per-stack coding-canon store (spec `04-automated-build-pipeline-spec.md` §10 — `code-canon.vN/`, canon lever applied at code layer). **Not a new registry** — profile slot Build phase reads to learn *how to scaffold, write, verify* one unit of deliverable. Selected by stack ADR `D21` (`stack = agentic-delivery-pipeline`).
>
> Sibling profiles a future project drops next to this one — `code-canon/terraform.md`, `code-canon/typescript.md` — fill same six fields against their own stack. Spine reads profile; never special-cases this one (invariant #1). Wiring a profile forces a spine edit → abstraction leaked; fix spine once (P3), not profile.

---

## The six fields

| Field | Resolves to (real, existing mechanism) | Source on disk |
|---|---|---|
| **scaffold** | **DRY prompt skeleton** — frontmatter + canonical caveman block (PR4) + `Role` / `Rules` / `[Discriminator]` / `Task steps` / `Escapes` / `Schema` / `Stop`. New prompts author against it (D10). | `.hld/skeleton/prompt-skeleton.md` (skeleton + canonical caveman block) |
| **coding canon** | **AB1–AB6** (anti-bloat authoring rules — one home per fact) + **PR1–PR4** (prompt-run contract: non-interactive, disk-in/disk-out, caveman verbatim) + caveman block. Prompt-domain idioms — analog of language's lint/format config + idiom library. | `.hld/skeleton/coding-canon.md` → AB1–AB6, PR1–PR4 |
| **"code" unit** | **One prompt `.md`** at `prompts/<NN-phase>/<ROLE>.md` (e.g. `prompts/03-hld/RECONCILE.md`). Atomic deliverable single Build invocation produces — analog of one `.py` module or one `.tf` file. | `prompts/<phase>/<ROLE>.md` |
| **oracle materialization** | **Golden fixtures in `_fixtures/`** + **declared output schema per role** (artifact each role writes, with frontmatter `outputs:` path + inline-comment schema). Fixture product = oracle, *not* separate "is this prompt good?" judge. | `_fixtures/greenfield-clean/**`, `_fixtures/greenfield-build-reds/**`; per-role `outputs:` + schema in each `.md` |
| **build idiom** | **Synthesize prompt text from its HLD-increment contract + per-role spec §.** Contract (what this prompt must consume/produce, its mode, its membership gate) comes from Phase-3 increment design; role's mandate/schema comes from matching `.aprd/specs/0N` spec section. LLM specializes canon to contract — canon never source of truth (B11). | `.aprd/specs/00–04` per-role §; increment contract (D14 dual-mode pattern, D15–D19 per-role calls) |
| **verify mechanism** | **Clean-room runner simulation** — fresh **Sonnet runner** (`.claude/agents/step-runner.md`, Sonnet/High) handed prompt **verbatim** + `_test_bench` project root, no pipeline context, must emit **schema-valid, ID-threaded** artifact matching golden on **value**. Run **both directions**: known-good prompt PASSes, planted-defect copy FAILs. **Register, do not reinvent** — harness already exists + proven (DERIVE-TESTS twin re-tested green through it). **AND authoring-quality gate** — Layer-1 lint + Layer-2 ECONOMY-AUDIT on the artifact prose BEFORE the clean-room sim (cheapest-source-first P5). Both write disk verdicts (`lint.json`, `economy-audit.json`); both run both-directions; `blocked` at either layer short-circuits the sim → re-author. | `_test_bench/`, `.claude/agents/step-runner.md`, `prompts/_orchestrator.md` STEP 4 (per-step clean-room); `tools/economy-lint/`, `prompts/_economy-audit.md` (the gate) |

---

## Verbatim shape (usage §A1 Step 2)

```
scaffold              the DRY prompt skeleton (frontmatter + caveman block + Role/Rules/Task/Schema/Stop)
coding canon          AB1–AB6 + PR1–PR4 + caveman block (the prompt-domain idioms)
"code" unit           one prompt .md at prompts/<NN-phase>/<ROLE>.md
oracle materialization golden fixtures in _fixtures/ + the declared output schema per role
build idiom           synthesize the prompt text from its HLD-increment contract + the per-role spec §
verify mechanism      clean-room runner simulation (a fresh Sonnet runner gets the prompt verbatim +
                      a _test_bench root, must emit a schema-valid, ID-threaded artifact; both directions),
                      PRECEDED by the authoring-quality gate: Layer-1 lint + Layer-2 ECONOMY-AUDIT
                      (lint.json, economy-audit.json), both-directions, blocked short-circuits the sim
```

---

## Notes binding profile to engine

- **Verify is value-first, parity-second.** Prompt judged by whether clean-room run delivers correct fixture value (right downstream artifact, ID-threaded, schema-valid, acceptance satisfied) — behavior over byte-equality (usage §C1). Parity vs hand-authored twin = convenience cross-check, not gate.
- **Both-directions discrimination mandatory:** known-good PASS + planted-defect FAIL, proving verifier discriminates before any self-build trusted.
- **Outputs promoted, never written in place.** Self-authored prompt lands in scratch path, verified clean-room, only on gate-accept promoted to `prompts/` (shipped prompts immutable — invariant #2).
- **No new state file.** Status derived from disk (scan `prompts/` + `_fixtures/` + locks); profile names no tracker (D20). `lint.json` + `economy-audit.json` are gate VERDICTS (disk-in/disk-out, like every gate), NOT trackers — the next STEP-0 scan re-derives from them, no status pointer / changelog added.
- **Authoring-quality gate = ONE shared auditor, five callers (no copy-5×).** Every phase gate (00-aprd VERIFY/CRITIQUE, 01-roadmap SEQUENCE-REVIEW, 02-adr CRITIQUE, 03-hld RECONCILE-CRITIQUE, 04-build VERIFY-OUTPUT/CRITIQUE) DELEGATES its economy dimension to the shared `ECONOMY-AUDIT` (`prompts/_economy-audit.md`, the general `{artifact, economy-canon}` capability — frontmatter `phase: every-verify`). ONE home for the check, five invocation points; copying the check into each gate would itself break AB1. Lint thresholds per artifact-type (prompt/adr/aprd/hld/roadmap) come from THIS profile, not hard-coded in a gate. A bloat/starvation finding routes to the PRODUCING stage's re-author; `fix` is `DELETE|REWRITE`, never `ADD` — no patch path (the routing keystone).
