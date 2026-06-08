# Using the System — Practical Usage Guide

> The hands-on playbook: how to **deploy** the delivery system into a harness, then **use** it to take a project from a rough request to verified software.
> Companion to **`generic-workflow.md`** (which explains *how the system works*). This guide explains *how you set it up and operate it*.
> Supported harnesses: **Claude Code** (Anthropic CLI) and **Kiro** (AWS agentic IDE).
> Audience: the person driving a project (client/product owner). No engineering background assumed; the deploy steps are copy-paste.

---

## 1. What you're setting up

The delivery system is a **library of role prompts** (under `prompts/<phase>/<ROLE>.md`) plus a small set of **rules** the agents always follow and the **on-disk artifacts** they produce (`.aprd/ .roadmap/ .adr/ .hld/ .build/`). Deploying it means dropping those files into your project and wiring them into your harness so a single command (or button) runs the pipeline.

Both harnesses already think in terms of **specs → design → tasks**, which is exactly this pipeline's shape — so deployment is mostly mapping the system onto each harness's native constructs.

| You provide | The harness provides | The system adds |
|---|---|---|
| your request, answers at gates | the agent runtime + file access | the discipline: requirements freeze, vertical slices, decision records, verified builds, anti-cheat, demo gate |

---

## 2. Choose your harness

