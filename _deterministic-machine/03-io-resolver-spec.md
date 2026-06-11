# 03 — IO Resolver Spec: io-manifest, resolve algorithm, selftest, orchestrator swap

> Implementation spec for [[02-input-injection]]. Defines: the state tuple, io-manifest schema, `when`-predicate grammar, path features (placeholder / glob / lock-indirection / optional), resolver algorithm, CLI, both-directions selftest, the orchestrator STEP-4.1 swap. Idiom-matches `tools/economy-lint/lint.mjs` (Node ESM, zero deps, profiles-in-code, exit codes, both-directions selftest). Grounded on real IMPLEMENT input set.

## What the resolver replaces

IMPLEMENT's real `inputs:` (26 paths, 5 `when`-groups) shows every feature the resolver must handle:
- **placeholder** — `.build/slices/<slice_id>/build-plan.json` (`{slice}` from state).
- **scope placeholder** — `.build/skeleton/...` vs `.build/slices/<slice>/...` (`{scope}`).
- **glob** — `.build/skeleton/oracle/contract/*.py`, `src/freelancer_app/**`.
- **lock-indirection** — `.aprd/<aprd.lock.artifact>` (read `.aprd/aprd.lock`, use its `artifact` field → `aprd.v2.frozen.md`).
- **multi-file ref** — `.adr/log/<NNNN>-<slug>.md` (all ADR bodies).
- **optional** — `build-record.json` "absent on first run".
- **inherited** — slice-build also reads `.build/skeleton/oracle/oracle.json` (frozen, by reference).

## State tuple (resolver input)

`resolve(role, state)` where `state` = what orchestrator STEP 0 already derives from disk:

```
state = {
  role,            # e.g. "IMPLEMENT"
  class,           # greenfield | feature-add | bugfix | ...   (from playbook / adr.lock.class)
  mode,            # skeleton-build | slice-build | bugfix     (from sentinel presence)
  pass,            # skeleton | increment                      (Phase-3 dual-mode)
  scope,           # "skeleton" | "slices/<slice_id>"          (derived: target build scope)
  slice            # "<slice_id>" | null                       (auto-selected from 08-rerank remaining_sequence)
}
```
No new derivation — same tuple used to pick the frontier + seed `_test_bench`. Resolver is one more consumer.

## io-manifest schema (`io/io-manifest.json`)

```json
{
  "$schema_version": 1,
  "groups": {
    "frozen_frame": [
      { "path": ".adr/adr.lock",                "hint": "frozen gate (status==frozen); class" },
      { "path": ".hld/skeleton.lock" },
      { "path": ".aprd/aprd.lock" },
      { "path": ".hld/skeleton/components.json", "hint": "your component id/name/responsibility + name→module" },
      { "path": ".hld/skeleton/contracts.json",  "hint": "CT* for your seams; frozen contract is the wall (B3)" },
      { "path": ".hld/skeleton/data-model.json" },
      { "path": ".adr/log/<NNNN>-<slug>.md",     "glob": true, "hint": "frozen stack; ground, never re-decide (B5)" }
    ],
    "frozen_oracle": [
      { "path": ".build/{scope}/oracle/oracle.lock" },
      { "path": ".build/{scope}/oracle/oracle.json" },
      { "path": ".build/{scope}/oracle/contract/*.py", "glob": true },
      { "path": ".build/{scope}/oracle/contract/conftest.py" }
    ],
    "current_what": [
      { "path": ".aprd/aprd.lock#artifact", "indirect": true, "hint": "CURRENT frozen WHAT via lock — never hardcode version (BF7/P8)" }
    ]
  },
  "roles": {
    "IMPLEMENT": {
      "always": ["frozen_frame"],
      "when": [
        { "if": { "mode": "skeleton-build" },
          "read": ["frozen_oracle",
                   { "path": ".build/skeleton/build-plan.json", "hint": "PRIMARY scope; structural_defects must be empty" },
                   { "path": ".build/skeleton/build-record.json", "optional": true }] },

        { "if": { "mode": "slice-build" },
          "read": ["frozen_oracle",
                   { "path": ".build/slices/{slice}/build-plan.json" },
                   { "path": ".build/skeleton/oracle/oracle.json", "hint": "inherited skeleton greens — never re-run (B4/H14)" },
                   { "path": ".build/slices/{slice}/build-record.json", "optional": true },
                   { "path": ".roadmap/08-rerank.json" }] },

        { "if": { "mode": "slice-build", "class": "feature-add" },
          "read": ["current_what",
                   { "path": ".aprd/baseline-map.json" },
                   { "path": "src/freelancer_app/**", "glob": true, "hint": "convention exemplar; READ-ONLY, never restyle (BF1/BF5)" }] },

        { "if": { "mode": "slice-build", "class": "bugfix" },
          "read": ["current_what",
                   { "path": ".aprd/diagnosis.json", "hint": "root_cause + localization.symbol = the ONLY edit site" },
                   { "path": ".build/slices/{slice}/oracle/reproduction/test_*.py", "glob": true },
                   { "path": "src/freelancer_app/**", "glob": true, "hint": "EDIT in place at BLAST_RADIUS symbol (BF4)" }] }
      ]
    }
  }
}
```

