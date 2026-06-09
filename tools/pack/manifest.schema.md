# manifest.json schema (P2.1)

`manifest.json` = SINGLE SOURCE OF TRUTH for pack (build tarball) + install (`adp init`). ALLOWLIST not blacklist: only listed files ship. Build scaffolding + self-host content cannot leak.

## Shape

```jsonc
{
  "version": "<git-describe>+p<prompts8>.l<locks8>",   // P2.3 derive
  "files": [
    {
      "src":     "prompts/_orchestrator.generic.md",    // repo source path
      "path":    "prompts/_orchestrator.md",            // payload dest path (path-map)
      "sha256":  "<hex>",                               // hash of src CONTENT (install re-hash)
      "harness": "all"                                  // all | claude | kiro
    }
    // ...
  ],
  "harness-matrix": {
    "claude": ["<path>", ...],   // paths install when harness=claude (= all ∪ claude)
    "kiro":   ["<path>", ...]    // paths install when harness=kiro   (= all ∪ kiro)
  }
}
```

## Field law

- `src` ≠ `path` ENABLES path-mapping: generic sibling ships under canonical name WITHOUT renaming self-host original. Ex: `_orchestrator.generic.md` → `prompts/_orchestrator.md`.
- `sha256` = sha256 of `src` bytes. Installer re-hashes payload → integrity check.
- `harness` ∈ {`all`,`claude`,`kiro`}. `all` = both adapter sets get it. `claude`/`kiro` = that adapter only.
- `harness-matrix[h]` = sorted dest paths a harness `h` installs = files where `harness ∈ {all, h}`.

## version derive (P2.3)

`semver = git-describe ⊕ content-hash(prompts shipped) ⊕ lock-hash`.
- git-describe: `git describe --tags --always` (NO `--dirty` — untracked manifest.json must not perturb).
- prompts content-hash: sha256 over sorted `(path, sha256)` of shipped `prompts/*` files → deliverable identity.
- lock-hash: sha256 over sorted root `*.lock` files (`.aprd .adr .hld .roadmap`) → pins frozen-artifact generation that produced build. Audit trail.

## Generator

`tools/pack/gen-manifest.mjs`. Zero-dep (node:fs/path/crypto). Allowlist-driven (enumerates SHIP rows), NEVER walk-all-then-blacklist. Deterministic: files sorted by `path`, fixed key order → byte-identical across runs on clean tree.
