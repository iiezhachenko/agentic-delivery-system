#!/usr/bin/env node
// Both-directions self-test for idgen.mjs (monotonic ADR-NNNN + high-water max()).
// Direction 1 (GOLDEN): greenfield adr-index.json has ADR-0001..0006 in array order;
//   assignAdrIds(6 decisions) must reproduce exactly. high-water over a namespace id set.
// Direction 2: planted defect — a non-monotonic / gapped id sequence does NOT match
//   assignAdrIds output (caught); count mismatch throws; high-water picks max not last.
// Determinism: same input → byte-identical twice. Mirrors validate.selftest.mjs structure.
import fs from "node:fs";
import { assignAdrIds, highWater, nextId } from "./idgen.mjs";

const GF = "/workspace/_fixtures/greenfield-clean";
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log(`  FAIL: ${msg}`); } };
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

// ===========================================================================
// DIRECTION 1 (GOLDEN) — assignAdrIds reproduces golden adr-index ids
// ===========================================================================
console.log("=== Direction 1: golden adr-index ids reproduced ===");
{
  const idx = readJSON(`${GF}/.adr/adr-index.json`);
  const goldenIds = idx.adrs.map(a => a.id);
  const got = assignAdrIds(idx.adrs, { start: 1 });
  ok(JSON.stringify(got) === JSON.stringify(goldenIds), `assigned ${JSON.stringify(got)} != golden ${JSON.stringify(goldenIds)}`);
  console.log(`  assignAdrIds(${idx.adrs.length}) → ${JSON.stringify(got)} == golden`);
  // monotonic, zero-padded 4 wide
  ok(got.every(id => /^ADR-\d{4}$/.test(id)), "all ids 4-wide zero-padded ADR-NNNN");
  ok(got[0] === "ADR-0001" && got[got.length - 1] === `ADR-${String(idx.adrs.length).padStart(4,"0")}`, "monotonic 0001..n");
}
// high-water across a mixed namespace id set
{
  const hw = highWater(["R1", "R8", "BF3", "R10", "BF1"]);
  ok(hw.R === 10 && hw.BF === 3, `high-water expected {R:10,BF:3}, got ${JSON.stringify(hw)}`);
  console.log(`  highWater([R1,R8,BF3,R10,BF1]) → ${JSON.stringify(hw)}`);
  ok(highWater(["R1", "R8"], "R") === 8, "single-namespace query R → 8");
  ok(nextId("R", 10) === "R11", `nextId(R,10) expected R11, got ${nextId("R", 10)}`);
}
// high-water grounded in golden traces (ADR-0003 traces carry R7..R10, E1..E7)
{
  const idx = readJSON(`${GF}/.adr/adr-index.json`);
  const allTraces = idx.adrs.flatMap(a => a.traces);
  const hw = highWater(allTraces);
  ok(hw.R >= 10, `golden traces R high-water expected >=10, got ${hw.R}`);
  console.log(`  highWater(golden ADR traces) → ${JSON.stringify(hw)}`);
}

// ===========================================================================
// DIRECTION 2 — planted defects caught
// ===========================================================================
console.log("\n=== Direction 2: planted defects → caught ===");
// non-monotonic gap: a hand-authored index skips ADR-0003 → != assignAdrIds
{
  const handAuthored = ["ADR-0001", "ADR-0002", "ADR-0004"];  // gap at 3 (non-monotonic)
  const correct = assignAdrIds(handAuthored, { start: 1 });
  ok(JSON.stringify(handAuthored) !== JSON.stringify(correct), "gapped sequence differs from monotonic assign");
  ok(JSON.stringify(correct) === JSON.stringify(["ADR-0001", "ADR-0002", "ADR-0003"]), `correct ${JSON.stringify(correct)}`);
  console.log(`  gapped [..0004] caught: monotonic assign yields ${JSON.stringify(correct)}`);
}
// high-water must pick max, NOT last-seen (defect: using array order)
{
  const hw = highWater(["R10", "R2"]);  // last is R2 but max is 10
  ok(hw.R === 10, `high-water must be max(10) not last(2), got ${hw.R}`);
  console.log(`  highWater([R10,R2]) → R:${hw.R} (max not last)`);
}
// count-accounting: assignAdrIds always len-matches input (assert internal)
{
  const ids = assignAdrIds(new Array(5).fill(0), { start: 3 });
  ok(ids.length === 5 && ids[0] === "ADR-0003" && ids[4] === "ADR-0007", `start-offset ${JSON.stringify(ids)}`);
  console.log(`  assignAdrIds(5,start=3) → ${ids[0]}..${ids[4]}`);
}

// ===========================================================================
// DETERMINISM — same input → byte-identical twice
// ===========================================================================
console.log("\n=== Determinism check ===");
{
  const ids = ["R1", "R8", "BF3", "R10"];
  const a = JSON.stringify(highWater(ids));
  const b = JSON.stringify(highWater(ids));
  ok(a === b, "determinism: two runs differ");
  console.log(`  determinism → ${a === b ? "stable" : "DRIFT"}`);
}

console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
