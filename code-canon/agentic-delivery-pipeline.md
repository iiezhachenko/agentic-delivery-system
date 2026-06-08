# Coding-canon profile — `agentic-delivery-pipeline`

> Per-stack coding-canon store (spec `04-automated-build-pipeline-spec.md` §10 — `code-canon.vN/`, the canon lever applied at the code layer). **Not a new registry** — this is the profile slot the Build phase reads to learn *how to scaffold, write, and verify* one unit of deliverable. Selected by the stack ADR `D21` (`stack = agentic-delivery-pipeline`).
>
> Sibling profiles a future project drops next to this one — `code-canon/terraform.md`, `code-canon/typescript.md` — fill the same six fields against their own stack. The spine reads the profile; it never special-cases this one (invariant #1, migration-spec §5). If wiring a profile forces a spine edit, the abstraction leaked — fix the spine once (P3), not the profile.

---

## The six fields

| Field | Resolves to (real, existing mechanism) | Source on disk |
|---|---|---|
| **scaffold** | The **DRY prompt skeleton** — frontmatter + canonical caveman block (PR4) + `Role` / `Rules` / `[Discriminator]` / `Task steps` / `Escapes` / `Schema` / `Stop`. New prompts author against it (D10). | `_rules.md` → *Standard prompt skeleton* + *Canonical caveman block* |
| **coding canon** | **AB1–AB6** (anti-bloat authoring rules — one home per fact) + **PR1–PR4** (prompt-run contract: non-interactive, disk-in/disk-out, caveman verbatim) + the caveman block. The prompt-domain idioms — the analog of a language's lint/format config + idiom library. | `_rules.md` → AB1–AB6, PR1–PR4 |
| **"code" unit** | **One prompt `.md`** at `prompts/<NN-phase>/<ROLE>.md` (e.g. `prompts/03-hld/RECONCILE.md`). The atomic deliverable a single Build invocation produces — the analog of one `.py` module or one `.tf` file. | `prompts/<phase>/<ROLE>.md` |
| **oracle materialization** | The **golden fixtures in `_fixtures/`** + the **declared output schema per role** (the artifact each role writes, with its frontmatter `outputs:` path + inline-comment schema). The fixture product is the oracle — *not* a separate "is this prompt good?" judge. | `_fixtures/greenfield-clean/**`, `_fixtures/greenfield-build-reds/**`; per-role `outputs:` + schema in each `.md` |
| **build idiom** | **Synthesize the prompt text from its HLD-increment contract + the per-role spec §.** The contract (what this prompt must consume/produce, its mode, its membership gate) comes from the Phase-3 increment design; the role's mandate/schema comes from the matching `_initial_design/0N` spec section. The LLM specializes canon to the contract — canon is never the source of truth (B11). | `_initial_design/00–04` per-role §; the increment contract (D14 dual-mode pattern, D15–D19 per-role calls) |
| **verify mechanism** | **Clean-room runner simulation** — a fresh **Sonnet runner** (`.claude/agents/step-runner.md`, Sonnet/High) is handed the prompt **verbatim** + a `_test_bench` project root, no pipeline context, and must emit a **schema-valid, ID-threaded** artifact that matches the golden on **value**. Run **both directions**: a known-good prompt PASSes, a planted-defect copy FAILs. **Register, do not reinvent** — this harness already exists and is proven (M0 re-tested the DERIVE-TESTS twin green through it). | `_test_bench/`, `.claude/agents/step-runner.md`, `_prompt-run.md` (per-step), `_pipeline-run.md` (full chain) |

---

## Verbatim shape (usage §A1 Step 2)

```
scaffold              the DRY prompt skeleton (frontmatter + caveman block + Role/Rules/Task/Schema/Stop)
coding canon          AB1–AB6 + PR1–PR4 + caveman block (the prompt-domain idioms)
"code" unit           one prompt .md at prompts/<NN-phase>/<ROLE>.md
oracle materialization golden fixtures in _fixtures/ + the declared output schema per role
build idiom           synthesize the prompt text from its HLD-increment contract + the per-role spec §
verify mechanism      clean-room runner simulation (a fresh Sonnet runner gets the prompt verbatim +
                      a _test_bench root, must emit a schema-valid, ID-threaded artifact; both directions)
```

---

## Notes binding the profile to the engine

- **Verify is value-first, parity-second.** A prompt is judged by whether the clean-room run delivers correct fixture value (right downstream artifact, ID-threaded, schema-valid, acceptance satisfied) — behavior over byte-equality (usage §C1). Parity vs a hand-authored twin is a convenience cross-check, not the gate.
- **Both-directions discrimination is mandatory at the cutover gate** (migration-spec §7): known-good PASS + planted-defect FAIL, proving the verifier discriminates before any self-build is trusted.
- **Outputs are promoted, never written in place.** A self-authored prompt lands in a scratch path, is verified clean-room, and only on gate-accept is promoted to `prompts/` (shipped prompts are immutable — invariant #2).
- **No new state file.** Status is derived from disk (scan `prompts/` + `_fixtures/` + locks); the profile names no tracker (D20).
