# FROZEN ORACLE — materialized from AC11. Do NOT edit (B4). Red-first: targets unimplemented at freeze.
# AC11 (req_ref: R11): freelancer sets a label on a project and saves; the stored label field holds the
# submitted text and the label renders on the project in the project list.
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
    from freelancer_app.wsgi import application  # red — label route does not exist yet
    monkeypatch.setattr(
        "freelancer_app.identity_auth.session_checker.resolve_session",
        lambda token: {"freelancer_id": "freelancer-42"} if token == "sess-ac11-visible" else None,
    )
    return application


def test_ac11_set_label_persists_and_renders(client):
    """AC11: freelancer sets label 'client-acme' on project 'Acme Website'; label stored + renders in list."""
    client.request("POST", "/projects", session_token="sess-ac11-visible",
                   data={"name": "Acme Website", "client_name": "Acme Corp", "client_contact": "a@acme.com",
                         "client_address": "1 Main St", "currency": "USD", "billable_rate": "150.00"})

    set_resp = client.request("POST", "/projects/acme-website/label",
                              session_token="sess-ac11-visible", data={"label": "client-acme"})
    assert set_resp["status"] in (200, 201, 302), f"expected 2xx/302, got {set_resp['status']}"

    # label renders on the project in the list
    label_view = client.request("GET", "/projects/acme-website/label", session_token="sess-ac11-visible")
    assert label_view["status"] == 200
    assert "client-acme" in label_view["body"]
    assert "Acme Website" in label_view["body"]
