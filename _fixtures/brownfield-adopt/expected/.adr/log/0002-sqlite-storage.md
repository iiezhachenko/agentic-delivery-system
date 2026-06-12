---
id: ADR-0002
title: SQLite via std-lib sqlite3 for persistence
status: Accepted
date: 2026-06-12
class: adopt-inferred
scope: global
mode: foundation
source: src/expense_tracker/storage/expense_store.py — import sqlite3; sqlite3.connect(DB_PATH)
supersedes: null
superseded_by: null
---
## Decision
Use SQLite (std-lib sqlite3, no external DB driver) for expense record persistence.

## Context
Inferred from existing code by ADOPT bootstrap. Operator should verify and expand before first normal ADP run.
