# FROZEN ORACLE — materialized from AC1 (held_out). Do NOT edit (B4); needing to edit = escape with a diagnosis. Red-first: targets unimplemented at freeze.
#
# AC1 (req_ref: R1): The application is reachable over HTTP/HTTPS in a standard
# web browser and renders its entry page without requiring a native app install.
#
# HELD-OUT acceptance test — gate-only, builder never sees this file (B7).
# Same property as visible/test_AC1.py; different, unguessable input.
# Hardcoding the visible case (GET / from localhost) does NOT make this pass.
# Traces: R1

import pytest
from conftest import wsgi_app


def test_ac1_held_out_app_reachable_https_user_agent(wsgi_app):
    """
    AC1 (held_out): Application reachable over HTTPS; entry page renders for a
    distinct, unguessable User-Agent and Host combination without requiring a
    native app install.

    Uses a different HTTP_HOST, wsgi.url_scheme=https, and a curl-style
    User-Agent (not a browser UA) — the property (reachable, renders,
    no native-install gate) must hold regardless of client identity.

    GATE-ONLY. Builder never sees this input. Hardcoding visible case fails here.
    RED until Web Ingress (C6) is implemented.
    """
    import io

    # Unguessable input: HTTPS scheme, non-localhost host, curl User-Agent,
    # X-Forwarded-Proto header (common behind a PaaS reverse proxy).
    environ = {
        "REQUEST_METHOD": "GET",
        "PATH_INFO": "/",
        "QUERY_STRING": "",
        "SERVER_NAME": "app.freelancetool.internal",
        "SERVER_PORT": "443",
        "wsgi.input": io.BytesIO(b""),
        "wsgi.errors": io.StringIO(),
        "wsgi.url_scheme": "https",
        "HTTP_HOST": "app.freelancetool.internal",
        "HTTP_ACCEPT": "*/*",
        "HTTP_USER_AGENT": "curl/7.88.1",
        "HTTP_X_FORWARDED_PROTO": "https",
        "HTTP_X_FORWARDED_FOR": "203.0.113.42",
    }

    response_started = []
    body_parts = list(wsgi_app(environ, lambda s, h, *a: response_started.append((s, h))))

    assert response_started, "AC1 held_out: WSGI app must call start_response."
    status_line = response_started[0][0]
    status_code = int(status_line.split(" ", 1)[0])

    # Reachable over HTTPS (proxied): must not be a server error.
    assert status_code < 500, (
        f"AC1 held_out: app must be reachable via HTTPS proxy (got {status_code})."
    )
    # Renders or redirects — no native-install gate.
    if status_code == 200:
        body = b"".join(body_parts).decode("utf-8", errors="replace")
        assert len(body) > 0, "AC1 held_out: entry page body must be non-empty."
        body_lower = body.lower()
        assert "itms-appss://" not in body_lower, (
            "AC1 held_out: must not require native app install (Apple)."
        )
        assert "market://details" not in body_lower, (
            "AC1 held_out: must not require native app install (Android)."
        )
    else:
        assert status_code in (301, 302, 303, 307, 308), (
            f"AC1 held_out: unexpected non-200 non-redirect status {status_code}."
        )
