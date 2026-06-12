# `_fixtures/ledger-prune/` — ledger-hygiene oracle (D31/CR-010)

Both-directions golden for `tools/det/prune-ledger.mjs` (R-LH-1/2/3). Sentinel for W24c.

## Layout
- `input/08-rerank.json` — synthetic self-host ledger before prune. 3 completed (A+B merged, C accepted-but-unmerged), 1 remaining (D), 1 open deferred finding (IX-OPEN), bloated `_note`.
- `merged-sentinels.json` — direction-1 merged set = `done_sentinel`s present on master = wave A + B. (CLI derives this via `git cat-file -e master:<sentinel>`; the fixture states it directly so the pure-fn selftest needs no git.)
- `expected/08-rerank.json` — post-prune golden: A+B removed (+ `coverage.completed` mirror), C preserved (unmerged), `remaining_sequence` + open `deferred_findings` preserved (R-LH-2), `_note` collapsed, `roadmap_version` 5→6.

## Both directions (`prune-ledger.selftest.mjs`)
1. **Golden** — `pruneLedger(input, {A,B})` == `expected`.
2. **Discrimination** —
   - flip C→merged ⇒ C also pruned (detection drives prune, not a hardcoded id);
   - preserve-invariant: `remaining_sequence` + open `deferred_findings` survive ANY prune (R-LH-2);
   - idempotent: re-prune of `expected` = no-op (R-LH-3);
   - empty merged set (pre-merge) = no-op, no version bump;
   - determinism: two runs byte-identical.

Merged = complete + accepted + **merged** (sentinel on master). Ledger is informational, not the disk-derived frontier (D20).
