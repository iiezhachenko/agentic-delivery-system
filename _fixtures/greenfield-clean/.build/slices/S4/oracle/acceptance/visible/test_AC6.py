# FROZEN ORACLE — materialized from AC6. Do NOT edit (B4); needing to edit = escape with a diagnosis. Red-first: targets unimplemented at freeze.
# AC6 (req_ref: R6): freelancer creates project (name, client, currency, rate), project appears in list;
# freelancer edits name/rate and deletes project.
# Visible test — builder may see. Hits app WSGI/HTTP entry; framework-agnostic.

import pytest

from freelancer_app.wsgi import application  # does not exist yet — red


# ── helpers ───────────────────────────────────────────────────────────────────

class _Client:
    """Minimal framework-agnostic WSGI test client."""
    def __init__(self, app):
        self._app = app

    def request(self, method, path, session_token=None, data=None):
        environ = {
            "REQUEST_METHOD": method,
            "PATH_INFO": path,
            "HTTP_COOKIE": f"session={session_token}" if session_token else "",
            "wsgi.input": b"",
        }
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
    """App with session pre-seeded for freelancer-42 (AC6 visible input)."""
    from freelancer_app.wsgi import application  # red — does not exist yet
    monkeypatch.setattr(
        "freelancer_app.identity_auth.session_checker.resolve_session",
        lambda token: {"freelancer_id": "freelancer-42"} if token == "sess-ac6-visible" else None,
    )
    return application


# ── AC6 visible test ──────────────────────────────────────────────────────────

def test_ac6_create_project_appears_in_list(client):
    """AC6: freelancer creates project (name=Gamma Design, client=Gamma LLC, currency=GBP, rate=95.00); project appears in list."""
    create_resp = client.request(
        "POST",
        "/projects",
        session_token="sess-ac6-visible",
        data={
            "name": "Gamma Design",
            "client_name": "Gamma LLC",
            "client_contact": "gamma@example.com",
            "client_address": "3 Elm Rd",
            "currency": "GBP",
            "billable_rate": "95.00",
        },
    )
    # project created (2xx or redirect-after-post)
    assert create_resp["status"] in (200, 201, 302), f"expected 2xx/302, got {create_resp['status']}"

    # project appears in freelancer's project list
    list_resp = client.request("GET", "/projects", session_token="sess-ac6-visible")
    assert list_resp["status"] == 200
    assert "Gamma Design" in list_resp["body"]


def test_ac6_edit_project_name_and_rate(client):
    """AC6: freelancer edits existing project name to 'Gamma Redesign' and rate to 110.00; changes persist."""
    # pre-create
    client.request(
        "POST", "/projects",
        session_token="sess-ac6-visible",
        data={"name": "Gamma Design", "client_name": "Gamma LLC", "client_contact": "gamma@example.com",
              "client_address": "3 Elm Rd", "currency": "GBP", "billable_rate": "95.00"},
    )

    list_resp = client.request("GET", "/projects", session_token="sess-ac6-visible")
    assert "Gamma Design" in list_resp["body"]

    # edit — derive project id from list (implementation detail; test uses name-based path)
    edit_resp = client.request(
        "POST",
        "/projects/gamma-design/edit",
        session_token="sess-ac6-visible",
        data={"name": "Gamma Redesign", "billable_rate": "110.00"},
    )
    assert edit_resp["status"] in (200, 302)

    updated_list = client.request("GET", "/projects", session_token="sess-ac6-visible")
    assert "Gamma Redesign" in updated_list["body"]
    assert "110.00" in updated_list["body"] or "110" in updated_list["body"]


def test_ac6_delete_project_removed_from_list(client):
    """AC6: freelancer deletes project; project no longer appears in list."""
    client.request(
        "POST", "/projects",
        session_token="sess-ac6-visible",
        data={"name": "Gamma Design", "client_name": "Gamma LLC", "client_contact": "gamma@example.com",
              "client_address": "3 Elm Rd", "currency": "GBP", "billable_rate": "95.00"},
    )

    del_resp = client.request(
        "POST",
        "/projects/gamma-design/delete",
        session_token="sess-ac6-visible",
    )
    assert del_resp["status"] in (200, 302)

    list_resp = client.request("GET", "/projects", session_token="sess-ac6-visible")
    assert "Gamma Design" not in list_resp["body"]
