# Repo state: switch-to dispatch — checkout registered workstream

Git state for switch-to scenario (R-MW-5, D29).

## Git state
- current branch: `master` (or any branch — switch-to is a MODES dispatch, STEP 0 not run)
- `_streams/my-analytics/brief.md` exists with `status: pending`, `branch: feature/my-analytics`
- dispatch arg: `switch-to my-analytics`

## Orchestrator behavior triggered
- MODES: dispatch arg = `switch-to my-analytics`
- Read `_streams/my-analytics/brief.md` → exists, `branch: feature/my-analytics`
- `git checkout feature/my-analytics` (or `git checkout -B feature/my-analytics` if absent)
- Emit: "Switched to branch `feature/my-analytics` for workstream `my-analytics`. Re-run orchestrator to continue."
- STOP — do not advance any workstream, do not run STEP 0 sub-steps

## Expected discriminator
- emit message with branch + slug
- Branch checked out
- STOP (frontier-scan NOT run)
- No advance of any workstream