- **groups** = recurring bundles, one home. `frozen_frame` typed once, referenced by ~all build roles (today re-typed in 7).
- **role.always** = unconditional groups/paths. **role.when[]** = predicate-gated.
- `read` entries = group-id (string) OR inline path-object.
- Path-object fields: `path`, optional `hint` (load-bearing grounding — [[02-input-injection]] M3), `glob`, `indirect`, `optional`.

## `when`-predicate grammar

```
predicate := { <stateKey>: <value>, ... }      # AND over keys
```
- Keys ∈ state (`mode`, `class`, `pass`). All keys must equal state → predicate fires. (Plain equality only — deterministic, no expression language; richer needs add an `any`/`not` op later, YAGNI now.)
- **Multiple predicates may fire** (e.g. `{mode:slice-build}` AND `{mode:slice-build,class:bugfix}`). All matched `read` lists union. Specificity is additive, not override — bugfix slice-build reads slice-build inputs PLUS bugfix delta. Matches today's "shared + delta also bind" semantics.

## Path features (resolver expansion order)

1. **placeholder fill** — `{scope}` ← `state.scope`; `{slice}` ← `state.slice`. Missing state for a fired predicate → resolver ERROR (not silent skip): the manifest claims this path needs `{slice}` but state has none = bug.
2. **lock-indirection** (`indirect:true`, `path` form `<lockfile>#<field>`) — read lockfile JSON, take `field`, join to its dir. `.aprd/aprd.lock#artifact` → `aprd.v2.frozen.md` → `.aprd/aprd.v2.frozen.md`. Indirection target missing → ERROR.
3. **glob** (`glob:true`) — expand `*.py` / `**` / `<NNNN>-<slug>` against disk. Zero matches + not `optional` → ERROR; optional → drop.
4. **optional** (`optional:true`) — missing path dropped, no error.
5. **dedupe** — slice-build + bugfix both pull `current_what`; same resolved path appears once.

```mermaid
flowchart LR
  st[state tuple] --> al[expand always groups]
  al --> wh[eval when[] → union matched reads]
  wh --> ph[fill placeholders]
  ph --> ind[resolve lock-indirection]
  ind --> gl[expand globs]
  gl --> opt[drop missing optional]
  opt --> dd[dedupe] --> out[flat resolved list: path + hint + optional]
```

## Resolver algorithm (`tools/io/resolve.mjs`)

```
resolve(manifest, state):
  refs = []
  for g in manifest.roles[state.role].always:        refs ++= expandGroup(g)
  for w in manifest.roles[state.role].when:
      if matches(w.if, state):                        # every key equals → fire
          for r in w.read: refs ++= (isString(r) ? expandGroup(r) : [r])
  resolved = []
  for r in refs:
      p = fillPlaceholders(r.path, state)             # {scope}{slice}; missing → ERROR
      if r.indirect:  p = derefLock(p)                # read lock, join field; missing → ERROR
      hits = r.glob ? glob(p) : [p]
      if hits.empty and not r.optional: ERROR(p)
      if hits.empty and r.optional:     continue
      for h in hits: resolved.push({ path:h, hint:r.hint, optional:!!r.optional })
  return dedupeByPath(resolved)
matches(pred, state): every (k,v) in pred → state[k]===v
```
Deterministic: same `(manifest, state, disk)` → byte-identical list. Zero npm deps, Node ESM, mirrors `lint.mjs`.

## CLI surface

```
node tools/io/resolve.mjs <ROLE> [--state k=v ...] [--root <dir>] [--json] [--explain]
```
- default: print resolved path list (operator hand-pass — replaces reading `inputs:` off the prompt).
- `--json`: `{role, state, resolved:[{path,hint,optional}], fired_predicates:[...]}` (orchestrator consumes).
- `--explain`: render each path + which group/predicate produced it (reviewer locality — replaces in-prompt readability).
- `--root`: resolve against `_test_bench` (verify) or repo root (live).
- exit: 0 ok · 1 resolve-error (missing required path / unfilled placeholder / dead indirection) · 2 usage.

