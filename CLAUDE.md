# CLAUDE.md — always-on rules

> The standing rules for working in this repo, loaded every session. This is a **canonical Agentic Delivery Pipeline project**: the deliverable is a library of executable AI prompts (`prompts/`), built against the frozen artifact trees at the root. The design canon (prompt scaffold, anti-bloat rules, coding idioms) lives in `.hld/`; the requirements live in `.aprd/`; the decisions live in `.adr/`; the build frontier lives in `.roadmap/`. This file holds only what is always true.

## Register (governs ALL prose everywhere — narration AND artifacts AND code comments)

Think, write, reply terse like smart caveman. All technical substance stays. Only fluff dies. Caveman is the mandate, not a chat-only register — it saves tokens at scale across the whole tree.
- Drop: articles (a/an/the), filler (just/really/basically), pleasantries, hedging.
- Pattern: [thing] [action] [reason]. [next step]
- NOT: "Sure! I'd be happy to help you with that."
- YES: "Bug in auth middleware. Fix:"
- **Applies to:** chat/narration, AND all artifact prose (spec/ADR/prompt/doc bodies), AND code comments. Comments are prose — caveman governs them too.
- **Stays literal (not caveman, never corrupted):** structural data (JSON/YAML keys+values, schemas), identifiers (`R*`/`AC*`/`C*`/`ADR-*`/ids), and code syntax itself. Caveman is a register for prose; it shortens comments, never breaks data or code.

## Standing conventions

- **One role = one prompt.** Role separation is load-bearing (failure isolation). Split a role further only when justified.
- **Artifacts land on disk.** Every prompt instructs its agent to WRITE its output to the spec-defined path. The deliverable is the file on disk, not the chat reply.
- **Disk is the source of truth.** All state is derived from the on-disk trees + `prompts/` + locks — never from a hand-maintained tracker. Writes are atomic; resume re-derives the frontier.
- **IDs thread end-to-end:** `R → AC → S → ADR → C → CT → F → commit`.
- **LLM reconciles/verifies, never authors truth.** Cheapest-source-first; the model specializes canon to a contract, canon is never the source of truth.
- **Adversarial roles stay hostile** (GAP-DETECT, CRITIQUE, anti-cheat).
- **Author against the DRY skeleton** (`.hld/skeleton/prompt-skeleton.md`): one home per fact (AB1–AB6 in `.hld/skeleton/coding-canon.md`). The substance is invariant; only duplication dies.

## Immutability & verify

- **Never overwrite a frozen artifact.** `.aprd/aprd.frozen.md`, `.hld/skeleton.frozen.md`, the `.adr/log/` bodies and every `*.lock` are signed + immutable. A change is a new version + change request that re-triggers affected downstream stages.
- **Verify before done.** A prompt is judged by running it clean-room against `_fixtures/` (the oracle): a known-good prompt PASSes, a planted-defect copy FAILs. Both directions must hold. Schema-valid + ID-threaded + acceptance satisfied is the bar.

## Where things live

| Tree | Holds |
|---|---|
| `.aprd/` | frozen requirements (the WHAT) |
| `.adr/` | decisions — `log/<NNNN>.md` bodies + `adr-index.json` (the index, as JSON) + `adr.lock` |
| `.hld/` | design skeleton — prompt scaffold + coding canon (caveman, PR1–PR4, AB1–AB6) + components / build-dag / contracts |
| `.roadmap/` | the build frontier (`roadmap.md` + `08-rerank.json`); position derived from disk sentinels |
| `prompts/` | THE DELIVERABLE — the role library + `_orchestrator.md` + `_step-runner.md` |
| `code-canon/` | per-stack canon profiles (active: `agentic-delivery-pipeline.md`) |
| `_fixtures/` | the oracle baseline (golden artifacts) |
