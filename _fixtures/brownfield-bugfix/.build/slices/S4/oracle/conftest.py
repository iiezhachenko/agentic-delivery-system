# FROZEN ORACLE — conftest for S4 slice oracle (bugfix re-entry: OREPRO-1 fixtures added). Do NOT edit (B4); needing to edit = escape with a diagnosis.
# Contract-level mock fixtures for S4 slice seams: CT2 (C1/Data Store), CT3 (C2/Identity & Auth),
# CT9 (C3/Project Management as callee of C6).
# Bugfix additions: client, auth_session, project_store — support OREPRO-1 reproduction test (AC11/R11).
# All mocks follow frozen contract specs — never configure mock attributes as assertions (Rule 10).

import pytest
from unittest.mock import MagicMock


@pytest.fixture
def mock_data_store():
    """Mock for C1 (Data Store) — contract-level spec for CT2 seam.
    Provides: create_project, get_project, list_projects, update_project, delete_project.
    """
    m = MagicMock(name="DataStore")
    m.create_project = MagicMock(name="create_project")
    m.get_project = MagicMock(name="get_project")
    m.list_projects = MagicMock(name="list_projects", return_value=[])
    m.update_project = MagicMock(name="update_project")
    m.delete_project = MagicMock(name="delete_project")
    return m


@pytest.fixture
def mock_identity_auth():
    """Mock for C2 (Identity & Auth) — contract-level spec for CT3 seam.
    Provides: resolve_session → returns freelancer identity dict or None.
    High-blast component (auth).
    """
    m = MagicMock(name="IdentityAuth")
    m.resolve_session = MagicMock(name="resolve_session", return_value=None)
    return m


@pytest.fixture
def mock_project_management():
    """Mock for C3 (Project Management) — contract-level spec for CT9 seam (C6 caller).
    Provides: handle_request → returns response dict {status, body, content_type}.
    """
    m = MagicMock(name="ProjectManagement")
    m.handle_request = MagicMock(
        name="handle_request",
        return_value={"status": 200, "body": "<html></html>", "content_type": "text/html"},
    )
    return m


# ---------------------------------------------------------------------------
# Bugfix fixtures — OREPRO-1 (AC11/R11): reproduction test support
# ---------------------------------------------------------------------------

@pytest.fixture
def project_store():
    """Contract-level mock for C1 data-store list operation used in _render path.
    Provides: list(owner_id) → returns list of project dicts.
    Used by reproduction test to inject null-rate project without touching a real store.
    """
    m = MagicMock(name="ProjectStore")
    m.list = MagicMock(name="list", return_value=[])
    return m


@pytest.fixture
def auth_session():
    """Authenticated freelancer session for reproduction test.
    Returns dict with freelancer_id + HTTP headers that satisfy CT3 (session resolution).
    Distinct unguessable session token from the visible AC6 suite (not guessable by hardcoding).
    """
    return {
        "freelancer_id": "freelancer-repro-7f3a",
        "headers": {"Cookie": "session=repro-sess-9b2e4d1c; Path=/"},
    }


@pytest.fixture
def client(project_store, auth_session):
    """Framework-agnostic WSGI test client wired to the app entry point.
    Injects contract-level mocks: project_store (C1 list) and auth_session (C2 resolve_session).
    The app entry point is imported but not yet implemented — collection is RED (Rule 6).
    """
    from freelancer_app.wsgi import create_app  # does not exist yet → RED (Rule 6)

    app = create_app(
        project_store=project_store,
        identity_auth=MagicMock(
            name="IdentityAuth",
            resolve_session=MagicMock(
                return_value={"freelancer_id": auth_session["freelancer_id"]}
            ),
        ),
    )
    # Return a test client; framework-agnostic (framework = IMPLEMENT-stage LLD, B4/B8)
    return app.test_client()
