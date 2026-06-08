# Self-Hosting the System — Practical Usage Guide

> The hands-on playbook for the **bootstrap**: how to **deploy** the delivery system against *its own project*, then **operate it** so the pipeline authors the rest of the pipeline.
> Companion to **`self-host-workflow.md`** (which explains *how the self-build works*). This guide explains *how you set it up and run it*.
> Supported harnesses: **Claude Code** (Anthropic CLI) and **Kiro** (AWS agentic IDE) — the same two as the generic guide; only the configuration target differs.
> Audience: the operator running the bootstrap (the system owner). Assumes familiarity with the generic [generic-usage-guide.md](generic-usage-guide.md); this is its reflexive special case.

---

## 1. What you're setting up

You are pointing the **existing** delivery system at the project *"build the agentic delivery system."* Nothing about the engine changes — you are configuring **two new things** and then running the ordinary Build loop:

1. **A deliverable target** — the **prompt-library coding-canon profile** (`code-canon/prompt-library.md`), selected by a **stack ADR** — that tells the Build phase how to scaffold, write, and **verify** a prompt `.md` (the same slot a future Terraform or TypeScript canon profile will fill).
2. **A frozen self-workspace** — `_self/` — the on-disk artifact tree produced by *seeding from frozen*: the four already-hand-built phases (Understand / Plan / Decide / Design) mechanically rendered into the shape the prompts read, so only the Build phase runs live.

| You provide | The harness provides | The self-host setup adds |
|---|---|---|
| the existing repo, your judgment at the parity gate | the agent runtime + file access | the prompt-library target + the frozen `_self/` tree + a controller that picks the next unshipped prompt |

**The product being delivered is the system's own prompts.** A self-authored prompt is judged not by inspecting its text but by **running it clean-room against the `_fixtures/` products** and checking it delivers correct value (workflow §2, §6). The fixture run is the oracle — you don't build a separate "is this prompt good?" judge.

---

## 2. Choose your harness

Same two harnesses, same trade-offs as the generic guide. The difference is purely what you point them at:

| | **Claude Code** | **Kiro** |
|---|---|---|
| Form | Terminal CLI | Full IDE + chat panel |
| Self-host driver | `/self-host` skill → orchestrator scoped to `_self/` + prompt-library target | CLI custom agent `selfhost` → same scope, run exclusively |
| Best when | scripted/automatable bootstrap runs | visual view of the `_self/` tree + authored prompts |
| Built-in spec flow | n/a | **not used** — the system runs exclusively (as in the generic guide) |

Pick one; the **operator gate is identical** (Part C). Deploy/use differ — Part A (Claude Code), Part B (Kiro).

> **Prerequisite for either:** the generic deployment from `generic-usage-guide.md` (the role library under `prompts/`, the harness install, file permissions). Self-host **adds** the target + `_self/` on top; it does not replace it.

---

# PART A — Claude Code

## A1. Deploy (one-time setup)

**Step 1 — Have the generic deploy in place.** Claude Code installed; `prompts/<phase>/<ROLE>.md`, `CLAUDE.md`, and `.claude/{settings.json,agents/,skills/}` present per `generic-usage-guide.md` §A1. Self-host builds on that.

**Step 2 — Author the prompt-library coding-canon profile.** Create `code-canon/prompt-library.md` (the per-stack canon store spec 04 §10 already defines — **not** a new registry), selected by the stack ADR you freeze in Step 3. It holds the six fields:
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

