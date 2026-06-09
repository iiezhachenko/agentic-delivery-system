# Component C3 (Project Management) — implements CT2 (caller→C1) against FROZEN contract. Traces: R4, R6, R9, R10. LLD (internals) owned here (B8); seam is fixed (B3).
#
# CT2: shared_data seam — C3 calls C1 (Data Store) for E2/E5/E6/E7 persistence.
# ProjectStore wraps C1 DataStore; delegates create/get/list/update/delete; propagates
# StoreUnavailableError, ConstraintViolationError, NotFoundError unmodified (CT2 failure modes).
# Framework-agnostic plain Python at contract layer (ADR-0002). Synchronous, no async (INV6).

from __future__ import annotations

from typing import Any

from freelancer_app.project_management.exceptions import (
    ConstraintViolationError,
    NotFoundError,
    StoreUnavailableError,
)


class ProjectStore:
    """CT2 surface — ownership-scoped CRUD over E2/E5/E6/E7 records via C1 DataStore."""

    def __init__(self, data_store: Any) -> None:
        # data_store: C1 DataStore instance (real or frozen-conftest mock).
        self._store = data_store

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        """
        Create new project record.

        CT2 failure modes propagated unmodified:
        - StoreUnavailableError (PostgreSQL unreachable)
        - ConstraintViolationError (FK/uniqueness violation)
        """
        # Delegate to C1; let exceptions surface unmodified per CT2 contract.
        return self._store.create_project(payload)

    def get(self, project_id: str, owner_id: str) -> dict[str, Any]:
        """
        Fetch single project by id, scoped to owner.

        CT2 failure modes propagated unmodified:
        - StoreUnavailableError
        - NotFoundError (project absent or wrong owner scope)
        """
        return self._store.get_project(project_id, owner_id)

    def list(self, owner_id: str) -> list[dict[str, Any]]:
        """List all projects for owner. Propagates StoreUnavailableError."""
        return self._store.list_projects(owner_id)

    def update(self, project_id: str, owner_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Update project fields. Propagates CT2 failure modes unmodified."""
        return self._store.update_project(project_id, owner_id, payload)

    def delete(self, project_id: str, owner_id: str) -> None:
        """Delete project. Propagates CT2 failure modes unmodified."""
        self._store.delete_project(project_id, owner_id)
