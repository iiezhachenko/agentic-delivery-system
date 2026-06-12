# expense_store — CRUD over expense records (SQLite via sqlite3 std-lib).
# Table: expenses(id TEXT, owner_id TEXT, amount REAL, currency TEXT,
#                 description TEXT, category TEXT, date TEXT).
# Called by api layer over the ExpenseStore seam.

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent.parent / "expenses.db"


def _connect():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS expenses (
                id TEXT PRIMARY KEY,
                owner_id TEXT NOT NULL,
                amount REAL NOT NULL,
                currency TEXT NOT NULL DEFAULT 'USD',
                description TEXT,
                category TEXT,
                date TEXT NOT NULL
            )
            """
        )
        conn.commit()


class ExpenseStore:
    """Persistence seam for expense records."""

    def create(self, record: dict) -> dict:
        with _connect() as conn:
            conn.execute(
                "INSERT INTO expenses VALUES (:id,:owner_id,:amount,:currency,:description,:category,:date)",
                record,
            )
            conn.commit()
        return record

    def list(self, owner_id: str) -> list:
        with _connect() as conn:
            rows = conn.execute(
                "SELECT * FROM expenses WHERE owner_id=? ORDER BY date DESC",
                (owner_id,),
            ).fetchall()
        return [dict(r) for r in rows]

    def delete(self, expense_id: str, owner_id: str) -> None:
        with _connect() as conn:
            conn.execute(
                "DELETE FROM expenses WHERE id=? AND owner_id=?",
                (expense_id, owner_id),
            )
            conn.commit()
