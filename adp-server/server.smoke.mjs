#!/usr/bin/env node
// adp-server/server.smoke.mjs — smoke test for MCP stdio server
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

// spawn server
const child = spawn(
  process.execPath,
  [path.join(repoRoot, "adp-server", "server.mjs"), "--root", repoRoot],
  { cwd: repoRoot, stdio: ["pipe", "pipe", "inherit"] }
);

// collect responses keyed by id
const pending = new Map(); // id -> { resolve }

const rl = createInterface({ input: child.stdout, crlfDelay: Infinity });
rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let msg;
  try { msg = JSON.parse(trimmed); } catch { return; }
  const { id } = msg;
  if (id !== undefined && id !== null && pending.has(id)) {
    const { resolve } = pending.get(id);
    pending.delete(id);
    resolve(msg);
  }
});

function request(msg) {
  return new Promise((resolve) => {
    if (msg.id !== undefined && msg.id !== null) {
      pending.set(msg.id, { resolve });
    }
    child.stdin.write(JSON.stringify(msg) + "\n");
  });
}

function sendNotification(msg) {
  child.stdin.write(JSON.stringify(msg) + "\n");
}

let failures = 0;
function assert(label, condition) {
  if (condition) {
    console.log("PASS:", label);
  } else {
    console.log("FAIL:", label);
    failures++;
  }
}

async function run() {
  // (a) initialize
  const initResp = await request({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} });
  assert(
    'initialize: serverInfo.name === "adp-powers"',
    initResp.result && initResp.result.serverInfo && initResp.result.serverInfo.name === "adp-powers"
  );

  // (b) initialized notification (no id, no response expected)
  sendNotification({ jsonrpc: "2.0", method: "notifications/initialized" });

  // (c) tools/list
  const listResp = await request({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
  const toolNames = (listResp.result && listResp.result.tools || []).map(t => t.name);
  assert('tools/list includes "adp_status"', toolNames.includes("adp_status"));
  assert('tools/list includes "adp_next"',   toolNames.includes("adp_next"));
  assert('tools/list includes "adp_derive"', toolNames.includes("adp_derive"));
  assert('tools/list includes "adp_submit"', toolNames.includes("adp_submit"));

  // (d) tools/call adp_status
  const callResp = await request({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: { name: "adp_status", arguments: {} },
  });

  let statusObj = null;
  try {
    const text = callResp.result && callResp.result.content && callResp.result.content[0] && callResp.result.content[0].text;
    statusObj = JSON.parse(text);
  } catch (e) {
    console.log("FAIL: tools/call adp_status: could not parse content JSON:", e.message);
    failures++;
  }

  if (statusObj !== null) {
    assert(
      'tools/call adp_status: frontier.id is a non-empty string (not hard-coded; moves as units ship)',
      statusObj.frontier && typeof statusObj.frontier.id === "string" && statusObj.frontier.id.length > 0
    );
  }

  child.stdin.end();
  child.kill();

  if (failures > 0) {
    console.log(`\n${failures} assertion(s) failed.`);
    process.exit(1);
  } else {
    console.log("\nAll assertions passed.");
    process.exit(0);
  }
}

run().catch((err) => {
  console.error("smoke test error:", err);
  child.kill();
  process.exit(1);
});
