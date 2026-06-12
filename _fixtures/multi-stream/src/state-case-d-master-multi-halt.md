# Repo state: Case D — master + >1 pending streams → HALT ambiguous

Git state for Case D (ambiguous multi-stream HALT, R-MW-5, D29).

## Git state
- current branch: `master`
- `_streams/analytics-pipeline/brief.md`: `status: pending`, `branch: feature/analytics-pipeline`
- `_streams/auth-refactor/brief.md`: `status: pending`, `branch: feature/auth-refactor`
- Both branches exist locally

## Orchestrator behavior triggered
- STEP 0.0: HEAD = `master`. Read `_streams/*/brief.md` where `status: pending` → registered set = `{feature/analytics-pipeline, feature/auth-refactor}`. >1 pending → Case D → HALT. Emit: "On master with multiple pending workstreams: [analytics-pipeline → feature/analytics-pipeline, auth-refactor → feature/auth-refactor]. Check out the target workstream branch and re-run."

## Expected discriminator
- HALT fires with slug + branch list for all pending streams
- STEP 0.1 NOT reached
- Frontier-scan NOT reached
