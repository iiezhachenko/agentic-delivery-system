# brownfield-adopt — both-directions oracle for the ADOPT role (CR-004 §D)

Oracle the ADOPT role (and CLASSIFIER has_adp_artifacts guard) verifies against. `src/` = minimal Python/Flask expense-tracker project with no ADP trees. `expected/` = correct ADOPT bootstrap output ADOPT should produce from `src/`. `defects/` = planted-defect variants that must FAIL. Known-good ADOPT run PASSes; each defect FAILs. Verifier can't separate golden from defect → verifier broken; fix before trusting any ADOPT-related build.

## What's here

```
src/                  — raw source project (no ADP trees; Flask/SQLite expense tracker)
  pyproject.toml
  README.md
  expense_tracker/
    app.py            — Flask app factory
    auth/api_key.py   — API-key auth
    api/routes.py     — POST/GET/DELETE /expenses endpoints
    storage/expense_store.py — SQLite CRUD (ExpenseStore)

expected/             — expected ADOPT bootstrap output (golden)
  .aprd/aprd.frozen.md    — stub: entities + requirements (inferred:true) + OPEN ACs
  .hld/skeleton.lock      — adopt-bootstrap stub: C1-C4 + CT1-CT3
  .adr/log/
    0001-python-flask-stack.md
    0002-sqlite-storage.md
    0003-api-key-auth.md
    0004-pytest-test-runner.md

defects/              — planted-defect variants (each overlaid onto golden bench)
  closed-acs/                — ACs closed (filled) instead of OPEN-tagged (P1/Rule 2 violation)
  missing-skeleton-lock/     — .hld/skeleton.lock absent from output (output contract violation)
  clobber-existing/          — bench with .aprd/+.hld/+.adr/ present; ADOPT must HALT not write
```

## The source project (expense-tracker)

Minimal Flask REST API for personal expense tracking. Observable structure:
- **Python 3.11 / Flask 3.x** (pyproject.toml dependencies)
- **SQLite** via std-lib sqlite3 (expense_store.py — no external DB driver)
- **API-key auth** via X-Api-Key header + EXPENSE_API_KEYS env var (auth/api_key.py)
- **pytest** test runner (pyproject.toml [tool.pytest.ini_options])
- 4 observable modules: C1=api, C2=auth, C3=storage, C4=app-factory; 3 seams (CT1-CT3)
- No ADP trees (no .aprd/, .hld/, .adr/, .roadmap/) — ADOPT target by definition

## Both-directions oracle — scenario → expected result

### ADOPT role (primary discriminator)

| scenario | bench | run | expected result | separates from golden by |
|---|---|---|---|---|
| golden | `src/` (no ADP trees) → write to bench | ADOPT | 6 files written; all ACs OPEN-tagged | baseline |
| `closed-acs` | golden expected/ with closed ACs in aprd.frozen.md | ADOPT value-verify | value-parity FAIL | OPEN-tag absent (0/5 ACs tagged) |
| `missing-skeleton-lock` | golden expected/ minus .hld/skeleton.lock | ADOPT value-verify | value-parity FAIL | .hld/skeleton.lock absent |
| `clobber-existing` | bench with .aprd/+.hld/+.adr/ all present | ADOPT | HALT (writes nothing) | any file written = escape violated |

### CLASSIFIER role (regression guard — has_adp_artifacts delta)

| scenario | bench | run | expected result |
|---|---|---|---|
| no ADP foundation | `src/` (no .aprd//.hld//.adr/) | CLASSIFIER | HALT-with-guidance: "No ADP foundation found. Run `adopt` dispatch first." |
| ADP foundation present | `expected/` (has .aprd/+.hld/+.adr/) | CLASSIFIER (with a raw-request stub) | proceeds to classify; no HALT on foundation check |

## Defect details

### closed-acs
**Invariant:** ADOPT Rule 2 — every AC carries `[OPEN — client to fill at Checkpoint A]`. Zero closed ACs = correct. Hallucinated closed ACs = P1 violation (ADOPT's core discriminator).

**Seed:** overlay `defects/closed-acs/aprd.frozen.closed.md` → `expected/.aprd/aprd.frozen.md`.

**Separates by:** OPEN-tag presence per AC (golden: all 5 tagged / defect: 0 tagged).

### missing-skeleton-lock
**Invariant:** ADOPT output contract (outputs[1]) mandates `.hld/skeleton.lock`. Omitting it leaves the ADP foundation incomplete; CLASSIFIER and downstream can't read the structural stub.

**Seed:** remove `expected/.hld/skeleton.lock` from bench before value-verify.

**Separates by:** `.hld/skeleton.lock` file presence (golden: present, class:adopt-bootstrap / defect: absent).

### clobber-existing
**Invariant:** ADOPT escape #1 + Rule 5 — if `.aprd/` AND `.hld/` AND `.adr/` all exist → HALT immediately; write nothing. A runner that writes despite trees present violates the guard.

**Seed:** run ADOPT against `defects/clobber-existing/` bench (which contains stub `.aprd/`+`.hld/`+`.adr/`).

**Separates by:** escape-fires behavior (golden bench: no trees → writes; defect bench: trees present → HALT, 0 writes).

## How to seed a scenario into a bench

1. Copy `src/` (the raw project) into a fresh bench for ADOPT runs; copy `expected/` into bench for value-verify runs.
2. Apply the scenario's overlay per its `expected-verdict.json` `seed[]`.
3. Run the named role clean-room (step-runner, Sonnet/High — prompt verbatim + bench path; never reads `_fixtures/` directly).
4. Assert on-disk output matches `expected_verdict` + `expected_signal`. Golden must produce correct output; defect must produce the described FAIL.

## CLASSIFIER regression guard — how to seed

1. **No-foundation bench:** copy `src/` only (no expected/ files). Add minimal `.aprd/00-raw-request.md` (any text). Run CLASSIFIER → expect HALT-with-guidance on has_adp_artifacts check (Task step 1 fires before reading request).
2. **Foundation-present bench:** copy `expected/` (has .aprd/+.hld/+.adr/). Add `.aprd/00-raw-request.md` with any feature-add or bugfix request text. Run CLASSIFIER → expect no HALT on foundation check (proceeds to classify).

> **e2e-validated (2026-06-12)** — ADOPT golden run: src/ bench → 6 files written (aprd.frozen.md + skeleton.lock + 4 ADR stubs); all 5 ACs carry OPEN tag; components C1-C4 and seams CT1-CT3 inferred from disk (zero hallucination). closed-acs defect: OPEN tag absent in all 5 ACs → value-parity FAIL (ADOPT Rule 2 / P1 violated). missing-skeleton-lock defect: skeleton.lock absent → output-contract FAIL. clobber-existing defect: escape #1 fires on trees-present bench → HALT, 0 files written. CLASSIFIER regression: no-foundation bench → HALT-with-guidance (Task step 1); foundation-present bench → classifies normally. Oracle discriminates all four scenarios.

Verify discipline (EMBEDDED CANON): both-directions mandatory · disk is the deliverable (verify artifact on disk, not chat reply) · clean-room (no pipeline context leaks) · caveman + economy bind all fixture prose.
