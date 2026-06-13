#!/usr/bin/env node
// Deterministic derived fields for .aprd/08-critique.json.
// Moves id-minting, verdict, issue_count OUT of CRITIQUE role INTO spine (ADR-0038/D38, CR-026).
// Pure compute core + thin CLI. Zero deps, ESM, no I/O in core.
// Usage: node critique-derive.mjs '<primitives-json>' [--opts '<opts-json>']

// --- deriveCritique: primitives -> id-minted + verdict + counted artifact ----------------
// primitives = {
//   issues: [{ category, target_ref, problem, fix_hint }]
// }
// opts = {
//   aprd_ref?: string,         // default ".aprd/drafts/aprd.v1.md"
//   assumptions_ref?: string,  // default ".aprd/07-assumptions.json"
//   gaps_ref?: string,         // default ".aprd/04-gaps.json"
//   class?: string             // default "greenfield"
// }
// Returns complete artifact object; caller writes to disk.
export function deriveCritique(primitives, opts = {}) {
  const {
    issues: rawIssues = [],
  } = primitives;

  const aprd_ref = opts.aprd_ref ?? ".aprd/drafts/aprd.v1.md";
  const assumptions_ref = opts.assumptions_ref ?? ".aprd/07-assumptions.json";
  const gaps_ref = opts.gaps_ref ?? ".aprd/04-gaps.json";
  const cls = opts.class ?? "greenfield";

  // Mint I* ids by order.
  let iCounter = 0;
  const issues = rawIssues.map((issue) => ({
    id: `I${++iCounter}`,
    category: issue.category,
    target_ref: issue.target_ref,
    problem: issue.problem,
    fix_hint: issue.fix_hint,
  }));

  // verdict: deterministic — blocked iff issues non-empty.
  const verdict = issues.length > 0 ? "blocked" : "clean";

  return {
    aprd_ref,
    assumptions_ref,
    gaps_ref,
    class: cls,
    verdict,
    issues,
    issue_count: issues.length,
  };
}

// --- CLI ------------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("usage: node critique-derive.mjs '<primitives-json>' [--opts '<opts-json>']");
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
  try { result = deriveCritique(primitives, opts); }
  catch (e) { console.error(`ERROR: ${e.message}`); process.exit(2); }
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}
