# Repo state: new-stream dispatch

Git state for scenario 3 (new-stream dispatch path).

## Git state
- current branch: `feature/current-work` (any workstream branch)
- dispatch arg: `new-stream analytics-pipeline "Add analytics pipeline to ADP"`
- `feature/analytics-pipeline` does NOT yet exist locally

## Orchestrator behavior triggered
- MODES: dispatch arg = `new-stream analytics-pipeline "Add analytics pipeline to ADP"`
- Create branch `feature/analytics-pipeline` off current HEAD (local only, no push — G1)
- Write `_streams/analytics-pipeline/brief.md`
- Emit: "New workstream queued on branch `feature/analytics-pipeline`. Check out that branch in a new harness session."
- STOP — do not advance current workstream, do not run STEP 0.0/0.1/frontier-scan

## Expected discriminator
- Branch `feature/analytics-pipeline` created locally
- `_streams/analytics-pipeline/brief.md` written (fields: ask, branch, status=pending, date)
- STOP emitted
- No push to remote (G1 local-only)
- Current workstream NOT advanced
