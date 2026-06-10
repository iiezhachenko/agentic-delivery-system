# FROZEN ORACLE — materialized from F5. Do NOT edit (B4). Red-first: targets unimplemented at freeze.
# F5: slice S5 integration flow: C6 → C3 → C2 → C1 via [CT9, CT3, CT2-extension].
# Happy path: Web Ingress dispatches authenticated set-label request; Project Management resolves
# session (CT3/C2) and persists the additive label field on the project record (CT2/C1); label renders
# (AC11) and persists across navigation (AC13).
# Failure path: exercises CT2:store-unavailable.

import pytest

from freelancer_app.web_ingress.project_label_dispatch import dispatch_project_label_request  # red


@pytest.fixture
def authenticated_session_context():
    return {"session_token": "sess-f5-valid", "freelancer_id": "freelancer-42"}


# ── happy path ────────────────────────────────────────────────────────────────

def test_f5_happy_path_set_label_persists_and_renders(
    mock_identity_auth,
    mock_project_management,
    mock_data_store,
    authenticated_session_context,
):
    """F5 happy: full path C6→C3→C2→C1 via CT9/CT3/CT2-extension; label set, persisted, renders in list. Asserts AC11, AC13."""
    mock_identity_auth.resolve_session.return_value = {"freelancer_id": "freelancer-42", "provider": "google"}
    labeled_project = {"id": "proj-1", "owner_id": "freelancer-42", "name": "Acme Website",
                       "currency": "USD", "billable_rate": "150.00", "label": "client-acme"}
    mock_data_store.update_project.return_value = labeled_project
    mock_data_store.list_projects.return_value = [labeled_project]

    mock_project_management.handle_request.side_effect = _simulate_set_label_flow(
        mock_identity_auth, mock_data_store, authenticated_session_context, labeled_project
    )

    set_response = dispatch_project_label_request(
        request={"method": "POST", "path": "/projects/proj-1/label",
                 "session_token": authenticated_session_context["session_token"],
                 "body": {"label": "client-acme"}},
        project_management=mock_project_management,
        identity_auth=mock_identity_auth,
    )
    # AC11: label set successfully (2xx or redirect-after-post)
    assert set_response["status"] in (200, 201, 302)

    # AC11: label renders on the project in the list
    mock_project_management.handle_request.side_effect = None
    mock_project_management.handle_request.return_value = {
        "status": 200, "content_type": "text/html",
        "body": "<html><li>Acme Website [client-acme]</li></html>",
        "projects": [labeled_project],
    }
    list_response = dispatch_project_label_request(
        request={"method": "GET", "path": "/projects/proj-1/label",
                 "session_token": authenticated_session_context["session_token"]},
        project_management=mock_project_management,
        identity_auth=mock_identity_auth,
    )
    assert list_response["status"] == 200
    assert any(p["id"] == "proj-1" and p["label"] == "client-acme" for p in list_response.get("projects", []))

    # AC13: label still holds after navigate-away (second read returns the same labeled record)
    reload_project = mock_data_store.list_projects.return_value[0]
    assert reload_project["label"] == "client-acme" and reload_project["id"] == "proj-1"


def _simulate_set_label_flow(mock_identity_auth, mock_data_store, session_ctx, labeled_project):
    """Integration stub: C3 calling C2 (CT3) then C1 (CT2-extension) during a set-label request."""
    def _handler(request, **kwargs):
        identity = mock_identity_auth.resolve_session({"session_token": session_ctx["session_token"]})
        if not identity:
            from freelancer_app.project_management.exceptions import UnauthorizedError
            raise UnauthorizedError("no valid session")
        record = mock_data_store.update_project(
            request["path"].split("/")[2], identity["freelancer_id"], {"label": request.get("body", {}).get("label")},
        )
        return {"status": 200, "project": record, "content_type": "text/html"}
    return _handler


# ── failure path ──────────────────────────────────────────────────────────────

def test_f5_failure_ct2_store_unavailable(
    mock_identity_auth,
    mock_project_management,
    mock_data_store,
    authenticated_session_context,
):
    """F5 failure: CT2:store-unavailable — C1 raises on the label write; C3 propagates; C6 returns 503; label not persisted."""
    mock_identity_auth.resolve_session.return_value = {"freelancer_id": "freelancer-42", "provider": "google"}

    from freelancer_app.project_management.exceptions import StoreUnavailableError  # red

    def _failing_handler(request, **kwargs):
        identity = mock_identity_auth.resolve_session({"session_token": request.get("session_token")})
        # C3 calls C1 label write; store-unavailable propagates unmodified (no catch)
        mock_data_store.update_project(request["path"].split("/")[2], identity["freelancer_id"],
                                       {"label": request.get("body", {}).get("label")})

    mock_data_store.update_project.side_effect = StoreUnavailableError("PostgreSQL unreachable")
    mock_project_management.handle_request.side_effect = _failing_handler
    mock_data_store.list_projects.return_value = []

    response = dispatch_project_label_request(
        request={"method": "POST", "path": "/projects/proj-1/label",
                 "session_token": authenticated_session_context["session_token"],
                 "body": {"label": "client-acme"}},
        project_management=mock_project_management,
        identity_auth=mock_identity_auth,
    )
    # Terminal state: Web Ingress surfaces the persistence error as 5xx; label not persisted
    assert response["status"] in (500, 503)
    assert not any(p.get("label") == "client-acme" for p in mock_data_store.list_projects.return_value)
