# CLAUDE.md — always-on rules (generic delivery)

> Standing rules, loaded every session. This = Agentic Delivery Pipeline runtime driving an end-user project rough-request→verified-software. **Deliverable = USER's software.** Pipeline GENERATES design trees (`.aprd .adr .hld .roadmap`) FRESH in user repo across 5 phases. Consumer = client / product-owner, no eng background, drives via 3 checkpoints (A questions · B roadmap · C demo). Finish line = accepted demo on staging. This file holds only what stays always true.

# Register

Think, write, reply terse like smart caveman. All technical substance stays. Only fluff dies. Caveman is mandate, not chat-only register — saves tokens at scale across whole tree.
- Drop: articles (a/an/the), filler (just/really/basically), pleasantries, hedging.
- Pattern: [thing] [action] [reason]. [next step]
- NOT: "Sure! I'd be happy to help you with that."
- YES: "Bug in auth middleware. Fix:"
- **Applies ABSOLUTE — NO exception:** chat/narration, ALL artifact prose (spec/ADR/HLD/prompt/doc bodies), code comments — incl human-facing artifacts. (Condensed reads faster; every artifact is also agent-ingested context.) Need different prose for a human consumer → a separate agent OUTSIDE the pipeline restyles that one artifact; NEVER relax caveman inside the system.
- **Stays literal (not caveman, never corrupted):** structural data (JSON/YAML keys+values, schemas), identifiers (`R*`/`AC*`/`C*`/`ADR-*`/ids), code syntax itself. Caveman is register for prose; shortens comments, never breaks data or code.
- **Register + Economy = two SEPARATE absolutes, both consumer-independent.** Register = terse style (this section). Economy = substance discipline (one home per fact · every statement earns its place · single interpretation). Independent: terse-but-bloated still fails (economy), economical-but-full-prose still fails (register). Both bind every artifact.

## Phase order — all 5 run LIVE

understand→plan→decide→design→build. Pipeline runs every phase live against user request — no frozen subset. Brownfield = read existing user code first, then same loop. Each phase WRITES its tree into user repo:
- understand → `.aprd/` (the WHAT; specs + Mission).
- plan → `.roadmap/` (build frontier).
- decide → `.adr/` (decisions).
- design → `.hld/` (design skeleton + components + contracts).
- build → user software + verified slices.

## Standing conventions

- **One role = one prompt.** Role separation load-bearing (failure isolation). Split role further only when justified.
- **Artifacts land on disk.** Every prompt instructs agent to WRITE output to spec-defined path. Deliverable = file on disk, not chat reply.
- **Disk is source of truth.** All state derived from on-disk trees + locks — never from hand-maintained tracker. Writes atomic; resume re-derives frontier.
- **IDs thread end-to-end:** `R → AC → S → ADR → C → CT → F → commit`.
- **LLM reconciles/verifies, never authors truth.** Cheapest-source-first; model specializes canon to contract, canon never source of truth.
- **Adversarial roles stay hostile** (GAP-DETECT, CRITIQUE, anti-cheat).
- **Author against DRY skeleton:** one home per fact (AB1–AB6). Substance invariant; only duplication dies.

## Immutability & verify

- **Never overwrite a frozen artifact.** Once a tree freezes (`*.lock` signed), it is immutable. A change = new version + change request re-triggering affected downstream stages.
- **Verify before done.** Prompt judged by running it clean-room against fixtures (oracle): known-good PASSes, planted-defect copy FAILs. Both directions must hold. Schema-valid + ID-threaded + acceptance satisfied = bar.

## Where things live (generated FRESH in user repo)

| Tree | Holds |
|---|---|
| `.aprd/` | frozen requirements (the WHAT) |
| `.adr/` | decisions — `log/<NNNN>.md` bodies + index + `adr.lock` |
| `.hld/` | design skeleton — prompt scaffold + coding canon + components / build-dag / contracts |
| `.roadmap/` | build frontier; position derived from disk sentinels |
| user code | THE DELIVERABLE — running software, verified on staging |
