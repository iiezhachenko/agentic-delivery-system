# Repo state: merge conflict on reconcile

Git state for scenario 4 (STEP 0.1 conflict HALT).

## Git state
- current branch: `feature/my-feature`
- remote: `origin` present
- `origin/main` has diverged from the workstream branch — non-fast-forward (or merge conflict on `git merge origin/main --ff-only`)
- STEP 0.0 passes (not master)

## Orchestrator behavior triggered
- STEP 0.0: branch = `feature/my-feature` → passes
- STEP 0.1: `git fetch origin` + `git merge origin/main --ff-only` → non-fast-forward or conflict → HALT

## Expected discriminator
- STEP 0.1 HALT fires
- Emit: "Merge conflict or non-fast-forward against origin/main. Resolve manually, then re-run."
- Frontier-scan NOT reached
