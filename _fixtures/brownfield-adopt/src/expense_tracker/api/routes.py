# routes — Flask Blueprint wiring auth + expense CRUD.
# POST /expenses        — record new expense
# GET  /expenses        — list caller's expenses
# DELETE /expenses/<id> — delete by id

import uuid
from datetime import date as _date

from flask import Blueprint, request, jsonify, abort

from expense_tracker.auth.api_key import resolve_identity
from expense_tracker.storage.expense_store import ExpenseStore

bp = Blueprint("expenses", __name__)
_store = ExpenseStore()


def _auth() -> dict:
    key = request.headers.get("X-Api-Key", "")
    identity = resolve_identity(key)
    if not identity:
        abort(401, "Invalid or missing API key")
    return identity


@bp.route("/expenses", methods=["POST"])
def create_expense():
    identity = _auth()
    body = request.get_json(force=True) or {}
    record = {
        "id": str(uuid.uuid4()),
        "owner_id": identity["owner_id"],
        "amount": float(body.get("amount", 0)),
        "currency": body.get("currency", "USD"),
        "description": body.get("description", ""),
        "category": body.get("category", ""),
        "date": body.get("date", str(_date.today())),
    }
    created = _store.create(record)
    return jsonify(created), 201


@bp.route("/expenses", methods=["GET"])
def list_expenses():
    identity = _auth()
    items = _store.list(identity["owner_id"])
    return jsonify({"expenses": items}), 200


@bp.route("/expenses/<expense_id>", methods=["DELETE"])
def delete_expense(expense_id: str):
    identity = _auth()
    _store.delete(expense_id, identity["owner_id"])
    return jsonify({}), 204
