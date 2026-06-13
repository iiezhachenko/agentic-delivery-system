#!/usr/bin/env node
// adp-server/live-loop.mjs — drives one classification case end-to-end over live MCP server.
// Spawns server.mjs, runs adp_next → adp_derive → adp_submit, computes parity vs golden.
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const TIMEOUT_MS = 30_000;

// --- spawn + line-framed JSON-RPC client --------------------------------------
function spawnClient() {
  const child = spawn(
    process.execPath,
    [path.join(repoRoot, "adp-server", "server.mjs"), "--root", repoRoot],
    { cwd: repoRoot, stdio: ["pipe", "pipe", "inherit"] }
  );

  let idCounter = 0;
  const pending = new Map(); // id -> resolve

  const rl = createInterface({ input: child.stdout, crlfDelay: Infinity });
  rl.on("line", (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let msg;
    try { msg = JSON.parse(trimmed); } catch { return; }
    const { id } = msg;
    if (id !== undefined && id !== null && pending.has(id)) {
      const resolve = pending.get(id);
      pending.delete(id);
      resolve(msg);
    }
  });

  function request(msg) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(msg.id);
        reject(new Error(`timeout waiting for id=${msg.id}`));
      }, TIMEOUT_MS);
      pending.set(msg.id, (resp) => { clearTimeout(timer); resolve(resp); });
      child.stdin.write(JSON.stringify(msg) + "\n");
    });
  }

  function notify(msg) {
    child.stdin.write(JSON.stringify(msg) + "\n");
  }

  function nextId() { return ++idCounter; }

  function shutdown() {
    try { child.stdin.end(); } catch {}
    try { child.kill(); } catch {}
  }

  return { child, request, notify, nextId, shutdown };
}

// --- call helper: tools/call → parsed JSON value (throws if isError) ----------
async function call(client, name, args) {
  const id = client.nextId();
  process.stderr.write(`→ tools/call ${name} ${JSON.stringify(args)}\n`);
  const resp = await client.request({
    jsonrpc: "2.0",
    id,
    method: "tools/call",
    params: { name, arguments: args },
  });
  const result = resp.result;
  if (!result) throw new Error(`no result from ${name}: ${JSON.stringify(resp)}`);
  if (result.isError) throw new Error(`${name} error: ${result.content?.[0]?.text}`);
  const text = result.content?.[0]?.text;
  let value;
  try { value = JSON.parse(text); } catch (e) { throw new Error(`${name}: bad JSON in content: ${text}`); }
  process.stderr.write(`← ${JSON.stringify(value)}\n`);
  return value;
}

// --- parity: load-bearing field comparison ------------------------------------
function computeParity(artifact, golden) {
  const diffs = [];

  function check(label, a, b) {
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      diffs.push({ field: label, artifact: a, golden: b });
    }
  }

  check("is_compound", artifact.is_compound, golden.is_compound);

  const aSRs = Array.isArray(artifact.subrequests) ? artifact.subrequests : [];
  const gSRs = Array.isArray(golden.subrequests) ? golden.subrequests : [];
  check("subrequest_count", aSRs.length, gSRs.length);

  const aClasses = aSRs.map(s => s.class);
  const gClasses = gSRs.map(s => s.class);
  check("subrequest_classes", aClasses.sort(), gClasses.sort());

  const aIds = aSRs.map(s => s.id);
  const gIds = gSRs.map(s => s.id);
  check("subrequest_ids", aIds, gIds);

  check("needs_confirmation", artifact.needs_confirmation, golden.needs_confirmation);

  // escape: both null, or both non-null with same unplaybooked_subrequests set
  const aEscNull = artifact.escape == null;
  const gEscNull = golden.escape == null;
  if (aEscNull !== gEscNull) {
    diffs.push({ field: "escape_null", artifact: aEscNull, golden: gEscNull });
  } else if (!aEscNull && !gEscNull) {
    const aSet = [...(artifact.escape.unplaybooked_subrequests || [])].sort();
    const gSet = [...(golden.escape.unplaybooked_subrequests || [])].sort();
    check("escape.unplaybooked_subrequests", aSet, gSet);
  }

  // confirmation_questions length polarity
  const aQLen = (artifact.confirmation_questions || []).length;
  const gQLen = (golden.confirmation_questions || []).length;
  check("confirmation_questions.length>0", aQLen > 0, gQLen > 0);

  return { match: diffs.length === 0, diffs };
}

