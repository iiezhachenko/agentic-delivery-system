# Self-Hosting the System — Practical Usage Guide

> Hands-on playbook for **self-host**: **deploy** delivery system against *its own project*, then **operate it** so pipeline authors rest of pipeline.
> Companion to **`self-host-workflow.md`** (explains *how self-build works*). This guide explains *how you set up + run it*.
> Supported harnesses: **Claude Code** (Anthropic CLI) and **Kiro** (AWS agentic IDE) — same two as generic guide; only configuration target differs.
> Audience: operator running self-host (system owner). Assumes familiarity with generic [generic-usage-guide.md](generic-usage-guide.md); this = its reflexive special case.

---

## 1. What you're setting up

You point **existing** delivery system at project *"build the agentic delivery system."* This repo *is* canonical Agentic Delivery Pipeline project — engine reads its frozen artifact trees directly at repo root, no cache. Engine unchanged; you point it at **one new thing**, then run ordinary Build loop:

1. **Deliverable target** — **agentic-delivery-pipeline coding-canon profile** (`code-canon/agentic-delivery-pipeline.md`), selected by **stack ADR** — tells Build phase how to scaffold, write, **verify** a prompt `.md` (same slot future Terraform or TypeScript canon profile fills).

Four upstream phases (Understand / Plan / Decide / Design) already frozen as canonical trees at repo root (`.aprd/ .adr/ .hld/ .roadmap/`), so only Build phase runs live.

| You provide | Harness provides | Self-host setup adds |
|---|---|---|
| existing repo, your judgment at value gate | agent runtime + file access | agentic-delivery-pipeline target + controller picking next unshipped prompt |

**Product being delivered = system's own prompts.** Self-authored prompt judged not by inspecting text but by **running it clean-room against `_fixtures/` products** + checking it delivers correct value (workflow §2, §6). Fixture run = oracle — no separate "is this prompt good?" judge.

---

## 2. Choose your harness

Same two harnesses, same trade-offs as generic guide. Difference = purely what you point them at:

| | **Claude Code** | **Kiro** |
|---|---|---|
| Form | Terminal CLI | Full IDE + chat panel |
| Self-host driver | `/self-host` skill → orchestrator scoped to repo root + agentic-delivery-pipeline target | CLI custom agent `selfhost` → same scope, run exclusively |
| Best when | scripted/automatable self-host runs | visual view of canonical trees + authored prompts |
| Built-in spec flow | n/a | **not used** — system runs exclusively (as in generic guide) |

Pick one; **operator gate identical** (Part C). Deploy/use differ — Part A (Claude Code), Part B (Kiro).

> **Prerequisite for either:** generic deployment from `generic-usage-guide.md` (role library under `prompts/`, harness install, file permissions). Self-host **adds** deliverable target on top; doesn't replace it.

---

# PART A — Claude Code

## A1. Deploy (one-time setup)

**Step 1 — Have generic deploy in place.** Claude Code installed; `prompts/<phase>/<ROLE>.md`, `CLAUDE.md`, `.claude/{settings.json,agents/,skills/}` present per `generic-usage-guide.md` §A1. Self-host builds on that.

**Step 2 — agentic-delivery-pipeline coding-canon profile = active target.** Lives at `code-canon/agentic-delivery-pipeline.md` (per-stack canon store spec already defines — **not** new registry), selected by stack ADR in `.adr/`. Holds six fields:
```
scaffold              the DRY prompt skeleton (frontmatter + caveman block + Role/Rules/Task/Schema/Stop)
coding canon          AB1–AB6 + PR1–PR4 + caveman block (the prompt-domain idioms)
"code" unit           one prompt .md at prompts/<NN-phase>/<ROLE>.md
oracle materialization golden fixtures in _fixtures/ + the declared output schema per role
build idiom           synthesize the prompt text from its HLD-increment contract + the per-role spec §
verify mechanism      clean-room runner simulation (a fresh Sonnet runner gets the prompt verbatim +
                      a _test_bench root, must emit a schema-valid, ID-threaded artifact; both directions)
```
Verify mechanism **already exists + proven** — clean-room runner simulation (fresh Sonnet runner gets prompt verbatim + `_test_bench` root, must emit schema-valid ID-threaded artifact; both directions). Profile *registers* it; doesn't invent one.