| | **Claude Code** | **Kiro** |
|---|---|---|
| Form | Terminal CLI (works in any editor/repo) | Full IDE (VS Code–based) with a chat panel |
| Best when | you live in the terminal, want scripted/automatable runs | you want a visual spec/task board and click-to-run tasks |
| How it runs | subagents + skills + `CLAUDE.md` | a **CLI custom agent** runs the pipeline exclusively (Kiro's built-in spec flow is **not** used) + steering for canon |
| Setup effort | low (drop files, allow permissions) | low (drop steering, use the Spec button) |

Pick one; the **per-gate interactions are identical** (Part C). Deploy/use steps differ — Part A for Claude Code, Part B for Kiro.

---

# PART A — Claude Code

## A1. Deploy (one-time setup)

**Step 1 — Install Claude Code.**
```bash
# macOS / Linux / WSL
curl -fsSL https://claude.ai/install.sh | bash
# or: brew install --cask claude-code
# Windows PowerShell: irm https://claude.ai/install.ps1 | iex
```

**Step 2 — Lay the system into your project.** Copy the delivery-system files so your project looks like this:
```
your-project/
├── CLAUDE.md                     # the rules/canon every agent must follow
├── prompts/<phase>/<ROLE>.md     # the role library (aprd, roadmap, adr, hld, build)
└── .claude/
    ├── settings.json             # permissions (below)
    ├── agents/
    │   ├── orchestrator.md        # drives the phases; spawns role agents
    │   └── step-runner.md         # runs one role prompt verbatim (model: sonnet)
    └── skills/
        └── deliver/SKILL.md       # the /deliver entry point
```
The artifact folders (`.aprd/`, `.roadmap/`, `.adr/`, `.hld/`, `.build/`) are created automatically as the pipeline runs — you don't make them.

**Step 3 — `CLAUDE.md` holds the always-on rules.** This file is loaded into every session. Put the pipeline's standing rules here (phase order, artifact conventions, "never overwrite a frozen artifact," the verify-before-done rule). This is the home for the system's canon.

**Step 4 — Allow the permissions the pipeline needs.** Create `.claude/settings.json`:
```json
{
  "permissions": {
    "allow": ["Read", "Write", "Edit", "Agent", "Bash(git *)"],
    "defaultMode": "acceptEdits"
  }
}
```
`Read/Write/Edit` let agents manage artifacts without prompting; `Agent` lets the orchestrator spawn role agents; `acceptEdits` auto-approves file writes (you're still asked before shell commands).

**Step 5 — The `/deliver` entry point.** `.claude/skills/deliver/SKILL.md` is a thin launcher:
```markdown
---
name: deliver
description: Run the delivery pipeline on a request (aPRD → roadmap → ADR → HLD → build)
argument-hint: "<your request in plain language>"
---
Hand the request in $ARGUMENTS to the orchestrator agent and run the pipeline,
pausing at the clarifying-questions, roadmap, and demo gates.
```

> MCP is **not required** — this is a disk-artifact pipeline. Add an MCP server only if you want the system to pull from an external tracker (Jira/GitHub) or post to Slack.

## A2. Use (run a project)

**Step 1 — Launch in your project:**
```bash
cd your-project
claude
```

**Step 2 — Kick off delivery** (either works):
```
/deliver "A web marketplace where clients post jobs and freelancers apply."
```
or just type the request and ask it to run the pipeline.

**Step 3 — Answer the gates, in the same session.** The agent pauses and asks you directly (via an on-screen question) — no restarts:
- **Clarifying questions** → you answer (Part C, §C2).
- **Roadmap** → you confirm or reorder (§C3).
- **Each demo** → you accept or give feedback (§C4).

**Step 4 — Find your outputs.** Requirements, roadmap, decision records, and design land in `.aprd/ .roadmap/ .adr/ .hld/`; built increments land under `.build/` and on the staging target the orchestrator reports.

**Resuming:** close the terminal anytime; run `claude` again and use `/resume` to pick the session back up. The pipeline reads its state from the on-disk artifacts, so it continues from the last completed step.

---

# PART B — Kiro

Kiro ships its own built-in spec workflow (`requirements.md` / `design.md` / `tasks.md`). **We do not use it.** The delivery system *is* the methodology, and it must run exclusively — its own phases, its own artifacts (`.aprd/ .roadmap/ .adr/ .hld/ .build/`), its own gates. Kiro is used purely as a **runtime**: a **CLI custom agent** runs the system's orchestrator prompt, loads the role library, and drives the pipeline end to end. The native **Spec** button stays untouched; steering is used only to carry the system's rules as context and to tell Kiro to defer entirely to the pipeline.

## B1. Deploy (one-time setup)

**Step 1 — Install the Kiro CLI** (`kiro-cli`) and open a terminal in your project. (The Kiro IDE is optional — useful for *viewing/editing* the agent and artifact files; the **driver is the custom agent**, run from the CLI, not the IDE's Spec button.)

**Step 2 — Lay the system into your project.** The delivery system drives everything; Kiro just runs it:
```
your-project/
├── prompts/<phase>/<ROLE>.md        # the role library (aprd, roadmap, adr, hld, build)
└── .kiro/
    ├── agents/
    │   ├── delivery.json             # the orchestrator (the one you run) — lean context, delegates each step
    │   └── step.json                 # generic pipeline-step agent (Sonnet) — runs ONE role prompt in fresh context
    └── steering/
        ├── 00-exclusive.md           # "run the pipeline exclusively; do NOT use built-in specs"
        ├── pipeline.md               # phase order + two-loop rhythm (skeleton once, then slices)
        ├── rules.md                  # requirements-freeze, slice = vertical & demoable, verify-before-done
        ├── decisions.md              # require a decision record (ADR) for every significant choice
        └── verification.md           # tests authored separately from the builder; anti-cheat; demo to accept
```
The system's artifact folders (`.aprd/ .roadmap/ .adr/ .hld/ .build/`) are written by the agents as the pipeline runs — **not** Kiro's `.kiro/specs/`.

**Step 3 — Define the orchestrator agent** `.kiro/agents/delivery.json`. Its prompt is the system's orchestration logic. **Keep its context lean — do NOT preload the prompt library.** Loading all ~39 role prompts every turn is pure token waste; the orchestrator only needs the rules plus the ability to read a role prompt *when that step runs*. So `resources` loads only the steering (small, always-applicable); each role prompt and each step's input artifacts are **lazy-loaded from disk on demand**:
```json
{
  "name": "delivery",
  "description": "Runs the delivery pipeline exclusively: aPRD → roadmap → ADR → HLD → build",
  "prompt": "file://./prompts/_orchestrator.md",
  "resources": ["file://.kiro/steering/**/*.md"],
  "tools": ["read", "write"],
  "allowedTools": ["read"],
  "model": "claude-sonnet-4"
}
```
The orchestrator sequences phases and, for each step, **delegates to a fresh `step` subagent** (Step 5) — handing it just that step's role-prompt path. The role prompt then lives only in the subagent's fresh context and is discarded when the step ends, so no turn ever carries more than the active step. The orchestrator itself stays small for the whole run.

**Step 4 — Make the discipline (and the exclusivity) steering.** Steering files in `.kiro/steering/*.md` are loaded as always-on context (and committed to Git). The critical one, `00-exclusive.md`, keeps Kiro on the rails:
```markdown
# Run the delivery pipeline exclusively
- Do NOT generate or use Kiro's built-in spec files (requirements.md / design.md / tasks.md).
- The methodology is the role prompts under prompts/<phase>/<ROLE>.md. Follow them verbatim, in phase order.
- Read inputs from and write outputs to the system's artifact tree (.aprd/ .roadmap/ .adr/ .hld/ .build/).
- Honor the system's gates: clarifying questions, roadmap confirmation, per-slice demo acceptance.
```
The other steering files carry the canon (phase order, slice/skeleton rules, ADR requirement, verification/anti-cheat, demo gate).

**Step 5 — The generic pipeline-step agent** `.kiro/agents/step.json`. This is the execution unit: **one** agent that runs **any** role, not 39 per-role configs. The orchestrator hands it a role-prompt path; it reads that prompt, follows it verbatim against the project root, reads only that step's input artifacts, writes the outputs, and ends — fresh context every step.
```json
{
  "name": "step",
  "description": "Runs one pipeline step: read the given role prompt, execute it against the project, write outputs",
  "prompt": "file://./prompts/_step-runner.md",
  "resources": ["file://.kiro/steering/**/*.md"],
  "tools": ["read", "write"],
  "model": "claude-sonnet-4"
}
```
**Sonnet is the runtime target — the whole pipeline must run on Sonnet**, so the step agent is Sonnet across the board. (Search/discovery-heavy steps could later be routed to **Haiku** for speed and cost; that's a per-step optimization to add once the Sonnet baseline is proven, not now.) You can also drive a step yourself — see B2 "Manual stepping."

**Step 6 — Verification (mandatory; built into every slice).** Verification is **not optional and not a hook** — it is a required phase of the pipeline that gates every slice. For each slice the system:
1. **Authors the oracle** — a role *separate from the builder* turns the slice's acceptance criteria and contracts into executable tests (so the builder can't grade its own work).
2. **Builds** the slice against the design.
3. **Runs the full test ladder** against the *live* build (contract + flow + acceptance tests; plus regression for changes to existing products).
4. **Runs the anti-cheat pass** — a semantic-diff critique that flags hollow or hard-coded implementations (e.g. values matching the test fixtures, empty branches, stub logic).

A slice reaches "done" **only when this ladder is green and you have accepted the demo** — never on a claim of completion. The `verification.md` steering file encodes this gate, and the build-phase role prompts execute it; nothing ships unverified.

**Step 7 (optional) — Hooks.** Hooks (`.kiro/hooks/*.json`) don't *add* verification — that always runs. They only let you **auto-trigger** the already-mandatory pass on an event (e.g. re-run it whenever build files change). Create one from the IDE Command Palette → **Kiro: Open Kiro Hook UI**, or describe it in natural language.

## B2. Use (run a project)

**Step 1 — Start the pipeline** by running the orchestrator agent with your request:
```bash
cd your-project
kiro-cli chat --agent delivery "A web marketplace where clients post jobs and freelancers apply."
```
This launches the **system's own pipeline** — not Kiro's spec flow. The orchestrator reads the role prompts and begins at the aPRD phase.

**Step 2 — Answer the gates, in the same chat.** The orchestrator pauses and asks you directly; the gates are the system's, identical to the workflow:
- **Clarifying questions** → you answer (Part C, §C2).
- **Roadmap** → you confirm or reorder (§C3).
- **Each demo** → you accept or give feedback (§C4).

**Step 3 — Find your outputs.** Requirements, roadmap, decision records, and design land in `.aprd/ .roadmap/ .adr/ .hld/`; built increments land under `.build/` and on the staging target the orchestrator reports. (Open these in the Kiro IDE if you want a visual view — they're plain Markdown/JSON, Git-tracked.)

**Manual stepping (optional).** Prefer to drive phase-by-phase? Run the generic step agent directly, handing it one role prompt:
```bash
kiro-cli chat --agent step "Run prompts/hld/DEFINE-CONTRACTS.md against this project."
```
It reads the prior phase's on-disk artifacts and writes the next, so manual stepping and orchestrated runs are interchangeable — same Sonnet step agent either way.

**Resuming:** the pipeline keeps its state in the on-disk artifacts, so re-running `--agent delivery` continues from the last completed step — no built-in session/spec state to manage.

---

# PART C — What you do at each checkpoint (both harnesses)

The setup differs; **your job at the three gates is the same.** This is the part you actually do.

## C1. Write a good request

Plain language; rough is fine. A template you can copy:
```
What I want:          <one or two sentences — the product and who it's for>
Main things users do: <key actions, e.g. "post a job", "apply", "pay">
Must-haves:           <anything non-negotiable>
Constraints:          <deadline, budget, required technology, regions, compliance>
What I already have:  <existing code, designs, brand assets — or "nothing yet">
Out of scope:         <anything you explicitly do NOT want, if known>
```
**Good** (clear outcomes, flexible on how): *"A web marketplace where clients post jobs and freelancers apply… launch a demoable version in ~6 weeks; single region (EU); payments out of scope for now."*
**Weaker** (over-specifies *how*, under-specifies *what*): *"Build it in React with library X and a microservice per feature."*

Describe **outcomes**; let the system choose the technology. You can still *require* a stack — put it under Constraints.

## C2. Answer the clarifying questions

The system asks only what it can't safely assume, highest-impact first. Answer briefly and directly:
```
Q1 (affects architecture): Single region or global?  →  Single region (EU) for now.
Q2 (affects scope): Profiles visible before applying? →  Yes.
Q3: Sign-in methods?                                  →  Email and Google.
```
Don't know yet? Say **"assume X for now"** — it's recorded as an explicit assumption you can change later, never a silent guess. The result is the **frozen requirements** — the contract everything is checked against, so spend a little care here.

## C3. Review and confirm the roadmap

You'll see the planned order of increments (skeleton first, then features):
```
1. Skeleton (thin end-to-end foundation)   3. Browse / search jobs
2. Post a job                              4. Apply to a job   5. Review applicants
```
- **Confirm** as-is, or **reorder** to your priorities: *"Move 'Review applicants' before 'Browse jobs' — I want the hiring flow demoable first."*
- Some items must precede others (and the skeleton is always first). Request an impossible order and the system explains the dependency and proposes the nearest valid one.

## C4. Review each demo and respond (the repeating loop)

For each increment the system builds it, verifies it with tests, deploys to staging, and shows a **working demo**. Try the real thing, then respond:

| Response | When | What happens next |
|---|---|---|
| **Accept** | it does what the slice promised | delivered; next slice begins |
| **Fix within this slice** | right feature, something off (wrong default, visible bug, missed criterion) | system corrects it and re-demos the same slice |
| **New / changed requirement** | you want something different/additional | captured as a change; requirements + roadmap update, scheduled as work (not silently folded in) |

Give **concrete, observable** feedback tied to the demo ("the job list should default to *open* jobs"). "Done" always means *both* the tests pass **and** you accepted the demo.

---

## 3. Stopping & resuming — the system is idempotent

You can stop at **any** time — a clean pause after a slice, or an abrupt interruption: lost internet, a closed laptop, a killed agent mid-step. The system is built to **pick up exactly where it left off**. No run ever depends on state that lives only in the agent's memory.

**Why it's safe**
- **Disk is the source of truth.** Every step records its result as a file in the artifact tree; the agent's in-memory state is disposable. Progress *is* what's on disk — nothing else.
- **Writes are atomic.** A step writes its output in full or not at all (write to a temp file, then swap into place). An interruption mid-write never leaves a half-written, corrupt artifact — the file is either the complete result or absent.
- **Committed work is immutable.** Frozen artifacts — the requirements, decisions, design, and accepted slices (the locks) — are never modified; steps only *add* new files. So an interrupted or re-run step cannot damage anything already agreed or accepted.
- **Re-running a step is harmless.** Each step reads only frozen inputs and writes one output. Run it again and it reproduces the same result — no double-counting, no drift. The unit of recovery is a single step (one role), so the most you ever redo is the one step that was in flight.

**What happens on resume**
1. The orchestrator scans the artifact tree and finds the **frontier** — the last complete, valid output.
2. It validates that frontier against its schema; a partial or missing output counts as "not done."
3. It continues from the **first step whose output is absent or invalid** — completed steps are skipped; the interrupted step re-runs cleanly.

**Your gate answers are safe too.** Your replies (clarifying answers, roadmap confirmation, demo acceptance) are saved as files the moment you give them. If a reply was saved, resume uses it and won't re-ask. If you were interrupted *before* answering, it simply asks again — never a silent guess.

**How to resume (just restart and re-run — no cleanup):**
- **Claude Code:** run `claude`, then `/resume` to reopen the session — or simply run `/deliver` again / tell the orchestrator to continue. It reads the artifact tree and picks up the next step.
- **Kiro:** re-run `kiro-cli chat --agent delivery "continue"`. It reads the same artifacts and continues from the frontier; there is no separate session state to restore.

---

## 4. Making changes mid-project

- Raise changes at the **next checkpoint** (a question round, the roadmap, or a demo). The system updates the frozen requirements, re-plans affected slices, and keeps everything consistent.
- Prefer to **redirect between slices, not mid-slice** — let the current slice finish and accept/reject it first.
- Every change is **recorded**, so the history of what changed and why stays intact.

## 5. Special situations

- **Several things in one request** ("fix the upload bug, make it faster, *and* add PDF support") — submit as-is; the system splits, classifies each piece, and confirms the breakdown before proceeding.
- **Bug in an already-accepted slice** — report it like a new request (broken behavior + how to reproduce); the system reproduces, fixes, and guards against regressions.
- **Change the technology** — raise it as a constraint/decision change; it's a recorded decision, so it can be revisited (late changes may trigger flagged rework).
- **Pause or get interrupted** — stop deliberately, or lose connection / close the laptop / kill the agent mid-step. Either way the system resumes cleanly from the on-disk artifact tree; see **§3 (idempotency)** for exactly how. Short version: restart and re-run the orchestrator — it continues from the frontier, redoing at most the one step that was in flight.
- **Disagree with a decision** — open the decision record to see the rationale and options weighed; state your constraint and it's reopened.

## 6. Do's and don'ts

**Do** — describe outcomes, not implementation · state real constraints up front · answer questions directly ("assume X" when unsure) · actually use each demo before responding · give concrete feedback.
**Don't** — over-specify *how* while leaving *what* vague · sit on clarifying questions (they block progress) · change direction mid-slice · accept a demo you haven't tried · file a new idea as a "fix" (flag it as a change).

## 7. Frequently asked

- **Do I need to code?** No — plain language throughout.
- **How often will it interrupt me?** Only at the three gates; otherwise it runs on its own.
- **How do I know it isn't faked?** Tests are authored by a role separate from the builder, run against the live build, plus an anti-cheat review that flags hollow/hard-coded work. "Done" requires passing, not claiming.
- **Can I skip a gate?** Questions and roadmap can be fast ("sensible defaults" / "confirmed"); don't skip demos — they're how you verify value.
- **What's the finish line?** An accepted demo of every increment on staging. Production release/handoff is out of scope (see `generic-workflow.md` §8).
- **Claude Code or Kiro — does my project differ?** No. Same requirements, same decisions, same verified result; only the surface (terminal vs IDE) and the file homes differ.

## 8. The shortest version

> **Deploy:** drop the system files in (Claude Code: `prompts/` + `.claude/` + `CLAUDE.md`; Kiro: `prompts/` + `.kiro/agents/delivery.json` + `.kiro/steering/`), install the harness, allow file access. **Use:** start delivery (Claude Code `/deliver "…"`; Kiro `kiro-cli chat --agent delivery "…"`), then at each gate — answer the questions, confirm the plan, accept each demo or give concrete feedback. In **both** harnesses the system runs *exclusively*: same role prompts, same artifacts, same gates. Repeat until done.

---

## References (official docs)

- Claude Code: install & subagents & skills & settings — https://docs.claude.com/en/docs/claude-code
- Kiro CLI custom agents — https://kiro.dev/docs/cli/custom-agents/ · config reference — https://kiro.dev/docs/cli/custom-agents/configuration-reference/ · subagents — https://kiro.dev/docs/cli/chat/subagents/ · steering — https://kiro.dev/docs/steering/ · hooks — https://kiro.dev/docs/hooks/

*Exact file paths and frontmatter fields above reflect each harness's current docs (checked 2026-06-08); both tools evolve, so verify against the linked pages if something has moved.*
