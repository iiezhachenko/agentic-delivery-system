# expense-tracker

Simple REST API for recording personal expenses. No web UI — JSON API only.

## Stack
- Python 3.11 / Flask 3.x
- SQLite (std-lib sqlite3)
- API-key auth (X-Api-Key header, env-var store)

## Structure
```
src/
  expense_tracker/
    app.py          — Flask app factory + entry point
    auth/
      api_key.py    — API-key resolution
    api/
      routes.py     — REST endpoints (POST/GET/DELETE /expenses)
    storage/
      expense_store.py — SQLite CRUD (ExpenseStore)
```

## Run
```
EXPENSE_API_KEYS="mykey:user1" flask --app expense_tracker.app run
```

## Endpoints
- `POST /expenses` — record expense `{amount, currency, description, category, date}`
- `GET  /expenses` — list caller's expenses
- `DELETE /expenses/<id>` — remove expense by id
