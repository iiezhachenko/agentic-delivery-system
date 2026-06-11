# FROZEN ORACLE — materialized from AC11/R11 (bugfix repro). Do NOT edit (B4); needing to edit = escape with a diagnosis. Red-first: targets unimplemented at freeze.
#
# defect_site: _ProjectManagementAdapter._render (src/freelancer_app/wsgi.py)
# flips_green_when: null billable_rate renders as em-dash ('—'); row renders, no numeric format on null
# traces: R11, AC11
# baseline_ref: AC6
# starts_red: true — current code raises TypeError on null billable_rate → HTTP 500; this test asserts correct behavior the defect violates

import pytest
from unittest.mock import MagicMock, patch


# ---------------------------------------------------------------------------
# OREPRO-1: Reproduction test — GET /projects with null-rate project
# ---------------------------------------------------------------------------
def test_repro_get_projects_null_rate_returns_200_with_em_dash(client, auth_session, project_store):
    """GET /projects with null-rate project → HTTP 200, row rendered with '—', no crash."""
    # Arrange: authenticated freelancer owns one project with billable_rate=null
    null_rate_project = {
        "id": "proj-null-rate-001",
        "owner_id": auth_session["freelancer_id"],
        "name": "Zero-Rate Engagement",
        "client": "Acme Corp",
        "currency": "USD",
        "billable_rate": None,   # the defect-triggering value
    }
    project_store.list.return_value = [null_rate_project]

    # Act: send authenticated GET /projects to the app WSGI/HTTP entry
    response = client.get("/projects", headers=auth_session["headers"])

    # Assert SUT-observable behavior (shared Rule 10):
    #   • HTTP 200 (not 500 — the defect produces 500)
    assert response.status_code == 200, (
        "GET /projects with null billable_rate must return HTTP 200; "
        f"defect produces 500 via TypeError in _render (AC11/R11). Got {response.status_code}."
    )
    #   • Project row present in rendered output
    body = response.text if hasattr(response, "text") else response.get_data(as_text=True)
    assert "Zero-Rate Engagement" in body, (
        "Response body must contain the null-rate project's name (row rendered, AC11)."
    )
    #   • Rate column rendered as em-dash '—', not blank-via-crash, not '0.00'
    assert "—" in body or "&#8212;" in body or "&mdash;" in body, (
        "Null billable_rate must render as em-dash ('—') in rate column (A14 / AC11); "
        "crash or missing row fails AC11."
    )
