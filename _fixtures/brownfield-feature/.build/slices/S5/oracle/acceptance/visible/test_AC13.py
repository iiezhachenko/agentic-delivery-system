# FROZEN ORACLE — materialized from AC13. Do NOT edit (B4). Red-first: targets unimplemented at freeze.
# AC13 (req_ref: R13): after setting a label and navigating away, on return the project's label field
# still holds the same value and remains linked to the same project (persistence across navigation).
# Visible test — builder may see. Hits app WSGI/HTTP entry; framework-agnostic.

import pytest


class _Client:
    def __init__(self, app):
        self._app = app

    def request(self, method, path, session_token=None, data=None):
        environ = {"REQUEST_METHOD": method, "PATH_INFO": path,
                   "HTTP_COOKIE": f"session={session_token}" if session_token else "", "wsgi.input": b""}
        if data:
            import urllib.parse, io
            body = urllib.parse.urlencode(data).encode()
            environ["wsgi.input"] = io.BytesIO(body)
            environ["CONTENT_TYPE"] = "application/x-www-form-urlencoded"
            environ["CONTENT_LENGTH"] = str(len(body))
        responses = []
        def start_response(status, headers):
            responses.append({"status": int(status.split(" ", 1)[0]), "headers": dict(headers)})
        body_iter = self._app(environ, start_response)
        body = b"".join(body_iter)
        responses[0]["body"] = body.decode("utf-8", errors="replace")
        return responses[0]


@pytest.fixture
def client(authenticated_wsgi_app):
    return _Client(authenticated_wsgi_app)


@pytest.fixture
def authenticated_wsgi_app(monkeypatch):
    from freelancer_app.wsgi import application  # red
    monkeypatch.setattr(
        "freelancer_app.identity_auth.session_checker.resolve_session",
        lambda token: {"freelancer_id": "freelancer-42"} if token == "sess-ac13-visible" else None,
    )
    return application


def test_ac13_label_persists_across_navigation(client):
    """AC13: set label 'archived-delta' on 'Delta Co'; navigate away; on return label still holds + linked to same project."""
    client.request("POST", "/projects", session_token="sess-ac13-visible",
                   data={"name": "Delta Co", "client_name": "Delta Ltd", "client_contact": "d@delta.io",
                         "client_address": "9 River Rd", "currency": "USD", "billable_rate": "100.00"})
    client.request("POST", "/projects/delta-co/label", session_token="sess-ac13-visible",
                   data={"label": "archived-delta"})

    # navigate away (hit an unrelated page), then return to the project label view
    client.request("GET", "/projects", session_token="sess-ac13-visible")
    reload_view = client.request("GET", "/projects/delta-co/label", session_token="sess-ac13-visible")

    assert reload_view["status"] == 200
    assert "archived-delta" in reload_view["body"]          # label still holds the same value
    assert "Delta Co" in reload_view["body"]                # remains linked to the same project
