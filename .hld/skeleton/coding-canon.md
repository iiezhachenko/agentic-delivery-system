# Coding canon — prompt-domain idioms (D21 field 2)

> Frozen from CLAUDE.md standing rules + .hld design canon. IMPLEMENT specializes canon to contract; canon never source of truth (B11).

## Caveman block (PR4 — paste verbatim into every prompt)

```
# Register
Think, write, reply terse like smart caveman. All technical substance stays. Only fluff dies.
- Drop: articles (a/an/the), filler (just/really/basically), pleasantries, hedging.
- Pattern: [thing] [action] [reason]. [next step]
- NOT: "Sure! I'd be happy to help you with that."
- YES: "Bug in auth middleware. Fix:"
Applies to ALL prose: narration AND artifact bodies (spec/ADR/prompt/doc) AND code comments. Stays literal (never caveman): structural data (JSON/YAML keys+values, schemas), ids (R*/AC*/C*/ADR-*), code syntax. Caveman shortens prose, never breaks data/code.
```

## Locked requirements PR1–PR4
- **PR1 — Non-interactive by default.** Prompt runs autonomously start→finish, no back-and-forth. Agent reads inputs from disk, does work, writes outputs to disk, stops. No mid-run questions unless PR3.
- **PR2 — Producer/consumer contract.** Each prompt writes results in exact place + format *next* prompt reads. Output schema of step N == input schema of step N+1. Path + format declared in metadata.
- **PR3 — Interaction flagged in metadata.** Step genuinely needs user (interview, sign-off, redline, demo accept) → prompt metadata states `interactive: true` + what interaction + when. Silent prompts → `interactive: false`.
- **PR4 — Caveman block verbatim.** Every prompt embeds canonical caveman block (above) verbatim. Governs ALL prose — narration + artifact bodies + comments. Literal only: data/ids/code (caveman is register, not data corruption).

## Anti-bloat authoring rules AB1–AB6
- **AB1 — No double-bookkeeping.** Fact lives in exactly one section. Task steps don't restate Rules; Stop condition doesn't restate escapes. Tempted to repeat → bloating; link by name instead.
- **AB2 — Guards have ONE home: `escapes:` frontmatter.** Task step 1 may say "check guards (frontmatter), else continue" — does NOT re-enumerate them. Stop condition says "guard tripped → HALT" — does NOT re-list which guards.
- **AB3 — `format:` is one clause, not essay.** Name artifact + what THIS prompt consumes from it (`"json — owns_entities[] = proposed owner to formalize"`). Do NOT re-document upstream schema; producing prompt already did.
- **AB4 — Grounding folds into Rules.** Cheapest-source-first + LLM-verifies-not-authors discipline (P5/P11) = ONE Rules bullet, not standing section. Role-specific grounding (which source is truth) part of relevant rule.
- **AB5 — No Field-rules section.** JSON schema inline comments ARE field documentation. Constraint that can't fit comment (reciprocity, walk-to-count) attaches to that field's comment line. Never re-list every field in prose after schema.
- **AB6 — Role identity ≤3 lines, no mandate-narration.** State who/the-one-thing/lane. Mandate is Rules section — don't prose-narrate it first.

## Conventions
- **One role = one prompt** (D1). Role separation load-bearing (failure isolation, every spec §8). May split role further if justified — decide per case.
- **Greenfield class first** (D4). Author full vertical greenfield path (Phase 0→4) before generalizing to other classes via playbook overlays.
- Each prompt self-contained for fresh session: role identity + **required input artifacts (paths on disk)** + task + output schema + **where to write output on disk** + escape/route rules.
- **Artifacts land on disk, not just printed** (D3). Every prompt instructs agent to WRITE output to spec-defined path. Manual sim runs against real project workspace; operator hand-passes by pointing next session at files.
- Output JSON/YAML schema explicit so next prompt consumes it. IDs thread end-to-end: `R → AC → S → ADR → C → CT → F → commit`.
- Adversarial roles (GAP-DETECT, CRITIQUE, anti-cheat) stay hostile.
- LLM reconciles/verifies, never source of truth (P11) — bake into grounding prompts.
- **DRY / anti-bloat (D10)** — author against DRY skeleton; one home per fact (AB1–AB6 above). Substance (rules, schema, guards) invariant; only duplication dies.
