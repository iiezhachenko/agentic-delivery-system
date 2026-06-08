# CLAUDE.md — always-on rules

> Standing rules for this repo, loaded every session. This = **canonical Agentic Delivery Pipeline project**: deliverable = library of executable AI prompts (`prompts/`), built against frozen artifact trees at root. Design canon (prompt scaffold, anti-bloat rules, coding idioms) lives in `.hld/`; requirements in `.aprd/`; decisions in `.adr/`; build frontier in `.roadmap/`. This file holds only what is always true.

## Register (governs ALL prose everywhere — narration AND artifacts AND code comments)

Think, write, reply terse like smart caveman. All technical substance stays. Only fluff dies. Caveman is mandate, not chat-only register — saves tokens at scale across whole tree.
- Drop: articles (a/an/the), filler (just/really/basically), pleasantries, hedging.
- Pattern: [thing] [action] [reason]. [next step]
- NOT: "Sure! I'd be happy to help you with that."
- YES: "Bug in auth middleware. Fix:"
- **Applies to:** chat/narration, AND all artifact prose (spec/ADR/prompt/doc bodies), AND code comments. Comments are prose — caveman governs them too.
- **Stays literal (not caveman, never corrupted):** structural data (JSON/YAML keys+values, schemas), identifiers (`R*`/`AC*`/`C*`/`ADR-*`/ids), code syntax itself. Caveman is register for prose; shortens comments, never breaks data or code.

## Standing conventions

- **One role = one prompt.** Role separation load-bearing (failure isolation). Split role further only when justified.
- **Artifacts land on disk.** Every prompt instructs agent to WRITE output to spec-defined path. Deliverable = file on disk, not chat reply.
- **Disk is source of truth.** All state derived from on-disk trees + `prompts/` + locks — never from hand-maintained tracker. Writes atomic; resume re-derives frontier.
- **IDs thread end-to-end:** `R → AC → S → ADR → C → CT → F → commit`.
- **LLM reconciles/verifies, never authors truth.** Cheapest-source-first; model specializes canon to contract, canon never source of truth.
- **Adversarial roles stay hostile** (GAP-DETECT, CRITIQUE, anti-cheat).
- **Author against DRY skeleton** (`.hld/skeleton/prompt-skeleton.md`): one home per fact (AB1–AB6 in `.hld/skeleton/coding-canon.md`). Substance invariant; only duplication dies.

## Immutability & verify

- **Never overwrite a frozen artifact.** `.aprd/aprd.frozen.md`, `.hld/skeleton.frozen.md`, `.adr/log/` bodies + every `*.lock` are signed + immutable. A change = new version + change request re-triggering affected downstream stages.
- **Verify before done.** Prompt judged by running it clean-room against `_fixtures/` (oracle): known-good prompt PASSes, planted-defect copy FAILs. Both directions must hold. Schema-valid + ID-threaded + acceptance satisfied = bar.

## Where things live

| Tree | Holds |
|---|---|
| `.aprd/` | frozen requirements (the WHAT) |
| `.adr/` | decisions — `log/<NNNN>.md` bodies + `adr-index.json` (the index, as JSON) + `adr.lock` |
| `.hld/` | design skeleton — prompt scaffold + coding canon (caveman, PR1–PR4, AB1–AB6) + components / build-dag / contracts |
| `.roadmap/` | build frontier (`roadmap.md` + `08-rerank.json`); position derived from disk sentinels |
| `prompts/` | THE DELIVERABLE — role library + `_orchestrator.md` + `_step-runner.md` |
| `code-canon/` | per-stack canon profiles (active: `agentic-delivery-pipeline.md`) |
| `_fixtures/` | oracle baseline (golden artifacts) |
