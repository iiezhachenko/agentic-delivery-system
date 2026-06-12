# Repo state: master with in-flight workstream branches

Git state for scenario 2 (enforce-non-master HALT).

## Git state
- current branch: `master`
- local branches present: `feature/my-feature`, `bugfix/fix-rate`
- (remote state irrelevant — HALT fires before reconcile)

## Orchestrator behavior triggered
- STEP 0.0: branch = `master` → scan `feature/*` + `bugfix/*` → finds `feature/my-feature` + `bugfix/fix-rate` → HALT

## Expected discriminator
- HALT fires
- Emit: "On master with in-flight workstream branches: [feature/my-feature, bugfix/fix-rate]. Check out the target workstream branch and re-run."
- STEP 0.1 NOT reached
- Frontier-scan NOT reached
