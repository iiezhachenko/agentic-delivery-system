# ADP on Kiro: subagent dispatch pattern

## Context

ADP's orchestrator was designed for Claude's multi-agent environment where custom agent files
(`.claude/agents/step-runner.md`) are resolved by name when spawning subagents. Kiro's
`invoke_sub_agent` tool works differently — it only resolves built-in agent types, not workspace
`.kiro/agents/*.json` definitions.

This document describes the adaptation made to run ADP on Kiro and what the canonical dispatch
pattern is going forward.

---

## Problem

`_orchestrator.md` referenced `.claude/agents/step-runner.md` as the harness for all step
dispatches. On Kiro, calling `invoke_sub_agent` with a custom agent name (e.g. `"step"`) silently
falls back to a generic agent that has no knowledge of the step-runner contract. The clean-room
harness is bypassed entirely.

Symptom: subagents execute role prompts without the step-runner preamble, produce chat replies
instead of writing files to disk, and ignore the "deliverable = file on disk, not chat reply" rule.

---

## Root cause

Kiro's `invoke_sub_agent` tool accepts `name` values from a fixed built-in registry:

- `general-task-execution`
- `spec-task-execution`
- `context-gatherer`
- `feature-requirements-first-workflow`
- etc.

Workspace agents defined in `.kiro/agents/*.json` are invoked by the user via `@agentname` in
chat. They are **not** dispatchable as subagents from within another agent using
`invoke_sub_agent`.

---

## Fix

Three locations in `_orchestrator.md` were updated:

### 1. GIVEN params — verify harness reference

**Before:**
```
Verify harness = clean-room runner sim (`.claude/agents/step-runner.md`, Sonnet/High)
```

**After:**
```
Verify harness = clean-room runner sim (`.kiro/adp/prompts/_step-runner.md` prepended to role
prompt, dispatched via `invoke_sub_agent name:general-task-execution`)
```

### 2. SUBAGENT CONTRACT — new mandatory dispatch section added

The existing contract described the *intent* (runner gets prompt verbatim, no context leaks) but
not the *mechanics*. A new subsection was added:

```
## Kiro dispatch pattern (MANDATORY — every subagent call)

Kiro's `invoke_sub_agent` does not resolve `.kiro/agents/*.json` by name. Use
`name: "general-task-execution"` for every step-runner dispatch. Build the `prompt` parameter
by concatenating:

1. Read `.kiro/adp/prompts/_step-runner.md` verbatim — this is the harness preamble.
2. Append `\n\n---\n\n`
3. Read the target role prompt (e.g. `.kiro/adp/prompts/00-aprd/CLASSIFIER.md`) verbatim —
   this is the task.
4. Pass the concatenated string as `prompt`.

Supply `contextFiles` with all input files the role prompt names under its `inputs:` frontmatter
— so the subagent has them in context without a cold read.

Never pass only the role prompt without the step-runner preamble. Never use a custom agent name
Kiro cannot resolve. Never pass orchestrator context into the runner's prompt — runner is
clean-room by design.
```

### 3. Build phase Layer 3 — inline spawn description updated

**Before:**
```
spawn runner (step-runner, Sonnet/High) whose prompt = scratch verbatim + bench path
```

**After:**
```
spawn runner via `invoke_sub_agent name:general-task-execution` with prompt =
`_step-runner.md` contents + `\n\n---\n\n` + scratch verbatim + bench path
```

---

## Canonical dispatch pattern (for all future ADP work on Kiro)

```
step_runner_preamble = read_file(".kiro/adp/prompts/_step-runner.md")
role_prompt          = read_file(".kiro/adp/prompts/<NN-phase>/<ROLE>.md")

invoke_sub_agent(
  name         = "general-task-execution",
  prompt       = step_runner_preamble + "\n\n---\n\n" + role_prompt,
  contextFiles = [<all paths listed in role prompt's `inputs:` frontmatter>],
  explanation  = "Running <ROLE> step clean-room against project root"
)
```

Key invariants preserved:
- Step-runner preamble always first — sets clean-room contract before task text.
- Role prompt appended verbatim — no orchestrator context mixed in.
- `contextFiles` pre-loads role inputs — avoids subagent cold-discovering files.
- Deliverable = file on disk — subagent reply is ignored; orchestrator verifies the written file.

---

## What does NOT change

- `_step-runner.md` itself is unchanged — it remains the clean-room harness definition.
- `.kiro/agents/step.json` is unchanged — it remains valid for user-triggered `@step` invocations.
- `.kiro/agents/delivery.json` is unchanged — `@delivery` still triggers the orchestrator.
- All role prompts (`00-aprd/`, `01-roadmap/`, etc.) are unchanged.
- The orchestrator's control loop, phase sequence, and checkpoint gates are unchanged.

---

## Recommendation for ADP generic canon

Update `canon/CLAUDE.generic.md` (or the equivalent multi-runtime section) to document both
dispatch paths:

| Runtime | Dispatch mechanism | Agent name |
|---|---|---|
| Claude | `.claude/agents/step-runner.md` resolved by name | `step-runner` |
| Kiro | `invoke_sub_agent` with concatenated prompt | `general-task-execution` |

The concatenation pattern is runtime-neutral and could be adopted for Claude as well — passing
`_step-runner.md` + role prompt explicitly is more robust than relying on name resolution.