**Step 3 — Upstream phases already frozen at repo root.** Four settled phases live as canonical trees prompts read — no rendering step, no cache:
```
repo root/
├── .aprd/    aprd.frozen.md + aprd.lock                  ← the frozen requirements
├── .adr/     log/<NNNN>.md + adr-index.json + adr.lock   ← decisions, INCLUDING the stack ADR
│                                                            pinning stack = agentic-delivery-pipeline
├── .hld/     skeleton.frozen.md + skeleton/*             ← the DRY skeleton + AB1–6 + PR1–4
└── .roadmap/ roadmap.md + 08-rerank.json                 ← remaining_sequence = the unshipped prompts
                                                            (RECONCILE/CRITIQUE increment first)
```
`prompts/*` already shipped = "built skeleton"; `_fixtures/*` = oracle baseline. These trees = **frozen artifacts** — signed, immutable, never hand-edited; change = new version + change request (see §4), not edit to frozen body.

**Step 4 — Point orchestrator at self-project.** Tell orchestrator agent (or dedicated copy) two things: **workspace root = repo root** (read frozen trees there) + **deliverable target = agentic-delivery-pipeline coding-canon profile (`code-canon/agentic-delivery-pipeline.md`)** (so Build writes prompts + verifies via clean-room sim, not pytest). Outputs (authored prompts) land in `prompts/` tree.

**Step 5 — `/self-host` entry point.** Create `.claude/skills/self-host/SKILL.md`:
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

