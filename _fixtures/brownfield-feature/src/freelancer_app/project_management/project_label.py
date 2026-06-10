# Component C3 (Project Management) — EXTENDS CT2 (caller→C1) with the additive label field. Traces: R11, R13.
# Feature-add (CR-001, A14). LLD (internals) owned here (B8); seam fixed (B3).
#
# CT2 extension: the tag is a free-text `label` field on the EXISTING project record (no new table/contract).
# ProjectLabeler delegates the label write to the existing C1 data-store update surface; propagates
# StoreUnavailableError, ConstraintViolationError, NotFoundError unmodified (inherited CT2 failure modes).
# ADDITIVE new file in the existing project_management package — no baseline C3 file edited (BF1/BF5/BF6).
# Framework-agnostic plain Python at contract layer (ADR-0002). Synchronous, no async (INV6).

from __future__ import annotations

from typing import Any


class ProjectLabeler:
    """CT2 extension surface — set/read the additive free-text label on an existing project record."""

    def __init__(self, data_store: Any) -> None:
        # data_store: C1 DataStore instance (real or frozen-conftest mock) — same surface ProjectStore uses.
        self._store = data_store

    def set_label(self, project_id: str, owner_id: str, label: str) -> dict[str, Any]:
        """
        Persist the additive label field on the existing project record (A14).

        Reuses the existing CT2 update surface with the new field — no new contract.
        CT2 failure modes propagated unmodified:
        - StoreUnavailableError (PostgreSQL unreachable)
        - ConstraintViolationError (store constraint on the label write)
        - NotFoundError (project absent or wrong owner scope)
        """
        return self._store.update_project(project_id, owner_id, {"label": label})

    def get(self, project_id: str, owner_id: str) -> dict[str, Any]:
        """Read the project record (carrying its label) by id, scoped to owner. Propagates CT2 failure modes."""
        return self._store.get_project(project_id, owner_id)