// --- runCase: core export -----------------------------------------------------
export async function runCase({
  primitivesPath,
  questionsPath,
  schemaId,
  outputPath,
  requestRef,
  goldenPath,
}) {
  const primitives = JSON.parse(fs.readFileSync(primitivesPath, "utf8"));
  const questions = questionsPath
    ? JSON.parse(fs.readFileSync(questionsPath, "utf8"))
    : undefined;

  const client = spawnClient();

  // ensure child killed on process exit
  const cleanup = () => client.shutdown();
  process.on("exit", cleanup);
  process.on("SIGINT", () => { cleanup(); process.exit(130); });
  process.on("SIGTERM", () => { cleanup(); process.exit(143); });

  try {
    // handshake
    const initId = client.nextId();
    process.stderr.write(`→ initialize\n`);
    const initResp = await client.request({ jsonrpc: "2.0", id: initId, method: "initialize", params: {} });
    process.stderr.write(`← ${JSON.stringify(initResp.result?.serverInfo)}\n`);
    client.notify({ jsonrpc: "2.0", method: "notifications/initialized" });

    // step a: adp_next
    const packet = await call(client, "adp_next", {
      role: "CLASSIFIER",
      state: {},
      schemaId,
      computed: { request_ref: requestRef },
    });
    if (!packet.shell) throw new Error("adp_next: no shell in packet");

    // step b: adp_derive
    const deriveArgs = {
      schemaId,
      primitives,
      shell: packet.shell,
      output_path: outputPath,
    };
    if (questions !== undefined) deriveArgs.confirmation_questions = questions;
    const deriveResult = await call(client, "adp_derive", deriveArgs);
    const { needs_confirmation, escape } = deriveResult;

    // step c: adp_submit
    const gate = await call(client, "adp_submit", { artifactPath: outputPath, schemaId });
    const { verdict } = gate;

    // read written artifact
    const artifactFull = path.join(repoRoot, outputPath);
    const artifact = JSON.parse(fs.readFileSync(artifactFull, "utf8"));

    // parity vs golden
    let parity = { match: true, diffs: [] };
    if (goldenPath) {
      const golden = JSON.parse(fs.readFileSync(goldenPath, "utf8"));
      parity = computeParity(artifact, golden);
    }

    client.shutdown();
    process.removeListener("exit", cleanup);

    return { needs_confirmation, escape, verdict, parity, artifact };
  } catch (err) {
    client.shutdown();
    process.removeListener("exit", cleanup);
    throw err;
  }
}

// --- CLI ----------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  function flag(name) {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : undefined;
  }
  function boolFlag(name) { return args.includes(name); }

  const primitivesPath = flag("--primitives");
  const questionsPath = flag("--questions");
  const schemaId = flag("--schema") || "01-classification";
  const outputPath = flag("--out");
  const requestRef = flag("--request-ref") || ".aprd/00-raw-request.md";
  const goldenPath = flag("--golden");

  if (!primitivesPath || !outputPath) {
    process.stderr.write("usage: node adp-server/live-loop.mjs --primitives <p> --out <o> [--schema <s>] [--request-ref <r>] [--golden <g>] [--questions <q>]\n");
    process.exit(2);
  }

  runCase({ primitivesPath, questionsPath, schemaId, outputPath, requestRef, goldenPath })
    .then((result) => {
      process.stdout.write(JSON.stringify(result, null, 2) + "\n");
      const ok = result.parity.match && result.verdict === "pass";
      process.exit(ok ? 0 : 1);
    })
    .catch((err) => {
      process.stderr.write(`ERROR: ${err.message}\n${err.stack}\n`);
      process.exit(1);
    });
}
