<!-- KIRO-ONLY runtime adapter. Auto-loads into delivery + step agents via resources glob. -->
<!-- Two Kiro defects fixed at adapter edge: C1 subagent dispatch, C2 large-file write. -->
<!-- Engine + neutral prompts stay clean; Claude never carries these rules. -->

# Kiro runtime rules

## §dispatch — subagent dispatch (C1)

Kiro `invoke_sub_agent` resolves ONLY built-in types (`general-task-execution`, `spec-task-execution`, `context-gatherer`, and other built-ins). Workspace `.kiro/agents/*.json` (e.g. `step`) NOT dispatchable from inside an agent — user-only `@step` triggers. Passing workspace name silently falls back to generic agent with NO step-runner contract → subagent emits chat reply, skips disk write, bypasses verify harness.

Rules — every step-runner dispatch:
- Use `name: "general-task-execution"`. Never workspace agent name (won't resolve).
- Build `prompt` param by concat: `_step-runner.md` preamble + §write rule + `\n\n---\n\n` + target role prompt verbatim.
- Supply `contextFiles` = all paths role prompt names under its `inputs:` frontmatter → subagent holds them without cold read.
- Verifier spawn = SAME pattern, SEPARATE call. Runner never grades own output.

Invariants preserved: preamble FIRST · role prompt verbatim · zero orchestrator context leaked in (clean-room) · subagent reply ≠ deliverable, verify file on disk.

Canonical assembly (reuse for step + verifier):
```
preamble  = read(".kiro/adp/prompts/_step-runner.md")          # clean-room contract
writerule = §write rule below                                  # C2 chunked write
role      = read(".kiro/adp/prompts/<NN-phase>/<ROLE>.md")     # task, verbatim
inputs    = paths under role's `inputs:` frontmatter

invoke_sub_agent(
  name         = "general-task-execution",                     # ONLY built-in resolves
  prompt       = preamble + "\n\n" + writerule + "\n\n---\n\n" + role,
  contextFiles = inputs,
  explanation  = "Run <ROLE> clean-room at project root"
)
# subagent reply ignored — verify written file on disk
# verifier = identical assembly, SEPARATE invoke_sub_agent call (no self-grading)
```
Write rule PREPENDED after preamble, before `---` → reaches dispatched `general-task-execution` subagent (may not inherit workspace steering). One rule, two paths: steering for delivery + step agents, injection for dispatched runner.

## §write — large-file write (C2)

Kiro chokes writing big files in one call → failures + delays. Chunked write, verbatim:
```
When writing files longer than 50 lines, always use fsWrite for the first section (up to 50
lines), then sequential fsAppend calls for remaining sections in chunks of no more than 200
lines each — never pass the entire content of a large file in a single fsWrite call.
```
Auto-loads into `delivery` + `step` agents (steering). Also injected into dispatched runner prompt per §dispatch assembly.
