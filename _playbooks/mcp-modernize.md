# Playbook — `mcp-modernize` class (role-thinning + MCP switch builds)

> Class discriminator + done-signal for mcp-modernize-class units (CR-026: W31i-T01+, mcp-modernize subclass). Consumed by orchestrator STEP 0.2 frontier scan — the sanctioned `_playbooks/<class>.md` hook it delegates the class-discriminator to. Net-new file; orchestrator unchanged.

## What the class is

Co-deliver: (1) role-thinning (role `.md` goes JUDGMENT-ONLY — zero deterministic mechanisms) + (2) MCP switch (ADR-0038/D38 — all determinism moves to server-side derive module).

Determinism includes: id-minting, counts, predicates, derivation, ref/field splicing. All exit the role body; none remain. A new server-side module (e.g. `tools/det/<role>-derive.mjs`, sibling of `tools/det/classify-derive.mjs` / `tools/det/extract-derive.mjs`) receives that logic, gets registered in the adp-server `DERIVERS` registry, and drives the MCP path `adp_next -> adp_derive -> adp_submit`.

Behavior preserved — same both-directions verdict vs unchanged `_fixtures/` goldens. Only prose shrinks + determinism relocates.

Reference impls: CLASSIFIER (W31i-T01) = primary; EXTRACT (W31i-T10) = second.

## Why bare file-existence is NOT done

Same as refactor class: target pre-exists, edited in place. No net-new file; goldens unchanged. Path-existence sentinel fires immediately — before any thinning or MCP wiring ran. MUST NOT count as done.

## Done discriminator — done iff ALL hold

1. `done_sentinel` (role `.md`) exists — necessary, not sufficient.
2. Frontmatter carries BOTH `thinned: CR-026` AND `mcp_powered: true` — completion stamp. Either absent → NOT done. `adp_status`/`sentinelDone` checks these markers.
3. Role is judgment-only: server-owned determinism (id-minting, counts, predicates, derivation, ref/field splicing) removed from body; registered server derive module owns it.
4. Verified through launched MCP server (`adp_next -> adp_derive -> adp_submit`), both directions vs golden:
   - GOOD primitives reproduce golden (no regression).
   - Planted-defect judgment diverges (adversarial direction holds).
   - Role emits only judgment primitives (zero determinism in role).
   Operator runs demo (D39) — agent provides reproducible steps.

## Economy-audit budget (RAISED for this class)

Default loop budget (prompts/_orchestrator.md STEP 4.1.6) = 3 total attempts (initial + 2 re-authors).

mcp-modernize budget RAISED to **5** (initial + 4 re-authors).

Reason: pre-existing roles carry latent prose debt (dups / no-objective phrases predating thinning) that adversarial ECONOMY-AUDIT surfaces one-next-smallest per pass — real, converging defects, not thrash. Still HALT at 5.

Sanctioned per-class override of loop budget (same pattern as STEP 0.2 delegating discriminator to this file). Operator ruling 2026-06-13 (during EXTRACT W31i-T10).

## prompt_overlays

N/A — thinning is subtractive (like refactor). Only additive is server-side derive module + its `DERIVERS` registration (code), not a prompt overlay block.
