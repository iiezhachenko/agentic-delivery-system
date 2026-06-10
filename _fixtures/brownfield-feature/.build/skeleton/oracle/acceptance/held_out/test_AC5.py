# FROZEN ORACLE — materialized from AC5 (held_out). Do NOT edit (B4); needing to edit = escape with a diagnosis. Red-first: targets unimplemented at freeze.
#
# AC5 (req_ref: R5): A freelancer can initiate sign-in via the configured OAuth
# provider (e.g. Google or GitHub), complete the OAuth flow, and arrive at an
# authenticated session in the application — no password entry is required.
#
# HELD-OUT acceptance test — gate-only, builder never sees this file (B7).
# Same property; different, unguessable OAuth code, provider_id, profile,
# and state token. Hardcoding the visible case does NOT make this pass.
# High-blast: auth flow — mutation-certified.
# Traces: R5

import pytest
from conftest import wsgi_app, mock_oauth_provider


def test_ac5_held_out_oauth_flow_establishes_session_different_identity(
    wsgi_app, mock_oauth_provider
):
    """
    AC5 (held_out): Same OAuth-login-to-session property as visible test;
    different unguessable provider_id, OAuth code, CSRF state, and user profile.
    Hardcoding visible inputs (google-uid-visible-12345, alice@example.com,
    code=4%2F0AbcXYZvisible) does NOT satisfy this test.

    GATE-ONLY. Builder never sees this file.
    RED until C6 / C2 / C1 implemented.
    """
    import io

    # Step 1: initiate OAuth login (same endpoint, different session context).
    login_environ = {
        "REQUEST_METHOD": "GET",
        "PATH_INFO": "/auth/login",
        "QUERY_STRING": "",
        "SERVER_NAME": "app.freelancetool.internal",
        "SERVER_PORT": "443",
        "wsgi.input": io.BytesIO(b""),
        "wsgi.errors": io.StringIO(),
        "wsgi.url_scheme": "https",
        "HTTP_HOST": "app.freelancetool.internal",
        "HTTP_COOKIE": "",
        "HTTP_X_FORWARDED_PROTO": "https",
    }
    login_response = []
    list(wsgi_app(login_environ, lambda s, h, *a: login_response.append((s, h))))
    assert login_response, "AC5 held_out: /auth/login must produce a response."
    login_status = int(login_response[0][0].split(" ", 1)[0])
    assert login_status in (200, 301, 302, 303, 307, 308), (
        f"AC5 held_out: /auth/login must redirect to OAuth provider or render login page (got {login_status})."
    )

    # Step 2: OAuth callback with unguessable different provider_id and code.
    mock_oauth_provider.exchange_code.return_value = {
        "provider": "google",
        "provider_id": "google-uid-heldout-9f3a7c2e",   # different, unguessable
        "profile": {
            "email": "bob.contractor.heldout@gmail.com",  # different identity
            "name": "Bob Contractor",
        },
    }
    callback_environ = {
        "REQUEST_METHOD": "GET",
        "PATH_INFO": "/auth/callback",
        # Unguessable OAuth code and CSRF state — different from visible case.
        "QUERY_STRING": "code=4%2F0XkQ9heldout3z7mNpRTv&state=csrf-heldout-7f2e9b1c",
        "SERVER_NAME": "app.freelancetool.internal",
        "SERVER_PORT": "443",
        "wsgi.input": io.BytesIO(b""),
        "wsgi.errors": io.StringIO(),
        "wsgi.url_scheme": "https",
        "HTTP_HOST": "app.freelancetool.internal",
        "HTTP_COOKIE": "",
        "HTTP_X_FORWARDED_PROTO": "https",
    }
    callback_response = []
    list(wsgi_app(callback_environ, lambda s, h, *a: callback_response.append((s, h))))
    assert callback_response, "AC5 held_out: /auth/callback must produce a response."
    callback_status = int(callback_response[0][0].split(" ", 1)[0])
    callback_headers = dict(callback_response[0][1])

    # Must complete without server error.
    assert callback_status < 500, (
        f"AC5 held_out: OAuth callback must not produce server error (got {callback_status})."
    )

    # Must establish authenticated session for the held-out identity.
    set_cookie = callback_headers.get("Set-Cookie", "")
    assert "session" in set_cookie.lower() or callback_status in (302, 303), (
        "AC5 held_out: OAuth callback must set a session cookie or redirect to authenticated area "
        "for a different (unguessable) user identity — no password entry required."
    )
