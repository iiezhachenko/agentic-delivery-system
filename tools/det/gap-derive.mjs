#!/usr/bin/env node
// Deterministic derived fields for .aprd/04-gaps.json.
// Moves id-minting, disposition, gap_counts OUT of GAP-DETECT role INTO spine (ADR-0038/D38, CR-026).
// Pure compute core + thin CLI. Zero deps, ESM, no I/O in core.
// Usage: node gap-derive.mjs '<primitives-json>' [--opts '<opts-json>']

// --- deriveGaps: primitives -> id-minted + disposition-stamped + counted artifact ----
// primitives = {
//   gaps: [{ gap, refs, interpretations, recommended_default, blast_radius, reason, seam_ref? }],
//   dismissed_unknowns: [{ id, reason }]
// }
// opts = {
//   extraction_ref?: string,      // default ".aprd/02-extraction.json"
//   grounding_ref?: string|null,  // default null
//   class?: string,               // copied from extraction
//   baseline_map_ref?: string|null,  // brownfield only
//   baseline_aprd_ref?: string|null  // brownfield only
// }
// Returns complete artifact object; caller writes to disk.
export function deriveGaps(primitives, opts = {}) {
  const {
    gaps: rawGaps = [],
    dismissed_unknowns: rawDismissed = [],
  } = primitives;

  const extraction_ref = opts.extraction_ref ?? ".aprd/02-extraction.json";
  const grounding_ref = opts.grounding_ref ?? null;
  const cls = opts.class ?? "greenfield";

  // Disposition is deterministic from blast_radius — no judgment.
  const dispositionFor = (br) => (br === "cosmetic" ? "assume" : "ask");

  // Mint G* ids by order; stamp disposition.
  let gCounter = 0;
  const gaps = rawGaps.map((g) => {
    const item = {
      id: `G${++gCounter}`,
      gap: g.gap,
      refs: g.refs,
    };
    // seam_ref: include only when present (feature-add optional field)
    if (Object.prototype.hasOwnProperty.call(g, "seam_ref")) {
      item.seam_ref = g.seam_ref;
    }
    item.interpretations = g.interpretations;
    item.recommended_default = g.recommended_default;
    item.blast_radius = g.blast_radius;
    item.disposition = dispositionFor(g.blast_radius);
    item.reason = g.reason;
    return item;
  });

  // gap_counts: count by tier; total == gaps.length.
  const gap_counts = { architecture: 0, scope: 0, cosmetic: 0, total: gaps.length };
  for (const g of gaps) {
    if (g.blast_radius === "architecture") gap_counts.architecture++;
    else if (g.blast_radius === "scope") gap_counts.scope++;
    else if (g.blast_radius === "cosmetic") gap_counts.cosmetic++;
  }

  // Assemble artifact; omit brownfield keys when null (greenfield output is clean).
  const artifact = {
    extraction_ref,
    grounding_ref,
    class: cls,
    gaps,
    dismissed_unknowns: rawDismissed,
    gap_counts,
  };
  if (opts.baseline_map_ref != null) artifact.baseline_map_ref = opts.baseline_map_ref;
  if (opts.baseline_aprd_ref != null) artifact.baseline_aprd_ref = opts.baseline_aprd_ref;

  return artifact;
}

// --- CLI ------------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("usage: node gap-derive.mjs '<primitives-json>' [--opts '<opts-json>']");
    process.exit(2);
  }
  let primitives;
  try {
    primitives = JSON.parse(args[0]);
  } catch (e) {
    console.error(`bad primitives JSON: ${e.message}`);
    process.exit(2);
  }
  const optsIdx = args.indexOf("--opts");
  let opts = {};
  if (optsIdx !== -1) {
    try {
      opts = JSON.parse(args[optsIdx + 1]);
    } catch (e) {
      console.error(`bad --opts JSON: ${e.message}`);
      process.exit(2);
    }
  }
  let result;
  try { result = deriveGaps(primitives, opts); }
  catch (e) { console.error(`ERROR: ${e.message}`); process.exit(2); }
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}
