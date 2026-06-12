---
id: ADR-0003
title: API-key authentication (X-Api-Key header)
status: Accepted
date: 2026-06-12
class: adopt-inferred
scope: global
mode: foundation
source: src/expense_tracker/auth/api_key.py — resolve_identity reads EXPENSE_API_KEYS env var
supersedes: null
superseded_by: null
---
## Decision
Use API-key auth via X-Api-Key header; keys stored in EXPENSE_API_KEYS environment variable (comma-separated key:owner_id pairs).

## Context
Inferred from existing code by ADOPT bootstrap. Operator should verify and expand before first normal ADP run.
