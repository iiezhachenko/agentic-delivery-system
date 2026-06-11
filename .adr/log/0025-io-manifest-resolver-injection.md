---
id: ADR-0025
title: io-manifest + resolver own the input read-graph — new frozen artifact class
status: Accepted
date: 2026-06-11
class: self-host
scope: global
mode: foundation
source: reasoned
supersedes: null
superseded_by: null
---

## Decision

- **D25 — Input resolution leaves the prompt into a frozen `io/` manifest; a deterministic resolver injects paths.**
  Context (docs 02/03): every prompt's `inputs:` is hand-maintained; in 04-build it explodes (IMPLEMENT 26 input lines in 5 `when`-groups; INTEGRATE 30). Each group header = a predicate over `(mode, class, pass)` — the exact dispatch the orchestrator ALREADY derives from disk (STEP 0). The prompt re-encodes, as prose, a dispatch table code owns → drift (declared ≠ read, nothing enforces) + cross-prompt waste (frozen-frame re-typed in ~7 prompts, AB1 violation). Input resolution is NOT stochastic: `(role, state) → paths` is a pure function. **Extends D22** — the resolver is a D22 tool; this ADR adds the new frozen DATA class + the injection decision.
  **Decision:**
  1. **io-manifest.** `io/io-manifest.json` = `groups` (recurring frozen-frame / oracle bundles, one home) + `roles[].always` + `roles[].when[]` (predicate-gated `read` lists). `when` predicate = AND over state keys, plain equality only (deterministic; no expression language — YAGNI). Multiple predicates may fire; matched `read` lists union (specificity additive, matches today's "shared + delta both bind"). Path features: placeholder (`{scope}`/`{slice}`), lock-indirection (`<lock>#<field>`), glob, optional.
  2. **Resolver + injection.** `resolve(role, state)` (`tools/io/resolve.mjs`, a D22 tool) → flat deduped path list. Orchestrator STEP-4.1 calls it (replaces "parse prompt frontmatter"), seeds exactly those into `_test_bench`, prepends `Inputs (resolved for this run): <flat list + hints>` to the runner message. **Path-grade injection only** — runner reads disk as today, no branching leaks in; clean-room intact. Content-injection rejected (staleness + bloat; D3 prefers path + seed).
  3. **Prompt declares no inputs.** `inputs:` frontmatter + body `when`-group headers removed; the prompt declares only what it WRITES (`outputs:`). The `format` clause's load-bearing grounding → io-manifest `hint` (one clause) or a Rules bullet (AB4); routing → manifest `path`.
  4. **New frozen artifact class.** `io/` + `io.lock` join the immutability set (mirror `schemas.lock`, D24). io-manifest = source of truth for the read-graph. Change = new version + downstream change-request.
  **Consequences:** 04-build prompts shed ~26–30 frontmatter lines each; drift impossible (prompt declares nothing); frozen-frame typed once. Resolver becomes load-bearing → both-directions selftest mandatory (right state→right set; planted-wrong-state caught) in the `pack.mjs` gate. Coding-canon self-containment rule rewritten, AB3 re-scoped, PR2 restated, prompt-skeleton drops `inputs:` (HLD canon CR, this intake). **Reopen if** a `when` table needs richer logic than AND-equality (add `any`/`not` then, not now).
