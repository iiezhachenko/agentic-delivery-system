#!/usr/bin/env node
// Generic pure set-ops: bijection / membership / walk-to-count coverage (doc-00 §B
//   "Set membership / bijection / coverage"). Used by RECONCILE, DEFINE-CONTRACTS,
//   MODEL-DATA, DERIVE-TESTS, BUILD-PLAN, INTEGRATE, DEMO-GEN.
// Small, pure, composable. Zero deps, ESM, deterministic. Mirrors validate.mjs idiom.
// Usage: node coverage.mjs intersect '<jsonA>' '<jsonB>'

// --- bijection: every left id referenced exactly once by rightRefs ----------------
// e.g. one CT* per edge — every edge contracted exactly once, no orphan, no double.
// Returns { ok, orphans, doubles } (orphans = left ids with 0 refs; doubles = left ids >1 ref).
export function bijection(leftIds, rightRefs) {
  const count = new Map();
  for (const id of leftIds) count.set(id, 0);
  for (const r of rightRefs) if (count.has(r)) count.set(r, count.get(r) + 1);
  const orphans = [], doubles = [];
  for (const id of leftIds) {
    const c = count.get(id);
    if (c === 0) orphans.push(id);
    else if (c > 1) doubles.push(id);
  }
  return { ok: orphans.length === 0 && doubles.length === 0, orphans, doubles };
}

// --- bucketCoverage: each item covered|deferred|gap by set membership (RECONCILE) --
// covered iff in tracedSet; else deferred iff in deferredSet; else gap.
export function bucketCoverage(items, tracedSet, deferredSet) {
  const traced = tracedSet instanceof Set ? tracedSet : new Set(tracedSet);
  const deferred = deferredSet instanceof Set ? deferredSet : new Set(deferredSet);
  const covered = [], def = [], gap = [];
  for (const it of items) {
    if (traced.has(it)) covered.push(it);
    else if (deferred.has(it)) def.push(it);
    else gap.push(it);
  }
  return { covered, deferred: def, gap };
}

// --- singleOwner: each entity owned exactly once across owner lists (MODEL-DATA) ---
// ownsLists: [[E1,E2],[E3]] per owner. Returns { ok, orphans, multi } —
//   orphans = entities owned by nobody; multi = entities in >1 owner list.
export function singleOwner(entityIds, ownsLists) {
  const count = new Map();
  for (const id of entityIds) count.set(id, 0);
  for (const list of ownsLists) for (const e of list) if (count.has(e)) count.set(e, count.get(e) + 1);
  const orphans = [], multi = [];
  for (const id of entityIds) {
    const c = count.get(id);
    if (c === 0) orphans.push(id);
    else if (c > 1) multi.push(id);
  }
  return { ok: orphans.length === 0 && multi.length === 0, orphans, multi };
}

// --- membership: dep real iff in buildSet, else mocked (BUILD-PLAN, doc-00:111) ----
export function membership(dep, buildSet) {
  const set = buildSet instanceof Set ? buildSet : new Set(buildSet);
  return set.has(dep) ? "real" : "mocked";
}

// --- intersect: demonstrable set = a ∩ b (DEMO-GEN, doc-00:114) --------------------
export function intersect(a, b) {
  const setB = b instanceof Set ? b : new Set(b);
  const seen = new Set();
  const out = [];
  for (const x of a) if (setB.has(x) && !seen.has(x)) { seen.add(x); out.push(x); }
  return out;
}

// --- CLI --------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const [kind, ...rest] = process.argv.slice(2);
  try {
    if (kind === "intersect") {
      const a = JSON.parse(rest[0]), b = JSON.parse(rest[1]);
      console.log(JSON.stringify(intersect(a, b)));
      process.exit(0);
    } else if (kind === "bijection") {
      const left = JSON.parse(rest[0]), refs = JSON.parse(rest[1]);
      const r = bijection(left, refs);
      console.log(JSON.stringify(r));
      process.exit(r.ok ? 0 : 1);
    } else {
      console.error("usage: node coverage.mjs <intersect|bijection> '<jsonA>' '<jsonB>'");
      process.exit(2);
    }
  } catch (e) {
    console.error(`ERROR: ${e.message}`);
    process.exit(2);
  }
}
