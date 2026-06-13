// adp-server/driver.js — MCP driver loop (D38/ADR-0038/CR-023)
// STEP 0–6 transcribed to code. Server drives; model = hole-filler only.
// ESM; zero npm deps; idempotent (disk-derived, D20); command-agnostic (D35).
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import {
  adp_branch,
  adp_status,
  adp_next,
  adp_emit,
  adp_submit,
  adp_promote,
  adp_guard,
} from "./tools/index.js";

// Tier-1 roles: emitter-owned, no model call (D26/D27)
const TIER1_ROLES = ["BASELINE-MAP", "BUILD-PLAN", "DERIVE-TESTS", "VERIFY-OUTPUT"];

// --- main entry point ---------------------------------------------------------
export async function run(params = {}, { root = "." } = {}) {
  const mode = params.mode || "default";

  if (mode === "status") return runStatus(params, root);
  if (mode === "new-stream") return runNewStream(params, root);
  if (mode === "switch-to") return runSwitchTo(params, root);
  return runDefault(params, root);
}

// --- status: derive frontier tally, write nothing ----------------------------
async function runStatus(params, root) {
  const branch = await adp_branch({}, { root });
  if (branch.action === "halt") return { mode: "halt", message: branch.message, streams: branch.streams };

  const { frontier, done_count, remaining_count } = await adp_status({}, { root });
  return {
    mode: "status",
    done: done_count,
    remaining: remaining_count,
    frontier: frontier?.id || null,
    next: frontier || null,
  };
}

// --- default: advance next pending build (returns step packet for MCP host) --
async function runDefault(params, root) {
  // STEP 0.0 — branch enforce
  const branch = await adp_branch({}, { root });
  let checkoutMessage = null;
  if (branch.action === "halt") return { mode: "halt", message: branch.message, streams: branch.streams };
  if (branch.action === "checkout") {
    // auto-checkout: run git and record message
    execSync(`git checkout -B ${branch.branch}`, { cwd: root });
    checkoutMessage = `Auto-checked out branch ${branch.branch} for workstream ${branch.slug}.`;
  }

  // STEP 0.2 — frontier scan
  const { frontier } = await adp_status({}, { root });
  if (!frontier) {
    return { mode: "done", message: "loop drained, all unshipped prompts built" };
  }

  // STEP 1 — pick target (role override or frontier)
  const entry = frontier;
  const targetRole = params.role || entry.id;

  // Tier-1 check — emit whole artifact, no model
  if (TIER1_ROLES.includes(targetRole)) {
    const emitParams = Object.assign({ role: targetRole }, entry.state || {});
    const artifact = await adp_emit(emitParams, { root });
    return { mode: "emit", entry, artifact, checkoutMessage };
  }

  // STEP 2 — assemble step packet (role must be in io-manifest)
  let packet = null;
  try {
    packet = await adp_next(
      {
        role: targetRole,
        state: { class: entry.class || "architecture" },
        schemaId: entry.schemaId || null,
        computed: {},
      },
      { root }
    );
  } catch (e) {
    // role not in io-manifest (e.g. code/planning artifact, not a prompt role)
    packet = null;
  }

  // STEP 3 return — model fills holes; MCP host calls adp_submit then adp_promote
  return { mode: "step", entry, packet, checkoutMessage };
}

// --- new-stream: queue workstream, create branch, write brief -----------------
async function runNewStream(params, root) {
  const { slug, brief } = params;
  if (!slug || !brief) return { mode: "halt", message: "new-stream requires slug + brief params" };

  const branch = `feature/${slug}`;
  try {
    execSync(`git checkout -B ${branch}`, { cwd: root });
  } catch (e) {
    return { mode: "halt", message: `git checkout failed: ${e.message}` };
  }

  const streamsDir = path.join(root, "_streams", slug);
  fs.mkdirSync(streamsDir, { recursive: true });
  const briefPath = path.join(streamsDir, "brief.md");
  const date = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    briefPath,
    `ask: ${brief}\nbranch: ${branch}\nstatus: pending\ndate: ${date}\n`
  );

  return {
    mode: "new-stream",
    branch,
    slug,
    message: `New workstream queued on branch \`${branch}\`. Check out that branch in a new harness session.`,
  };
}

// --- switch-to: switch to registered workstream branch -----------------------
async function runSwitchTo(params, root) {
  const { slug } = params;
  if (!slug) return { mode: "halt", message: "switch-to requires slug param" };

  const briefPath = path.join(root, "_streams", slug, "brief.md");
  if (!fs.existsSync(briefPath)) {
    return { mode: "halt", message: `No stream registered as \`${slug}\`; run \`new-stream\` first.` };
  }

  const text = fs.readFileSync(briefPath, "utf8");
  const branchMatch = /branch:\s*(\S+)/i.exec(text);
  if (!branchMatch) return { mode: "halt", message: `brief.md for ${slug} missing branch: field` };
  const branch = branchMatch[1];

  return {
    mode: "switch-to",
    branch,
    slug,
    message: `Switched to branch \`${branch}\` for workstream \`${slug}\`. Re-run orchestrator to continue.`,
  };
}
