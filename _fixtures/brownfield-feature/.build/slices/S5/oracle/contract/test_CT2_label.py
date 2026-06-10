# FROZEN ORACLE — materialized from the CT2 LABEL EXTENSION (A14). Do NOT edit (B4). Red-first: targets unimplemented at freeze.
# CT2 extension: shared_data seam C3 (Project Management, caller) → C1 (Data Store, provider).
# NEW additive assertion only — the inherited CT2 BASE shape test (S4, OCT-CT2) is frozen and NOT re-authored (H14).
# Asserts the free-text label field persists on the EXISTING project record (no new table/contract).
# C1 (Data Store) mocked via conftest fixture — never touches a real store.

import pytest

from freelancer_app.project_management.project_label import ProjectLabeler  # does not exist yet — red


# ── shape test (extension) ──────────────────────────────────────────────────

def test_ct2_label_field_persists_on_project_record(mock_data_store):
    """CT2 extension: set_label writes the additive label field on the existing project record via C1."""
    labeler = ProjectLabeler(data_store=mock_data_store)
    mock_data_store.update_project.return_value = {
        "id": "proj-1", "owner_id": "freelancer-42", "name": "Acme Website",
        "currency": "USD", "billable_rate": "150.00", "label": "client-acme",
    }

    result = labeler.set_label("proj-1", owner_id="freelancer-42", label="client-acme")

    assert mock_data_store.update_project.called
    # additive label field carried on the existing project record (A14) — no new entity/table
    args, kwargs = mock_data_store.update_project.call_args
    payload = kwargs.get("payload", args[2] if len(args) > 2 else (args[-1] if args else {}))
    assert payload.get("label") == "client-acme"
    assert result["label"] == "client-acme"
    assert result["id"] == "proj-1"
    # base project fields untouched by the additive label write
    assert result["name"] == "Acme Website"


# ── failure tests (inherited CT2 failure modes apply to the label write) ─────

def test_ct2_label_failure_store_unavailable(mock_data_store):
    """CT2 failure: store-unavailable on the label write; propagated unmodified, no partial record."""
    from freelancer_app.project_management.exceptions import StoreUnavailableError  # red

    labeler = ProjectLabeler(data_store=mock_data_store)
    mock_data_store.update_project.side_effect = StoreUnavailableError("PostgreSQL unreachable")

    with pytest.raises(StoreUnavailableError):
        labeler.set_label("proj-1", owner_id="freelancer-42", label="client-acme")

    assert mock_data_store.update_project.call_count == 1


def test_ct2_label_failure_constraint_violation(mock_data_store):
    """CT2 failure: constraint-violation on the label write; propagated unmodified."""
    from freelancer_app.project_management.exceptions import ConstraintViolationError  # red

    labeler = ProjectLabeler(data_store=mock_data_store)
    mock_data_store.update_project.side_effect = ConstraintViolationError("label constraint violated")

    with pytest.raises(ConstraintViolationError):
        labeler.set_label("proj-1", owner_id="freelancer-42", label="client-acme")

    assert mock_data_store.update_project.call_count == 1
