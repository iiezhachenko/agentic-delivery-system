# Self-Hosting the System — Practical Usage Guide

> The hands-on playbook for **self-host**: how to **deploy** the delivery system against *its own project*, then **operate it** so the pipeline authors the rest of the pipeline.
> Companion to **`self-host-workflow.md`** (which explains *how the self-build works*). This guide explains *how you set it up and run it*.
> Supported harnesses: **Claude Code** (Anthropic CLI) and **Kiro** (AWS agentic IDE) — the same two as the generic guide; only the configuration target differs.
> Audience: the operator running self-host (the system owner). Assumes familiarity with the generic [generic-usage-guide.md](generic-usage-guide.md); this is its reflexive special case.

---

## 1. What you're setting up

You are pointing the **existing** delivery system at the project *"build the agentic delivery system."* This repo *is* a canonical Agentic Delivery Pipeline project — the engine reads its frozen artifact trees directly at the repo root, no cache. Nothing about the engine changes; you are pointing it at **one new thing** and then running the ordinary Build loop:

1. **A deliverable target** — the **agentic-delivery-pipeline coding-canon profile** (`code-canon/agentic-delivery-pipeline.md`), selected by the **stack ADR** — that tells the Build phase how to scaffold, write, and **verify** a prompt `.md` (the same slot a future Terraform or TypeScript canon profile will fill).

The four upstream phases (Understand / Plan / Decide / Design) are already frozen as the canonical trees at the repo root (`.aprd/ .adr/ .hld/ .roadmap/`), so only the Build phase runs live.

| You provide | The harness provides | The self-host setup adds |
|---|---|---|
| the existing repo, your judgment at the value gate | the agent runtime + file access | the agentic-delivery-pipeline target + a controller that picks the next unshipped prompt |

**The product being delivered is the system's own prompts.** A self-authored prompt is judged not by inspecting its text but by **running it clean-room against the `_fixtures/` products** and checking it delivers correct value (workflow §2, §6). The fixture run is the oracle — you don't build a separate "is this prompt good?" judge.

---

## 2. Choose your harness

Same two harnesses, same trade-offs as the generic guide. The difference is purely what you point them at:

| | **Claude Code** | **Kiro** |
|---|---|---|
| Form | Terminal CLI | Full IDE + chat panel |
| Self-host driver | `/self-host` skill → orchestrator scoped to the repo root + agentic-delivery-pipeline target | CLI custom agent `selfhost` → same scope, run exclusively |
| Best when | scripted/automatable self-host runs | visual view of the canonical trees + authored prompts |
| Built-in spec flow | n/a | **not used** — the system runs exclusively (as in the generic guide) |

Pick one; the **operator gate is identical** (Part C). Deploy/use differ — Part A (Claude Code), Part B (Kiro).

> **Prerequisite for either:** the generic deployment from `generic-usage-guide.md` (the role library under `prompts/`, the harness install, file permissions). Self-host **adds** the deliverable target on top; it does not replace it.

---

# PART A — Claude Code

## A1. Deploy (one-time setup)

**Step 1 — Have the generic deploy in place.** Claude Code installed; `prompts/<phase>/<ROLE>.md`, `CLAUDE.md`, and `.claude/{settings.json,agents/,skills/}` present per `generic-usage-guide.md` §A1. Self-host builds on that.

**Step 2 — The agentic-delivery-pipeline coding-canon profile is the active target.** It lives at `code-canon/agentic-delivery-pipeline.md` (the per-stack canon store the spec already defines — **not** a new registry), selected by the stack ADR in `.adr/`. It holds the six fields:
```
scaffold              the DRY prompt skeleton (frontmatter + caveman block + Role/Rules/Task/Schema/Stop)
coding canon          AB1–AB6 + PR1–PR4 + caveman block (the prompt-domain idioms)
"code" unit           one prompt .md at prompts/<NN-phase>/<ROLE>.md
oracle materialization golden fixtures in _fixtures/ + the declared output schema per role
build idiom           synthesize the prompt text from its HLD-increment contract + the per-role spec §
verify mechanism      clean-room runner simulation (a fresh Sonnet runner gets the prompt verbatim +
                      a _test_bench root, must emit a schema-valid, ID-threaded artifact; both directions)
```
The verify mechanism **already exists and is proven** — it is the clean-room runner simulation (a fresh Sonnet runner gets the prompt verbatim + a `_test_bench` root, must emit a schema-valid, ID-threaded artifact; both directions). The profile *registers* it; it does not invent one.

