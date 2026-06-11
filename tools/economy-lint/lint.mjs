#!/usr/bin/env node
// Layer-1 economy LINT (deterministic, NO LLM). Oracle = AB1-AB9 (.hld/skeleton/coding-canon.md).
// Reads a prose artifact, emits lint.json. Catches structural ~70% of bloat before LLM tokens (P5).
// Semantic ~30% (same fact reworded, no-objective, two-way wording) = Layer-2 AUDIT (economy-audit).
// Usage: node lint.mjs <target.md> [--type prompt|adr|aprd|hld|roadmap] [--out path]
import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// PROFILES — linter parameterized by {artifact-type, thresholds} (file-06 generalize).
// prompt thresholds live here; other artifact thresholds belong in the stack profile,
// NOT hard-coded (06 §"Where the discipline must LIVE"). C2/C3/C5/C6 = prompt-frontmatter
// specific → gated behind type so a plain ADR body skips them; C1/C4/C7/C8/C9 always apply.
// ---------------------------------------------------------------------------
const PROFILES = {
  prompt: {
    checks: ["C1","C2","C3","C4","C5","C6","C7","C8","C9"],
    // C1 budgets TOKENS, not lines — lines gameable by packing facts into long lines (file-07).
    // Mapped from old line thresholds (150/220) at corpus median density 134 char/line ÷4:
    // warn 150 ln → ~5000 tok, block 220 ln → ~7500 tok. Same ceiling, un-gameable axis.
    tokenBudget: { warn: 5000, block: 7500 },
    roleMax: 3,                               // AB6 hard cap
    formatMaxWords: 25,                       // AB3 one-clause
    articleRatioWarn: 0.10,                   // C9 signal (caveman ~0.05)
    dupPhrase: { warn: 3, block: 4 },         // C7 shingle occurrences
    dupBlockRun: 3,                           // C7 contiguous duplicated countable lines = verbatim block
  },
  // Generic non-prompt artifact: drop prompt-frontmatter checks; thresholds illustrative —
  // real values come from the stack profile per file-06, not from this file.
  artifact: {
    checks: ["C1","C4","C7","C8","C9"],
    tokenBudget: { warn: 6500, block: 13000 },   // token-based (file-07); real values per stack profile
    articleRatioWarn: 0.12,
    dupPhrase: { warn: 3, block: 4 },
    dupBlockRun: 3,
  },
};
const TYPE_TO_PROFILE = { prompt:"prompt", adr:"artifact", aprd:"artifact", hld:"artifact", roadmap:"artifact" };

const META = {
  C1: { check:"token-budget",           rule:"AB1", practice:"P1", fix:"REWRITE" },
  C2: { check:"role-identity-length",   rule:"AB6", practice:"P2", fix:"REWRITE" },
  C3: { check:"format-clause-length",   rule:"AB3", practice:"P2", fix:"REWRITE" },
  C4: { check:"banned-hedge",           rule:"AB8", practice:"P3", fix:"REWRITE" },
  C5: { check:"field-rules-section",    rule:"AB5", practice:"P2", fix:"DELETE"  },
  C6: { check:"escapes-in-stop",        rule:"AB2", practice:"P1", fix:"DELETE"  },
  C7: { check:"duplicate-phrase",       rule:"AB1", practice:"P1", fix:"DELETE"  },
  C8: { check:"caveman-footer-dup",     rule:"AB1", practice:"P1", fix:"DELETE"  },
  C9: { check:"register-compliance",    rule:"PR4", practice:"register", fix:"REWRITE" },
};

