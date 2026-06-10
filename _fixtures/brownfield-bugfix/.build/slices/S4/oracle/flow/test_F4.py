# FROZEN ORACLE — materialized from F4. Do NOT edit (B4); needing to edit = escape with a diagnosis. Red-first: targets unimplemented at freeze.
# F4: slice S4 integration flow: C6 → C3 → C2 → C1 via [CT9, CT3, CT2].
# Happy path: Web Ingress dispatches authenticated project-management request; Project Management
# resolves session (CT3/C2) and persists/reads project records (CT2/C1); arrives at AC6.
# Failure path: exercises CT3:no-valid-session.

import pytest
from unittest.mock import MagicMock, call

from freelancer_app.wsgi import application  # does not exist in this form yet — red
from freelancer_app.web_ingress.dispatcher import dispatch_project_request  # red


# ── fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def authenticated_session_context():
    return {"session_token": "sess-f4-valid", "freelancer_id": "freelancer-42"}


@pytest.fixture
def unauthenticated_session_context():
    return {"session_token": None}


# ── happy path ────────────────────────────────────────────────────────────────

def test_f4_happy_path_project_create_and_list(
    mock_identity_auth,
    mock_project_management,
    mock_data_store,
    authenticated_session_context,
):
    """F4 happy: full path C6→C3→C2→C1 via CT9/CT3/CT2; authenticated freelancer creates project, project appears in list. Asserts AC6."""
    # CT3: C2 returns authenticated identity
    mock_identity_auth.resolve_session.return_value = {"freelancer_id": "freelancer-42", "provider": "google"}

    # CT2: C1 stores and returns project record
    created_project = {
        "id": "proj-new",
        "name": "Beta Client Portal",
        "client": {"name": "Beta Corp", "contact": "beta@example.com", "billing_address": "2 Oak Ave"},
        "currency": "EUR",
        "billable_rate": "120.00",
        "owner_id": "freelancer-42",
    }
    mock_data_store.create_project.return_value = created_project
    mock_data_store.list_projects.return_value = [created_project]

    # CT9: C3 handles create request → calls C2 session resolve, then C1 create
    mock_project_management.handle_request.side_effect = _simulate_create_flow(
        mock_identity_auth, mock_data_store, authenticated_session_context, created_project
    )

    create_response = dispatch_project_request(
        request={
            "method": "POST",
            "path": "/projects",
            "session_token": authenticated_session_context["session_token"],
            "body": {
                "name": "Beta Client Portal",
                "client_name": "Beta Corp",
                "currency": "EUR",
                "billable_rate": "120.00",
            },
        },
        project_management=mock_project_management,
        identity_auth=mock_identity_auth,
    )

    # AC6: project created successfully (2xx or redirect-after-post)
    assert create_response["status"] in (200, 201, 302)

    # List request to assert project appears
    mock_project_management.handle_request.side_effect = None  # reset: side_effect overrides return_value otherwise — create handler would re-fire
    mock_project_management.handle_request.return_value = {
        "status": 200,
        "body": "<html>Beta Client Portal</html>",
        "content_type": "text/html",
        "projects": [created_project],
    }
    list_response = dispatch_project_request(
        request={"method": "GET", "path": "/projects", "session_token": authenticated_session_context["session_token"]},
        project_management=mock_project_management,
        identity_auth=mock_identity_auth,
    )
    assert list_response["status"] == 200
    # project appears in list (AC6: project appears in freelancer's project list)
    assert any(p["id"] == "proj-new" for p in list_response.get("projects", []))


def _simulate_create_flow(mock_identity_auth, mock_data_store, session_ctx, created_project):
    """Integration stub: simulates C3 calling C2 (CT3) then C1 (CT2) during a create request."""
    def _handler(request, **kwargs):
        # CT3 leg: resolve session
        identity = mock_identity_auth.resolve_session({"session_token": session_ctx["session_token"]})
        if not identity:
            from freelancer_app.project_management.exceptions import UnauthorizedError
            raise UnauthorizedError("no valid session")
        # CT2 leg: create project
        record = mock_data_store.create_project({
            "name": request.get("body", {}).get("name"),
            "owner_id": identity["freelancer_id"],
        })
        return {"status": 201, "project": record}
    return _handler


# ── failure path ──────────────────────────────────────────────────────────────

def test_f4_failure_ct3_no_valid_session(
    mock_identity_auth,
    mock_project_management,
    mock_data_store,
    unauthenticated_session_context,
):
    """F4 failure: CT3:no-valid-session — C2 returns no identity; C3 rejects as unauthorized; C6 returns HTTP error (redirect to sign-in). No project data read or written."""
    # CT3: no session
    mock_identity_auth.resolve_session.return_value = None

    from freelancer_app.project_management.exceptions import UnauthorizedError  # red

    def _unauthorized_handler(request, **kwargs):
        identity = mock_identity_auth.resolve_session({"session_token": request.get("session_token")})
        if not identity:
            raise UnauthorizedError("no valid session")
        # should never reach data store
        mock_data_store.create_project({})

    mock_project_management.handle_request.side_effect = _unauthorized_handler

    response = dispatch_project_request(
        request={"method": "POST", "path": "/projects", "session_token": None},
        project_management=mock_project_management,
        identity_auth=mock_identity_auth,
    )

    # Terminal state: Web Ingress returns HTTP error / redirect to sign-in; no project data written
    assert response["status"] in (302, 401, 403)
    assert not mock_data_store.create_project.called, "Data Store must not be touched when session invalid"
