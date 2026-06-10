# Using the System — Practical Usage Guide

> Hands-on playbook: **deploy** delivery system into harness, then **use** it to take project from rough request to verified software.
> Companion to **`generic-workflow.md`** (explains *how system works*). This guide explains *how you set up + operate it*.
> Supported harnesses: **Claude Code** (Anthropic CLI) and **Kiro** (AWS agentic IDE).
> Audience: person driving project (client/product owner). No engineering background assumed; deploy steps = copy-paste.

---

## 1. What you're setting up

Delivery system = **library of role prompts** (under `prompts/<phase>/<ROLE>.md`) plus small set of **rules** agents always follow + **on-disk artifacts** they produce (`.aprd/ .roadmap/ .adr/ .hld/ .build/`). Deploying = one installer command (`adp init`, run from the shipped tarball) lays those files into your project + wires the harness so a single command (or button) runs the pipeline.

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
| How it runs | subagents + skills + `.claude/rules/` canon | **CLI custom agent** runs pipeline exclusively (Kiro's built-in spec flow **not** used) + steering for canon |
| Setup effort | low (`adp init --harness=claude`) | low (`adp init --harness=kiro`) |

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

**Step 2 — Install ADP into your project from the shipped tarball — one command (offline, no registry):**
```bash
cd your-project
npx --package=/path/to/adp-<version>.tgz adp init --harness=claude
# one-time global alt: npm install -g /path/to/adp-<version>.tgz  →  then `adp init --harness=claude` anywhere
```
`adp-<version>.tgz` = artifact you were handed (`make pack` output). Installer lays the runtime, wires the `/deliver` launcher, re-hashes every file vs manifest (integrity), runs a smoke self-test, prints launch command. Needs node ≥ 18. Re-run = no-op (idempotent: skips files already present + valid). Reinstall a new version over an existing one: add `--force`.

Project gains (all machinery under one harness dir — **zero root pollution**):
```
your-project/
└── .claude/
    ├── settings.json                 # permissions (pre-set by installer)
    ├── rules/00-adp-canon.md          # always-on canon (Claude auto-loads .claude/rules/*.md)
    ├── agents/
    │   ├── adp-orchestrator.md         # drives the phases; spawns role agents
    │   └── adp-step-runner.md          # runs one role prompt verbatim (model: sonnet)
    ├── skills/deliver/SKILL.md         # the /deliver entry point
    └── adp/                            # the engine (you don't edit these)
        ├── prompts/<phase>/<ROLE>.md   # the role library (aprd, roadmap, adr, hld, build)
        ├── code-canon/                 # per-stack coding-canon profiles
        ├── tools/                      # economy-lint + fixtures
        └── docs/                       # this guide + workflow
```
Artifact folders (`.aprd/ .roadmap/ .adr/ .hld/ .build/`) created at your project root automatically as pipeline runs — you don't make them. They're the deliverable you commit to Git; the `.claude/adp/` engine can be `.gitignore`d.

> **Canon lives in `.claude/rules/00-adp-canon.md`, not a root `CLAUDE.md`.** Claude does NOT auto-load `.claude/CLAUDE.md`, but DOES auto-load `.claude/rules/*.md` — so the installer puts the always-on rules (phase order, artifact conventions, "never overwrite frozen," verify-before-done) there.

**Step 3 — Permissions.** Installer writes `.claude/settings.json` with what the pipeline needs (`Read/Write/Edit` to manage artifacts, `Agent` to spawn role agents, `acceptEdits` to auto-approve writes — still asked before shell commands). Nothing to hand-edit.

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

**Step 2 — Install ADP into your project from the shipped tarball — one command (offline, no registry):**
```bash
cd your-project
npx --package=/path/to/adp-<version>.tgz adp init --harness=kiro
# one-time global alt: npm install -g /path/to/adp-<version>.tgz  →  then `adp init --harness=kiro` anywhere
```
Installer lays the runtime, wires the `delivery` custom agent, re-hashes every file vs manifest (integrity), runs a smoke self-test, prints launch command. Needs node ≥ 18. Re-run = no-op (idempotent); reinstall a new version with `--force`.

Project gains (Kiro used purely as **runtime**; ADP drives everything — zero root pollution):
```
your-project/
└── .kiro/
    ├── agents/
    │   ├── delivery.json             # the orchestrator (the one you run) — lean context, delegates each step
    │   └── step.json                 # generic pipeline-step agent (Sonnet) — runs ONE role prompt in fresh context
    ├── steering/                      # always-on canon + exclusivity (incl 00-exclusive.md)
    └── adp/                           # the engine (you don't edit these)
        ├── prompts/<phase>/<ROLE>.md  # the role library (aprd, roadmap, adr, hld, build)
        ├── code-canon/ tools/ docs/
```
System's artifact folders (`.aprd/ .roadmap/ .adr/ .hld/ .build/`) written at your project root by agents as pipeline runs — **not** Kiro's `.kiro/specs/`.

**How the installer wired it (you don't author these — context only):**

- **Orchestrator `delivery.json`** — prompt = `.kiro/adp/prompts/_orchestrator.md`. **Lean context: prompt library NOT preloaded** (all ~39 role prompts every turn = token waste). `resources` loads only steering (small, always-applicable); each role prompt + each step's input artifacts **lazy-loaded from disk on demand**. Each step it **delegates to a fresh `step` subagent**, handing only that step's role-prompt path — role prompt lives only in the subagent's fresh context, discarded when step ends. Orchestrator stays small for whole run.
- **Generic step agent `step.json`** — execution unit: **one** agent runs **any** role, not 39 per-role configs. Reads the given role prompt, follows verbatim against project root, reads only that step's inputs, writes outputs, ends — fresh context every step. **Sonnet across board** (runtime target — whole pipeline runs on Sonnet). Can drive a step yourself — see B2 "Manual stepping."
- **Steering `.kiro/steering/*.md`** — always-on context (Git-tracked). Critical `00-exclusive.md` keeps Kiro on rails: do NOT use Kiro's built-in spec files (`requirements.md`/`design.md`/`tasks.md`); methodology = the role prompts, followed verbatim in phase order; read/write the ADP artifact tree; honor the three gates. Others carry canon (phase order, slice/skeleton rules, ADR requirement, verification/anti-cheat, demo gate).

**Verification is mandatory — built into every slice (not optional, not a hook).** Each slice: (1) a role *separate from the builder* authors the oracle (acceptance criteria + contracts → executable tests); (2) build; (3) run full test ladder against the *live* build (contract + flow + acceptance + regression); (4) anti-cheat pass — semantic-diff critique flagging hollow/hard-coded work (values matching fixtures, empty branches, stubs). Slice reaches "done" **only when ladder green + you accepted demo** — never on claim. Build-phase role prompts execute this; nothing ships unverified.

**(Optional) Hooks** (`.kiro/hooks/*.json`) don't *add* verification — that always runs. They only **auto-trigger** the already-mandatory pass on event (e.g. re-run when build files change). Create from IDE Command Palette → **Kiro: Open Kiro Hook UI**, or describe in natural language.

## B2. Use (run a project)

**Step 1 — Start pipeline** by running orchestrator agent with your request:
```bash
cd your-project
kiro-cli chat --agent delivery "A web marketplace where clients post jobs and freelancers apply."
```
Launches **system's own pipeline** — not Kiro's spec flow. Orchestrator reads role prompts, begins at aPRD phase.

**Step 2 — Answer gates, same chat.** Orchestrator pauses, asks you directly; same three gates as the Claude Code flow above (§C2/C3/C4).

**Step 3 — Find outputs.** Same output tree as above. (Open in Kiro IDE for visual view — plain Markdown/JSON, Git-tracked.)

**Manual stepping (optional).** Prefer phase-by-phase? Run generic step agent directly, handing it one role prompt:
```bash
kiro-cli chat --agent step "Run prompts/hld/DEFINE-CONTRACTS.md against this project."
```
Reads prior phase's on-disk artifacts, writes next, so manual stepping + orchestrated runs interchangeable — same Sonnet step agent either way.

**Resuming:** pipeline keeps state in on-disk artifacts, so re-running `--agent delivery` continues from last completed step — no built-in session/spec state to manage.

---

# PART C — What you do at each checkpoint (both harnesses)

Setup differs; **your job at three gates same.** Part you do.

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

# PART D — Adding a feature to an already-delivered project (feature-add)

Already shipped a project with this system? To add ONE new feature you don't start over — you **re-enter the SAME project**. System detects it's a change to an existing build (class **feature-add**), reads what's already there, adds the feature **without disturbing what works**. Same harness, same launcher — no new install, no flag.

## D1. Prerequisites
- The project already carries its ADP artifact tree (`.aprd/ .adr/ .hld/ .build/`) from the original delivery — frozen requirements + ≥1 accepted slice. (If this system delivered it, that's there. Run from the project root + branch where those artifacts live.)
- Engine installed (PART A/B). Nothing to re-deploy.

## D2. Run it — same launcher, phrased as a change
**Claude Code:**
```
cd your-project
claude
/deliver "Add the ability to tag each client project with a label, and let us filter the project list by tag."
```
**Kiro:**
```bash
kiro-cli chat --agent delivery "Add the ability to tag each client project with a label, and let us filter the project list by tag."
```
Phrase it as the **change** you want ("add …", "let users also …", "everything else stays as-is"). System recognizes *new-behavior-into-an-existing-codebase* and routes the feature-add path **automatically** — no flag to set. Keep it to **one atomic feature** per request (several asks → system splits + confirms the breakdown first, §5).

## D3. What's different from a fresh build
- **Reads first, asks less.** System reads the existing requirements, decisions, design, and code *before* asking you anything — so it asks only about genuinely new gaps the feature opens ("one tag per project, or many?"). It won't re-litigate what's already settled.
- **Requirements get a NEW version; the old one is untouched.** Your original frozen requirements stay byte-for-byte identical. The feature lands as a new version (`aprd.v2`) carrying only the new requirements + how they plug into the existing system. Nothing already agreed is rewritten.
- **Only the new feature is planned + built.** Already-accepted slices stay done — pinned, not rebuilt. The roadmap shows just the new slice(s).
- **Existing behavior is guarded.** Every new slice carries a **regression guard** — the system re-runs the existing acceptance tests the feature touches and **blocks** if any previously-green behavior breaks. New code must also match the project's existing conventions (naming, layout, error handling), not generic defaults.
- **Same demo gate.** You accept the new feature on staging exactly as before.

## D4. Your checkpoints (only what's new)
- **Clarifying questions** — only the new feature's gaps (often none; sensible defaults applied, which you can override). Same as §C2.
- **Roadmap** — confirm the new slice order; existing accepted slices show as already-done/pinned. Same as §C3.
- **Demo** — accept the new feature or give concrete feedback (§C4). Because of the regression guard, accepting also confirms nothing existing broke.

## D5. Where the outputs land
- **New requirements version:** `.aprd/aprd.v2.frozen.md` (original `.aprd/aprd.frozen.md` left unchanged). Your written change request is filed at `.aprd/change-requests/CR-<n>.md`; a `.aprd/baseline-map.json` records what already existed.
- **New slice:** `.build/slices/S<new>/` — its `verify-output.json` shows the full test ladder **plus** the regression layer green.
- **Roadmap:** `.roadmap/08-rerank.json` lists the new slice(s) in sequence with the baseline slices pinned under `completed`.

## D6. Worked example you can read
`_fixtures/brownfield-feature/` is a complete feature-add end-to-end: a delivered freelancer time-tracking app + the change request *"tag + filter client projects"* + the correctly-extended trees (new requirements R11/R13, new slice S5, regression guard on the existing project acceptance), **plus four planted mistakes** — breaking an existing feature, reusing an ID, editing frozen requirements, off-convention code — each shown FAILING while the correct version passes. Read it to see exactly what good feature-add output looks like and what the guards reject.

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

**Your gate answers safe too.** Replies (clarifying answers, roadmap confirmation, demo acceptance) saved as files moment you give them. Reply saved → resume uses it, won't re-ask. Interrupted *before* answering → asks again — never silent guess.

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
- **Add a feature to an already-delivered project** — re-enter the same project and submit the change as a request; system runs the **feature-add** path (versions requirements, builds only the new slice, guards existing behavior). Full how-to in **PART D**.
- **Bug in already-accepted slice** — report like new request (broken behavior + how to reproduce); system reproduces, fixes, guards against regressions.
- **Change technology** — raise as constraint/decision change; recorded decision, so can be revisited (late changes may trigger flagged rework).
- **Pause or get interrupted** — stop deliberately, or lose connection / close laptop / kill agent mid-step. Either way system resumes cleanly from on-disk artifact tree; see **§3 (idempotency)**. Short version: restart + re-run orchestrator — continues from frontier, redoing at most one step in flight.
- **Disagree with decision** — open decision record to see rationale + options weighed; state your constraint + it's reopened.

## 6. Do's and don'ts

**Do** — describe outcomes, not implementation · state real constraints up front · answer questions directly ("assume X" when unsure) · use each demo before responding · give concrete feedback.
**Don't** — over-specify *how* while leaving *what* vague · sit on clarifying questions (they block progress) · change direction mid-slice · accept demo you haven't tried · file new idea as "fix" (flag as change).

## 7. Frequently asked

- **Need to code?** No — plain language throughout.
- **How often will it interrupt me?** Only at three gates; otherwise runs on own.
- **How do I know it isn't faked?** Tests authored by role separate from builder, run against live build, plus anti-cheat review flagging hollow/hard-coded work. "Done" requires passing, not claiming.
- **Can I skip a gate?** Questions + roadmap can be fast ("sensible defaults" / "confirmed"); don't skip demos — how you verify value.
- **Finish line?** Accepted demo of every increment on staging. Production release/handoff out of scope (see `generic-workflow.md` §8).
- **Claude Code or Kiro — does my project differ?** No. Same requirements, same decisions, same verified result; only surface (terminal vs IDE) + file homes differ.

## 8. Shortest version

> **Deploy:** install harness, then run the shipped tarball's installer (`npx --package=./adp-<version>.tgz adp init --harness=claude|kiro`) in your project (lays runtime under `.claude/adp/` or `.kiro/adp/`, wires launcher, sets permissions, smoke-checks). **Use:** start delivery (Claude Code `/deliver "…"`; Kiro `kiro-cli chat --agent delivery "…"`), then at each gate — answer questions, confirm plan, accept each demo or give concrete feedback. In **both** harnesses system runs *exclusively*: same role prompts, same artifacts, same gates. Repeat until done. **Adding a feature to a project already delivered this way?** Re-enter it with the same launcher + your change request — system auto-runs the feature-add path (versions requirements, builds only the new slice, guards what works). See **PART D**.

---

## References (official docs)

- Claude Code: install & subagents & skills & settings — https://docs.claude.com/en/docs/claude-code
- Kiro CLI custom agents — https://kiro.dev/docs/cli/custom-agents/ · config reference — https://kiro.dev/docs/cli/custom-agents/configuration-reference/ · subagents — https://kiro.dev/docs/cli/chat/subagents/ · steering — https://kiro.dev/docs/steering/ · hooks — https://kiro.dev/docs/hooks/

*Exact file paths + frontmatter fields above reflect each harness's current docs (checked 2026-06-08); both tools evolve, so verify against linked pages if something moved.*
