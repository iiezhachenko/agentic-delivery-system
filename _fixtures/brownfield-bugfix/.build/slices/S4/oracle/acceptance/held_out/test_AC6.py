# FROZEN ORACLE — materialized from AC6 (held-out). Do NOT edit (B4); needing to edit = escape with a diagnosis. Red-first: targets unimplemented at freeze.
# AC6 held-out: same property as visible test — freelancer creates/edits/deletes project — but
# uses DIFFERENT, unguessable inputs (project name, client, currency, rate, session token).
# Gate-only — builder never sees this file. Hardcoding the visible case fails here (B7).

import pytest

from freelancer_app.wsgi import application  # does not exist yet — red


# ── helpers (same framework-agnostic client as visible) ──────────────────────

class _Client:
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
def client(authenticated_wsgi_app_ho):
    return _Client(authenticated_wsgi_app_ho)


@pytest.fixture
def authenticated_wsgi_app_ho(monkeypatch):
    """App with session pre-seeded for held-out freelancer identity (different from visible)."""
    from freelancer_app.wsgi import application  # red
    # Unguessable session token + freelancer id distinct from visible test
    monkeypatch.setattr(
        "freelancer_app.identity_auth.session_checker.resolve_session",
        lambda token: {"freelancer_id": "freelancer-7f3a"} if token == "sess-ac6-ho-xk9m" else None,
    )
    return application


# ── AC6 held-out test — different unguessable inputs ─────────────────────────

def test_ac6_held_out_create_project_appears_in_list(client):
    """AC6 held-out: freelancer creates project (name=Zeta Analytics, client=Zeta GmbH, currency=JPY, rate=18000); project appears in list."""
    create_resp = client.request(
        "POST",
        "/projects",
        session_token="sess-ac6-ho-xk9m",
        data={
            "name": "Zeta Analytics",
            "client_name": "Zeta GmbH",
            "client_contact": "zeta@zeta.de",
            "client_address": "Hauptstr. 77, Berlin",
            "currency": "JPY",
            "billable_rate": "18000",
        },
    )
    assert create_resp["status"] in (200, 201, 302), f"expected 2xx/302, got {create_resp['status']}"

    list_resp = client.request("GET", "/projects", session_token="sess-ac6-ho-xk9m")
    assert list_resp["status"] == 200
    assert "Zeta Analytics" in list_resp["body"]


def test_ac6_held_out_edit_project_name_and_rate(client):
    """AC6 held-out: freelancer edits project name to 'Zeta Analytics Pro' and rate to 20000; changes persist."""
    client.request(
        "POST", "/projects",
        session_token="sess-ac6-ho-xk9m",
        data={"name": "Zeta Analytics", "client_name": "Zeta GmbH", "client_contact": "zeta@zeta.de",
              "client_address": "Hauptstr. 77, Berlin", "currency": "JPY", "billable_rate": "18000"},
    )

    edit_resp = client.request(
        "POST",
        "/projects/zeta-analytics/edit",
        session_token="sess-ac6-ho-xk9m",
        data={"name": "Zeta Analytics Pro", "billable_rate": "20000"},
    )
    assert edit_resp["status"] in (200, 302)

    updated_list = client.request("GET", "/projects", session_token="sess-ac6-ho-xk9m")
    assert "Zeta Analytics Pro" in updated_list["body"]
    assert "20000" in updated_list["body"]


def test_ac6_held_out_delete_project_removed_from_list(client):
    """AC6 held-out: freelancer deletes project; project no longer in list."""
    client.request(
        "POST", "/projects",
        session_token="sess-ac6-ho-xk9m",
        data={"name": "Zeta Analytics", "client_name": "Zeta GmbH", "client_contact": "zeta@zeta.de",
              "client_address": "Hauptstr. 77, Berlin", "currency": "JPY", "billable_rate": "18000"},
    )

    del_resp = client.request(
        "POST",
        "/projects/zeta-analytics/delete",
        session_token="sess-ac6-ho-xk9m",
    )
    assert del_resp["status"] in (200, 302)

    list_resp = client.request("GET", "/projects", session_token="sess-ac6-ho-xk9m")
    assert "Zeta Analytics" not in list_resp["body"]
