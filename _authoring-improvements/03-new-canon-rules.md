# Proposed canon additions — AB7–AB9 + caveman delta

> Paste-ready text closing the P2-general + P3 gaps. **NOT applied** — `.hld/skeleton/coding-canon.md` is under the FROZEN skeleton (`skeleton.frozen.md`). Per immutability rule, a change = new skeleton version + change request re-triggering downstream. This file is the proposal the change request would carry.

## Why three new rules (gap analysis)

| Practice | Covered by existing AB? | Gap |
|---|---|---|
| P1 delete-not-add | Partly — AB1 (one home) implies it | No rule names the ACTION "fix by deletion/rewrite, never addition" as mandatory. AB1 says where a fact lives, not how to fix when you find it doubled. |
| P2 objective-per-statement | Partly — AB3/AB5/AB6 cover specific cases (format, field-rules, role identity) | No GENERAL rule "every statement earns its place by an objective." Decorative narration outside the AB3/5/6 cases is uncaught (spec pep-talk, ADR session-narration, workflow rhetoric). |
| P3 single-interpretation | **No** | Nothing bans multi-reading wording. This is the wholly-missing rule. |

Three additions, each one home, each gateable.

---

## AB7 — every statement has an objective

```markdown
- **AB7 — Statement earns its place.** Every line exists to change a downstream reader's action — what the agent reads, computes, writes, or routes. No decorative narration, no motivational prose, no restating a mandate "for emphasis", no explaining WHY a rule exists where stating the rule suffices. Test per statement: "delete it — does any agent behavior change?" No → delete it. A statement whose only job is to make another statement feel important is bloat. (Generalizes AB3/AB5/AB6 from their specific homes to all prose.)
```

Enforces P2. Gate: PROMPT-AUDIT `no-objective` category + lint banned-narration heuristics.

## AB8 — one interpretation, or flag the judgment

```markdown
- **AB8 — Single interpretation, or named judgment.** Use the most precise wording that reads ONE way. A statement readable two ways is a defect — rewrite it. State each test ONCE, precisely. If the call is genuinely judgment (no mechanical test exists — e.g. INVEST sizing), say so explicitly with "judgment call:" so the reader stops hunting a crisp bound that isn't there. Banned without a crisp adjacent test: "usually", "loosely", "roughly", "too big/small", "genuinely unsure", "when in doubt", open "etc." lists. A fixture-coupled number stated as a general rule ("= 14 for standard input") must be marked illustrative or cut.
```

Enforces P3 — the wholly-missing rule. Gate: lint hedge-wordlist + PROMPT-AUDIT `ambiguous`.

## AB9 — fix by deletion or rewrite, never addition

```markdown
- **AB9 — Fix down, not up.** Wrong/unclear behavior → DELETE or REWRITE the offending text. NEVER patch by adding another instruction. Adding to clarify is the bloat mechanism itself (a second statement to fix a first leaves both). If a rule is misread, the rule is wrong — rewrite it in place; do not append a caveat. A prose defect routes to RE-AUTHOR against the DRY skeleton, never to a patch. (The authoring analog of orchestrator STEP 4.5: defect is in the prompt — re-author, never hand-patch.)
```

Enforces P1 as an ACTION rule (AB1 is a placement rule). Gate: the routing keystone — bloat findings carry `fix: DELETE|REWRITE`, never `ADD`; the loop offers no patch path (`01-enforcement-mechanism.md`).

---

## Caveman-block delta (optional, smaller)

Current caveman block (coding-canon L7-14) governs register. Add one line tying register to the new rules:

```markdown
Fix by cutting, never by adding (AB9). If a statement reads two ways, rewrite it (AB8). Every line earns its place (AB7).
```

One line, in the verbatim block, so every prompt carries the anti-bloat reflex at point-of-authoring, not just in canon the author may skip.

---

## Skeleton-section delta — kill the two-pass duplication at the SOURCE

The biggest P1 driver (02-adherence §"structural drivers" #1) is the A/B Rules copy. Add to `prompt-skeleton.md` the dual-mode home rule:

```markdown
## Rules (dual-mode prompts)   # ONE shared Rules block + a per-mode DELTA block.
# Shared rules (lane, grounding, named-not-designed, invent-nothing) live ONCE above the mode split.
# Each mode section carries ONLY its delta (the rules that differ A vs B). Never copy a shared rule into both.
```

This makes the DRY skeleton itself prevent the duplication, not just AUDIT catch it after. Closes the root cause ADR-0010 left open for dual-mode prompts (D14 came later).

---

## Change-request path (how this lands without breaking immutability)

```mermaid
flowchart LR
    P[this proposal] --> CR[change request]
    CR --> NS[skeleton v4<br/>coding-canon + prompt-skeleton]
    NS --> RT[re-trigger downstream:<br/>re-author affected prompts DRY]
    RT --> GATE[new authoring gate verifies each]
    GATE --> FREEZE[freeze v4 + new goldens]
```

- coding-canon.md + prompt-skeleton.md get AB7–AB9 + dual-mode rule → new frozen skeleton version (v3→v4).
- Downstream = every prompt re-authored against v4 (the gate from `01` proves each tightened prompt still PASSes clean-room on value — behavior invariant, only duplication dies, exactly ADR-0010's bar).
- New goldens frozen only after both-directions discrimination holds.
- Do NOT overwrite v3 in place — v4 is a new signed version (immutability rule).
