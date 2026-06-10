# FROZEN ORACLE — materialized from CT2. Do NOT edit (B4); needing to edit = escape with a diagnosis. Red-first: targets unimplemented at freeze.
# CT2: shared_data seam between C3 (Project Management, caller) and C1 (Data Store, provider).
# Carries Client Project and related entity records (E2, E5, E6, E7); create/read/update/delete.
# C1 (Data Store) mocked via conftest fixture — never touches a real store.

import pytest
from unittest.mock import MagicMock

from freelancer_app.project_management.project_store import ProjectStore  # does not exist yet — red


# ── shape test ────────────────────────────────────────────────────────────────

def test_ct2_shape_persists_project_records(mock_data_store):
    """CT2 shape: seam carries E2/E5/E6/E7 records; create+read round-trip moves across this seam."""
    store = ProjectStore(data_store=mock_data_store)

    project_payload = {
        "name": "Acme Website",
        "client": {"name": "Acme Corp", "contact": "acme@example.com", "billing_address": "1 Main St"},
        "currency": "USD",
        "billable_rate": "150.00",
        "owner_id": "freelancer-42",
    }
    mock_data_store.create_project.return_value = {"id": "proj-1", **project_payload}

    result = store.create(project_payload)

    assert mock_data_store.create_project.called
    assert result["id"] == "proj-1"
    assert result["name"] == "Acme Website"
    assert result["currency"] == "USD"
    assert result["billable_rate"] == "150.00"


# ── failure tests ─────────────────────────────────────────────────────────────

def test_ct2_failure_store_unavailable(mock_data_store):
    """CT2 failure: store-unavailable — PostgreSQL unreachable; all project CRUD ops fail without partial record."""
    from freelancer_app.project_management.exceptions import StoreUnavailableError  # red

    store = ProjectStore(data_store=mock_data_store)
    mock_data_store.create_project.side_effect = StoreUnavailableError("PostgreSQL unreachable")

    with pytest.raises(StoreUnavailableError):
        store.create({"name": "X", "owner_id": "freelancer-1"})

    # SUT did not produce/modify any record
    assert mock_data_store.create_project.call_count == 1
    # no partial-write call — only one attempt, no retry that could produce partial state
    assert not mock_data_store.update_project.called


def test_ct2_failure_constraint_violation(mock_data_store):
    """CT2 failure: constraint-violation — FK/uniqueness violation; no inconsistent or duplicate record persisted."""
    from freelancer_app.project_management.exceptions import ConstraintViolationError  # red

    store = ProjectStore(data_store=mock_data_store)
    mock_data_store.create_project.side_effect = ConstraintViolationError("uniqueness violation on project name")

    with pytest.raises(ConstraintViolationError):
        store.create({"name": "Duplicate", "owner_id": "freelancer-1"})

    assert mock_data_store.create_project.call_count == 1
    assert not mock_data_store.update_project.called


def test_ct2_failure_not_found(mock_data_store):
    """CT2 failure: not-found — queried project absent or wrong owner scope; no fabricated data returned."""
    from freelancer_app.project_management.exceptions import NotFoundError  # red

    store = ProjectStore(data_store=mock_data_store)
    mock_data_store.get_project.side_effect = NotFoundError("project-99 not found")

    with pytest.raises(NotFoundError):
        store.get("project-99", owner_id="freelancer-1")

    assert mock_data_store.get_project.called