// --- parse: classify every line ---------------------------------------------
function parse(src) {
  const lines = src.split(/\r?\n/);
  const N = lines.length;
  const cls = new Array(N).fill("prose"); // frontmatter|code|heading|blank|prose
  // frontmatter
  let fmEnd = -1;
  if (lines[0] !== undefined && lines[0].trim() === "---") {
    for (let i = 1; i < N; i++) if (lines[i].trim() === "---") { fmEnd = i; break; }
    if (fmEnd > 0) for (let i = 0; i <= fmEnd; i++) cls[i] = "frontmatter";
  }
  const bodyStart = fmEnd > 0 ? fmEnd + 1 : 0;
  // code fences + headings + blanks
  let inFence = false;
  for (let i = bodyStart; i < N; i++) {
    const t = lines[i];
    if (/^\s*```/.test(t)) { cls[i] = "code"; inFence = !inFence; continue; }
    if (inFence) { cls[i] = "code"; continue; }
    if (t.trim() === "") { cls[i] = "blank"; continue; }
    if (/^#{1,6}\s/.test(t)) { cls[i] = "heading"; continue; }
    cls[i] = "prose";
  }
  // register block range (exempt from C4/C8/C9 — mandated verbatim quote, contains the NOT examples)
  let regStart = -1, regEnd = N;
  for (let i = bodyStart; i < N; i++) if (/^#\s+Register\b/i.test(lines[i])) { regStart = i; break; }
  if (regStart >= 0) { regEnd = N; for (let i = regStart + 1; i < N; i++) if (/^#{1,6}\s/.test(lines[i])) { regEnd = i; break; } }
  const inReg = (i) => regStart >= 0 && i >= regStart && i < regEnd;
  return { lines, N, cls, bodyStart, fmEnd, inReg };
}

// --- tokenizer for prose -----------------------------------------------------
const STOP = new Set("the a an or and to of in on no not is be it for with which else then this that self by as at if".split(" "));
function tokens(s) { return (s.toLowerCase().match(/[a-z0-9_.]+/g) || []).filter(Boolean); }
function sigTokens(s) { return tokens(s).filter(t => t.length >= 4 && !STOP.has(t)); }
function norm(s) { return tokens(s).join(" "); }

// --- checks ------------------------------------------------------------------
function run(p, prof, V, W) {
  const { lines, N, cls, inReg } = p;
  const push = (arr, id, line, evidence) => arr.push({ ...META[id], line, evidence });
  const on = (id) => prof.checks.includes(id);

  // prose-scan set: real authored prose (excl code/blank/heading/frontmatter/Register quote)
  const scan = [];
  for (let i = 0; i < N; i++) if (cls[i] === "prose" && !inReg(i)) scan.push(i);

  // C1 — TOKEN budget (signal). Tokens = real context cost; un-gameable by line packing (file-07).
  // est_tokens = content_chars/4 (deterministic, zero-dep, conservative under-count for caveman).
  if (on("C1")) {
    let chars = 0;
    for (let i = 0; i < N; i++) if (cls[i] !== "frontmatter" && cls[i] !== "blank") chars += lines[i].length;
    p.est_tokens = Math.ceil(chars / 4);
    const tok = p.est_tokens;
    if (tok > prof.tokenBudget.block) push(V, "C1", 1, `est_tokens = ${tok} (block >${prof.tokenBudget.block}; chars=${chars})`);
    else if (tok > prof.tokenBudget.warn) push(W, "C1", 1, `est_tokens = ${tok} (warn >${prof.tokenBudget.warn}; chars=${chars})`);
  }

  // C2 — role identity ≤3 lines
  if (on("C2")) {
    let rs = -1; for (let i = 0; i < N; i++) if (/^#\s+Role:/i.test(lines[i])) { rs = i; break; }
    if (rs >= 0) {
      let cnt = 0; for (let i = rs + 1; i < N; i++) { if (/^#{1,6}\s/.test(lines[i])) break; if (lines[i].trim() !== "") cnt++; }
      if (cnt > prof.roleMax) push(V, "C2", rs + 1, `role block = ${cnt} lines (cap ${prof.roleMax})`);
    }
  }

  // C3 — format: clause length / brace field-list (frontmatter only)
  if (on("C3")) {
    for (let i = 0; i < N; i++) {
      if (cls[i] !== "frontmatter") continue;
      const re = /format:\s*"((?:[^"\\]|\\.)*)"/g; let m;
      while ((m = re.exec(lines[i]))) {
        const val = m[1]; const words = val.trim().split(/\s+/).length;
        const brace = /\{[^{}]*,[^{}]*\}/.test(val);
        if (brace) push(V, "C3", i + 1, `format clause has {...} field-list (upstream-schema re-spec): ${trunc(val)}`);
        else if (words > prof.formatMaxWords) push(V, "C3", i + 1, `format clause = ${words} words (cap ${prof.formatMaxWords})`);
      }
    }
  }

  // C4 — banned hedge wordlist (prose, judgment-call escape)
  if (on("C4")) {
    const re = /\b(usually|roughly|loosely|basically|really|just|simply|genuinely unsure|when in doubt|too big|too small)\b| etc\.| and so on|\.\.\./i;
    for (const i of scan) {
      if (/judgment call:/i.test(lines[i])) continue;
      const m = re.exec(lines[i]);
      if (m) push(V, "C4", i + 1, `hedge "${m[0].trim()}" — no crisp test / judgment-call escape`);
    }
  }

  // C5 — field-rules section after json schema (prose re-stating field keys)
  if (on("C5")) {
    let i = 0;
    while (i < N) {
      if (cls[i] === "code" && /^\s*```/.test(lines[i])) {
        // collect this fenced block's field keys
        const keys = new Set(); let j = i + 1;
        for (; j < N; j++) { if (/^\s*```/.test(lines[j])) break; const k = lines[j].match(/"([A-Za-z_][A-Za-z0-9_]*)"\s*:/g); if (k) k.forEach(x => keys.add(x.replace(/[":]/g, "").trim())); }
        // scan footer prose until next heading / next fence
        for (let f = j + 1; f < N; f++) {
          if (/^#{1,6}\s/.test(lines[f]) || /^\s*```/.test(lines[f])) break;
          if (cls[f] !== "prose") continue;
          const hits = [...keys].filter(k => new RegExp(`\\b${k}\\b`).test(lines[f]));
          const trigger = /\bmust\b|on a clean run|==/.test(lines[f]);
          if (hits.length >= 2 && trigger) push(V, "C5", f + 1, `schema-footer re-states ${hits.length} field keys + constraint prose (keys live in inline comments)`);
        }
        i = j + 1; continue;
      }
      i++;
    }
  }

  // C6 — escapes restated in Stop body
  if (on("C6")) {
    const whens = [];
    for (let i = 0; i < N; i++) { if (cls[i] !== "frontmatter") continue; const m = lines[i].match(/when:\s*"((?:[^"\\]|\\.)*)"/); if (m) whens.push(new Set(sigTokens(m[1]))); }
    let ss = -1; for (let i = 0; i < N; i++) if (/^##\s+Stop/i.test(lines[i])) { ss = i; break; }
    if (ss >= 0 && whens.length) {
      let stopTok = new Set(), stopLine = ss + 1;
      // CALIBRATION (W9): a guard's WRONG home is a FAILURE-exit line (HALT / write-nothing) — that is
      // where a re-stated predicate lives. SUCCESS / write-and-continue exit lines legitimately NAME
      // mode + output path (PR stop-contract); a multi-exit role's mode/path vocabulary overlaps its
      // mode-keyed escapes WITHOUT being a re-enumeration. Count overlap only from failure-exit lines.
      for (let i = ss + 1; i < N; i++) { if (/^#{1,6}\s/.test(lines[i])) break; if (!/(?<!not[- ])\bHALT\b|write nothing/i.test(lines[i])) continue; sigTokens(lines[i]).forEach(t => stopTok.add(t)); }
      let restated = 0;
      for (const w of whens) { let ov = 0; for (const t of w) if (stopTok.has(t)) ov++; if (ov >= 3) restated++; }
      if (restated >= 2) push(V, "C6", stopLine, `Stop re-enumerates ${restated} specific guard conditions (guards' one home = escapes:)`);
    }
  }

  // C7 — duplicate phrase + verbatim block (literal dup)
  if (on("C7")) {
    // (a) contiguous duplicated countable lines = verbatim block dup → block
    const normByLine = {}; const count = {};
    for (const i of scan) { const t = tokens(lines[i]); if (t.length < 4) continue; const nl = t.join(" "); normByLine[i] = nl; count[nl] = (count[nl] || 0) + 1; }
    let runStart = -1, runLen = 0, reported = new Set();
    const flushRun = (end) => { if (runLen >= prof.dupBlockRun && !reported.has(runStart)) { reported.add(runStart); push(V, "C7", runStart + 1, `verbatim block dup: ${runLen} consecutive duplicated lines`); } runStart = -1; runLen = 0; };
    for (let i = 0; i < N; i++) {
      const dup = normByLine[i] !== undefined && count[normByLine[i]] >= 2;
      if (dup) { if (runStart < 0) runStart = i; runLen++; } else flushRun(i);
    }
    flushRun(N);
    // (b) shingle recurrence n=6..12 across prose token stream
    const stream = []; const sline = [];
    for (const i of scan) for (const t of tokens(lines[i])) { stream.push(t); sline.push(i); }
    const grams = new Map(); // key -> {count, first}
    for (let n = 6; n <= 12; n++) for (let s = 0; s + n <= stream.length; s++) {
      const key = n + ":" + stream.slice(s, s + n).join(" ");
      const g = grams.get(key) || { count: 0, first: s, n }; g.count++; grams.set(key, g);
    }
    const rep = [...grams.entries()].filter(([, g]) => g.count >= prof.dupPhrase.warn)
      .sort((a, b) => b[1].n - a[1].n || a[1].first - b[1].first);
    const kept = [];
    for (const [key, g] of rep) { const txt = key.slice(key.indexOf(":") + 1); if (kept.some(k => k.includes(txt))) continue; kept.push(txt);
      const id = "C7"; const arr = g.count >= prof.dupPhrase.block ? V : W;
      push(arr, id, sline[g.first] + 1, `phrase recurs ${g.count}× (n=${g.n}): "${trunc(txt)}"`);
    }
  }

  // C8 — caveman-footer / PR4-reminder duplication (outside Register block).
  // CALIBRATION (W9): a bare "PR4" inside a canon-BUNDLE enumeration ("PR1–PR4", "AB1–AB6 + PR1–PR4
  // + caveman block") NAMES the coding-canon set IMPLEMENT authors against — load-bearing reference,
  // NOT a duplicated register reminder. Exclude it so C8 fires only on genuine reminder dups.
  if (on("C8")) {
    const re = /\bPR4\b|caveman governs|register governs|clean prose|caveman too/i;
    const bundleRef = /PR\d\s*[–—-]\s*PR4|AB\d[^.]*\bPR\d/;   // canon-bundle range/list, not a reminder
    const hits = [];
    for (let i = 0; i < N; i++) { if (cls[i] === "code" || inReg(i)) continue; if (re.test(lines[i]) && !bundleRef.test(lines[i])) hits.push(i); }
    if (hits.length > 1) for (const i of hits) push(V, "C8", i + 1, `caveman/PR4 reminder duplicated (one home = Register block); found ${hits.length}`);
  }

  // C9 — register / caveman compliance (PR4) — pleasantry/filler = block; article density = warn
  if (on("C9")) {
    const block = /\b(sure|i'?d be happy|let'?s|as you can see|in order to|please|note that|actually)\b/i;
    let articles = 0, words = 0;
    for (const i of scan) {
      const m = block.exec(lines[i]);
      if (m) push(V, "C9", i + 1, `register breach: pleasantry/filler "${m[0]}" (caveman absolute, no exception)`);
      const w = tokens(lines[i]); words += w.length; articles += w.filter(t => t === "the" || t === "a" || t === "an").length;
    }
    if (words > 0) { const r = articles / words; if (r > prof.articleRatioWarn) push(W, "C9", 1, `article density ${(r*100).toFixed(1)}% (warn >${(prof.articleRatioWarn*100)}%) — full-prose drift`); }
  }
}
function trunc(s) { s = s.replace(/\s+/g, " ").trim(); return s.length > 70 ? s.slice(0, 67) + "..." : s; }

// --- driver ------------------------------------------------------------------
export function lint(target, typeOverride) {
  const src = fs.readFileSync(target, "utf8");
  const type = typeOverride || inferType(target);
  const prof = PROFILES[TYPE_TO_PROFILE[type] || "prompt"];
  const p = parse(src);
  const V = [], W = [];
  run(p, prof, V, W);
  const cmp = (a, b) => (a.line - b.line) || a.check.localeCompare(b.check);
  V.sort(cmp); W.sort(cmp);
  const by_rule = {}; for (const v of V) by_rule[v.rule] = (by_rule[v.rule] || 0) + 1;
  return {
    target, type,
    verdict: V.length ? "blocked" : "clean",   // blocked iff a BLOCK-grade violation exists
    violations: V,                              // every fix is DELETE|REWRITE — never ADD (AB9 keystone)
    warnings: W,                                // signal-grade (C1/C7/C9 below block); do not gate
    counts: { lines_total: p.N, est_tokens: p.est_tokens ?? null, by_rule, warnings: W.length },
  };
}
function inferType(t) {
  const a = "/" + t.replace(/\\/g, "/");
  if (/\/prompts\//.test(a)) return "prompt";
  if (/\/\.adr\//.test(a)) return "adr";
  if (/\/\.aprd\//.test(a)) return "aprd";
  if (/\/\.hld\//.test(a)) return "hld";
  if (/\/\.roadmap\//.test(a)) return "roadmap";
  return "prompt";
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const target = args.find(a => !a.startsWith("--"));
  const typeI = args.indexOf("--type"); const type = typeI >= 0 ? args[typeI + 1] : undefined;
  const outI = args.indexOf("--out"); const out = outI >= 0 ? args[outI + 1] : undefined;
  if (!target) { console.error("usage: node lint.mjs <target.md> [--type T] [--out path]"); process.exit(2); }
  const res = lint(path.resolve(target), type);
  const json = JSON.stringify(res, null, 2);
  if (out) fs.writeFileSync(out, json + "\n");
  else console.log(json);
  process.exit(res.verdict === "blocked" ? 1 : 0);
}
