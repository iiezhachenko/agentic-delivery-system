# FROZEN ORACLE — contract-level mock fixtures (B4). Do NOT edit; needing to edit = escape with a diagnosis.
#
# Frozen contract = mock spec (§4.3).
# Fixtures here correspond to the mocked seams in the build plan:
#   - CT1 mock: for contract/test_CT1.py (C2 tests its CT1 seam with C1 mocked)
#   - CT8 mock: for contract/test_CT8.py (C6 tests its CT8 seam with C2 mocked)
#   - CT9/CT10/CT11 mocks: later-slice deps (C3/C4/C5) mocked for C6 flow/acceptance tests
#   - wsgi_app: framework-agnostic WSGI entry fixture
#   - mock_oauth_provider: external Google OAuth provider mock

import pytest
from unittest.mock import MagicMock


# ---------------------------------------------------------------------------
# CT1 — shared_data seam, C2 (Identity & Auth) caller, C1 (Data Store) provider
# Frozen contract spec: save_identity(provider, provider_id, profile_ref) -> record;
#                        get_identity(provider, provider_id) -> record | None
# Mock used in: contract/test_CT1.py
# ---------------------------------------------------------------------------
@pytest.fixture
def mock_data_store_ct1(monkeypatch):
    """
    Mock for CT1 seam: Data Store identity persistence contract.
    Frozen spec: save_identity + get_identity callable; default success path returns
    a non-None acknowledgement. Tests that need failure override side_effect.
    """
    mock = MagicMock()
    mock.save_identity.return_value = {"provider": "google", "provider_id": "uid-mock", "persisted": True}
    mock.get_identity.return_value = {"provider": "google", "provider_id": "uid-mock"}

    try:
        monkeypatch.setattr(
            "freelancer_app.data_store.identity_record_store",
            mock,
            raising=False,
        )
    except Exception:
        pass  # Module does not exist at freeze time — RED is correct.

    yield mock


# ---------------------------------------------------------------------------
# CT8 — sync_api seam, C6 (Web Ingress) caller, C2 (Identity & Auth) provider
# Frozen contract spec: check_session(cookie_value) -> session_obj | None
# Mock used in: contract/test_CT8.py
# ---------------------------------------------------------------------------
@pytest.fixture
def mock_identity_auth_ct8(monkeypatch):
    """
    Mock for CT8 seam: Identity & Auth session-check contract.
    Frozen spec: check_session callable; default returns a valid session object.
    Tests that need no-valid-session or callee-error override return_value/side_effect.
    """
    mock = MagicMock()
    mock.check_session.return_value = {"authenticated": True, "identity_ref": "uid-mock"}

    try:
        monkeypatch.setattr(
            "freelancer_app.identity_auth.session_checker",
            mock,
            raising=False,
        )
    except Exception:
        pass  # Module does not exist at freeze time — RED is correct.

    yield mock


# ---------------------------------------------------------------------------
# CT9 — sync_api seam mock, C6 caller, C3 (Project Management) provider
# Later-slice dep (status:mocked in build plan). Mock spec from frozen CT9.
# Frozen contract spec: handle_request(request_env) -> html_response | not_found | error
# ---------------------------------------------------------------------------
@pytest.fixture
def mock_ct9_project_management(monkeypatch):
    """
    Mock for CT9 seam: Project Management request dispatch (later-slice, mocked).
    Frozen contract: handle_request returns an HTML response dict by default.
    """
    mock = MagicMock()
    mock.handle_request.return_value = {
        "status": "200 OK",
        "headers": [("Content-Type", "text/html")],
        "body": b"<html><body>Projects</body></html>",
    }

    try:
        monkeypatch.setattr(
            "freelancer_app.project_management.request_handler",
            mock,
            raising=False,
        )
    except Exception:
        pass

    yield mock


# ---------------------------------------------------------------------------
# CT10 — sync_api seam mock, C6 caller, C4 (Time Logging) provider
# Later-slice dep (status:mocked in build plan). Mock spec from frozen CT10.
# ---------------------------------------------------------------------------
@pytest.fixture
def mock_ct10_time_logging(monkeypatch):
    """
    Mock for CT10 seam: Time Logging request dispatch (later-slice, mocked).
    Frozen contract: handle_request returns an HTML response dict by default.
    """
    mock = MagicMock()
    mock.handle_request.return_value = {
        "status": "200 OK",
        "headers": [("Content-Type", "text/html")],
        "body": b"<html><body>Time Entries</body></html>",
    }

    try:
        monkeypatch.setattr(
            "freelancer_app.time_logging.request_handler",
            mock,
            raising=False,
        )
    except Exception:
        pass

    yield mock


# ---------------------------------------------------------------------------
# CT11 — sync_api seam mock, C6 caller, C5 (Invoice Export) provider
# Later-slice dep (status:mocked in build plan). Mock spec from frozen CT11.
# ---------------------------------------------------------------------------
@pytest.fixture
def mock_ct11_invoice_export(monkeypatch):
    """
    Mock for CT11 seam: Invoice Export request dispatch (later-slice, mocked).
    Frozen contract: handle_request returns a PDF stream response dict by default.
    """
    mock = MagicMock()
    mock.handle_request.return_value = {
        "status": "200 OK",
        "headers": [("Content-Type", "application/pdf"), ("Content-Disposition", "attachment; filename=invoice.pdf")],
        "body": b"%PDF-1.4 mock",
    }

    try:
        monkeypatch.setattr(
            "freelancer_app.invoice_export.request_handler",
            mock,
            raising=False,
        )
    except Exception:
        pass

    yield mock


# ---------------------------------------------------------------------------
# External: Google OAuth provider mock
# The system delegates to Google OAuth 2.0 (ADR-0005); exchange_code is the
# observable interface boundary (provider token exchange). Framework-agnostic.
# ---------------------------------------------------------------------------
@pytest.fixture
def mock_oauth_provider(monkeypatch):
    """
    Mock for Google OAuth 2.0 provider (ADR-0005 external integration).
    exchange_code(code) -> {provider, provider_id, profile} by default.
    Tests override return_value / side_effect per scenario.
    """
    mock = MagicMock()
    mock.exchange_code.return_value = {
        "provider": "google",
        "provider_id": "google-uid-default",
        "profile": {"email": "default@example.com", "name": "Default User"},
    }

    try:
        monkeypatch.setattr(
            "freelancer_app.identity_auth.oauth_provider",
            mock,
            raising=False,
        )
    except Exception:
        pass

    yield mock


# ---------------------------------------------------------------------------
# WSGI app fixture — framework-agnostic entry point
# The web framework (Django / Flask / FastAPI) is IMPLEMENT-stage LLD (B8).
# Tests import the WSGI callable; if the module does not exist → RED (correct).
# ---------------------------------------------------------------------------
@pytest.fixture
def wsgi_app():
    """
    Framework-agnostic WSGI application entry point.
    Imports freelancer_app.wsgi.application — does not exist at freeze time (RED).
    Framework choice (Django/Flask/FastAPI) is IMPLEMENT-stage LLD (B8/ADR-0002).
    """
    try:
        from freelancer_app.wsgi import application
        return application
    except ImportError:
        # Module does not exist yet — correct at freeze time.
        # Return a sentinel that will fail any WSGI call, keeping tests RED.
        def _not_implemented(environ, start_response):
            raise NotImplementedError(
                "freelancer_app.wsgi.application not implemented — oracle is RED at freeze."
            )
        return _not_implemented
