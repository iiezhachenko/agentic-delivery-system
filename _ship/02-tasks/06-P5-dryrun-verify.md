# Task P5 — Dry-run verify both harnesses (acceptance)

> SELF-CONTAINED. Everything inline. FINAL gate — install the REAL artifact, confirm launch + self-host regression.

## Register (binds task + every file you write)
Terse caveman. Substance stays, fluff dies. [thing] [action] [reason]. Literal/uncorrupted: JSON keys+values, identifiers, code syntax.

## Context — what system is
**Agentic Delivery Pipeline (ADP)** = library of executable AI prompts driving SW project rough-request→verified-software (5 phases: understand→plan→decide→design→build). Shipped as `adp-vX.Y.Z.tgz` via `npx adp init --harness=claude|kiro`. P5 = acceptance: install the REAL tarball (NOT repo files), confirm both harness launchers boot, confirm self-host UNBROKEN.

## Prereq (assume done)
- **P4** produced real `adp-vX.Y.Z.tgz` + `manifest.json` (pack gate passed: lint + selftest both-directions + self-host grep empty).
- Tarball installs under one harness dir: Claude `.claude/adp/` (+ rules/agents/skills/settings); Kiro `.kiro/adp/` (+ agents/steering). Launchers: `/deliver` (claude) · `kiro-cli --agent delivery` (kiro).

## INVARIANT being proved (P5.4)
ADP devs run by cloning repo + starting harness at repo root via `/self-host`. All ship work was strictly ADDITIVE (new siblings). P5.4 PROVES that path still works after ship — protected files unchanged: root `CLAUDE.md`, `prompts/_orchestrator.md`, self-host wiring (`.claude/skills/self-host/`, `.claude/agents/step-runner.md`, `.kiro/agents/{selfhost,step}.json`, `.kiro/steering/`).

## Scope — 4 checks

### P5.1 — Claude scratch
Fresh empty project. `npx adp init --harness=claude` (from real tarball). Run `/deliver`. Confirm: orchestrator boots, drives a TRIVIAL slice (rough request → at least aPRD artifact written to disk). Zero root pollution beyond generated artifact trees.

### P5.2 — Kiro scratch
Fresh empty project. `init --harness=kiro`. `kiro-cli --agent delivery`. Confirm orchestrator boots.

### P5.3 — lint survives move
Confirm economy-lint path-type inference still matches under installed layout: substrings `/prompts/` (now `.claude/adp/prompts/`) + `/.adr/` (root, pipeline-generated) still trigger correct path-type rules. Run lint against an installed prompt + a generated `.adr/` artifact → inference correct.

### P5.4 — self-host regression gate `[Invariant proof]`
In a FRESH clone of post-ship repo, start harness at repo root:
- Claude: `/self-host status`.
- Kiro: `kiro-cli --agent selfhost`.
Confirm: orchestrator boots, RE-RANK derives state from disk, names next unshipped prompt.
Then `git diff` of ship branch → root `CLAUDE.md` + `prompts/_orchestrator.md` + ALL self-host wiring UNCHANGED (additions only, zero modifications to protected files).

## Steps
1. Obtain real tarball from P4 (`adp-vX.Y.Z.tgz`).
2. P5.1 — claude scratch install + `/deliver` trivial slice.
3. P5.2 — kiro scratch install + `--agent delivery` boot.
4. P5.3 — lint path-inference check on installed layout.
5. P5.4 — fresh clone, self-host launch both harnesses + `git diff` protected-file audit.
6. Record results per check (PASS/FAIL + evidence).

## Done-bar
- Both harnesses boot DELIVERY launcher clean FROM INSTALLED TARBALL (not repo).
- Smoke selftest green post-install.
- Lint path inference intact under `.claude/adp/prompts/` + root `.adr/`.
- Self-host launch-from-root still operational on fresh clone; ship diff = additions only (protected files unmodified).

## Deps
Needs P4 (real tarball) + P1 (launchers it boots). LAST task — satisfying its done-bar = shippable.
