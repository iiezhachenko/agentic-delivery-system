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
| Self-host driver | `/self-host` skill → **adp-orchestrator** wrapper (root-wired) scoped to repo root + agentic-delivery-pipeline target | CLI custom agent `selfhost` → same scope, run exclusively |
| Best when | scripted/automatable self-host runs | visual view of canonical trees + authored prompts |
| Built-in spec flow | n/a | **not used** — system runs exclusively (as in generic guide) |

Pick one; **operator gate identical** (Part C). Deploy/use differ — Part A (Claude Code), Part B (Kiro).

> **Prerequisite for either:** clone the ADP repo + install the harness. Self-host runs ADP on its OWN repo — role library (`prompts/`), root `CLAUDE.md`, and the **canonical self-host wiring** (Claude: `.claude/{settings.json, agents/{adp-orchestrator.md,step-runner.md}, skills/{self-host,deliver}/}` · Kiro `.kiro/agents/{selfhost,step}.json`, `.kiro/steering/`) are ALREADY in-tree. Same canonical shape an end-user gets (thin skill → orchestrator wrapper → loop body + clean-room runner), only **root-wired**: the engine sits in-place at the repo root, not copied under `.claude/adp/`. Do NOT `npx adp init` (that's the end-user install into a *different* project — `generic-usage-guide.md`). Self-host **adds** a deliverable target on top of the checkout; doesn't replace it.

---

# PART A — Claude Code

## A1. Deploy (one-time setup)

**Step 1 — Clone repo + install Claude Code.** Self-host runs against the checkout itself — `prompts/<phase>/<ROLE>.md`, root `CLAUDE.md`, `.claude/{settings.json, agents/{adp-orchestrator.md,step-runner.md}, skills/{self-host,deliver}/}` already in-tree (the canonical thin-skill → orchestrator-wrapper → runner shape, root-wired). No `npx adp init` (that installs into a separate end-user project). Self-host builds on the checkout.

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

**Step 4 — The orchestrator wrapper binds the self-project params.** The canonical `.claude/agents/adp-orchestrator.md` wrapper (root-wired) is handed two things by the launcher: **WORKSPACE_ROOT = repo root** (engine + frozen trees coincide) + **DELIVERABLE_TARGET = agentic-delivery-pipeline coding-canon profile (`code-canon/agentic-delivery-pipeline.md`)** (so Build writes prompts + verifies via clean-room sim, not pytest). It reads the self-host loop body `prompts/_orchestrator.md` + runs it verbatim, spawning `step-runner` for clean-room verify. Outputs (authored prompts) land in `prompts/`.

**Step 5 — `/self-host` entry point = a thin launcher** at `.claude/skills/self-host/SKILL.md`. It carries no loop logic — it just hands `$ARGUMENTS` to the **adp-orchestrator** wrapper with the self-host params:
```markdown
---
name: self-host
description: Run the delivery pipeline on its own project — author the next unshipped prompt
argument-hint: "[optional: status | a specific ROLE to target, else RE-RANK picks the next]"
---
Thin launcher. Hand $ARGUMENTS to the adp-orchestrator agent with:
  LOOP_BODY=prompts/_orchestrator.md · ENGINE_ROOT=. · WORKSPACE_ROOT=.
  DELIVERABLE_TARGET=code-canon/agentic-delivery-pipeline.md
The four upstream phases are frozen at the repo root (.aprd .adr .hld .roadmap) — only Build runs
live (the loop's disk-derived STEP-0 frontier skips them). RE-RANK picks the next unshipped prompt;
IMPLEMENT authors it; step-runner verifies it clean-room against _fixtures/; pause at the value gate.
```
This mirrors the end-user `/deliver` launcher (which hands the **generic** loop body to the same wrapper) — same canonical shape, different params.

**Step 6 — Orchestrator model.** Runtime target = Sonnet. The loop is now trusted + observed to advance, so the orchestrator runs **Sonnet** and the earlier Opus external-judge pass is **retired** (the runner/verifier were always Sonnet/High). (Historical: while the loop was unproven, the orchestrator ran Opus as an external judge so the system didn't grade its own grading — workflow §7.)

> **`/deliver` in the checkout (parity).** The same `.claude/skills/deliver/SKILL.md` an end-user gets is wired in-tree too, over the SAME `adp-orchestrator` wrapper — so you can dogfood the canonical end-user path from the dev repo. It runs the **generic** loop (all 5 phases live) and **must target an EXTERNAL workspace root** (`/deliver "<request>" --root <external-dir>`); the wrapper HALTs if WORKSPACE_ROOT resolves to the repo root, protecting the factory's frozen `.aprd/.roadmap/.adr/.hld`. For real end-user delivery, still prefer `npx adp init` into the target project (`generic-usage-guide.md`).

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

**Step 1 — Clone repo + install `kiro-cli`.** Self-host wiring already in-tree: `prompts/`, `.kiro/agents/{selfhost.json,step.json}`, `.kiro/steering/*`. No `npx adp init` (end-user install into a separate project).

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
- **Adding a whole new capability** (not just tweaking a decision) → that's a feature against ADP itself: see **§4A** (feature-add on the self-project).

---

## 4A. Adding a NEW capability to ADP — feature-add on the self-project

§A2/§B2 drain prompts the roadmap **already lists**. To add a capability the plan doesn't yet have — a new **class** (bugfix/refactor/…), a new **role**, a new **playbook** — bring a **change request to the self-project**. ADP runs its own **feature-add** path on its OWN repo: versions its requirements, plans only the new prompt-authoring slices, authors them, and **guards every prompt already shipped**. This is the system using its own feature-add capability on itself.

> ADP just gained this capability. The brownfield-feature spine (`prompts/_playbooks/feature-add.md` + ten role overlays + the new `BASELINE-MAP` role) **is** the feature-add path. It was bootstrapped via the planned self-slice loop (§A2/§B2) — you can't feature-add a capability before it exists — but now that it's shipped, **future** capabilities get added to ADP via the path below. Plan: `_brownfield-feature/`; both-directions oracle: `_fixtures/brownfield-feature/`.

**Run it — same launcher, phrased as a change to ADP:**
```
# Claude Code
/self-host "Add a `bugfix` class to the pipeline: classifier route + playbook + the role overlays it needs."
# Kiro
kiro-cli chat --agent selfhost "Add a `bugfix` class: classifier route + playbook + role overlays."
```
Bare `/self-host` (no argument) still drains the planned roadmap. Hand it a **change request** and it runs the feature-add path instead — the classifier recognizes new-behavior-into-the-existing-prompt-library and routes `class=feature-add`.

**Meta-mapping — feature-add concepts (generic PART D) on the self-project:**

| feature-add concept | …on ADP itself |
|---|---|
| baseline product | the shipped `prompts/` + frozen `.aprd/.adr/.hld` + `_fixtures/` |
| change request | "add capability X to the pipeline" |
| reads existing first | reads shipped `prompts/`, the DRY skeleton, the canon, conventions |
| new requirements version | `.aprd/aprd.v2.frozen.md` — new pipeline requirements above high-water (original untouched) |
| new slices, old pinned | new prompt-authoring self-slices; every shipped prompt stays pinned-done |
| integration seams | where the new role/class plugs into the spine (classifier route, playbook field, shared `## Rules` + delta block) |
| convention baseline | the prompt-domain canon — DRY skeleton, AB1–AB6, PR1–PR4, caveman register |
| **regression guard** | **every already-shipped prompt must still pass its both-directions fixture oracle; the new prompt conforms to the skeleton/canon, never invents structure** |
| value gate | the new prompt(s) deliver correct value clean-room against `_fixtures/` (incl. a new fixture for the new capability) |

**The meta regression guard is the load-bearing part.** A new capability ships only when (1) its own clean-room fixture run is correct, (2) every existing prompt's fixture oracle stays green, and (3) the new prompt is an overlay carrying ONLY what differs from the shared `## Rules` (AB1 — never a fork). Same disk-is-truth + idempotency rules (§3) apply; the version bump never hand-edits a frozen tree (§4).

**Where outputs land:** new/overlaid prompts at `prompts/<phase>/<ROLE>.md` (+ any new `prompts/_playbooks/<class>.md`); new requirements at `.aprd/aprd.v2.frozen.md`; the new capability's oracle at `_fixtures/<name>/`. Existing shipped prompts + frozen trees unchanged.

---

## 5. Special situations

- **Adding a new capability to ADP (new class/role/playbook)** — bring it as a change request to the self-project; ADP runs **feature-add on itself** (versions its requirements, authors only the new prompts, regression-guards every shipped prompt). Full how-to in **§4A**.
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
- **How do I add a NEW capability (class/role/playbook) to ADP?** Bring it as a change request to the self-project (`/self-host "add …"` / `--agent selfhost "add …"`). ADP runs **feature-add on itself**: versions its own requirements, authors only the new prompts, and a regression guard keeps every shipped prompt's fixture oracle green. Full how-to: **§4A**. (Newly possible now that the feature-add capability is shipped — it was itself bootstrapped via the planned self-slice loop, since a capability can't feature-add itself into existence.)
- **Claude Code or Kiro — does self-build differ?** No. Same target, same trees, same value gate, same authored prompts; only surface (terminal vs IDE) + launcher differ.
- **Status or run-loop file to maintain?** No — no hand-maintained tracker, changelog, run-loop file. State **derived from disk** (workflow §5): "what's done" scanned from `prompts/` + `_fixtures/` + locks, "what's next" = RE-RANK over roadmap.

## 8. Shortest version

> **Deploy:** on top of generic deploy, point orchestrator at (1) **workspace root = repo root** (where four frozen trees already live) + (2) agentic-delivery-pipeline **coding-canon profile** `code-canon/agentic-delivery-pipeline.md` (selected by stack ADR), via launcher (Claude Code `/self-host`; Kiro `--agent selfhost`). **Use:** run launcher — RE-RANK picks next unshipped prompt, IMPLEMENT writes it, clean-room runner verifies against `_fixtures/`. **Judge:** at one gate, confirm prompt **delivers correct fixture value**; accept → promoted to `prompts/`. Clear that gate once (the proof), then **step back** + let loop drain rest. System builds system. **Adding a NEW capability to ADP** (a class/role/playbook the roadmap doesn't list)? Hand the launcher a change request — ADP runs feature-add on itself: versions its own requirements, authors only the new prompts, regression-guards every shipped prompt (**§4A**).

---

## References

- Self-build conceptual model: [self-host-workflow.md](self-host-workflow.md).
- Decisions: `.adr/` (D20 idempotency; stack ADR pinning `stack = agentic-delivery-pipeline`). Coding-canon store: `code-canon/`.
- Harness mechanics (install, agents, steering, permissions): [generic-usage-guide.md](generic-usage-guide.md) Parts A/B + its References.

*Self-host adds deliverable target on top of generic deploy; harness mechanics unchanged — verify harness specifics against generic guide's linked docs if anything moved.*
