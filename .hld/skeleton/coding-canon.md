# Coding canon — the prompt-domain idioms (D21 field 2)

> Frozen from _rules.md. The canon IMPLEMENT specializes to a contract; canon is never the source of truth (B11).

## Caveman block (PR4 — paste verbatim into every prompt)

```
# Register
Think, write, reply terse like smart caveman. All technical substance stays. Only fluff dies.
- Drop: articles (a/an/the), filler (just/really/basically), pleasantries, hedging.
- Pattern: [thing] [action] [reason]. [next step]
- NOT: "Sure! I'd be happy to help you with that."
- YES: "Bug in auth middleware. Fix:"
Exception: artifact content (specs, JSON/YAML, ADR bodies) stays clean and complete. Caveman governs narration, not the deliverable.
```

## Locked requirements PR1–PR4
- **PR1 — Non-interactive by default.** Prompt runs autonomously start→finish, no back-and-forth. Agent reads inputs from disk, does work, writes outputs to disk, stops. No mid-run questions unless PR3.
- **PR2 — Producer/consumer contract.** Each prompt writes results in the exact place + format the *next* prompt reads. Output schema of step N == input schema of step N+1. Path + format declared in metadata.
- **PR3 — Interaction flagged in metadata.** If a step genuinely needs the user (interview, sign-off, redline, demo accept), the prompt's metadata header states `interactive: true` + what interaction + when. Silent prompts must be `interactive: false`.
- **PR4 — Caveman block verbatim.** Every prompt embeds the canonical caveman block (below) verbatim. Governs agent narration/reasoning; **artifact content stays clean prose/structured** (caveman is register, not data corruption).

## Anti-bloat authoring rules AB1–AB6
- **AB1 — No double-bookkeeping.** A fact lives in exactly one section. Task steps don't restate Rules; Stop condition doesn't restate escapes. If you're tempted to repeat, you're bloating — link by name instead.
- **AB2 — Guards have ONE home: `escapes:` frontmatter.** Task step 1 may say "check guards (frontmatter), else continue" — it does NOT re-enumerate them. Stop condition says "guard tripped → HALT" — it does NOT re-list which guards.
- **AB3 — `format:` is one clause, not an essay.** Name the artifact + what THIS prompt consumes from it (`"json — owns_entities[] = proposed owner to formalize"`). Do NOT re-document the upstream schema; the producing prompt already did.
- **AB4 — Grounding folds into Rules.** The cheapest-source-first + LLM-verifies-not-authors discipline (P5/P11) is ONE Rules bullet, not a standing section. Role-specific grounding (which source is truth) is part of the relevant rule.
- **AB5 — No Field-rules section.** The JSON schema's inline comments ARE the field documentation. A constraint that can't fit a comment (reciprocity, walk-to-count) attaches to that field's comment line. Never re-list every field in prose after the schema.
- **AB6 — Role identity ≤3 lines, no mandate-narration.** State who/the-one-thing/lane. The mandate is the Rules section — don't prose-narrate it first.

## Conventions
- **One role = one prompt** (D1). Role separation is load-bearing (failure isolation, every spec §8). May split a role further if justified — decide per case.
- **Greenfield class first** (D4). Author full vertical greenfield path (Phase 0→4) before generalizing to other classes via playbook overlays.
- Each prompt is self-contained for a fresh session: role identity + **required input artifacts (paths on disk)** + task + output schema + **where to write output on disk** + escape/route rules.
- **Artifacts land on disk, not just printed** (D3). Every prompt instructs its agent to WRITE its output to the spec-defined path. Manual sim runs against a real project workspace; operator hand-passes by pointing the next session at the files.
- Output JSON/YAML schema explicit so next prompt can consume it. IDs thread end-to-end: `R → AC → S → ADR → C → CT → F → commit`.
- Adversarial roles (GAP-DETECT, CRITIQUE, anti-cheat) stay hostile.
- LLM reconciles/verifies, never source of truth (P11) — bake into grounding prompts.
- **DRY / anti-bloat (D10)** — author against the DRY skeleton; one home per fact (AB1–AB6 above). The substance (rules, schema, guards) is invariant; only the duplication dies.
