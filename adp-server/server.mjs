#!/usr/bin/env node
// adp-server/server.mjs — MCP stdio server (JSON-RPC 2.0, newline-delimited)
// Zero npm deps. Transport: newline-delimited JSON on stdin/stdout.
import readline from "node:readline";
import {
  adp_status,
  adp_next,
  adp_emit,
  adp_derive,
  adp_submit,
  adp_promote,
  adp_branch,
  adp_guard,
  adp_classify_derive,
  adp_verdict,
  adp_route,
  adp_sequence,
  adp_idgen,
  adp_coverage,
  adp_route_tier,
} from "./tools/index.js";

// --- parse --root arg ---
let root = ".";
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--root" && args[i + 1]) {
    root = args[i + 1];
    i++;
  }
}

// --- tool registry ---
const PERMISSIVE_SCHEMA = { type: "object" };

const TOOLS = {
  adp_status:         { fn: adp_status,         description: "Frontier tally + done/remaining partition.",           inputSchema: PERMISSIVE_SCHEMA },
  adp_next:           { fn: adp_next,           description: "Step packet assembly (resolve + prefill).",            inputSchema: PERMISSIVE_SCHEMA },
  adp_emit:           { fn: adp_emit,           description: "Tier-1 artifact emission (no model).",                 inputSchema: PERMISSIVE_SCHEMA },
  adp_derive:         { fn: adp_derive,         description: "Server determinism: derive + splice shell + write.",   inputSchema: PERMISSIVE_SCHEMA },
  adp_submit:         { fn: adp_submit,         description: "Pure gate: validate artifact -> verdict.",             inputSchema: PERMISSIVE_SCHEMA },
  adp_promote:        { fn: adp_promote,        description: "Atomic move scratch -> dest.",                         inputSchema: PERMISSIVE_SCHEMA },
  adp_branch:         { fn: adp_branch,         description: "Branch case eval (STEP 0.0).",                         inputSchema: PERMISSIVE_SCHEMA },
  adp_guard:          { fn: adp_guard,          description: "Escape predicate eval.",                               inputSchema: PERMISSIVE_SCHEMA },
  adp_classify_derive:{ fn: adp_classify_derive,description: "Classification derived fields (CR-026/D38).",          inputSchema: PERMISSIVE_SCHEMA },
  adp_verdict:        { fn: adp_verdict,        description: "Compute pass/fail verdict from gate + issue count.",   inputSchema: PERMISSIVE_SCHEMA },
  adp_route:          { fn: adp_route,          description: "Triage or diagnose routing.",                          inputSchema: PERMISSIVE_SCHEMA },
  adp_sequence:       { fn: adp_sequence,       description: "Sequence slices into ordered build steps.",            inputSchema: PERMISSIVE_SCHEMA },
  adp_idgen:          { fn: adp_idgen,          description: "ID generation: adr / highwater / next.",               inputSchema: PERMISSIVE_SCHEMA },
  adp_coverage:       { fn: adp_coverage,       description: "Coverage ops: bijection / bucketCoverage / etc.",      inputSchema: PERMISSIVE_SCHEMA },
  adp_route_tier:     { fn: adp_route_tier,     description: "Per-hole tier routing (CR-025).",                      inputSchema: PERMISSIVE_SCHEMA },
};

// --- send one JSON-RPC response line ---
function send(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

// --- dispatch one request ---
async function dispatch(req) {
  const { jsonrpc, id, method, params } = req;

  // notification: no id, no response
  if (id === undefined || id === null) {
    // known notifications silently handled
    return;
  }

  if (method === "initialize") {
    return send({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "adp-powers", version: "0.1.0" },
      },
    });
  }

  if (method === "tools/list") {
    const tools = Object.entries(TOOLS).map(([name, { description, inputSchema }]) => ({
      name,
      description,
      inputSchema,
    }));
    return send({ jsonrpc: "2.0", id, result: { tools } });
  }

  if (method === "tools/call") {
    const { name, arguments: args } = params || {};
    const entry = TOOLS[name];
    if (!entry) {
      return send({
        jsonrpc: "2.0",
        id,
        result: { content: [{ type: "text", text: `unknown tool: ${name}` }], isError: true },
      });
    }
    try {
      const value = await entry.fn(args || {}, { root });
      return send({
        jsonrpc: "2.0",
        id,
        result: { content: [{ type: "text", text: JSON.stringify(value) }], isError: false },
      });
    } catch (err) {
      return send({
        jsonrpc: "2.0",
        id,
        result: { content: [{ type: "text", text: String(err.message || err) }], isError: true },
      });
    }
  }

  // unknown method
  send({
    jsonrpc: "2.0",
    id,
    error: { code: -32601, message: "method not found: " + method },
  });
}

// --- main: read stdin line-by-line ---
const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let req;
  try {
    req = JSON.parse(trimmed);
  } catch (e) {
    process.stderr.write("parse error: " + e.message + "\n");
    return;
  }
  try {
    await dispatch(req);
  } catch (e) {
    process.stderr.write("dispatch error: " + e.message + "\n");
  }
});

rl.on("close", () => {
  process.exit(0);
});
