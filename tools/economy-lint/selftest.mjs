#!/usr/bin/env node
// Both-directions self-test (mirror verify mandate). Linter MUST prove it discriminates
// before trusted: reference tight prompt → clean; each planted-defect copy → blocked,
// naming the RIGHT check. Defect that PASSes = broken check. Deterministic: same input → same output.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { lint } from "./lint.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const REF = path.join(here, "..", "fixtures", "economy-lint", "reference.md");  // deterministic-tool fixtures live under tools/fixtures/
const ref = fs.readFileSync(REF, "utf8");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lint-selftest-"));
const write = (name, body) => { const f = path.join(tmp, name); fs.writeFileSync(f, body); return f; };

// --- defect injectors (mutate the clean reference) ---------------------------
const defects = {
  // C2 — role identity padded to 7 lines
  C2: (s) => s.replace(
    /(# Role: REF-EXAMPLE\n)([^\n]*\n)/,
    "$1$2This role sits in Phase 4 of the build pipeline.\nIt receives the frozen DAG from the prior stage.\nIts purpose is to make the build orderly and safe.\nHistorically this mattered because builds drifted.\nThe mandate below governs everything it does.\nRemember to stay strictly within the lane.\n"),
  // C3 — format clause with {...} brace field-list (upstream-schema re-spec)
  C3: (s) => s.replace(
    /(outputs:\n)/,
    '$1  - { path: ".build/x.json", format: "json — fields {id, kind, shape, traces} re-listed from upstream schema" }\n'),
  // C4 — open "etc." inserted in prose
  C4: (s) => s.replace(/build nothing, decide nothing about component internals\./,
    "build nothing, decide nothing about internals, contracts, etc."),
  // C6 — the lane (specific guard conditions) copied into Stop body
  C6: (s) => s.replace(/(## Stop condition\n)/,
    '$1- ".hld/skeleton.lock missing OR status != frozen" → HALT.\n- "components.json missing or unparseable" → HALT.\n'),
  // C7 — verbatim 8-line block duplicated
  C7: (s) => s.replace(/(## Stop condition[\s\S]*)$/, (m) =>
    "## Rules\n1. Plan only; build nothing, decide nothing about component internals.\n2. Carry frozen build order; never re-sort or re-cut it yourself.\n3. Cheapest source first; LLM verifies, never source of truth (P5/P11).\n\n## Task steps\n1. Read inputs. Check guards (frontmatter escapes) — tripped → HALT, report which, write nothing. Else continue.\n2. Filter build order to skeleton path; carry ids verbatim.\n\n" + m),
  // C9 — full-prose / pleasantry sentence inserted
  C9: (s) => s.replace(/(## Rules\n)/,
    "$1As you can see, the agent should carefully read all of the inputs before it does anything.\n"),
  // bonus — C5 schema-footer prose re-stating field keys
  C5: (s) => s.replace(/(```\n)(\n## Stop)/,
    "$1On a clean run build_units length == counts.build_units and skeleton_id must be present.\n$2"),
  // bonus — C8 caveman/PR4 reminder duplicated outside Register block
  C8: (s) => s.replace(/(## Rules\n)/,
    "$14. Remember PR4 — caveman governs.\n5. Keep clean prose everywhere (PR4).\n"),
  // bonus — C1 line budget (inflate past block threshold)
  C1: (s) => s + "\n" + Array.from({ length: 230 }, (_, i) => `Filler content line number ${i} adds bulk here.`).join("\n") + "\n",
};
// each defect → the check it MUST trip
const expect = { C1:"line-budget", C2:"role-identity-length", C3:"format-clause-length", C4:"banned-hedge",
  C5:"field-rules-section", C6:"escapes-in-stop", C7:"duplicate-phrase", C8:"caveman-footer-dup", C9:"register-compliance" };

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log(`  FAIL: ${m}`); } };

// direction 1 — reference must be clean
const base = lint(REF);
console.log(`reference → ${base.verdict}`);
ok(base.verdict === "clean", `reference must be clean, got ${base.verdict} (${base.violations.map(v=>v.check)})`);

// direction 2 — each planted defect must block, naming the right check
for (const id of Object.keys(defects)) {
  const f = write(`${id}.md`, defects[id](ref));
  const r = lint(f);
  const hit = r.violations.some(v => v.check === expect[id]);
  const status = r.verdict === "blocked" && hit ? "OK" : "FAIL";
  console.log(`  ${id} (${expect[id]}) → ${r.verdict} [${[...new Set(r.violations.map(v=>v.check))].join(",")||"-"}] ${status}`);
  ok(r.verdict === "blocked", `${id}: expected blocked, got ${r.verdict}`);
  ok(hit, `${id}: expected check "${expect[id]}" in violations`);
}

// determinism — same input → byte-identical lint.json
const a = JSON.stringify(lint(REF)), b = JSON.stringify(lint(REF));
ok(a === b, "determinism: two runs differ");
console.log(`determinism → ${a === b ? "stable" : "DRIFT"}`);

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${pass} checks ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
