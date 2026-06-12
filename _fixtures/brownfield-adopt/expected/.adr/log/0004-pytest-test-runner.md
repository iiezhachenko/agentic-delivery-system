---
id: ADR-0004
title: pytest test runner
status: Accepted
date: 2026-06-12
class: adopt-inferred
scope: global
mode: foundation
source: src/pyproject.toml — [tool.pytest.ini_options] testpaths = ["tests"]
supersedes: null
superseded_by: null
---
## Decision
Use pytest as the test runner (pythonpath = ["src"], testpaths = ["tests"]).

## Context
Inferred from existing code by ADOPT bootstrap. Operator should verify and expand before first normal ADP run.
