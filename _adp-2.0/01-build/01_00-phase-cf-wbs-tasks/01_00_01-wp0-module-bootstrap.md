# CF-WP0 — minimal module bootstrap (shared prereq)

> Atomic task. SELF-CONTAINED — all context inline. Register: caveman; structural data (ids, paths, tool names, versions) literal.

## Context — Phase CF (canon floor)

ADP 2.0 = full rewrite of ADP into Go. Deliverable = deployed Go MCP engine. **Delivery root = `_adp-2.0/_deliverables/adp-2.0-code/`** (= engine SOURCE repo; ≠ deployed build). ALL paths below relative to this root.

Phase CF lands tier-1 BORROWED canon (off-the-shelf linters + frozen arch profile + rule-schema/harness shell) at commit 0, BEFORE first hand-written engine Go. Dissolves paradox: engine=Go must obey Go canon, but tier-2 ADP canon not authored yet. Tier-1 governs from line 0; tier-2 earned later. CF = config + adopt-frozen; ZERO rule authoring.

This task = **WP-0**, the shared prereq for all three CF lanes (W0a lint, W0b arch, W0c schema). Resolves commit-0 chicken-egg: linters/arch-lint/analysistest need a Go module + lint target to run against. CF ships a MINIMAL fixture-scale module — NOT the real P-TOOL pkg tree (= SUB W1a).

## Deliverable

Minimal Go module + toolchain pin + linter-tool version pins + CI workflow skeleton.

## Sentinels (on disk, under delivery root)

- `go.mod` · `go.sum`
- tool-dep manifest — `tools/tools.go` (blank-import tool deps) OR `go.mod` tool directives (Go 1.24+ `tool` lines)
- `.github/workflows/canon-floor.yml` (skeleton — placeholder steps later filled by tasks 03 + 08)

## Depends on

— (none; first task on critical path)

## Steps

1. `go mod init <module-path>` at delivery root.
   - **Decision (confirm w/ operator):** module path. Recommended default `github.com/adp2/adp`. Whatever chosen = stable; renaming later churns every import.
2. Pin Go version: `go` directive + `toolchain` line in `go.mod` (e.g. `go 1.24` + `toolchain go1.24.x`). This version = provenance source for canon `provenance.go-version` field (task 10). Confirm version matches what operator/CI has installed.
3. Pin linter tool versions reproducibly — drift = false gate (R-CF1). Options:
   - `tools/tools.go` blank-import file pinning `golangci-lint` + `go-arch-lint` via `go.mod`, OR
   - Go 1.24+ `tool` directives in `go.mod`, OR
   - version-pinned install in CI (`go install ...@vX.Y.Z`) + module cache.
   - Record EXACT versions. CI must use the pinned bin, not floating latest.
4. CI workflow skeleton `.github/workflows/canon-floor.yml`:
   - trigger: push + pull_request.
   - one job, Go setup (matching pinned version) + module cache + linter-bin cache.
   - placeholder steps with TODO markers for: lint job (task 03 fills), arch job (task 08 fills). Skeleton must run + report green on empty/stub module.
5. Add a trivial stub package so `go build ./...` has something to compile (e.g. `internal/version/version.go` with one const). Keep fixture-scale.

## Acceptance

- `go build ./...` green on the empty/stub module.
- CI skeleton triggers + runs + reports (placeholder steps pass).
- Pinned versions recorded + reproducible (same versions resolve locally + CI).

## Boundary — OUT of scope

- Full P-TOOL pkg tree (`internal/det…` ⊥ `cmd/adp-server`) = SUB W1a. Do NOT pull forward. CF authors the configs that W1a's real tree must satisfy day-one.
- No engine business logic, no MCP surface, no `embed.FS`/`schemas.lock` (= SUB W1c).
- Module here = fixture-scale ONLY: host for configs + fixtures + lint targets.

## Risk

- **R-CF1** linter version drift → false gate (passes locally, fails CI or vice-versa). Mitigation = pin tool versions reproducibly (step 3); CI uses pinned bin.