**Step 3 — The upstream phases are already frozen at the repo root.** The four settled phases live as the canonical trees the prompts read — no rendering step, no cache:
```
repo root/
├── .aprd/    aprd.frozen.md + aprd.lock                  ← the frozen requirements
├── .adr/     log/<NNNN>.md + adr-index.json + adr.lock   ← decisions, INCLUDING the stack ADR
│                                                            pinning stack = agentic-delivery-pipeline
├── .hld/     skeleton.frozen.md + skeleton/*             ← the DRY skeleton + AB1–6 + PR1–4
└── .roadmap/ roadmap.md + 08-rerank.json                 ← remaining_sequence = the unshipped prompts
                                                            (RECONCILE/CRITIQUE increment first)
```
`prompts/*` already shipped is the "built skeleton"; `_fixtures/*` is the oracle baseline. These trees are **frozen artifacts** — signed, immutable, never hand-edited; a change is a new version + change request (see §4), not an edit to a frozen body.

**Step 4 — Point the orchestrator at the self-project.** Tell the orchestrator agent (or a dedicated copy) two things: **workspace root = the repo root** (read the frozen trees there) and **deliverable target = the agentic-delivery-pipeline coding-canon profile (`code-canon/agentic-delivery-pipeline.md`)** (so Build writes prompts and verifies via clean-room sim, not pytest). Outputs (the authored prompts) land in the `prompts/` tree.

**Step 5 — The `/self-host` entry point.** Create `.claude/skills/self-host/SKILL.md`:
```markdown
---
name: self-host
description: Run the delivery pipeline on its own project — author the next unshipped prompt
argument-hint: "[optional: a specific role to target, else RE-RANK picks the next]"
---
Run the orchestrator with workspace root = the repo root and deliverable target
code-canon/agentic-delivery-pipeline.md. The four upstream phases (Understand/Plan/Decide/Design)
are already frozen at the repo root (.aprd .adr .hld .roadmap) — only Build runs live.
Let RE-RANK pick the next unshipped prompt from .roadmap/08-rerank.json, author it (IMPLEMENT),
verify it clean-room against _fixtures/, and pause at the value gate before promoting it to prompts/.
```

**Step 6 — Orchestrator model during self-host.** The runtime target is Sonnet, but **while the loop is unproven the orchestrator stays Opus** as the external judge (workflow §7 — the system does not yet grade its own grading). After the first prompt's value is confirmed and the loop is trusted, you can drop it to Sonnet.

## A2. Use (run the self-host)

**Step 1 — Launch in the system's repo:**
```bash
cd agentic-systems
claude
```

**Step 2 — Build the next prompt:**
```
/self-host
```
RE-RANK reads `.roadmap/` and picks the first unshipped prompt (today: the **RECONCILE/CRITIQUE** increment). It designs the contract, IMPLEMENT authors the `.md`, and the clean-room runner verifies it against `_fixtures/`.

**Step 3 — Judge at the value gate** (Part C). For the first prompt you confirm **value** — does the clean-room run deliver correct fixture value? Accept → it's promoted to `prompts/`. Once this gate clears once, the loop is proven.

**Step 4 — Drain the rest.** Re-run `/self-host` (or tell it to "continue draining the sequence"); the loop authors each remaining prompt the same way, you step back to spot-checks (workflow §7).

**Step 5 — Find your outputs.** Authored prompts land in `prompts/<phase>/<ROLE>.md`; per-build records and verify verdicts land under the build tree. Status is **derived** — ask the orchestrator to render it from disk; there is no tracker file to read.

**Resuming:** run `claude`, then `/resume` — or just `/self-host` again. State is on disk (the canonical trees + `prompts/`), so it continues from the first unshipped/invalid prompt. See §3.

---

# PART B — Kiro

