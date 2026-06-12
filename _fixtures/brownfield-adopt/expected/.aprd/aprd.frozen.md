# aPRD — expense-tracker REST API (STUB — ADOPT bootstrap)
> Bootstrap stub. ADP foundation inferred from existing code. ACs OPEN — client fills at Checkpoint A.

## PROJECT
Simple REST API for recording and retrieving personal expenses.

## CLASS
adopt

## ENTITIES
- Expense: expense record (id, owner_id, amount, currency, description, category, date). Source: src/expense_tracker/storage/expense_store.py — table schema + ExpenseStore CRUD.
- Owner (User): caller identity resolved from API key. Source: src/expense_tracker/auth/api_key.py — resolve_identity return dict {owner_id}.

## REQUIREMENTS
- R1 (inferred:true): API accepts POST /expenses to create expense record. Source: src/expense_tracker/api/routes.py:create_expense.
- R2 (inferred:true): API returns GET /expenses list scoped to caller's owner_id. Source: src/expense_tracker/api/routes.py:list_expenses.
- R3 (inferred:true): API accepts DELETE /expenses/<id> to remove expense by id and owner_id. Source: src/expense_tracker/api/routes.py:delete_expense.
- R4 (inferred:true): All endpoints authenticate caller via X-Api-Key header; 401 on invalid/missing key. Source: src/expense_tracker/auth/api_key.py:resolve_identity + routes.py:_auth.
- R5 (inferred:true): Expenses persisted to SQLite; schema stable across restarts. Source: src/expense_tracker/storage/expense_store.py:init_db.

## CONSTRAINTS
- C1 (platform): Python >=3.11. Source: src/pyproject.toml.
- C2 (stack): Flask >=3.0 web framework. Source: src/pyproject.toml dependencies.
- C3 (stack): SQLite via std-lib sqlite3 — no external DB driver. Source: src/expense_tracker/storage/expense_store.py imports.
- C4 (stack): pytest test runner. Source: src/pyproject.toml [tool.pytest.ini_options].
- C5 (stack): API-key auth (X-Api-Key header, env-var EXPENSE_API_KEYS). Source: src/expense_tracker/auth/api_key.py.

## ASSUMPTIONS
[]

## OUT_OF_SCOPE
[]

## ACCEPTANCE
- AC1 [OPEN — client to fill at Checkpoint A]: R1 — expense creation.
- AC2 [OPEN — client to fill at Checkpoint A]: R2 — expense listing.
- AC3 [OPEN — client to fill at Checkpoint A]: R3 — expense deletion.
- AC4 [OPEN — client to fill at Checkpoint A]: R4 — API-key auth.
- AC5 [OPEN — client to fill at Checkpoint A]: R5 — SQLite persistence.
