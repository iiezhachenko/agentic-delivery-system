# Repo state: Case E — unregistered non-master branch → HALT

Git state for Case E (unregistered branch HALT, R-MW-5, D29).

## Git state
- current branch: `feature/orphan-work`
- `_streams/` contains only `_streams/my-analytics/brief.md` with `status: pending`, `branch: feature/my-analytics`
- `feature/orphan-work` is NOT in any `_streams/*/brief.md`

## Orchestrator behavior triggered
- STEP 0.0: HEAD = `feature/orphan-work`. Read `_streams/*/brief.md` where `status: pending` → registered set = `{feature/my-analytics}`. HEAD not in registered set AND not master/main → Case E → HALT. Emit: "Branch `feature/orphan-work` not registered in `_streams/`; run `new-stream` to register it or `switch-to <slug>` to move to a registered workstream."

## Expected discriminator
- HALT fires naming the current unregistered branch
- STEP 0.1 NOT reached
- Frontier-scan NOT reached
