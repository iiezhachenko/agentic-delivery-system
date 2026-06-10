# FROZEN ORACLE — materialized from AC11 (held-out). Do NOT edit (B4). Red-first: targets unimplemented at freeze.
# AC11 held-out: same property as visible — set label on a project, label stored + renders — but DIFFERENT
# unguessable inputs (project, label, session/freelancer). Gate-only — builder never sees this file.
# Hardcoding the visible case fails here (B7).

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
def client(authenticated_wsgi_app_ho):
    return _Client(authenticated_wsgi_app_ho)


@pytest.fixture
def authenticated_wsgi_app_ho(monkeypatch):
    from freelancer_app.wsgi import application  # red
    monkeypatch.setattr(
        "freelancer_app.identity_auth.session_checker.resolve_session",
        lambda token: {"freelancer_id": "freelancer-7f3a"} if token == "sess-ac11-ho-xk9m" else None,
    )
    return application


def test_ac11_held_out_set_label_persists_and_renders(client):
    """AC11 held-out: set label 'vip-zeta' on project 'Zeta Analytics'; label stored + renders in list."""
    client.request("POST", "/projects", session_token="sess-ac11-ho-xk9m",
                   data={"name": "Zeta Analytics", "client_name": "Zeta GmbH", "client_contact": "z@zeta.de",
                         "client_address": "Hauptstr. 77, Berlin", "currency": "JPY", "billable_rate": "18000"})

    set_resp = client.request("POST", "/projects/zeta-analytics/label",
                              session_token="sess-ac11-ho-xk9m", data={"label": "vip-zeta"})
    assert set_resp["status"] in (200, 201, 302), f"expected 2xx/302, got {set_resp['status']}"

    label_view = client.request("GET", "/projects/zeta-analytics/label", session_token="sess-ac11-ho-xk9m")
    assert label_view["status"] == 200
    assert "vip-zeta" in label_view["body"]
    assert "Zeta Analytics" in label_view["body"]