**Step 6 — Orchestrator model during self-host.** Runtime target = Sonnet, but **while loop unproven orchestrator stays Opus** as external judge (workflow §7 — system doesn't yet grade own grading). After first prompt's value confirmed + loop trusted, drop to Sonnet.

## A2. Use (run the self-host)

**Step 1 — Launch in system's repo:**
```bash
cd agentic-systems
claude
```

**Step 2 — Build next prompt:**
```
/self-host
```
RE-RANK reads `.roadmap/`, picks first unshipped prompt (today: **RECONCILE/CRITIQUE** increment). Designs contract, IMPLEMENT authors `.md`, clean-room runner verifies against `_fixtures/`.

**Step 3 — Judge at value gate** (Part C). First prompt: confirm **value** — does clean-room run deliver correct fixture value? Accept → promoted to `prompts/`. Once this gate clears once, loop proven.

**Step 4 — Drain rest.** Re-run `/self-host` (or tell it to "continue draining the sequence"); loop authors each remaining prompt same way, you step back to spot-checks (workflow §7).

**Step 5 — Find outputs.** Authored prompts land in `prompts/<phase>/<ROLE>.md`; per-build records + verify verdicts land under build tree. Status **derived** — ask orchestrator to render from disk; no tracker file to read.

**Resuming:** run `claude`, then `/resume` — or `/self-host` again. State on disk (canonical trees + `prompts/`), so continues from first unshipped/invalid prompt. See §3.

---

# PART B — Kiro

As in generic guide, **Kiro's built-in spec flow not used.** CLI custom agent runs self-host pipeline exclusively. Self-host adds agentic-delivery-pipeline target + steering file declaring deliverable target.

## B1. Deploy (one-time setup)

**Step 1 — Have generic Kiro deploy in place** (per `generic-usage-guide.md` §B1: `kiro-cli`, `prompts/`, `.kiro/agents/{delivery.json,step.json}`, `.kiro/steering/*`).

**Step 2 — agentic-delivery-pipeline coding-canon profile = active target** at `code-canon/agentic-delivery-pipeline.md` — identical content to §A1 Step 2 (harness-independent).

**Step 3 — Upstream phases already frozen at repo root** — same trees as §A1 Step 3; engine reads directly, no cache to build.

**Step 4 — Define self-host orchestrator** `.kiro/agents/selfhost.json`. Same lean-context discipline as generic orchestrator — **do not preload prompt library**; steering only, role prompts lazy-loaded:
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
(While loop unproven you may instead run Opus orchestrator as external judge — §A1 Step 6. After first prompt confirmed, Sonnet.)

**Step 5 — Add self-host steering** `.kiro/steering/self-host.md`:
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
Existing `00-exclusive.md` still applies (don't touch Kiro's built-in specs). Generic step agent `step.json` reused unchanged — runs any role prompt; for self-host it writes a prompt `.md`.

**Step 6 — Verification (mandatory).** Same gate as generic guide's verification step — separate oracle author, build, full ladder, anti-cheat — but **mechanism swapped by target**: ladder runs clean-room runner sim against `_fixtures/` instead of pytest. Spine roles identical; only verify mechanism comes from agentic-delivery-pipeline profile. Wiring this forces spine edit → deliverable-agnostic abstraction leaked — fix spine once, not target (P3).

## B2. Use (run the self-host)

**Step 1 — Build next prompt:**
```bash
cd agentic-systems
kiro-cli chat --agent selfhost "Author the next unshipped prompt."
```
Runs **system's own pipeline** on repo root — not Kiro's spec flow. RE-RANK picks next prompt (RECONCILE/CRITIQUE increment first), IMPLEMENT authors it, clean-room runner verifies against `_fixtures/`.

**Step 2 — Judge at value gate** (Part C). Confirm value before prompt promoted to `prompts/`.

**Step 3 — Drain rest.** Re-run `--agent selfhost "continue"` to author remaining prompts; step back to spot-checks after loop proven.

**Manual stepping (optional).** Drive one role yourself with generic step agent, scoped to repo root:
```bash
kiro-cli chat --agent step "Run prompts/04-build/IMPLEMENT.md against the repo with target code-canon/agentic-delivery-pipeline.md, producing prompts/03-hld/RECONCILE.md (increment mode)."
```

**Resuming:** re-run `--agent selfhost "continue"`; state = canonical trees + `prompts/`, so continues from frontier. See §3.

---

# PART C — Your one gate: judge value first, then step back (both harnesses)

Generic guide: three gates (clarify, roadmap, demo). Self-host: upstream phases already frozen, so **no clarifying-question or roadmap gates** — involvement collapses into **single shifting gate**: external judge guarding against system grading own grading (workflow §7).

## C1. Value gate (while loop unproven)

When self-authored prompt comes out of verify, you confirm — in this priority order:

1. **Value (the bar).** Run clean-room against `_fixtures/`: does prompt deliver **correct value**? — right downstream artifact, ID-threaded, schema-valid, acceptance satisfied. This = bar (workflow §2, §6).
2. **Both directions held?** Known-good prompt PASSed + planted-defect copy FAILed — confirming verifier discriminates.

| Verdict | When | What happens |
|---|---|---|
| **Accept** | clean-room delivers correct fixture value | prompt promoted to `prompts/`; next prompt begins |
| **Reject — re-author** | value wrong (bad artifact, broken ID-thread, fails acceptance) | prompt stays unshipped; IMPLEMENT re-runs (oracle = safety net — bad prompt can't ship) |
| **Reject — fix the spine** | wiring target forced spine edit / abstraction leaked | fix **spine once** (P3), not target; re-run |

**Proof** = clearing C1 **once** on first prompt (RECONCILE/CRITIQUE increment). After that, loop trusted.

## C2. Step back (after first prompt proven)

Once value gate cleared once, you **withdraw from per-prompt judging**. Loop drains remaining sequence on own. Role narrows to:
- **Spot-checks** — sample self-built prompt now + then; oracle still gates every one regardless.
- **Feeding defects back** — self-build exposes rule/design gap → capture as new decision (`D*`), let it auto-apply to later self-builds (reflexive loop, workflow §9).

Never asked to grade prompt in abstract — only: *did fixture product it built come out right?*

---

## 3. Stopping + resuming — self-build is idempotent

Self-build runs on same crash-safe guarantees as any delivery (decision **D20**). Stop deliberately between prompts, or get interrupted mid-prompt (lost internet, killed agent) — nothing committed lost.

**Why it's safe**
- **Disk = source of truth.** Progress *is* canonical trees + promoted prompts; agent's memory disposable.
- **Writes atomic.** Prompt `.md` (+ every artifact) written in full or not at all (temp then rename) — no half-written corrupt prompt on resume.
- **Frozen work immutable.** Frozen trees + already-promoted prompts never modified; steps only *add*.
- **Re-running step harmless.** Re-authoring prompt that already shipped reproduces same result. Unit of recovery = one prompt (one role).

**What happens on resume**
1. Orchestrator scans `prompts/` + canonical trees, finds **frontier** — last shipped valid prompt.
2. Validates that prompt against schema; partial or failing output counts as "not done."
3. Continues from **first unshipped or invalid prompt** — RE-RANK names it; completed ones skipped.

**Your gate answer safe too.** Value acceptance saved moment you give it; resume won't re-ask. Interrupted *before* you judged → re-presents prompt for judging, never silently promotes it.

**How to resume (restart + re-run — no cleanup):**
- **Claude Code:** `claude` → `/resume`, or `/self-host` again.
- **Kiro:** `kiro-cli chat --agent selfhost "continue"`.

---

## 4. Changing self-project's decisions or design

Canonical trees = frozen artifacts — never hand-edited. Change to self-project flows same way any frozen-artifact change does:

- **Decision changes** (e.g. new `D*`) → add new ADR version to `.adr/log/` + `adr-index.json` + raise change request; re-triggers affected downstream stages. Frozen bodies + `adr.lock` never mutated in place.
- **Requirement or design rule changes** → new version of `.aprd/` or `.hld/` artifact + change request, never edit to signed frozen file.
- Keeps on-disk trees + live decision record consistent without hand-maintained duplicate to drift.

---

## 5. Special situations

- **Self-built prompt fails own clean-room test** — does **not** ship; IMPLEMENT re-runs. Oracle = safety net for one genuinely generative step (workflow §6). Repeated failure → contract or canon wrong; fix + re-author.
- **Wiring target forced spine edit** — deliverable-agnostic abstraction leaked (P3). Fix **spine once** so verify-method/build-idiom read from target, then re-run. Don't patch target to dodge it.
- **Prove agnosticism** — once agentic-delivery-pipeline loop drains, author **second** canon profile (`code-canon/terraform.md` or `code-canon/typescript.md`) + run tiny greenfield through **unchanged** spine. Passes own verify with zero engine edits → system genuinely deliverable-agnostic, not agentic-delivery-pipeline-special.
- **Interrupted mid-prompt** — restart + re-run orchestrator; continues from frontier, redoing at most one prompt in flight (§3).

## 6. Do's and don'ts

**Do** — judge **value** (does fixture product come out right?) · keep orchestrator Opus until first prompt proven · let oracle gate every prompt · capture self-build defects as `D*` + let them auto-apply.
**Don't** — grade prompts by reading them instead of running them · hand-edit frozen tree · ship prompt that fails own clean-room test · patch target to dodge spine leak (fix spine) · maintain status/tracker file (status derived) · keep judging every prompt after first proven (step back).

## 7. Frequently asked

- **How is prompt judged "good"?** By running it clean-room against `_fixtures/` + checking it delivers correct value — schema-valid, ID-threaded, acceptance satisfied. Not by inspecting text (workflow §6).
- **Do I re-run aPRD / Roadmap / ADR / HLD?** No — those four phases already **frozen at repo root**. Only Build phase runs live. Re-running settled phases buys nothing + risks churn (workflow §4).
- **Why can self-host start before generic Build phase finished?** Self-hosting needs only controller, oracle, synthesizer — all available now — and agentic-delivery-pipeline profile brings own build+verify mechanism (workflow §8).
- **When am I "done"?** RE-RANK picks next prompt (not human), at least one prompt authored+shipped by pipeline because delivered correct fixture value (value gate cleared once), loop drained rest (workflow §9). Fully validated when **second** deliverable profile also runs through unchanged spine.
- **Claude Code or Kiro — does self-build differ?** No. Same target, same trees, same value gate, same authored prompts; only surface (terminal vs IDE) + launcher differ.
- **Status or run-loop file to maintain?** No — no hand-maintained tracker, changelog, run-loop file. State **derived from disk** (workflow §5): "what's done" scanned from `prompts/` + `_fixtures/` + locks, "what's next" = RE-RANK over roadmap.

## 8. Shortest version

> **Deploy:** on top of generic deploy, point orchestrator at (1) **workspace root = repo root** (where four frozen trees already live) + (2) agentic-delivery-pipeline **coding-canon profile** `code-canon/agentic-delivery-pipeline.md` (selected by stack ADR), via launcher (Claude Code `/self-host`; Kiro `--agent selfhost`). **Use:** run launcher — RE-RANK picks next unshipped prompt, IMPLEMENT writes it, clean-room runner verifies against `_fixtures/`. **Judge:** at one gate, confirm prompt **delivers correct fixture value**; accept → promoted to `prompts/`. Clear that gate once (the proof), then **step back** + let loop drain rest. System builds system.

---

## References

- Self-build conceptual model: [self-host-workflow.md](self-host-workflow.md).
- Decisions: `.adr/` (D20 idempotency; stack ADR pinning `stack = agentic-delivery-pipeline`). Coding-canon store: `code-canon/`.
- Harness mechanics (install, agents, steering, permissions): [generic-usage-guide.md](generic-usage-guide.md) Parts A/B + its References.

*Self-host adds deliverable target on top of generic deploy; harness mechanics unchanged — verify harness specifics against generic guide's linked docs if anything moved.*
