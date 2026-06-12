# app.py — Flask app factory (application entry point).
from flask import Flask

from expense_tracker.storage.expense_store import init_db
from expense_tracker.api.routes import bp


def create_app() -> Flask:
    app = Flask(__name__)
    init_db()
    app.register_blueprint(bp)
    return app


application = create_app()
