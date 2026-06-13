#!/usr/bin/env node
// Deterministic derived fields for .aprd/02-extraction.json.
// Moves id-minting + inferred-flag stamping OUT of EXTRACT role prompt INTO spine (ADR-0038/D38, CR-026).
// Pure compute core + thin CLI. Zero deps, ESM, no I/O in core.
// Usage: node extract-derive.mjs '<primitives-json>' [--high-water '<json>']

// --- deriveExtraction: primitives -> id-minted + flag-stamped arrays ----------------
// primitives = {
//   entities:             [{ name, note, inferred, source, sr_ref, rationale? }],
//   explicit_requirements:[{ text, source, sr_ref }],
//   implied_requirements: [{ text, source, sr_ref, rationale }],
//   stated_constraints:   [{ text, kind, inferred, source, sr_ref, rationale? }],
//   unknowns:             [{ text, source, sr_ref }]
// }
// opts = { highWater = { E:0, R:0, C:0, U:0 } }
// Returns id-minted arrays only; caller splices request_ref/classification_ref/class/baseline_map_ref.
export function deriveExtraction(primitives, opts = {}) {
  const hw = Object.assign({ E: 0, R: 0, C: 0, U: 0 }, opts.highWater ?? {});

  const {
    entities: rawEntities = [],
    explicit_requirements: rawExplicit = [],
    implied_requirements: rawImplied = [],
    stated_constraints: rawConstraints = [],
    unknowns: rawUnknowns = [],
  } = primitives;

  // E* — pass-through inferred; include rationale ONLY when inferred===true.
  let eCounter = hw.E;
  const entities = rawEntities.map(e => {
    const item = {
      id: `E${++eCounter}`,
      name: e.name,
      note: e.note,
      inferred: e.inferred,
      source: e.source,
      sr_ref: e.sr_ref,
    };
    if (e.inferred === true) item.rationale = e.rationale;
    return item;
  });

  // R* — one contiguous space: explicit first (inferred:false), implied continue (inferred:true).
  let rCounter = hw.R;

  const explicit_requirements = rawExplicit.map(r => ({
    id: `R${++rCounter}`,
    text: r.text,
    inferred: false,
    source: r.source,
    sr_ref: r.sr_ref,
  }));

  // rCounter continues from explicit into implied.
  const implied_requirements = rawImplied.map(r => ({
    id: `R${++rCounter}`,
    text: r.text,
    inferred: true,
    source: r.source,
    sr_ref: r.sr_ref,
    rationale: r.rationale,
  }));

  // C* — pass-through inferred; include rationale ONLY when inferred===true.
  let cCounter = hw.C;
  const stated_constraints = rawConstraints.map(c => {
    const item = {
      id: `C${++cCounter}`,
      text: c.text,
      kind: c.kind,
      inferred: c.inferred,
      source: c.source,
      sr_ref: c.sr_ref,
    };
    if (c.inferred === true) item.rationale = c.rationale;
    return item;
  });

  // U* — no inferred flag in schema.
  let uCounter = hw.U;
  const unknowns = rawUnknowns.map(u => ({
    id: `U${++uCounter}`,
    text: u.text,
    source: u.source,
    sr_ref: u.sr_ref,
  }));

  return { entities, explicit_requirements, implied_requirements, stated_constraints, unknowns };
}

// --- CLI ------------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("usage: node extract-derive.mjs '<primitives-json>' [--high-water '<json>']");
    process.exit(2);
  }
  let primitives;
  try {
    primitives = JSON.parse(args[0]);
  } catch (e) {
    console.error(`bad primitives JSON: ${e.message}`);
    process.exit(2);
  }
  const hwIdx = args.indexOf("--high-water");
  const opts = {};
  if (hwIdx !== -1) {
    try {
      opts.highWater = JSON.parse(args[hwIdx + 1]);
    } catch (e) {
      console.error(`bad --high-water JSON: ${e.message}`);
      process.exit(2);
    }
  }
  let result;
  try { result = deriveExtraction(primitives, opts); }
  catch (e) { console.error(`ERROR: ${e.message}`); process.exit(2); }
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}
