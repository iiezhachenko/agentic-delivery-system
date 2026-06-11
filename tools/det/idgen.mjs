#!/usr/bin/env node
// Monotonic ID assignment: ADR-NNNN (SYNTHESIZE-ADR) + high-water max() (BASELINE-MAP).
// Source: prompts/02-adr/SYNTHESIZE-ADR.md + schemas/02-adr/adr-index.schema.json (ADR-[0-9]+),
//   doc-00 §"ID assignment: monotonic" + §"high-water = max() index per namespace".
// Pure core fns + thin CLI. Zero deps, ESM, deterministic. Mirrors validate.mjs idiom.
// Usage: node idgen.mjs adr <count> [start] | node idgen.mjs highwater <id> <id> ...

// --- assignAdrIds: decisions -> ADR-NNNN in array order, monotonic, 4-wide pad ----
// assert len(adrs)==len(decisions) (SYNTHESIZE-ADR accounting, doc-00:102).
export function assignAdrIds(decisions, { start = 1 } = {}) {
  const ids = decisions.map((_, i) => `ADR-${String(start + i).padStart(4, "0")}`);
  if (ids.length !== decisions.length) throw new Error(`adr count mismatch: ${ids.length} != ${decisions.length}`);
  return ids;
}

// --- highWater: ids -> { NS: maxIndex } per namespace prefix (doc-00:103) ----------
// Splits each id into leading alpha namespace + trailing numeric (e.g. R8 -> {R:8}).
// Non-namespaced / unparseable ids ignored.
export function highWater(ids, namespace) {
  const out = {};
  for (const id of ids) {
    const m = /^([A-Za-z]+(?:-)?)0*(\d+)$/.exec(id);
    if (!m) continue;
    const ns = m[1], n = Number(m[2]);
    if (out[ns] === undefined || n > out[ns]) out[ns] = n;
  }
  if (namespace !== undefined) return out[namespace] ?? 0;  // single-namespace query
  return out;
}

// --- nextId: feature-add mints max+1 in a namespace (doc-00:104) -------------------
export function nextId(namespace, currentMax) {
  return `${namespace}${currentMax + 1}`;
}

// --- CLI --------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const [kind, ...rest] = process.argv.slice(2);
  try {
    if (kind === "adr") {
      const count = Number(rest[0]);
      const start = rest[1] !== undefined ? Number(rest[1]) : 1;
      if (!Number.isInteger(count) || count < 0) { console.error("usage: node idgen.mjs adr <count> [start]"); process.exit(2); }
      const ids = assignAdrIds(new Array(count).fill(0), { start });
      console.log(ids.join("\n"));
      process.exit(0);
    } else if (kind === "highwater") {
      if (rest.length === 0) { console.error("usage: node idgen.mjs highwater <id> ..."); process.exit(2); }
      console.log(JSON.stringify(highWater(rest)));
      process.exit(0);
    } else {
      console.error("usage: node idgen.mjs <adr|highwater> ...");
      process.exit(2);
    }
  } catch (e) {
    console.error(`ERROR: ${e.message}`);
    process.exit(2);
  }
}