**Step 3 — Seed the `_self/` workspace from frozen.** A one-time mechanical render (no LLM — by hand or a small script) of the four hand-built phases into the tree the prompts expect:
```
_self/
├── .aprd/   aprd.frozen.md + aprd.lock     ← _initial_design/00–04 + _rules.md Mission
├── .adr/    log/<NNNN>.md + adr.lock        ← _decisions.md D1–D20, INCLUDING a new stack ADR
│                                              pinning stack = prompt-library
├── .hld/    skeleton.lock + skeleton/*      ← _rules.md DRY skeleton + AB1–6 + PR1–4
└── .roadmap/ roadmap.md + 08-rerank.json    ← _tracker.md inventory; remaining_sequence =
                                               the unshipped prompts (RECONCILE/CRITIQUE increment first)
```
`prompts/*` already shipped is the "built skeleton"; `_fixtures/*` is the oracle baseline. **Treat `_self/` as a rebuildable cache** — never hand-edit it; if a source file (`_decisions.md`, `_rules.md`, …) changes, re-run the freeze. Add `_self/` to `.gitignore` like `_test_bench`.

**Step 4 — Point the orchestrator at the self-project.** Tell the orchestrator agent (or a dedicated copy) two things: **workspace root = `_self/`** (read frozen inputs there) and **deliverable target = the prompt-library coding-canon profile (`code-canon/prompt-library.md`)** (so Build writes prompts and verifies via clean-room sim, not pytest). Outputs (the authored prompts) are promoted to the real `prompts/` tree.

**Step 5 — The `/self-host` entry point.** Create `.claude/skills/self-host/SKILL.md`:
```markdown
---
name: self-host
description: Run the delivery pipeline on its own project — author the next unshipped prompt
argument-hint: "[optional: a specific role to target, else RE-RANK picks the next]"
---
Run the orchestrator with workspace root _self/ and deliverable target code-canon/prompt-library.md.
Seed phases 0–3 from the frozen _self/ tree (do NOT re-run them). Let RE-RANK pick the next
unshipped prompt from .roadmap/08-rerank.json, author it (IMPLEMENT), verify it clean-room
against _fixtures/, and pause at the parity/value gate before promoting it to prompts/.
```

**Step 6 — Orchestrator model during bootstrap.** The runtime target is Sonnet, but **through the parity gate the orchestrator stays Opus** as the external judge (workflow §7 — the system does not yet grade its own grading). After parity clears and the loop is trusted, you can drop it to Sonnet.

## A2. Use (run the bootstrap)

**Step 1 — Launch in the system's repo:**
```bash
cd agentic-systems
claude
```

**Step 2 — Build the next prompt:**
```
/self-host
```
RE-RANK reads `_self/.roadmap/` and picks the first unshipped prompt (today: the **RECONCILE/CRITIQUE** increment). It designs the contract, IMPLEMENT authors the `.md`, and the clean-room runner verifies it against `_fixtures/`.

**Step 3 — Judge at the parity gate** (Part C). For the first prompt you confirm **value** (does the clean-room run deliver correct fixture value?) and glance at **parity** vs the hand-authored twin. Accept → it's promoted to `prompts/`. Once this gate clears once, the bootstrap is proven.

**Step 4 — Drain the rest.** Re-run `/self-host` (or tell it to "continue draining the sequence"); the loop authors each remaining prompt the same way, you step back to spot-checks (workflow §7).

**Step 5 — Find your outputs.** Authored prompts land in `prompts/<phase>/<ROLE>.md`; per-build records and verify verdicts land under the build tree. Status is **derived** — ask the orchestrator to render it from disk; there is no tracker file to read.

**Resuming:** run `claude`, then `/resume` — or just `/self-host` again. State is on disk (`_self/` + `prompts/`), so it continues from the first unshipped/invalid prompt. See §3.

---

# PART B — Kiro

As in the generic guide, **Kiro's built-in spec flow is not used.** A CLI custom agent runs the self-host pipeline exclusively. Self-host adds the prompt-library target, the `_self/` scope, and a steering file declaring the deliverable target.

## B1. Deploy (one-time setup)

**Step 1 — Have the generic Kiro deploy in place** (per `generic-usage-guide.md` §B1: `kiro-cli`, `prompts/`, `.kiro/agents/{delivery.json,step.json}`, `.kiro/steering/*`).

