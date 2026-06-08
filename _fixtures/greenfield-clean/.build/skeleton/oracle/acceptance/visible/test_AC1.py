# FROZEN ORACLE — materialized from AC1 (visible). Do NOT edit (B4); needing to edit = escape with a diagnosis. Red-first: targets unimplemented at freeze.
#
# AC1 (req_ref: R1): The application is reachable over HTTP/HTTPS in a standard
# web browser and renders its entry page without requiring a native app install.
#
# Visible acceptance test — builder may see this case.
# Held-out counterpart: acceptance/held_out/test_AC1.py (same property, different input).
# Traces: R1

import pytest
from conftest import wsgi_app


def test_ac1_app_reachable_renders_entry_page(wsgi_app):
    """
    AC1 (visible): Application reachable over HTTP/HTTPS; entry page renders
    without requiring a native app install.

    Sends a GET / to the WSGI app (framework-agnostic HTTP entry).
    Asserts: 2xx status, non-empty body, no native-install gate.
    RED until Web Ingress (C6) is implemented.
    """
    import io

    environ = {
        "REQUEST_METHOD": "GET",
        "PATH_INFO": "/",
        "QUERY_STRING": "",
        "SERVER_NAME": "localhost",
        "SERVER_PORT": "8000",
        "wsgi.input": io.BytesIO(b""),
        "wsgi.errors": io.StringIO(),
        "wsgi.url_scheme": "http",
        "HTTP_HOST": "localhost:8000",
        "HTTP_ACCEPT": "text/html,application/xhtml+xml",
        "HTTP_USER_AGENT": "Mozilla/5.0 (compatible; OracleTest/1.0)",
    }

    response_started = []
    body_parts = list(wsgi_app(environ, lambda s, h, *a: response_started.append((s, h))))

    assert response_started, "AC1: WSGI app must call start_response."
    status_line = response_started[0][0]
    status_code = int(status_line.split(" ", 1)[0])

    # Reachable: must not be a server error.
    assert status_code < 500, (
        f"AC1: app reachable — entry page must not produce server error (got {status_code})."
    )
    # Renders: body must be non-empty HTML (or redirect to a renderable page).
    if status_code == 200:
        body = b"".join(body_parts).decode("utf-8", errors="replace")
        assert len(body) > 0, "AC1: entry page body must be non-empty."
        # No native install required — must not contain an app-store redirect
        # or require a native app install prompt.
        body_lower = body.lower()
        assert "itms-appss://" not in body_lower, (
            "AC1: entry page must not gate access behind a native app install."
        )
        assert "market://details" not in body_lower, (
            "AC1: entry page must not gate access behind a native app install."
        )
    else:
        # Redirect is acceptable (e.g. / -> /login); still counts as reachable.
        assert status_code in (301, 302, 303, 307, 308), (
            f"AC1: unexpected non-200 non-redirect status {status_code}."
        )
