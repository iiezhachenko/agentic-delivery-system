# PLANTED DEFECT (regression / BF4) — overlay → src/freelancer_app/project_management/project_store.py
#
# The feature breaks an EXISTING baseline AC. To "add" the label the builder edited the existing
# create path so a project now REQUIRES a label: create() drops the record from the owner index unless
# payload carries a non-empty "label". Baseline projects created without a label (the S4 AC6 path) no
# longer appear in the list → baseline-green AC6 goes RED.
#
# This is NOT additive (BF6 violated) and breaks the regression guard (AC6). The verifier MUST reject:
# a baseline AC that was green must stay green. Golden project_store.py never required a label.

from __future__ import annotations

from typing import Any

from freelancer_app.project_management.exceptions import (
    ConstraintViolationError,
    NotFoundError,
    StoreUnavailableError,
)


class ProjectStore:
    def __init__(self, data_store: Any) -> None:
        self._store = data_store

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        # DEFECT: now refuses to persist a project that has no label — regression on AC6
        # (baseline create-without-label path). The label field was meant to be ADDITIVE/optional.
        if not payload.get("label"):
            return {}  # silently drops the project — never reaches the store
        return self._store.create_project(payload)

    def get(self, project_id: str, owner_id: str) -> dict[str, Any]:
        return self._store.get_project(project_id, owner_id)

    def list(self, owner_id: str) -> list[dict[str, Any]]:
        return self._store.list_projects(owner_id)

    def update(self, project_id: str, owner_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        return self._store.update_project(project_id, owner_id, payload)

    def delete(self, project_id: str, owner_id: str) -> None:
        self._store.delete_project(project_id, owner_id)
