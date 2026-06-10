# FROZEN ORACLE — materialized from AC13 (held-out). Do NOT edit (B4). Red-first: targets unimplemented at freeze.
# AC13 held-out: same persist-across-navigation property — but DIFFERENT unguessable inputs (project, label,
# session/freelancer). Gate-only — builder never sees this file. Hardcoding the visible case fails here (B7).

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
        lambda token: {"freelancer_id": "freelancer-c4e1"} if token == "sess-ac13-ho-qp7w" else None,
    )
    return application


def test_ac13_held_out_label_persists_across_navigation(client):
    """AC13 held-out: set label 'lead-omega' on 'Omega Ltd'; navigate away; on return label still holds + linked."""
    client.request("POST", "/projects", session_token="sess-ac13-ho-qp7w",
                   data={"name": "Omega Ltd", "client_name": "Omega SA", "client_contact": "o@omega.fr",
                         "client_address": "12 Rue Lafayette, Paris", "currency": "EUR", "billable_rate": "130.00"})
    client.request("POST", "/projects/omega-ltd/label", session_token="sess-ac13-ho-qp7w",
                   data={"label": "lead-omega"})

    client.request("GET", "/projects", session_token="sess-ac13-ho-qp7w")
    reload_view = client.request("GET", "/projects/omega-ltd/label", session_token="sess-ac13-ho-qp7w")

    assert reload_view["status"] == 200
    assert "lead-omega" in reload_view["body"]
    assert "Omega Ltd" in reload_view["body"]