As in the generic guide, **Kiro's built-in spec flow is not used.** A CLI custom agent runs the self-host pipeline exclusively. Self-host adds the agentic-delivery-pipeline target and a steering file declaring the deliverable target.

## B1. Deploy (one-time setup)

**Step 1 — Have the generic Kiro deploy in place** (per `generic-usage-guide.md` §B1: `kiro-cli`, `prompts/`, `.kiro/agents/{delivery.json,step.json}`, `.kiro/steering/*`).

**Step 2 — The agentic-delivery-pipeline coding-canon profile is the active target** at `code-canon/agentic-delivery-pipeline.md` — identical content to §A1 Step 2 (it's harness-independent).

**Step 3 — The upstream phases are already frozen at the repo root** — same trees as §A1 Step 3; the engine reads them directly, no cache to build.

**Step 4 — Define the self-host orchestrator** `.kiro/agents/selfhost.json`. Same lean-context discipline as the generic orchestrator — **do not preload the prompt library**; steering only, role prompts lazy-loaded:
```json
{
  "name": "selfhost",
  "description": "Runs the pipeline on its own project: authors the next unshipped prompt, verified clean-room",
  "prompt": "file://./prompts/_orchestrator.md",
  "resources": ["file://.kiro/steering/**/*.md"],
  "tools": ["read", "write"],
  "allowedTools": ["read"],
  "model": "claude-sonnet-4"
}
```
(While the loop is unproven you may instead run an Opus orchestrator as the external judge — §A1 Step 6. After the first prompt is confirmed, Sonnet.)

**Step 5 — Add the self-host steering** `.kiro/steering/self-host.md`:
```markdown
# Self-host: build the system on itself
- Workspace root is the repo root. The upstream phases (aPRD/Roadmap/ADR/HLD) are already frozen
  at .aprd .adr .hld .roadmap — only Build runs live.
- Deliverable target is the agentic-delivery-pipeline coding-canon profile (code-canon/agentic-delivery-pipeline.md).
  The "code" unit is a prompt .md; Build writes to prompts/<phase>/<ROLE>.md.
- Verify mechanism is the clean-room runner simulation against _fixtures/ — NOT pytest.
- RE-RANK over .roadmap/08-rerank.json picks the next unshipped prompt. Status is derived
  from disk (scan prompts/ + _fixtures/ + locks); do NOT maintain a tracker file.
```
The existing `00-exclusive.md` still applies (don't touch Kiro's built-in specs). The generic step agent `step.json` is reused unchanged — it runs any role prompt; for self-host it just happens to write a prompt `.md`.

**Step 6 — Verification (mandatory).** Same gate as the generic guide's verification step — separate oracle author, build, full ladder, anti-cheat — but the **mechanism is swapped by target**: the ladder runs the clean-room runner sim against `_fixtures/` instead of pytest. The spine roles are identical; only the verify mechanism comes from the agentic-delivery-pipeline profile. If wiring this forces a spine edit, the deliverable-agnostic abstraction leaked — fix the spine once, not the target (P3).

## B2. Use (run the self-host)

**Step 1 — Build the next prompt:**
```bash
cd agentic-systems
kiro-cli chat --agent selfhost "Author the next unshipped prompt."
```
This runs the **system's own pipeline** on the repo root — not Kiro's spec flow. RE-RANK picks the next prompt (RECONCILE/CRITIQUE increment first), IMPLEMENT authors it, the clean-room runner verifies it against `_fixtures/`.

**Step 2 — Judge at the value gate** (Part C). Confirm value before the prompt is promoted to `prompts/`.

**Step 3 — Drain the rest.** Re-run `--agent selfhost "continue"` to author the remaining prompts; step back to spot-checks after the loop is proven.

**Manual stepping (optional).** Drive one role yourself with the generic step agent, scoped to the repo root:
```bash
kiro-cli chat --agent step "Run prompts/04-build/IMPLEMENT.md against the repo with target code-canon/agentic-delivery-pipeline.md, producing prompts/03-hld/RECONCILE.md (increment mode)."
```

**Resuming:** re-run `--agent selfhost "continue"`; state is the canonical trees + `prompts/`, so it continues from the frontier. See §3.

---

# PART C — Your one gate: judge value first, then step back (both harnesses)

In the generic guide you have three gates (clarify, roadmap, demo). In self-host, the upstream phases are already frozen, so there are **no clarifying-question or roadmap gates** — your involvement collapses into a **single, shifting gate**: the external judge that guards against the system grading its own grading (workflow §7).

## C1. The value gate (while the loop is unproven)

When a self-authored prompt comes out of verify, you confirm — in this priority order:

1. **Value (the bar).** Run clean-room against `_fixtures/`: does the prompt deliver **correct value**? — the right downstream artifact, ID-threaded, schema-valid, acceptance satisfied. This is the bar (workflow §2, §6).
2. **Both directions held?** A known-good prompt PASSed and a planted-defect copy FAILed — confirming the verifier discriminates.

| Verdict | When | What happens |
|---|---|---|
| **Accept** | clean-room delivers correct fixture value | prompt promoted to `prompts/`; next prompt begins |
| **Reject — re-author** | value wrong (bad artifact, broken ID-thread, fails acceptance) | the prompt stays unshipped; IMPLEMENT re-runs (the oracle is the safety net — a bad prompt can't ship) |
| **Reject — fix the spine** | wiring the target forced a spine edit / the abstraction leaked | fix the **spine once** (P3), not the target; re-run |

**The proof** is clearing C1 **once** on the first prompt (the RECONCILE/CRITIQUE increment). After that, the loop is trusted.

## C2. Step back (after the first prompt is proven)

Once the value gate has cleared once, you **withdraw from per-prompt judging**. The loop drains the remaining sequence on its own. Your role narrows to:
- **Spot-checks** — sample a self-built prompt now and then; the oracle still gates every one regardless.
- **Feeding defects back** — when a self-build exposes a rule/design gap, capture it as a new decision (`D*`) and let it auto-apply to later self-builds (the reflexive loop, workflow §9).

You are never asked to grade a prompt in the abstract — only: *did the fixture product it built come out right?*

---

## 3. Stopping & resuming — the self-build is idempotent

The self-build runs on the same crash-safe guarantees as any delivery (decision **D20**). Stop deliberately between prompts, or get interrupted mid-prompt (lost internet, killed agent) — nothing committed is lost.

**Why it's safe**
- **Disk is the source of truth.** Progress *is* the canonical trees + the promoted prompts; the agent's memory is disposable.
- **Writes are atomic.** A prompt `.md` (and every artifact) is written in full or not at all (temp then rename) — no half-written, corrupt prompt on resume.
- **Frozen work is immutable.** The frozen trees and already-promoted prompts are never modified; steps only *add*.
- **Re-running a step is harmless.** Re-authoring a prompt that already shipped reproduces the same result. The unit of recovery is one prompt (one role).

**What happens on resume**
1. The orchestrator scans `prompts/` + the canonical trees and finds the **frontier** — the last shipped, valid prompt.
2. It validates that prompt against its schema; a partial or failing output counts as "not done."
3. It continues from the **first unshipped or invalid prompt** — RE-RANK names it; completed ones are skipped.

**Your gate answer is safe too.** A value acceptance is saved the moment you give it; resume won't re-ask. Interrupted *before* you judged → it simply re-presents the prompt for judging, never silently promotes it.

**How to resume (restart and re-run — no cleanup):**
- **Claude Code:** `claude` → `/resume`, or just `/self-host` again.
- **Kiro:** `kiro-cli chat --agent selfhost "continue"`.

---

## 4. Changing the self-project's decisions or design

The canonical trees are frozen artifacts — never hand-edited. A change to the self-project flows the same way any frozen-artifact change does:

- **A decision changes** (e.g. a new `D*`) → add a new ADR version to `.adr/log/` + `adr-index.json` and raise a change request; it re-triggers the affected downstream stages. The frozen bodies and `adr.lock` are never mutated in place.
- **A requirement or design rule changes** → a new version of the `.aprd/` or `.hld/` artifact + change request, never an edit to the signed frozen file.
- This keeps the on-disk trees and the live decision record consistent without a hand-maintained duplicate to drift.

---

## 5. Special situations

- **A self-built prompt fails its own clean-room test** — it does **not** ship; IMPLEMENT re-runs. The oracle is the safety net for the one genuinely generative step (workflow §6). Repeated failure → the contract or canon is wrong; fix it and re-author.
- **Wiring the target forced a spine edit** — the deliverable-agnostic abstraction leaked (P3). Fix the **spine once** so the verify-method/build-idiom is read from the target, then re-run. Don't patch the target to dodge it.
- **Prove agnosticism** — once the agentic-delivery-pipeline loop drains, author a **second** canon profile (`code-canon/terraform.md` or `code-canon/typescript.md`) and run a tiny greenfield through the **unchanged** spine. If it passes its own verify with zero engine edits, the system is genuinely deliverable-agnostic, not agentic-delivery-pipeline-special.
- **Interrupted mid-prompt** — restart and re-run the orchestrator; it continues from the frontier, redoing at most the one prompt in flight (§3).

## 6. Do's and don'ts

**Do** — judge **value** (does the fixture product come out right?) · keep the orchestrator Opus until the first prompt is proven · let the oracle gate every prompt · capture self-build defects as `D*` and let them auto-apply.
**Don't** — grade prompts by reading them instead of running them · hand-edit a frozen tree · ship a prompt that fails its own clean-room test · patch the target to dodge a spine leak (fix the spine) · maintain a status/tracker file (status is derived) · keep judging every prompt after the first is proven (step back).

## 7. Frequently asked

- **How is a prompt judged "good"?** By running it clean-room against `_fixtures/` and checking it delivers correct value — schema-valid, ID-threaded, acceptance satisfied. Not by inspecting the text (workflow §6).
- **Do I re-run aPRD / Roadmap / ADR / HLD?** No — those four phases are already **frozen at the repo root**. Only the Build phase runs live. Re-running settled phases buys nothing and risks churn (workflow §4).
- **Why can self-host start before the generic Build phase is finished?** Because self-hosting needs only a controller, an oracle, and a synthesizer — all available now — and the agentic-delivery-pipeline profile brings its own build+verify mechanism (workflow §8).
- **When am I "done"?** RE-RANK picks the next prompt (not a human), at least one prompt was authored+shipped by the pipeline because it delivered correct fixture value (the value gate cleared once), and the loop drained the rest (workflow §9). Fully validated when a **second** deliverable profile also runs through the unchanged spine.
- **Claude Code or Kiro — does the self-build differ?** No. Same target, same trees, same value gate, same authored prompts; only the surface (terminal vs IDE) and the launcher differ.
- **Is there a status or run-loop file to maintain?** No — there is no hand-maintained tracker, changelog, or run-loop file. State is **derived from disk** (workflow §5): "what's done" is scanned from `prompts/` + `_fixtures/` + locks, "what's next" is RE-RANK over the roadmap.

## 8. The shortest version

> **Deploy:** on top of the generic deploy, point the orchestrator at (1) **workspace root = the repo root** (where the four frozen trees already live) and (2) the agentic-delivery-pipeline **coding-canon profile** `code-canon/agentic-delivery-pipeline.md` (selected by the stack ADR), via a launcher (Claude Code `/self-host`; Kiro `--agent selfhost`). **Use:** run the launcher — RE-RANK picks the next unshipped prompt, IMPLEMENT writes it, the clean-room runner verifies it against `_fixtures/`. **Judge:** at the one gate, confirm the prompt **delivers correct fixture value**; accept → it's promoted to `prompts/`. Clear that gate once (the proof), then **step back** and let the loop drain the rest. The system is building the system.

---

## References

- Self-build conceptual model: [self-host-workflow.md](self-host-workflow.md).
- Decisions: `.adr/` (D20 idempotency; the stack ADR pinning `stack = agentic-delivery-pipeline`). Coding-canon store: `code-canon/`.
- Harness mechanics (install, agents, steering, permissions): [generic-usage-guide.md](generic-usage-guide.md) Parts A/B + its References.

*Self-host adds a deliverable target on top of the generic deploy; the harness mechanics are unchanged — verify harness specifics against the generic guide's linked docs if anything has moved.*