**Step 2 — Author the prompt-library coding-canon profile** `code-canon/prompt-library.md` — identical content to §A1 Step 2 (it's harness-independent).

**Step 3 — Seed the `_self/` workspace from frozen** — identical to §A1 Step 3 (the freeze is a mechanical render, not a harness feature). Gitignore `_self/`.

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
(Through the parity gate you may instead run an Opus orchestrator as the external judge — §A1 Step 6. After parity, Sonnet.)

**Step 5 — Add the self-host steering** `.kiro/steering/10-self-host.md`:
```markdown
# Self-host: build the system on itself
- Workspace root is _self/. Read frozen phases 0–3 from _self/.aprd .adr .hld .roadmap.
  Do NOT re-run aPRD/Roadmap/ADR/HLD — they are seeded from frozen.
- Deliverable target is the prompt-library coding-canon profile (code-canon/prompt-library.md). The "code" unit is a prompt .md;
  Build writes to prompts/<phase>/<ROLE>.md.
- Verify mechanism is the clean-room runner simulation against _fixtures/ — NOT pytest.
- RE-RANK over _self/.roadmap/08-rerank.json picks the next unshipped prompt. Status is derived
  from disk (scan prompts/ + _fixtures/ + locks); do NOT maintain a tracker file.
```
The existing `00-exclusive.md` still applies (don't touch Kiro's built-in specs). The generic step agent `step.json` is reused unchanged — it runs any role prompt; for self-host it just happens to write a prompt `.md`.

**Step 6 — Verification (mandatory).** Same gate as the generic guide §B6 — separate oracle author, build, full ladder, anti-cheat — but the **mechanism is swapped by target**: the ladder runs the clean-room runner sim against `_fixtures/` instead of pytest. The spine roles are identical; only the verify mechanism comes from the prompt-library profile. If wiring this forces a spine edit, the deliverable-agnostic abstraction leaked — fix the spine once, not the target (P3).

## B2. Use (run the bootstrap)

**Step 1 — Build the next prompt:**
```bash
cd agentic-systems
kiro-cli chat --agent selfhost "Author the next unshipped prompt."
```
This runs the **system's own pipeline** on `_self/` — not Kiro's spec flow. RE-RANK picks the next prompt (RECONCILE/CRITIQUE increment first), IMPLEMENT authors it, the clean-room runner verifies it against `_fixtures/`.

**Step 2 — Judge at the parity gate** (Part C). Confirm value (+ a parity glance) before the prompt is promoted to `prompts/`.

**Step 3 — Drain the rest.** Re-run `--agent selfhost "continue"` to author the remaining prompts; step back to spot-checks after parity clears.

**Manual stepping (optional).** Drive one role yourself with the generic step agent, scoped to `_self/`:
```bash
kiro-cli chat --agent step "Run prompts/04-build/IMPLEMENT.md against _self/ with target code-canon/prompt-library.md, producing prompts/03-hld/RECONCILE.md (increment mode)."
```

**Resuming:** re-run `--agent selfhost "continue"`; state is the `_self/` tree + `prompts/`, so it continues from the frontier. See §3.

---

# PART C — Your one gate: judge first, then step back (both harnesses)

In the generic guide you have three gates (clarify, roadmap, demo). In self-host, phases 0–3 are seeded from frozen, so there are **no clarifying-question or roadmap gates** — your involvement collapses into a **single, shifting gate**: the external judge that guards against the system grading its own grading (workflow §7).

## C1. The parity / value gate (while bootstrapping)

When a self-authored prompt comes out of verify, you confirm — in this priority order:

1. **Value (primary).** Run clean-room against `_fixtures/`, does the prompt deliver **correct value**? — the right downstream artifact, ID-threaded, schema-valid, acceptance satisfied. This is the bar (workflow §2, §6).
2. **Parity (secondary).** Glance at the hand-authored twin. Benign wording differences are fine — **behavior wins over byte-equality.** Parity is a convenience cross-check, not the gate.
3. **Both directions held?** A known-good prompt PASSed and a planted-defect copy FAILed — confirming the verifier discriminates.

| Verdict | When | What happens |
|---|---|---|
| **Accept** | clean-room delivers correct fixture value | prompt promoted to `prompts/`; next prompt begins |
| **Reject — re-author** | value wrong (bad artifact, broken ID-thread, fails acceptance) | the prompt stays unshipped; IMPLEMENT re-runs (the oracle is the safety net — a bad prompt can't ship) |
| **Reject — fix the spine** | wiring the target forced a spine edit / the abstraction leaked | fix the **spine once** (P3), not the target; re-run |

**The bootstrap proof** is clearing C1 **once** on the first prompt (the RECONCILE/CRITIQUE increment). After that, the loop is trusted.

## C2. Step back (after parity)

Once the parity gate has cleared, you **withdraw from per-prompt judging**. The loop drains the remaining sequence on its own. Your role narrows to:
- **Spot-checks** — sample a self-built prompt now and then; the oracle still gates every one regardless.
- **Feeding defects back** — when a self-build exposes a rule/design gap, capture it as a new decision (`D*`) and let it auto-apply to later self-builds (the reflexive loop, workflow §9).

You are never asked to grade a prompt in the abstract — only: *did the fixture product it built come out right?*

---

## 3. Stopping & resuming — the self-build is idempotent

The self-build runs on the same crash-safe guarantees as any delivery (decision **D20**). Stop deliberately between prompts, or get interrupted mid-prompt (lost internet, killed agent) — nothing committed is lost.

**Why it's safe**
- **Disk is the source of truth.** Progress *is* the `_self/` tree + the promoted prompts; the agent's memory is disposable.
- **Writes are atomic.** A prompt `.md` (and every artifact) is written in full or not at all (temp then rename) — no half-written, corrupt prompt on resume.
- **Frozen work is immutable.** `_self/` (the seeded phases) and already-promoted prompts are never modified; steps only *add*.
- **Re-running a step is harmless.** Re-authoring a prompt that already shipped reproduces the same result. The unit of recovery is one prompt (one role).

**What happens on resume**
1. The orchestrator scans `prompts/` + `_self/` and finds the **frontier** — the last shipped, valid prompt.
2. It validates that prompt against its schema; a partial or failing output counts as "not done."
3. It continues from the **first unshipped or invalid prompt** — RE-RANK names it; completed ones are skipped.

**Your gate answer is safe too.** A parity acceptance is saved the moment you give it; resume won't re-ask. Interrupted *before* you judged → it simply re-presents the prompt for judging, never silently promotes it.

**How to resume (restart and re-run — no cleanup):**
- **Claude Code:** `claude` → `/resume`, or just `/self-host` again.
- **Kiro:** `kiro-cli chat --agent selfhost "continue"`.

---

## 4. Keeping `_self/` in sync (the freeze is a cache)

The four seeded phases live in `_self/` as a **rebuildable cache of the hand artifacts** — never the editable source.

- **Edit the source, not the freeze.** Change `_decisions.md` / `_rules.md` / the specs; **re-run the S2 freeze** to regenerate `_self/`. Never hand-edit a file under `_self/`.
- **A decision that changes the self-project** (e.g. a new `D*`) flows in by re-freezing the `.adr/` tree — keeping the frozen ADR set and the live decision log consistent.
- **Stale-freeze guard:** if a source edit lands while `_self/` is mid-loop, re-freeze before the next prompt so the controller plans against current truth (the freeze-drift guard).

---

## 5. Special situations

- **A self-built prompt fails its own clean-room test** — it does **not** ship; IMPLEMENT re-runs. The oracle is the safety net for the one genuinely generative step (workflow §6). Repeated failure → the contract or canon is wrong; fix it and re-author.
- **Wiring the target forced a spine edit** — the deliverable-agnostic abstraction leaked (P3). Fix the **spine once** so the verify-method/build-idiom is read from the target, then re-run. Don't patch the target to dodge it.
- **Parity diff is large but value is correct** — accept it. Behavior is the bar; the hand-authored text was never canonical (value is the bar; §C1). Large *and* value-wrong → reject and re-author.
- **Prove agnosticism** — once the prompt-library loop drains, author a **second** canon profile (`code-canon/terraform.md` or `code-canon/typescript.md`) and run a tiny greenfield through the **unchanged** spine. If it passes its own verify with zero engine edits, the system is genuinely deliverable-agnostic, not prompt-library-special.
- **Interrupted mid-prompt** — restart and re-run the orchestrator; it continues from the frontier, redoing at most the one prompt in flight (§3).

## 6. Do's and don'ts

**Do** — judge **value first** (does the fixture product come out right?), parity second · keep the orchestrator Opus through the parity gate · treat `_self/` as a cache and re-freeze on source edits · let the oracle gate every prompt · capture self-build defects as `D*` and let them auto-apply.
**Don't** — grade prompts by reading them instead of running them · hand-edit `_self/` · ship a prompt that fails its own clean-room test · patch the target to dodge a spine leak (fix the spine) · maintain a status/tracker file (status is derived) · keep judging every prompt after the parity gate clears (step back).

## 7. Frequently asked

- **How is a prompt judged "good"?** By running it clean-room against `_fixtures/` and checking it delivers correct value — schema-valid, ID-threaded, acceptance satisfied. Not by inspecting the text (workflow §6).
- **Do I re-run aPRD / Roadmap / ADR / HLD?** No — those four phases are **seeded from frozen** (`_self/`). Only the Build phase runs live. Re-running settled phases buys nothing and risks churn (workflow §4).
- **Why can the bootstrap start before the generic Build phase is finished?** Because self-hosting needs only a controller, an oracle, and a synthesizer — all available now — and the prompt-library profile brings its own build+verify mechanism (workflow §8).
- **When am I "done"?** RE-RANK picks the next prompt (not a human), at least one prompt was authored+shipped by the pipeline because it delivered correct fixture value (parity gate cleared), and the loop drained the rest (workflow §9). Fully validated when a **second** deliverable profile also runs through the unchanged spine.
- **Claude Code or Kiro — does the self-build differ?** No. Same target, same `_self/` tree, same parity gate, same authored prompts; only the surface (terminal vs IDE) and the launcher differ.
- **What about the old `_tracker.md` / `_prompt-run.md`?** Gone — in the self-hosted system there is no hand-maintained tracker, changelog, or run-loop file. State is **derived from disk** (workflow §5): "what's done" is scanned from `prompts/` + `_fixtures/` + locks, "what's next" is RE-RANK over the roadmap. The hand-maintained duplicate (and the anti-bloat ceremony that re-synced it) is deleted, not ported.

## 8. The shortest version

> **Deploy:** on top of the generic deploy, add (1) the prompt-library **coding-canon profile** `code-canon/prompt-library.md` (selected by a stack ADR), (2) the frozen **`_self/`** tree (seed phases 0–3 from the hand artifacts), and (3) a launcher scoped to both (Claude Code `/self-host`; Kiro `--agent selfhost`). **Use:** run the launcher — RE-RANK picks the next unshipped prompt, IMPLEMENT writes it, the clean-room runner verifies it against `_fixtures/`. **Judge:** at the one gate, confirm the prompt **delivers correct fixture value** (parity is a secondary glance); accept → it's promoted to `prompts/`. Clear that gate once (the bootstrap proof), then **step back** and let the loop drain the rest. The system is building the system.

---

## References

- Self-build conceptual model: [self-host-workflow.md](self-host-workflow.md).
- Decisions: `_decisions.md` (D20 idempotency; the stack ADR pinning `stack = prompt-library`). Coding-canon store: spec 04 §10.
- Harness mechanics (install, agents, steering, permissions): [generic-usage-guide.md](generic-usage-guide.md) Parts A/B + its References.

*Self-host adds a target and a frozen workspace on top of the generic deploy; the harness mechanics are unchanged — verify harness specifics against the generic guide's linked docs if anything has moved.*
