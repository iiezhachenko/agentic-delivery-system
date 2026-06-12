---
id: ADR-0030
title: Rename launcher command `/self-host` → `/evolve` (clean, no alias)
status: Accepted
date: 2026-06-12
class: self-host
scope: global
mode: foundation
source: operator-approved
supersedes: null
superseded_by: null
cr: CR-009
---

## Decision

- **D30 — Rename the Claude Code launcher slash command `/self-host` → `/evolve`. Clean rename: `/self-host` stops existing, NO backward-compat alias.**
  Context (CR-009): the self-project launcher was named `/self-host` after its implementation detail (the pipeline hosting itself). Operator-directed rename to `/evolve` — names the *act* (system improving itself) over the mechanism. Surface-rename only; zero behavior change.

  **Boundary (load-bearing — defines blast radius):** "self-host" exists two ways. This decision touches ONLY the **command surface** (`/self-host` slash command → `/evolve`). The **concept noun** — "self-host", "self-hosting", `Self-Host Orchestrator` title, "self-host loop body", `self-host-*.md` filenames, every frozen-doc concept reference — is orthogonal and UNCHANGED. Edit rule: swap the literal slash-command token `/self-host` → `/evolve` in non-frozen files; bare `self-host` (no slash) = concept, left as-is.

  **Decisions:**
  1. **Command name = `/evolve`.** Skill dir `.claude/skills/self-host/` → `.claude/skills/evolve/`; frontmatter `name: evolve`.
  2. **No alias (clean rename).** Single invocation surface — a forwarding `/self-host` shim would be a second home for the same fact (AB-economy) and a drift source. Dropped.
  3. **Lean cascade, no new requirement.** Command name is NOT a frozen aPRD requirement (no spec names the launcher/command surface) and behavior is unchanged → controller-direct wiring edit (P3 precedent: CR-006, W7/W8/W9/W15), no new R-id, no aPRD version, no HLD delta.

  **Tradeoffs considered:**
  - *Keep `/self-host` alias rejected.* Two invocation surfaces for one launcher = duplicated fact + doc drift; clean rename is the economy default. Reopen only if external scripts depend on the old token (none known on the self-project).
  - *Full feature-add cascade rejected.* New R-id + aPRD version + HLD component delta over-specs a pure surface-rename with no behavior, schema, role, or contract change. P3 direct-edit is the right weight (same as CR-006).
  - *Rename the concept noun too — rejected.* "self-host" the idea is correct and load-bearing in frozen artifacts (aprd.frozen, ADR bodies); renaming it would force frozen-artifact churn for zero gain. Command ≠ concept.
  - *Kiro `--agent selfhost` left as-is.* Different harness's launcher, not a `/` slash command; symmetry is an optional follow-up CR, not required by this ask.

  **Consequences:** `.claude/skills/evolve/SKILL.md` (renamed) + command-token swap in `.claude/agents/adp-orchestrator.md`, `prompts/_orchestrator.md` (selection note), `docs/self-host-usage-guide.md`. Frozen artifacts + `_fixtures/` untouched (no oracle references the command token). Regression-guard = all `tools/**/*.selftest.mjs` + economy-lint corpus green + `/evolve` resolves + `/self-host` gone.
  **Reopen if:** an external consumer pins the `/self-host` token (→ reconsider a deprecation alias), or the Kiro launcher symmetry is wanted (→ follow-up CR renaming `selfhost` → `evolve`).
