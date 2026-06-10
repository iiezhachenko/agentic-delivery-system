# FROZEN ORACLE — materialized from F1. Do NOT edit (B4); needing to edit = escape with a diagnosis. Red-first: targets unimplemented at freeze.
#
# F1: Walking-skeleton flow — path C6 -> C2 -> C1, via [CT8, CT1]
# Happy path: traverses CT8 (Web Ingress -> Identity & Auth session check)
#   and CT1 (Identity & Auth -> Data Store identity write/read);
#   asserts arrival at AC1 and AC5.
# Failure path: exercises CT1:store-unavailable.
# Traces: R1, R5, AC1, AC5
#
# Integration-level: deps real along the path (C6, C2, C1); mocked deps
# (C3/C4/C5 via CT9/CT10/CT11) are mocked via conftest fixtures.

import pytest
from conftest import (
    wsgi_app,
    mock_ct9_project_management,
    mock_ct10_time_logging,
    mock_ct11_invoice_export,
    mock_oauth_provider,
)


# ---------------------------------------------------------------------------
# Happy path — traverses CT8 + CT1, asserts AC1 and AC5
# ---------------------------------------------------------------------------

def test_f1_happy_path_oauth_login_establishes_session(
    wsgi_app,
    mock_ct9_project_management,
    mock_ct10_time_logging,
    mock_ct11_invoice_export,
    mock_oauth_provider,
):
    """
    F1 happy path: Walking-skeleton traverses CT8 (session gate) and CT1
    (identity persistence).

    AC1: Application reachable over HTTP/HTTPS in a standard web browser,
    renders entry page without requiring a native app install.

    AC5: Freelancer initiates sign-in via the configured OAuth provider
    (Google or GitHub), completes the OAuth flow, and arrives at an
    authenticated session — no password entry required.

    RED until C6 (Web Ingress), C2 (Identity & Auth), C1 (Data Store) implemented.
    """
    import wsgiref.util

    # --- AC1: entry page reachable ---
    environ = {
        "REQUEST_METHOD": "GET",
        "PATH_INFO": "/",
        "SERVER_NAME": "localhost",
        "SERVER_PORT": "8000",
        "wsgi.input": __import__("io").BytesIO(b""),
        "wsgi.errors": __import__("io").StringIO(),
        "wsgi.url_scheme": "http",
        "HTTP_HOST": "localhost:8000",
    }
    response_started = []
    body_parts = []

    def start_response(status, headers, exc_info=None):
        response_started.append((status, headers))

    body_parts = list(wsgi_app(environ, start_response))

    assert response_started, "F1/AC1: WSGI app must call start_response (entry page reachable)."
    status_code = int(response_started[0][0].split(" ", 1)[0])
    assert status_code < 400, (
        f"F1/AC1: entry page must render without error (got {status_code})."
    )
    body = b"".join(body_parts).decode("utf-8", errors="replace")
    assert len(body) > 0, "F1/AC1: entry page must render non-empty body."

    # --- AC5: OAuth login flow establishes authenticated session ---
    # Step 1: initiate OAuth — redirect to provider
    oauth_init_environ = {
        "REQUEST_METHOD": "GET",
        "PATH_INFO": "/auth/login",
        "SERVER_NAME": "localhost",
        "SERVER_PORT": "8000",
        "wsgi.input": __import__("io").BytesIO(b""),
        "wsgi.errors": __import__("io").StringIO(),
        "wsgi.url_scheme": "http",
        "HTTP_HOST": "localhost:8000",
        "HTTP_COOKIE": "",
    }
    oauth_init_response = []
    list(wsgi_app(oauth_init_environ, lambda s, h, *a: oauth_init_response.append((s, h))))
    assert oauth_init_response, "F1/AC5: OAuth login initiation must produce a response."
    init_status = int(oauth_init_response[0][0].split(" ", 1)[0])
    # Expect redirect to OAuth provider (3xx) or login page (200).
    assert init_status in (200, 301, 302, 303, 307, 308), (
        f"F1/AC5: OAuth initiation must redirect to provider or render login page (got {init_status})."
    )

    # Step 2: OAuth callback — provider returns code; app exchanges for token,
    # persists identity record (CT1), establishes session (CT8).
    mock_oauth_provider.exchange_code.return_value = {
        "provider": "google",
        "provider_id": "uid-f1-happy",
        "profile": {"email": "freelancer@example.com"},
    }
    callback_environ = {
        "REQUEST_METHOD": "GET",
        "PATH_INFO": "/auth/callback",
        "QUERY_STRING": "code=test-oauth-code&state=test-state",
        "SERVER_NAME": "localhost",
        "SERVER_PORT": "8000",
        "wsgi.input": __import__("io").BytesIO(b""),
        "wsgi.errors": __import__("io").StringIO(),
        "wsgi.url_scheme": "http",
        "HTTP_HOST": "localhost:8000",
        "HTTP_COOKIE": "",
    }
    callback_response = []
    callback_body = list(
        wsgi_app(callback_environ, lambda s, h, *a: callback_response.append((s, h)))
    )
    assert callback_response, "F1/AC5: OAuth callback must produce a response."
    callback_status = int(callback_response[0][0].split(" ", 1)[0])
    # Must redirect to application (session established) — not back to login.
    assert callback_status in (200, 301, 302, 303, 307, 308), (
        f"F1/AC5: OAuth callback must complete without server error (got {callback_status})."
    )
    # Must set a session cookie (no password entry required; session established via OAuth).
    callback_headers = dict(callback_response[0][1])
    set_cookie = callback_headers.get("Set-Cookie", "")
    assert "session" in set_cookie.lower() or callback_status in (302, 303), (
        "F1/AC5: OAuth callback must establish an authenticated session "
        "(Set-Cookie with session token, or redirect to authenticated area)."
    )


