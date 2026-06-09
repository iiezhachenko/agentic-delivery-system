#!/usr/bin/env node
// adp init — manifest-DRIVEN installer. Lays ADP runtime payload into user project, wires
// launcher, smoke-checks. Zero npm deps (node builtins only). Mirror pipeline contracts:
// disk = source of truth · resume re-derives · never overwrite frozen · verify before done.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import readline from "node:readline";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");  // bin/.. = package root; manifest + payload src live here

// ── args ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (name) => {                       // --name=val → val; --name → true; absent → undefined
  const hit = argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  const eq = hit.indexOf("=");
  return eq === -1 ? true : hit.slice(eq + 1);
};
if (flag("help")) {
  console.log("adp init — install ADP runtime\n  --harness=claude|kiro  target harness (else auto/prompt)\n  --dir=<path>           target project dir (default cwd)\n  --force                reinstall over populated tree (new version)\n  --help");
  process.exit(0);
}
const FORCE = flag("force") === true;
const TARGET = path.resolve(typeof flag("dir") === "string" ? flag("dir") : process.cwd());

const die = (msg) => { console.error(`HALT: ${msg}`); process.exit(1); };

// ── 2. node >= 18 ─────────────────────────────────────────────────────────────
const major = Number(process.versions.node.split(".")[0]);
if (major < 18) die(`node ${process.versions.node} < 18. Upgrade node, re-run.`);

// ── 1. detect harness ─────────────────────────────────────────────────────────
async function detectHarness() {
  const want = flag("harness");
  if (want === "claude" || want === "kiro") return want;
  if (typeof want === "string") die(`bad --harness=${want}. Use claude|kiro.`);
  const hasClaude = fs.existsSync(path.join(TARGET, ".claude"));
  const hasKiro = fs.existsSync(path.join(TARGET, ".kiro"));
  if (hasClaude && !hasKiro) return "claude";
  if (hasKiro && !hasClaude) return "kiro";
  // none, or both (ambiguous) → prompt; no TTY → demand flag
  if (!process.stdin.isTTY) die("harness undetectable. Pass --harness=claude|kiro.");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ans = await new Promise((res) => rl.question("Harness? [claude|kiro]: ", res));
  rl.close();
  const h = ans.trim().toLowerCase();
  if (h !== "claude" && h !== "kiro") die(`bad harness '${ans}'. Use claude|kiro.`);
  return h;
}

// ── dest mapping (installed shape — zero root pollution, all under one harness dir) ──
// adapter file  adapters/<h>/REST  → .<h>/REST          (glue: agents/rules/skills/steering/settings)
// payload file  <anything else>    → .<h>/adp/<path>    (prompts/code-canon/tools/docs/canon)
function destFor(payloadPath, harness) {
  const m = payloadPath.match(/^adapters\/(claude|kiro)\/(.+)$/);
  const rel = m ? path.join(`.${m[1]}`, m[2]) : path.join(`.${harness}`, "adp", payloadPath);
  return path.join(TARGET, rel);
}

const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

// ── main ──────────────────────────────────────────────────────────────────────
const harness = await detectHarness();

// 3. read manifest
const manifestPath = path.join(PKG_ROOT, "manifest.json");
if (!fs.existsSync(manifestPath)) die(`manifest.json missing at ${manifestPath}. Broken package.`);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

// 4. lay payload — filter manifest harness field (all + chosen)
const rows = manifest.files.filter((f) => f.harness === "all" || f.harness === harness);
const laid = [], skipped = [], verify = [];   // verify = dests to re-hash in step 5
let promptsTouched = false;

for (const row of rows) {
  const src = path.join(PKG_ROOT, row.src);
  const dest = destFor(row.path, harness);
  if (!fs.existsSync(src)) die(`payload src missing: ${row.src}. Broken package.`);
  const isPrompt = row.path.startsWith("prompts/");

  if (fs.existsSync(dest)) {
    const cur = sha256(fs.readFileSync(dest));
    if (cur === row.sha256) { skipped.push(row.path); verify.push({ dest, row }); continue; }  // present+valid → SKIP (idempotent)
    // present + DIFFERENT = drift/tamper/own-work. Never silently overwrite (immutability).
    if (!FORCE) die(`${dest} exists + differs from manifest (sha mismatch). Refusing overwrite. --force to reinstall as new version.`);
    if (isPrompt) promptsTouched = true;                                                        // --force over populated prompts/ = new version
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  laid.push(row.path);
  verify.push({ dest, row });
}

// 5. re-hash every laid/present file vs manifest → catch tamper / partial-download BEFORE first run
for (const { dest, row } of verify) {
  const got = sha256(fs.readFileSync(dest));
  if (got !== row.sha256) die(`integrity: ${dest} sha mismatch (${got.slice(0, 12)} != ${row.sha256.slice(0, 12)}). Re-install with --force.`);
}

console.log(`harness=${harness} target=${TARGET}`);
console.log(`laid=${laid.length} skipped=${skipped.length}${promptsTouched ? " (force-reinstalled prompts/)" : ""} integrity=OK`);

// 6. smoke — economy-lint selftest, BOTH-DIRECTIONS (selftest internally asserts golden PASS + defect FAIL;
//    exits non-zero if either direction breaks). Catches broken payload before first run.
const selftest = destFor("tools/economy-lint/selftest.mjs", harness);
const sm = spawnSync(process.execPath, [selftest], { encoding: "utf8" });
if (sm.status !== 0) {
  console.error(sm.stdout || "");
  console.error(sm.stderr || "");
  die("smoke selftest RED (economy-lint failed both-directions check). Not finishing.");
}
console.log("smoke=PASS (economy-lint both-directions)");

// 7. green → launch cmd
const launch = harness === "claude" ? "/deliver" : "kiro-cli --agent delivery";
console.log(`\nADP ready. Launch: ${launch}`);
