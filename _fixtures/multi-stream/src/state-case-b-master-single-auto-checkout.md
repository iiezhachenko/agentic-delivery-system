# Repo state: Case B — master + exactly 1 pending stream → auto-checkout

Git state for Case B (auto-checkout path, R-MW-5, D29).

## Git state
- current branch: `master`
- `_streams/my-analytics/brief.md` exists with `status: pending`, `branch: feature/my-analytics`
- No other pending streams
- `feature/my-analytics` exists locally

## Orchestrator behavior triggered
- STEP 0.0: HEAD = `master`. Read `_streams/*/brief.md` where `status: pending` → registered set = `{feature/my-analytics}`. Exactly 1 pending → Case B → `git checkout feature/my-analytics` → emit "Auto-checked out branch `feature/my-analytics` for workstream `my-analytics`." → continue to STEP 0.1.

## Expected discriminator
- Case B triggers: emit message with branch + slug
- Orchestrator continues (does NOT halt)
- Branch checked out