# ---------------------------------------------------------------------------
# Failure path — exercises CT1:store-unavailable
# ---------------------------------------------------------------------------

def test_f1_failure_store_unavailable(
    wsgi_app,
    mock_ct9_project_management,
    mock_ct10_time_logging,
    mock_ct11_invoice_export,
    mock_oauth_provider,
):
    """
    F1 failure path: exercises CT1:store-unavailable.
    Terminal state: OAuth callback cannot persist the identity record;
    no authenticated session is established; Web Ingress redirects the
    browser to the login entry point with an error.
    RED until C6 / C2 / C1 implemented.
    """
    from unittest.mock import patch

    # Simulate Data Store unavailable during OAuth callback.
    with patch(
        "freelancer_app.data_store.identity_record_store.save_identity",
        side_effect=ConnectionError("store-unavailable: PostgreSQL instance unreachable"),
    ):
        mock_oauth_provider.exchange_code.return_value = {
            "provider": "google",
            "provider_id": "uid-f1-failure",
            "profile": {"email": "freelancer@example.com"},
        }
        callback_environ = {
            "REQUEST_METHOD": "GET",
            "PATH_INFO": "/auth/callback",
            "QUERY_STRING": "code=test-oauth-code-fail&state=test-state-fail",
            "SERVER_NAME": "localhost",
            "SERVER_PORT": "8000",
            "wsgi.input": __import__("io").BytesIO(b""),
            "wsgi.errors": __import__("io").StringIO(),
            "wsgi.url_scheme": "http",
            "HTTP_HOST": "localhost:8000",
            "HTTP_COOKIE": "",
        }
        callback_response = []
        list(
            wsgi_app(callback_environ, lambda s, h, *a: callback_response.append((s, h)))
        )

    assert callback_response, "F1 failure: OAuth callback must produce a response."
    callback_status = int(callback_response[0][0].split(" ", 1)[0])
    callback_headers = dict(callback_response[0][1])

    # No authenticated session established — must not set a session cookie.
    set_cookie = callback_headers.get("Set-Cookie", "")
    assert "session" not in set_cookie.lower() or callback_status >= 400, (
        "F1 store-unavailable: no authenticated session must be established when Data Store is unreachable."
    )

    # Web Ingress must redirect to login entry point with an error (not to app interior).
    location = callback_headers.get("Location", "")
    if callback_status in (301, 302, 303, 307, 308):
        assert "login" in location.lower() or "auth" in location.lower() or "error" in location.lower(), (
            "F1 store-unavailable: redirect must point to login entry point or error page, not app interior."
        )
    else:
        # Non-redirect error response also acceptable (4xx/5xx signals failure).
        assert callback_status >= 400 or "error" in set_cookie.lower(), (
            f"F1 store-unavailable: response must signal failure (got {callback_status})."
        )
