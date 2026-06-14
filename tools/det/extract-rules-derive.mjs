#!/usr/bin/env node
// Deterministic derived fields for .aprd/03-grounding/rules-extracted.json.
// Moves RULE* id-minting + extraction_meta OUT of EXTRACT-RULES role INTO spine (ADR-0038/D38, CR-026).
// Pure compute core + thin CLI. Zero deps, ESM, no I/O in core.
// Usage: node extract-rules-derive.mjs '<primitives-json>' [--opts '<opts-json>']

// --- deriveExtractRules: primitives -> id-minted + counted artifact ----------------
// primitives = {
//   rules: [{ source_ref, tier, tool, tool_version_pinned, kind, topic, rule, setting, evidence }],
//   unfetched_sources: [{ id, reason }]
// }
// opts = {
//   sources_ref?: string,   // default ".aprd/03-grounding/sources.json"
//   class?: string,         // default "greenfield"
//   stack?: string[]        // default []
// }
// Returns complete artifact object; caller writes to disk.
export function deriveExtractRules(primitives, opts = {}) {
  const {
    rules: rawRules = [],
    unfetched_sources: rawUnfetched = [],
  } = primitives;

  const sources_ref = opts.sources_ref ?? ".aprd/03-grounding/sources.json";
  const cls = opts.class ?? "greenfield";
  const stack = opts.stack ?? [];

  // Mint RULE* ids in order; splice id onto each rule.
  let rCounter = 0;
  const rules = rawRules.map((r) => ({
    id: `RULE${++rCounter}`,
    source_ref: r.source_ref,
    tier: r.tier,
    tool: r.tool,
    tool_version_pinned: r.tool_version_pinned,
    kind: r.kind,
    topic: r.topic,
    rule: r.rule,
    setting: Object.prototype.hasOwnProperty.call(r, "setting") ? r.setting : null,
    evidence: r.evidence,
  }));

  // Compute extraction_meta counts.
  const srcInRules = new Set(rawRules.map((r) => r.source_ref));
  const srcUnfetched = new Set(rawUnfetched.map((u) => u.id));
  // sources_total = unique SRC* across rules + unfetched (union)
  const allSrcs = new Set([...srcInRules, ...srcUnfetched]);
  const sources_total = allSrcs.size;
  const sources_extracted = srcInRules.size;
  const sources_unfetched = rawUnfetched.length;

  // by_tier: string key -> count; only tiers with rules present.
  const byTier = {};
  for (const r of rawRules) {
    const key = String(r.tier);
    byTier[key] = (byTier[key] || 0) + 1;
  }

  const extraction_meta = {
    sources_total,
    sources_extracted,
    sources_unfetched,
    rules_total: rules.length,
    by_tier: byTier,
  };

  return {
    sources_ref,
    class: cls,
    stack,
    rules,
    unfetched_sources: rawUnfetched,
    extraction_meta,
  };
}

// --- CLI ------------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("usage: node extract-rules-derive.mjs '<primitives-json>' [--opts '<opts-json>']");
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
  try { result = deriveExtractRules(primitives, opts); }
  catch (e) { console.error(`ERROR: ${e.message}`); process.exit(2); }
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}
