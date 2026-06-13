#!/usr/bin/env node
// Both-directions selftest for sentinelDone discriminator (adp-server/tools/index.js).
// Mirrors verdict.selftest.mjs idiom: assert + report + exit nonzero on fail.
// Bug fixed: refactor/mcp-modernize pre-existing sentinel falsely read "done" before thinning.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sentinelDone } from "./tools/index.js";

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "_regression/_tmp_status");
fs.rmSync(DIR, { recursive: true, force: true });
fs.mkdirSync(DIR, { recursive: true });

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log(`  PASS: ${msg}`); } else { fail++; console.log(`  FAIL: ${msg}`); } };

// Helper: write temp file, return relative-to-DIR path usable with sentinelDone(entry, DIR).
const write = (name, content) => { fs.writeFileSync(path.join(DIR, name), content, "utf8"); return name; };

// ===========================================================================
// refactor class
// ===========================================================================
console.log("=== refactor class ===");

// Case 1: file exists, NO thinned: marker → false (the bug being fixed)
{
  const f = write("refactor-no-marker.md", "---\ntitle: some role\n---\n# Role\nsome prose");
  const entry = { class: "refactor", done_sentinel: f };
  ok(sentinelDone(entry, DIR) === false, "refactor, file exists, no thinned: → false");
}

// Case 2: file exists WITH thinned: CR-026 → true
{
  const f = write("refactor-thinned.md", "---\ntitle: some role\nthinned: CR-026\n---\n# Role\nthin prose");
  const entry = { class: "refactor", done_sentinel: f };
  ok(sentinelDone(entry, DIR) === true, "refactor, thinned: CR-026 present → true");
}

// Case 3: file absent → false
{
  const entry = { class: "refactor", done_sentinel: "nonexistent-refactor.md" };
  ok(sentinelDone(entry, DIR) === false, "refactor, file absent → false");
}

// ===========================================================================
// mcp-modernize class
// ===========================================================================
console.log("=== mcp-modernize class ===");

// Case 4: thinned: present but NO mcp_powered: true → false
{
  const f = write("mcp-thinned-only.md", "---\nthinned: CR-026\n---\n# Role");
  const entry = { class: "mcp-modernize", done_sentinel: f };
  ok(sentinelDone(entry, DIR) === false, "mcp-modernize, thinned only, no mcp_powered → false");
}

// Case 5: both thinned: and mcp_powered: true → true
{
  const f = write("mcp-both.md", "---\nthinned: CR-026\nmcp_powered: true\n---\n# Role");
  const entry = { class: "mcp-modernize", done_sentinel: f };
  ok(sentinelDone(entry, DIR) === true, "mcp-modernize, thinned + mcp_powered: true → true");
}

// Case 6: mcp_powered: false (not true) → false
{
  const f = write("mcp-powered-false.md", "---\nthinned: CR-026\nmcp_powered: false\n---\n# Role");
  const entry = { class: "mcp-modernize", done_sentinel: f };
  ok(sentinelDone(entry, DIR) === false, "mcp-modernize, mcp_powered: false → false");
}

// Case 7: no thinned: but has mcp_powered: true → false
{
  const f = write("mcp-no-thinned.md", "---\nmcp_powered: true\n---\n# Role");
  const entry = { class: "mcp-modernize", done_sentinel: f };
  ok(sentinelDone(entry, DIR) === false, "mcp-modernize, no thinned: → false");
}

// ===========================================================================
// planning/architecture class (bare existence suffices)
// ===========================================================================
console.log("=== planning/architecture class (no discriminator) ===");

// Case 8: file exists → true
{
  const f = write("planning-exists.md", "# Planning artifact");
  const entry = { class: "planning", done_sentinel: f };
  ok(sentinelDone(entry, DIR) === true, "planning, file exists → true");
}

// Case 9: file absent → false
{
  const entry = { class: "planning", done_sentinel: "missing-planning.md" };
  ok(sentinelDone(entry, DIR) === false, "planning, file absent → false");
}

// Case 10: architecture class, file exists → true
{
  const f = write("arch-exists.md", "# Architecture artifact");
  const entry = { class: "architecture", done_sentinel: f };
  ok(sentinelDone(entry, DIR) === true, "architecture, file exists → true");
}

// Case 11: no done_sentinel field → false
{
  const entry = { class: "planning" };
  ok(sentinelDone(entry, DIR) === false, "no done_sentinel field → false");
}

// Cleanup
fs.rmSync(DIR, { recursive: true, force: true });

console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
