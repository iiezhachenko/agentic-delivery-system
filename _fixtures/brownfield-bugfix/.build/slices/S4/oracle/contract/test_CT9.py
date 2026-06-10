# FROZEN ORACLE — materialized from CT9. Do NOT edit (B4); needing to edit = escape with a diagnosis. Red-first: targets unimplemented at freeze.
# CT9: sync_api seam between C6 (Web Ingress, caller) and C3 (Project Management, provider).
# Web Ingress routes authenticated HTTP request in-process to Project Management; C3 returns
# server-rendered HTML response (project list, detail, create/edit/delete forms).
# C2 (Identity & Auth) and C1 (Data Store) mocked via conftest — never touch real deps.

import pytest
from unittest.mock import MagicMock

from freelancer_app.web_ingress.dispatcher import dispatch_project_request  # does not exist yet — red


# ── shape test ────────────────────────────────────────────────────────────────

def test_ct9_shape_dispatches_project_page_request(mock_project_management, mock_identity_auth):
    """CT9 shape: authenticated request dispatched in-process to Project Management; returns server-rendered HTML."""
    mock_project_management.handle_request.return_value = {"status": 200, "body": "<html>projects</html>", "content_type": "text/html"}

    response = dispatch_project_request(
        request={"path": "/projects", "session_token": "tok-valid"},
        project_management=mock_project_management,
        identity_auth=mock_identity_auth,
    )

    assert mock_project_management.handle_request.called
    assert response["status"] == 200
    assert "text/html" in response["content_type"]


# ── failure tests ─────────────────────────────────────────────────────────────

def test_ct9_failure_callee_error(mock_project_management, mock_identity_auth):
    """CT9 failure: callee-error — C3 raises unhandled exception; Web Ingress returns appropriate HTTP error; raw exception NOT propagated to browser."""
    mock_project_management.handle_request.side_effect = RuntimeError("unhandled exception in project management")

    response = dispatch_project_request(
        request={"path": "/projects", "session_token": "tok-valid"},
        project_management=mock_project_management,
        identity_auth=mock_identity_auth,
    )

    # Web Ingress must return an HTTP error response — not re-raise
    assert response["status"] >= 500
    assert "RuntimeError" not in response.get("body", "")


def test_ct9_failure_not_found(mock_project_management, mock_identity_auth):
    """CT9 failure: not-found — C3 returns not-found for requested resource; Web Ingress renders 404 page."""
    from freelancer_app.project_management.exceptions import NotFoundError  # red

    mock_project_management.handle_request.side_effect = NotFoundError("project-deleted not found")

    response = dispatch_project_request(
        request={"path": "/projects/project-deleted", "session_token": "tok-valid"},
        project_management=mock_project_management,
        identity_auth=mock_identity_auth,
    )

    assert response["status"] == 404
