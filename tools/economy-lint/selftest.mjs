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
  // bonus — C1 token budget (inflate tokens past block threshold: ~320 lines × ~98 char → >7500 tok)
  C1: (s) => s + "\n" + Array.from({ length: 320 },
    (_, i) => `Filler content line number ${i} adds genuine bulk and many tokens to push the budget well past block.`).join("\n") + "\n",
  // GAMING defect — few mega-lines: LOW line count (14), HIGH tokens. Old line-gate (220) would PASS this;
  // token-gate MUST block it. Proves the metric flip closes the hole (file-07).
  C1g: (s) => s + "\n" + Array.from({ length: 14 },
    (_, i) => `megaline ${i}: ` + Array.from({ length: 240 }, (_, j) => `distinctword${i}x${j}`).join(" ")).join("\n") + "\n",
};
// each defect → the check it MUST trip
const expect = { C1:"token-budget", C1g:"token-budget", C2:"role-identity-length", C3:"format-clause-length", C4:"banned-hedge",
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

// C8 calibration (W9) — a canon-BUNDLE enumeration line ("AB1–AB6 + PR1–PR4 + caveman block")
// is a load-bearing reference, NOT a duplicated register reminder. Even alongside ONE genuine
// reminder it must NOT trip C8 (only the bundle ref would be the 2nd "hit" pre-calibration).
{
  const fp = write("c8-bundle-ref.md", ref.replace(/(## Rules\n)/,
    "$1Author against the scaffold (DRY skeleton) + coding canon (AB1–AB6 + PR1–PR4 + caveman block).\nArtifact content stays caveman — PR4, no exception.\n"));
  const r = lint(fp);
  const c8 = r.violations.filter(v => v.check === "caveman-footer-dup");
  ok(c8.length === 0, `C8 calibration: bundle-ref + single reminder must NOT trip C8, got ${c8.length} (lines ${c8.map(v=>v.line)})`);
  console.log(`  C8-calibration (bundle-ref not a reminder) → ${c8.length === 0 ? "OK" : "FAIL"}`);
}

// C6 calibration (W9) — a multi-exit role whose Stop names mode + output path on SUCCESS exits
// (greenfield → write 05; feature-add → write 08) must NOT trip C6. Those bullets share mode/path
// vocabulary with mode-keyed escapes but re-state no guard PREDICATE (the failure conditions live
// only on the generic HALT line). Only a predicate copied onto a HALT line is genuine C6.
{
  const fp = write("c6-multiexit.md", ref.replace(/(## Stop condition\n)([\s\S]*)$/, (m, h) =>
    h +
    "- Guard tripped (escapes) → write nothing; print which guard fired; HALT.\n" +
    "- Greenfield order produced → write .roadmap/05-sequence.json verdict: sequenced, FOUNDATION-CUT next, stop.\n" +
    "- Feature-add order produced → write .roadmap/08-rerank.json (class:feature-add, completed[] pinned, remaining_sequence), stop.\n"));
  // give it mode-keyed escapes so the success bullets WOULD overlap pre-calibration
  const fp2 = write("c6-multiexit2.md", fs.readFileSync(fp, "utf8").replace(/(escapes:\n)/,
    '$1  - { when: "greenfield + (input missing/unparseable OR verdict != all_vertical)", target: "self / HALT" }\n  - { when: "feature-add but .roadmap/08-rerank.json missing, OR 08 has no completed[]", target: "BASELINE-MAP / HALT" }\n'));
  const r = lint(fp2);
  const c6 = r.violations.filter(v => v.check === "escapes-in-stop");
  ok(c6.length === 0, `C6 calibration: mode-keyed success exits must NOT trip C6, got ${c6.length}`);
  console.log(`  C6-calibration (success-exit mode/path not a re-enumeration) → ${c6.length === 0 ? "OK" : "FAIL"}`);
}

// determinism — same input → byte-identical lint.json
const a = JSON.stringify(lint(REF)), b = JSON.stringify(lint(REF));
ok(a === b, "determinism: two runs differ");
console.log(`determinism → ${a === b ? "stable" : "DRIFT"}`);

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${pass} checks ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