## Orchestrator STEP-4.1 swap

**Before:** "Seed the fixture this build needs from `_fixtures/` (the declared `inputs`, on disk)" — parses prompt frontmatter.

**After:**
```
state   = deriveState()                         # STEP 0, unchanged
inputs  = resolve(ioManifest, state)            # --json, against repo root
seed(_test_bench, inputs.map(.path))            # copy exactly these from _fixtures
runnerMsg = scratchPromptVerbatim
          + "\nInputs (resolved for this run):\n" + inputs.map(.path + (.hint?` — ${hint}`:""))
spawnRunner(runnerMsg, _test_bench)             # path-grade injection; runner reads disk
```
Runner gets a flat, pre-resolved, branch-free list — clean-room intact (no orchestrator logic leaks; the `when` already evaluated). Prompt body declares no inputs.

## Both-directions selftest (`tools/io/selftest.mjs`)

Resolver now decides what seeds the clean-room → a buggy resolver makes every verify lie. Test it like the linter:
- **forward (must resolve correct set):** fixed `(role, state)` → expected path set (golden). E.g. `IMPLEMENT @ {mode:slice-build, class:bugfix, slice:S4}` MUST include `diagnosis.json` + `reproduction/test_*.py` + `src/**`, MUST NOT include feature-add's `baseline-map.json`.
- **reverse (planted-wrong state caught):** `IMPLEMENT @ {mode:skeleton-build}` MUST NOT pull any `slices/` path; a manifest edit that leaks slice inputs into skeleton mode FAILs.
- **error paths:** unfilled `{slice}`, dead lock-indirection, zero-match required glob → exit 1, named.
- run in `pack.mjs` gate beside the economy-lint selftest (no tarball if resolver mis-resolves).

## IO-graph lint (composes with [[01-schema-externalization]])

`tools/io/graph-lint.mjs` renders + checks the full data-flow:
- every `read` group-id resolves; every role in manifest exists as a prompt.
- with schema-registry: each resolved input path has a producer whose `outputs[].schema` matches — **PR2 contract auto-checked**, `contracts.json` chain GENERATED not hand-written.
- orphan check: produced artifact nobody reads / consumed artifact nobody writes → warn.

## File layout + freeze

```
io/
  io-manifest.json        # the read-graph (groups + role bindings) — SOURCE OF TRUTH
  io.lock                 # frozen signature (new immutable class — mirrors schemas.lock)
tools/io/
  resolve.mjs             # resolver + CLI
  selftest.mjs            # both-directions
  graph-lint.mjs          # IO-graph + PR2 check
```
io-manifest change = new version + downstream change-request (immutability canon). Prompts reference nothing.

## Migration order (extract from 39 prompts)

1. **Build resolver + selftest first** (TDD against IMPLEMENT's known 4-way set as the golden). Resolver green before any prompt edits.
2. **Author io-manifest** by lifting each prompt's `inputs:` block → groups + `when`. Start 04-build (biggest payoff: 26–30 lines each). One PR per phase.
3. **Per prompt:** delete `inputs:` frontmatter + the body input-group headers; move load-bearing `hint`s to Rules/manifest. Re-author against DRY skeleton (frozen → change-request wave, one roadmap entry per prompt — reuse self-host loop).
4. **Swap orchestrator STEP-4.1** to call resolver.
5. **Verify both-directions** per prompt clean-room (known-good PASS + planted-defect FAIL) — the existing gate, now also exercising the resolver.
6. **Wire graph-lint into pack gate**; generate `contracts.json` from manifest + registry, retire the hand-written chain.

## Net

- Resolver = ~150 LOC Node, zero deps, deterministic, both-directions-tested — same class as `lint.mjs`.
- IMPLEMENT: 26 input lines + 5 `when`-headers → 0 in prompt; the dispatch table lives once in `io-manifest.json`.
- Clean-room preserved (path-grade injection); drift impossible (prompt declares nothing); frozen-frame typed once.
- With [[01-schema-externalization]]: read-graph + shape-graph both code-owned → PR2 + `contracts.json` generated + lint-checked.

**Next (optional):** `04-target-machine.md` — consolidated code-ownership map (resolver + schema-registry + Tier-1 artifact emitters + gate-verdict code) and the full change-request wave sequencing docs 01–03 into the roadmap.
