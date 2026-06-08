# Using the System — Practical Usage Guide

> Hands-on playbook: **deploy** delivery system into harness, then **use** it to take project from rough request to verified software.
> Companion to **`generic-workflow.md`** (explains *how system works*). This guide explains *how you set up + operate it*.
> Supported harnesses: **Claude Code** (Anthropic CLI) and **Kiro** (AWS agentic IDE).
> Audience: person driving project (client/product owner). No engineering background assumed; deploy steps = copy-paste.

---

## 1. What you're setting up

Delivery system = **library of role prompts** (under `prompts/<phase>/<ROLE>.md`) plus small set of **rules** agents always follow + **on-disk artifacts** they produce (`.aprd/ .roadmap/ .adr/ .hld/ .build/`). Deploying = drop those files into your project, wire into harness so single command (or button) runs pipeline.

Both harnesses already think in **specs → design → tasks**, exactly this pipeline's shape — so deployment = mostly mapping system onto each harness's native constructs.

| You provide | Harness provides | System adds |
|---|---|---|
| your request, answers at gates | agent runtime + file access | the discipline: requirements freeze, vertical slices, decision records, verified builds, anti-cheat, demo gate |

---

## 2. Choose your harness

| | **Claude Code** | **Kiro** |
|---|---|---|
| Form | Terminal CLI (works in any editor/repo) | Full IDE (VS Code–based) with chat panel |
| Best when | you live in terminal, want scripted/automatable runs | you want visual spec/task board + click-to-run tasks |
| How it runs | subagents + skills + `CLAUDE.md` | **CLI custom agent** runs pipeline exclusively (Kiro's built-in spec flow **not** used) + steering for canon |
| Setup effort | low (drop files, allow permissions) | low (drop steering, use Spec button) |

Pick one; **per-gate interactions identical** (Part C). Deploy/use steps differ — Part A for Claude Code, Part B for Kiro.

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

**Step 2 — Lay system into your project.** Copy delivery-system files so project looks like:
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
Artifact folders (`.aprd/`, `.roadmap/`, `.adr/`, `.hld/`, `.build/`) created automatically as pipeline runs — you don't make them.

**Step 3 — `CLAUDE.md` holds always-on rules.** Loaded into every session. Put pipeline's standing rules here (phase order, artifact conventions, "never overwrite frozen artifact," verify-before-done rule). Home for system's canon.

**Step 4 — Allow permissions pipeline needs.** Create `.claude/settings.json`:
```json
{
  "permissions": {
    "allow": ["Read", "Write", "Edit", "Agent", "Bash(git *)"],
    "defaultMode": "acceptEdits"
  }
}
```
`Read/Write/Edit` let agents manage artifacts without prompting; `Agent` lets orchestrator spawn role agents; `acceptEdits` auto-approves file writes (still asked before shell commands).

**Step 5 — `/deliver` entry point.** `.claude/skills/deliver/SKILL.md` = thin launcher:
```markdown
---
name: deliver
description: Run the delivery pipeline on a request (aPRD → roadmap → ADR → HLD → build)
argument-hint: "<your request in plain language>"
---
Hand the request in $ARGUMENTS to the orchestrator agent and run the pipeline,
pausing at the clarifying-questions, roadmap, and demo gates.
```

> MCP **not required** — this = disk-artifact pipeline. Add MCP server only if you want system to pull from external tracker (Jira/GitHub) or post to Slack.

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
or type request + ask it to run pipeline.

**Step 3 — Answer gates, same session.** Agent pauses, asks you directly (via on-screen question) — no restarts:
- **Clarifying questions** → you answer (Part C, §C2).
- **Roadmap** → you confirm or reorder (§C3).
- **Each demo** → you accept or give feedback (§C4).

**Step 4 — Find outputs.** Requirements, roadmap, decision records, design land in `.aprd/ .roadmap/ .adr/ .hld/`; built increments land under `.build/` + on staging target orchestrator reports.

**Resuming:** close terminal anytime; run `claude` again + use `/resume` to pick session back up. Pipeline reads state from on-disk artifacts, so continues from last completed step.

---

# PART B — Kiro

Kiro ships own built-in spec workflow (`requirements.md` / `design.md` / `tasks.md`). **We do not use it.** Delivery system *is* methodology, must run exclusively — own phases, own artifacts (`.aprd/ .roadmap/ .adr/ .hld/ .build/`), own gates. Kiro used purely as **runtime**: **CLI custom agent** runs system's orchestrator prompt, loads role library, drives pipeline end to end. Native **Spec** button stays untouched; steering used only to carry system's rules as context + tell Kiro to defer entirely to pipeline.

## B1. Deploy (one-time setup)

**Step 1 — Install Kiro CLI** (`kiro-cli`), open terminal in your project. (Kiro IDE optional — useful for *viewing/editing* agent + artifact files; **driver = custom agent**, run from CLI, not IDE's Spec button.)

**Step 2 — Lay system into your project.** Delivery system drives everything; Kiro just runs it:
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
System's artifact folders (`.aprd/ .roadmap/ .adr/ .hld/ .build/`) written by agents as pipeline runs — **not** Kiro's `.kiro/specs/`.

**Step 3 — Define orchestrator agent** `.kiro/agents/delivery.json`. Its prompt = system's orchestration logic. **Keep context lean — do NOT preload prompt library.** Loading all ~39 role prompts every turn = pure token waste; orchestrator only needs rules + ability to read role prompt *when that step runs*. So `resources` loads only steering (small, always-applicable); each role prompt + each step's input artifacts **lazy-loaded from disk on demand**:
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
Orchestrator sequences phases and, each step, **delegates to fresh `step` subagent** (Step 5) — handing just that step's role-prompt path. Role prompt then lives only in subagent's fresh context, discarded when step ends, so no turn carries more than active step. Orchestrator stays small for whole run.

**Step 4 — Make discipline (+ exclusivity) steering.** Steering files in `.kiro/steering/*.md` loaded as always-on context (+ committed to Git). Critical one, `00-exclusive.md`, keeps Kiro on rails:
```markdown
# Run the delivery pipeline exclusively
- Do NOT generate or use Kiro's built-in spec files (requirements.md / design.md / tasks.md).
- The methodology is the role prompts under prompts/<phase>/<ROLE>.md. Follow them verbatim, in phase order.
- Read inputs from and write outputs to the system's artifact tree (.aprd/ .roadmap/ .adr/ .hld/ .build/).
- Honor the system's gates: clarifying questions, roadmap confirmation, per-slice demo acceptance.
```
Other steering files carry canon (phase order, slice/skeleton rules, ADR requirement, verification/anti-cheat, demo gate).

**Step 5 — Generic pipeline-step agent** `.kiro/agents/step.json`. Execution unit: **one** agent runs **any** role, not 39 per-role configs. Orchestrator hands it role-prompt path; it reads that prompt, follows verbatim against project root, reads only that step's input artifacts, writes outputs, ends — fresh context every step.
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
**Sonnet = runtime target — whole pipeline must run on Sonnet**, so step agent Sonnet across board. (Search/discovery-heavy steps could later route to **Haiku** for speed + cost; per-step optimization to add once Sonnet baseline proven, not now.) Can also drive step yourself — see B2 "Manual stepping."

**Step 6 — Verification (mandatory; built into every slice).** Verification **not optional, not a hook** — required phase of pipeline gating every slice. Each slice, system:
1. **Authors oracle** — role *separate from builder* turns slice's acceptance criteria + contracts into executable tests (builder can't grade own work).
2. **Builds** slice against design.
3. **Runs full test ladder** against *live* build (contract + flow + acceptance tests; plus regression for changes to existing products).
4. **Runs anti-cheat pass** — semantic-diff critique flagging hollow/hard-coded implementations (e.g. values matching test fixtures, empty branches, stub logic).

Slice reaches "done" **only when ladder green + you accepted demo** — never on claim of completion. `verification.md` steering file encodes this gate, build-phase role prompts execute it; nothing ships unverified.

**Step 7 (optional) — Hooks.** Hooks (`.kiro/hooks/*.json`) don't *add* verification — that always runs. They only **auto-trigger** already-mandatory pass on event (e.g. re-run whenever build files change). Create one from IDE Command Palette → **Kiro: Open Kiro Hook UI**, or describe in natural language.

## B2. Use (run a project)

**Step 1 — Start pipeline** by running orchestrator agent with your request:
```bash
cd your-project
kiro-cli chat --agent delivery "A web marketplace where clients post jobs and freelancers apply."
```
Launches **system's own pipeline** — not Kiro's spec flow. Orchestrator reads role prompts, begins at aPRD phase.

**Step 2 — Answer gates, same chat.** Orchestrator pauses, asks you directly; gates = system's, identical to workflow:
- **Clarifying questions** → you answer (Part C, §C2).
- **Roadmap** → you confirm or reorder (§C3).
- **Each demo** → you accept or give feedback (§C4).

**Step 3 — Find outputs.** Requirements, roadmap, decision records, design land in `.aprd/ .roadmap/ .adr/ .hld/`; built increments land under `.build/` + on staging target orchestrator reports. (Open these in Kiro IDE for visual view — plain Markdown/JSON, Git-tracked.)

**Manual stepping (optional).** Prefer phase-by-phase? Run generic step agent directly, handing it one role prompt:
```bash
kiro-cli chat --agent step "Run prompts/hld/DEFINE-CONTRACTS.md against this project."
```
Reads prior phase's on-disk artifacts, writes next, so manual stepping + orchestrated runs interchangeable — same Sonnet step agent either way.

**Resuming:** pipeline keeps state in on-disk artifacts, so re-running `--agent delivery` continues from last completed step — no built-in session/spec state to manage.

---

# PART C — What you do at each checkpoint (both harnesses)

Setup differs; **your job at three gates same.** Part you actually do.

## C1. Write a good request

Plain language; rough fine. Template to copy:
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

Describe **outcomes**; let system choose technology. Can still *require* stack — put under Constraints.

## C2. Answer clarifying questions

System asks only what it can't safely assume, highest-impact first. Answer briefly + directly:
```
Q1 (affects architecture): Single region or global?  →  Single region (EU) for now.
Q2 (affects scope): Profiles visible before applying? →  Yes.
Q3: Sign-in methods?                                  →  Email and Google.
```
Don't know yet? Say **"assume X for now"** — recorded as explicit assumption you can change later, never silent guess. Result = **frozen requirements** — contract everything checked against, so spend little care here.

## C3. Review + confirm roadmap

You'll see planned order of increments (skeleton first, then features):
```
1. Skeleton (thin end-to-end foundation)   3. Browse / search jobs
2. Post a job                              4. Apply to a job   5. Review applicants
```
- **Confirm** as-is, or **reorder** to your priorities: *"Move 'Review applicants' before 'Browse jobs' — I want the hiring flow demoable first."*
- Some items must precede others (skeleton always first). Request impossible order → system explains dependency + proposes nearest valid one.

## C4. Review each demo + respond (repeating loop)

Each increment, system builds it, verifies with tests, deploys to staging, shows **working demo**. Try real thing, then respond:

| Response | When | What happens next |
|---|---|---|
| **Accept** | does what slice promised | delivered; next slice begins |
| **Fix within this slice** | right feature, something off (wrong default, visible bug, missed criterion) | system corrects + re-demos same slice |
| **New / changed requirement** | you want something different/additional | captured as change; requirements + roadmap update, scheduled as work (not silently folded in) |

Give **concrete observable** feedback tied to demo ("job list should default to *open* jobs"). "Done" always means *both* tests pass **and** you accepted demo.

---

## 3. Stopping + resuming — system is idempotent

Stop at **any** time — clean pause after slice, or abrupt interruption: lost internet, closed laptop, killed agent mid-step. System built to **pick up exactly where left off**. No run depends on state living only in agent's memory.

**Why it's safe**
- **Disk = source of truth.** Every step records result as file in artifact tree; agent's in-memory state disposable. Progress *is* what's on disk — nothing else.
- **Writes atomic.** Step writes output in full or not at all (write to temp file, then swap into place). Interruption mid-write never leaves half-written corrupt artifact — file either complete result or absent.
- **Committed work immutable.** Frozen artifacts — requirements, decisions, design, accepted slices (locks) — never modified; steps only *add* new files. So interrupted or re-run step can't damage anything already agreed or accepted.
- **Re-running step harmless.** Each step reads only frozen inputs, writes one output. Run again → reproduces same result — no double-counting, no drift. Unit of recovery = single step (one role), so most you ever redo = one step in flight.

**What happens on resume**
1. Orchestrator scans artifact tree, finds **frontier** — last complete valid output.
2. Validates that frontier against schema; partial or missing output counts as "not done."
3. Continues from **first step whose output absent or invalid** — completed steps skipped; interrupted step re-runs cleanly.

**Your gate answers safe too.** Replies (clarifying answers, roadmap confirmation, demo acceptance) saved as files moment you give them. Reply saved → resume uses it, won't re-ask. Interrupted *before* answering → simply asks again — never silent guess.

**How to resume (restart + re-run — no cleanup):**
- **Claude Code:** run `claude`, then `/resume` to reopen session — or run `/deliver` again / tell orchestrator to continue. Reads artifact tree, picks up next step.
- **Kiro:** re-run `kiro-cli chat --agent delivery "continue"`. Reads same artifacts, continues from frontier; no separate session state to restore.

---

## 4. Making changes mid-project

- Raise changes at **next checkpoint** (question round, roadmap, demo). System updates frozen requirements, re-plans affected slices, keeps everything consistent.
- Prefer to **redirect between slices, not mid-slice** — let current slice finish + accept/reject it first.
- Every change **recorded**, so history of what changed + why stays intact.

## 5. Special situations

- **Several things in one request** ("fix upload bug, make it faster, *and* add PDF support") — submit as-is; system splits, classifies each piece, confirms breakdown before proceeding.
- **Bug in already-accepted slice** — report like new request (broken behavior + how to reproduce); system reproduces, fixes, guards against regressions.
- **Change technology** — raise as constraint/decision change; recorded decision, so can be revisited (late changes may trigger flagged rework).
- **Pause or get interrupted** — stop deliberately, or lose connection / close laptop / kill agent mid-step. Either way system resumes cleanly from on-disk artifact tree; see **§3 (idempotency)**. Short version: restart + re-run orchestrator — continues from frontier, redoing at most one step in flight.
- **Disagree with decision** — open decision record to see rationale + options weighed; state your constraint + it's reopened.

## 6. Do's and don'ts

**Do** — describe outcomes, not implementation · state real constraints up front · answer questions directly ("assume X" when unsure) · actually use each demo before responding · give concrete feedback.
**Don't** — over-specify *how* while leaving *what* vague · sit on clarifying questions (they block progress) · change direction mid-slice · accept demo you haven't tried · file new idea as "fix" (flag as change).

## 7. Frequently asked

- **Need to code?** No — plain language throughout.
- **How often will it interrupt me?** Only at three gates; otherwise runs on own.
- **How do I know it isn't faked?** Tests authored by role separate from builder, run against live build, plus anti-cheat review flagging hollow/hard-coded work. "Done" requires passing, not claiming.
- **Can I skip a gate?** Questions + roadmap can be fast ("sensible defaults" / "confirmed"); don't skip demos — how you verify value.
- **Finish line?** Accepted demo of every increment on staging. Production release/handoff out of scope (see `generic-workflow.md` §8).
- **Claude Code or Kiro — does my project differ?** No. Same requirements, same decisions, same verified result; only surface (terminal vs IDE) + file homes differ.

## 8. Shortest version

> **Deploy:** drop system files in (Claude Code: `prompts/` + `.claude/` + `CLAUDE.md`; Kiro: `prompts/` + `.kiro/agents/delivery.json` + `.kiro/steering/`), install harness, allow file access. **Use:** start delivery (Claude Code `/deliver "…"`; Kiro `kiro-cli chat --agent delivery "…"`), then at each gate — answer questions, confirm plan, accept each demo or give concrete feedback. In **both** harnesses system runs *exclusively*: same role prompts, same artifacts, same gates. Repeat until done.

---

## References (official docs)

- Claude Code: install & subagents & skills & settings — https://docs.claude.com/en/docs/claude-code
- Kiro CLI custom agents — https://kiro.dev/docs/cli/custom-agents/ · config reference — https://kiro.dev/docs/cli/custom-agents/configuration-reference/ · subagents — https://kiro.dev/docs/cli/chat/subagents/ · steering — https://kiro.dev/docs/steering/ · hooks — https://kiro.dev/docs/hooks/

*Exact file paths + frontmatter fields above reflect each harness's current docs (checked 2026-06-08); both tools evolve, so verify against linked pages if something moved.*
