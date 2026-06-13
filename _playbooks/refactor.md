# Playbook — `refactor` class (role-thinning builds)

> Class discriminator + done-signal for refactor-class units (CR-026 role-thinning: W31i–W31m). Consumed by orchestrator STEP 0.2 frontier scan — the sanctioned `_playbooks/<class>.md` hook it delegates the class-discriminator to. Net-new file; orchestrator unchanged.

## What the class is

Thinning = strip **server-owned prose** (mode-dispatch blocks, guard predicates, inline schema-prose) from a shipped role `.md`. The MCP server (`adp-server/`, CR-023) now owns that procedure; role goes thin (judgment-bearing prose only). Behavior unchanged — same both-directions verdict vs the same `_fixtures/` goldens; only prose shrinks.

## Why bare file-existence is NOT done (the false-positive this closes)

Thinning edits an **existing** prompt in place (promote scratch over the shipped path). Target pre-exists; no net-new file appears; goldens don't move (behavior-preserving). So a path-existence sentinel reads "done" the instant the loop looks — before any thinning ran. W31i tripped exactly this: marked `shipped` while `CLASSIFIER.md` sat unchanged since W29i. Bare existence MUST NOT count as done for this class.

## Done discriminator (the completion signal)

A refactor unit is **done** iff ALL hold:
1. `done_sentinel` path exists (the role `.md`) — necessary, not sufficient.
2. The thinned prompt carries frontmatter marker **`thinned: <CR>`** (e.g. `thinned: CR-026`) — the completion stamp. Absent → NOT done (file is pre-thinning original). This is the class discriminator (analog of the brownfield `class`/`mode` discriminator): a property of the deliverable itself, not a separate marker file.
3. Server-owned sections (mode-dispatch / guard predicates / inline schema-prose) are GONE from the body — the thinning actually happened, not just a stamp.
4. Both-directions still hold: known-good thinned prompt PASSes, planted-defect copy FAILs, against the unchanged `_fixtures/` goldens (behavior preserved — thinning removes prose, never logic).

Marker over token-ceiling: a per-prompt token number is arbitrary + drifts; the marker is unambiguous + matches STEP 0.2's "discriminator on the artifact" pattern.

## prompt_overlays

N/A — refactor is subtractive (removes prose), adds no class overlay block. Unlike brownfield bugfix/feature-add classes, no `prompt_overlays` entry.
