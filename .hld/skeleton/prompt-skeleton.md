# Prompt scaffold (DRY skeleton, D10)

> Single scaffold every authored prompt follows. Frozen from .hld design canon "Standard prompt skeleton". One home per fact (AB1–AB9).

```
---
role: <ROLE>
phase: <NN-name>
class: greenfield            # first pass; generalize later
pass: skeleton|increment     # Phase-3 only (D9)
interactive: false           # or true + one-line {when, what} (PR3)
inputs:  [ {path, format} ]  # format = ONE terse clause: what THIS prompt reads from it (NOT a re-spec of upstream schema — AB3)
outputs: [ {path, format} ]
escapes: [ {when, target} ]  # THE single home for guards (AB2). Compact: condition → route. Not paragraphs.
---
<canonical caveman block, verbatim>          # PR4

# Role: <ROLE>
<≤3 lines: who, the one load-bearing thing, lane. No mandate-narration — AB6.>

## <Discriminator>            # role's core decision rule (ownership rule / skeleton test / verticality test …), IF role has one
## Rules                       # numbered mandate = single home for rules. Cheapest-source-first + LLM-not-source folds in as one bullet (AB4). No separate Grounding section.
## Task steps                  # PROCEDURE ONLY: read → compute → verify → write, in order. Do NOT re-list guards (→ escapes) or re-explain rules (→ Rules). AB1.
## Output schema — <path>      # JSON/YAML w/ inline comments = SINGLE field documentation (AB5). Constraints that don't fit comment go in comment-adjacent line, NOT separate Field-rules section.
## Stop condition              # terminal outcomes only (clean / defect-routed / halt), one line each. References guards by name; does NOT re-list them. Clean line states write path (no separate Write-to-disk section).
```

## Rules in dual-mode prompts (`pass: skeleton|increment`, D9/D14)
ONE shared `## Rules` block + a per-mode DELTA block. Shared rules (lane, grounding, named-not-designed, invent-nothing) live ONCE above the mode split. Each mode section carries ONLY its delta (rules that differ skeleton vs increment). Never copy a shared rule into both — AB1.
