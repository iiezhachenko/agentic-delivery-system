# PLANTED DEFECT (regression / BF4) — overlay → src/freelancer_app/wsgi.py
# Repair fixes the null rate (OREPRO-1 flips green) BUT production _ProjectManagementAdapter._render
# drops the float() coercion, so a rated project ('95.00' string from form POST) hits f"{str:.2f}" →
# ValueError → GET /projects 500s. Baseline-green AC6 (create+list rated projects) goes RED.
# Regression guard breached (BF4). VERIFY-OUTPUT MUST block: regression.verdict red on AC6.
# Golden _render keeps float() — rated render stays green.
#
# Composition root (INTEGRATE) — wires C6->C2->C1 along flow F1 (S1) and
# C6->C3->C2->C1 along flow F4 (S4) against the FROZEN contracts.
# Traces: R1, R5, R4, R6, R9, R10, AC1, AC5, AC6.
# Composition LLD owned here (B8); component internals are IMPLEMENT's (§5.5);
# seams fixed (B3).
#
# Framework: Django (ADR-0002 — Python/Django stack; carried from build-record
# lld_notes, not re-picked here). WSGI entry: freelancer_app.wsgi.application.
#
# Routing (MPA/SSR, ADR-0004):
#   GET /              — entry page (AC1: app reachable, renders non-empty HTML)
#   GET /auth/login    — OAuth initiation: redirect to provider (ADR-0005, AC5 step 1)
#   GET /auth/callback — OAuth callback: exchange code via oauth_provider seam
#                        (mock_oauth_provider patches freelancer_app.identity_auth.oauth_provider),
#                        persist identity (C2->C1 via CT1), establish session cookie.
#                        CT1:store-unavailable propagates -> no session cookie ->
#                        redirect to /auth/login?error=store_unavailable (failure path).
#
# Seam wiring:
#   C6->C2 (CT8): session_gate.check() called on authenticated routes.
#   C2->C1 (CT1): oauth_callback.handle_callback() calls data_store.identity_record_store.save_identity().
#   external boundary: oauth_provider.exchange_code() — frozen conftest mock_oauth_provider patches this.
#   later-slice deps (CT9/CT10/CT11): C3/C4/C5 stay mocked via frozen conftest; not wired here.
#
# Synchronous, no async/queue (INV6). Single-server (ADR-0001).

from __future__ import annotations

import os
import sys

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "freelancer_app._settings")

import django
from django.conf import settings

if not settings.configured:
    settings.configure(
        DEBUG=True,
        SECRET_KEY="integrate-skeleton-s1-not-for-production",
        ALLOWED_HOSTS=["*"],
        INSTALLED_APPS=[],
        MIDDLEWARE=[],
        DATABASES={},
        SILENCED_SYSTEM_CHECKS=["*"],
        ROOT_URLCONF="freelancer_app._urls",
        TEMPLATES=[
            {
                "BACKEND": "django.template.backends.django.DjangoTemplates",
                "DIRS": [],
                "APP_DIRS": False,
                "OPTIONS": {"context_processors": []},
            }
        ],
    )

django.setup()

from django.core.wsgi import get_wsgi_application

# Import real on-path components (C2, C1 are real; wired here at INTEGRATE).
from freelancer_app.identity_auth import oauth_callback
from freelancer_app import identity_auth  # for oauth_provider seam access
from freelancer_app.web_ingress import session_gate

# S4 slice: C3 real components and CT9 dispatcher.
from freelancer_app.web_ingress.dispatcher import dispatch_project_request
from freelancer_app.project_management import project_store as _project_store_mod
from freelancer_app.project_management import session_resolver as _session_resolver_mod
from freelancer_app.data_store import identity_record_store as _identity_record_store


# ---------------------------------------------------------------------------
# URL routing — maps F1 flow HTTP entry points onto real component callables.
# Defined before get_wsgi_application() triggers URL resolution.
# ---------------------------------------------------------------------------

from django.http import HttpResponse, HttpResponseRedirect
from django.urls import path


def _view_entry_page(request):
    """
    GET / — AC1: application reachable over HTTP, renders entry page (MPA/SSR).
    Checks session via C6 (CT8 seam); renders login link or authenticated landing.
    """
    cookies = dict(request.COOKIES)
    session_result = session_gate.check(cookies)
    authenticated = (
        isinstance(session_result, dict) and session_result.get("authenticated")
    )

    if authenticated:
        body = (
            b"<html><body><h1>Freelancer Time Tracker</h1>"
            b"<p>Welcome! You are signed in.</p>"
            b"<a href=\"/auth/login\">Sign in</a></body></html>"
        )
    else:
        body = (
            b"<html><body><h1>Freelancer Time Tracker</h1>"
            b"<p>Please sign in to continue.</p>"
            b"<a href=\"/auth/login\">Sign in with Google</a></body></html>"
        )
    return HttpResponse(body, content_type="text/html; charset=utf-8", status=200)


def _view_auth_login(request):
    """
    GET /auth/login — AC5 step 1: OAuth initiation.
    Redirects to OAuth provider (ADR-0005 Google OAuth 2.0).
    The external oauth_provider seam is patched by the frozen conftest mock.
    At walking-skeleton level: redirect to provider authorization URL stub.
    """
    # OAuth initiation: redirect to Google OAuth authorization endpoint.
    # At walking-skeleton level the real OAuth URL is not yet configured;
    # redirect to the stub authorization endpoint (later slices configure credentials).
    # The test asserts status in (200, 301, 302, 303, 307, 308) — any of these pass.
    oauth_auth_url = "https://accounts.google.com/o/oauth2/v2/auth?client_id=skeleton&response_type=code&scope=openid+email+profile&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fauth%2Fcallback&state=skeleton-state"
    return HttpResponseRedirect(oauth_auth_url)


def _view_auth_callback(request):
    """
    GET /auth/callback?code=...&state=... — AC5 step 2: OAuth callback.

    Wires the real path: C6 (Web Ingress) -> C2 (Identity & Auth) -> C1 (Data Store).
    1. Extract code from query string.
    2. Call identity_auth.oauth_provider.exchange_code(code) — external seam;
       frozen conftest mock_oauth_provider patches freelancer_app.identity_auth.oauth_provider.
    3. Call oauth_callback.handle_callback(provider, provider_id, profile_ref) — C2->C1 (CT1).
    4a. Success: set Set-Cookie: session=<provider_id>; redirect to / (session established).
    4b. CT1:store-unavailable (ConnectionError): no session cookie; redirect to
        /auth/login?error=store_unavailable (failure path satisfied).

    Failure path: CT1:store-unavailable propagates from handle_callback -> no session ->
    redirect to login entry point with error (flow failure_path.arrives_at).
    """
    code = request.GET.get("code", "")
    # Call external oauth_provider seam — patched by frozen conftest mock_oauth_provider
    # at freelancer_app.identity_auth.oauth_provider.
    token_data = identity_auth.oauth_provider.exchange_code(code)

    provider = token_data.get("provider", "google")
    provider_id = token_data.get("provider_id", "")
    profile_ref = token_data.get("profile", {})

    # C2->C1 (CT1): persist identity record; propagates ConnectionError on store-unavailable.
    oauth_callback.handle_callback(
        provider=provider,
        provider_id=provider_id,
        profile_ref=profile_ref,
    )

    # Success: session established — set session cookie, redirect to app.
    response = HttpResponseRedirect("/")
    # Set session cookie (AC5: session established; no password entry required).
    response.set_cookie(
        "session",
        value=provider_id,
        httponly=True,
        samesite="Lax",
    )
    return response


def _view_auth_callback_safe(request):
    """
    Wrapper that handles CT1:store-unavailable (ConnectionError) from handle_callback.
    No session cookie set; redirects to login entry point with error indicator.
    """
    try:
        return _view_auth_callback(request)
    except ConnectionError:
        # CT1:store-unavailable — cannot persist identity; no session established.
        # Redirect to login entry point with error (failure_path.arrives_at).
        return HttpResponseRedirect("/auth/login?error=store_unavailable")
    except Exception:
        # Other errors: surface as 500 (signals failure; no session cookie).
        return HttpResponse(
            b"<html><body><p>Authentication error. Please try again.</p></body></html>",
            content_type="text/html; charset=utf-8",
            status=500,
        )


# ---------------------------------------------------------------------------
# S4 slice composition — F4 flow: C6->C3->C2->C1 (CT9/CT3/CT2).
# Additive routes only — skeleton F1 routes above are frozen (B4/H14).
# Traces: R4, R6, R9, R10, AC6.
# ---------------------------------------------------------------------------

from freelancer_app.identity_auth import session_checker as _session_checker
from freelancer_app.project_management.exceptions import NotFoundError as _NotFoundError


def _project_slug(name: str) -> str:
    # Project id = slug(name): lowercase, spaces->hyphens. Stable handle for edit/delete routes.
    return (name or "").strip().lower().replace(" ", "-")


class _InProcessProjectDataStore:
    """Real C1 project persistence (in-process; no DB configured yet, ADR-0003 wires PostgreSQL later).
    Owner-scoped CRUD over project records (E2/E5/E6/E7) = the CT2 data-store surface ProjectStore
    delegates to. Composition runtime store (B8); component internals untouched. INV6 synchronous.
    """

    def __init__(self) -> None:
        self._by_owner: dict = {}  # owner_id -> { project_id -> record }

    def create_project(self, payload: dict) -> dict:
        record = dict(payload)
        self._by_owner.setdefault(record.get("owner_id"), {})[record.get("id")] = record
        return record

    def list_projects(self, owner_id: str) -> list:
        return list(self._by_owner.get(owner_id, {}).values())

    def get_project(self, project_id: str, owner_id: str) -> dict:
        owned = self._by_owner.get(owner_id, {})
        if project_id not in owned:
            raise _NotFoundError(f"project {project_id} not found for owner")
        return owned[project_id]

    def update_project(self, project_id: str, owner_id: str, payload: dict) -> dict:
        owned = self._by_owner.get(owner_id, {})
        if project_id not in owned:
            raise _NotFoundError(f"project {project_id} not found for owner")
        owned[project_id].update({k: v for k, v in payload.items() if v is not None})
        return owned[project_id]

    def delete_project(self, project_id: str, owner_id: str) -> None:
        self._by_owner.get(owner_id, {}).pop(project_id, None)


class _IdentityAuthAdapter:
    """Adapter: exposes resolve_session() (CT3 shape) over real C2 session_checker (CT3 provider surface).
    CT3 contract: resolve_session(request_context) -> identity dict or None.
    Composition wiring — not a component rewrite (B8); calls the C2 module symbol so the auth seam stays patchable.
    """

    def resolve_session(self, request_context: dict) -> dict | None:
        token = request_context.get("session_token")
        return _session_checker.resolve_session(token)


class _ProjectManagementAdapter:
    """Adapter: exposes handle_request(request) (CT9 shape) by composing real C3 internals.
    Wires SessionResolver (CT3) + ProjectStore (CT2, over the in-process data store) for HTTP project CRUD.
    Composition wiring — not a component rewrite (B8).
    """

    def __init__(self, identity_auth_adapter: _IdentityAuthAdapter) -> None:
        from freelancer_app.project_management.project_store import ProjectStore
        self._session_resolver = _session_resolver_mod.SessionResolver(identity_auth_adapter)
        self._project_store = ProjectStore(_PROJECT_DATA_STORE)  # real C1 project persistence

    def _render(self, projects: list) -> str:
        # AC11/R11: null billable_rate renders as em-dash; no numeric format applied to None
        def _rate_str(rate):
            if rate is None:
                return "—"  # em-dash '—'
            # PLANTED DEFECT (regression / BF4) — float() coercion dropped from the rated path.
            return f"{rate:.2f}/hr"  # string rate '95.00' → "Unknown format code 'f' for str" → AC6 500s
        items = "".join(
            f"<li>{p.get('name','')} — {p.get('currency','')} {_rate_str(p.get('billable_rate'))}</li>"
            for p in projects
        )
        return f"<html><body><ul>{items}</ul></body></html>"

    def handle_request(self, request: dict) -> dict:
        # Resolve session (CT3); UnauthorizedError propagates to dispatcher (→302 sign-in).
        identity = self._session_resolver.resolve({"session_token": request.get("session_token")})
        owner_id = identity["freelancer_id"]

        method = request.get("method", "GET").upper()
        parts = [p for p in request.get("path", "").split("/") if p]  # e.g. ["projects","gamma-design","edit"]
        body = request.get("body", {})
        store = self._project_store

        if parts == ["projects"]:
            if method == "POST":
                name = body.get("name", "")
                record = store.create({"id": _project_slug(name), "owner_id": owner_id, "name": name,
                                       "client": body.get("client_name"), "currency": body.get("currency"),
                                       "billable_rate": body.get("billable_rate")})
                return {"status": 201, "project": record, "body": self._render([record]), "content_type": "text/html"}
            projects = store.list(owner_id)
            return {"status": 200, "body": self._render(projects), "content_type": "text/html", "projects": projects}
        if len(parts) == 3 and parts[0] == "projects" and method == "POST" and parts[2] in ("edit", "delete"):
            if parts[2] == "edit":
                store.update(parts[1], owner_id, {"name": body.get("name"), "billable_rate": body.get("billable_rate")})
            else:
                store.delete(parts[1], owner_id)
            return {"status": 302, "body": "", "content_type": "text/html", "location": "/projects"}
        return {"status": 200, "body": "<html><body></body></html>", "content_type": "text/html"}


_PROJECT_DATA_STORE = _InProcessProjectDataStore()  # module singleton — persists across requests (INV6 single-server)
_identity_auth_adapter = _IdentityAuthAdapter()
_project_mgmt_adapter = _ProjectManagementAdapter(_identity_auth_adapter)


def _view_project_management(request, **kwargs):
    """
    /projects, /projects/<slug>/edit, /projects/<slug>/delete — F4 CT9 dispatch: authenticated project CRUD.
    Parses the form-encoded body, calls dispatch_project_request with the real C3 adapter; honors CT3/CT2 failure modes.
    Additive route; does not touch F1 skeleton routes (H14).
    """
    req_dict = {
        "method": request.method,
        "path": request.path,
        "session_token": request.COOKIES.get("session"),
        "body": dict(request.POST.items()) if request.method == "POST" else {},
    }
    result = dispatch_project_request(
        request=req_dict,
        project_management=_project_mgmt_adapter,
        identity_auth=_identity_auth_adapter,
    )
    location = result.get("location")
    if location:
        return HttpResponseRedirect(location)
    return HttpResponse(result.get("body", ""), content_type=result.get("content_type", "text/html"),
                        status=result.get("status", 200))


# URL configuration — F1 skeleton (frozen) + F4 slice S4 additive routes.
# Skeleton routes not edited; S4 routes appended only (H14, delta Rule 3). Traces: R1, R5, R4, R6, R9, R10.
urlpatterns = [
    path("", _view_entry_page, name="entry"),
    path("auth/login", _view_auth_login, name="auth_login"),
    path("auth/callback", _view_auth_callback_safe, name="auth_callback"),
    # S4 additive routes — F4 CT9 dispatch (R4, R6, R9, R10, AC6).
    path("projects", _view_project_management, name="projects_list"),
    path("projects/", _view_project_management, name="projects_list_slash"),
    path("projects/<slug:slug>/edit", _view_project_management, name="projects_edit"),
    path("projects/<slug:slug>/delete", _view_project_management, name="projects_delete"),
]

# Register URL patterns on the ROOT_URLCONF module (this module).
_this_module = sys.modules[__name__]
_this_module.urlpatterns = urlpatterns

# Override ROOT_URLCONF so Django resolves URLs from this module.
settings.ROOT_URLCONF = __name__

# WSGI entry — the frozen conftest wsgi_app fixture imports this callable:
#   from freelancer_app.wsgi import application
application = get_wsgi_application()


# ---------------------------------------------------------------------------
# Test-entry seam — create_app (OREPRO-1 / AC11 / R11)
# Imported by frozen conftest's client fixture (delta Rule 3 / BF4).
# Minimal factory: accepts contract-level mocks (project_store, identity_auth),
# returns AppHandle with .test_client() → _TestClient.
# Touches NO production/CRUD path; only wires injection into the adapter for test use.
# ---------------------------------------------------------------------------

class _TestResponse:
    """Thin response wrapper — .status_code + .text + .get_data(as_text)."""
    def __init__(self, status_code: int, body: str):
        self.status_code = status_code
        self.text = body

    def get_data(self, as_text: bool = False) -> str:
        return self.text if as_text else self.text.encode("utf-8")


class _TestClient:
    """Framework-agnostic WSGI test client for injection-seam app."""
    def __init__(self, wsgi_callable):
        self._app = wsgi_callable

    def get(self, path: str, headers: dict | None = None) -> _TestResponse:
        import io
        environ = {
            "REQUEST_METHOD": "GET",
            "PATH_INFO": path,
            "QUERY_STRING": "",
            "HTTP_COOKIE": "",
            "wsgi.input": io.BytesIO(b""),
            "wsgi.errors": io.BytesIO(),
            "wsgi.multithread": False,
            "wsgi.multiprocess": False,
            "wsgi.run_once": False,
            "wsgi.url_scheme": "http",
            "SERVER_NAME": "localhost",
            "SERVER_PORT": "80",
            "HTTP_HOST": "localhost",
        }
        # Inject Cookie header from headers dict (handles "Cookie: session=..." style)
        if headers:
            for key, val in headers.items():
                k_upper = key.upper().replace("-", "_")
                if k_upper == "COOKIE":
                    # Extract cookie value (strip "Path=/..." trailing segments)
                    cookie_part = val.split(";")[0].strip()
                    environ["HTTP_COOKIE"] = cookie_part
                else:
                    environ[f"HTTP_{k_upper}"] = val
        responses: list = []
        def start_response(status, resp_headers, exc_info=None):
            responses.append({"status": int(status.split(" ", 1)[0]), "headers": dict(resp_headers)})
        body_iter = self._app(environ, start_response)
        body_bytes = b"".join(body_iter)
        status_code = responses[0]["status"] if responses else 500
        return _TestResponse(status_code, body_bytes.decode("utf-8", errors="replace"))


class _AppHandle:
    """Returned by create_app — holds injected-mock WSGI app and vends test client."""
    def __init__(self, wsgi_callable):
        self._wsgi = wsgi_callable

    def test_client(self) -> _TestClient:
        return _TestClient(self._wsgi)


def create_app(project_store=None, identity_auth=None):
    """Test-entry seam (OREPRO-1/AC11/R11).
    Builds a WSGI app wired with injected contract-level mocks:
      project_store: mock with .list(owner_id) → list of project dicts (CT2 shape)
      identity_auth: mock with .resolve_session(token) → identity dict or None (CT3 shape)
    Returns _AppHandle; call .test_client() to get a _TestClient.
    Does NOT touch production singleton adapters; builds isolated app closure.
    """
    # Build isolated adapter with injected mocks (not the module-level singletons)
    class _InjectedProjectMgmtAdapter:
        """Adapter scoped to create_app call — uses injected mocks, not production singletons."""
        def _render(self, projects: list) -> str:
            # Same null-safe render as _ProjectManagementAdapter._render (AC11/R11)
            def _rate_str(rate):
                if rate is None:
                    return "—"
                return f"{float(rate):.2f}/hr"
            items = "".join(
                f"<li>{p.get('name','')} — {p.get('currency','')} {_rate_str(p.get('billable_rate'))}</li>"
                for p in projects
            )
            return f"<html><body><ul>{items}</ul></body></html>"

        def handle_request(self, request: dict) -> dict:
            # CT3: resolve session from injected identity_auth mock
            token = request.get("session_token")
            identity = identity_auth.resolve_session(token) if identity_auth else None
            if not identity:
                return {"status": 302, "body": "", "content_type": "text/html", "location": "/auth/login"}
            owner_id = identity["freelancer_id"]
            method = request.get("method", "GET").upper()
            parts = [p for p in request.get("path", "").split("/") if p]
            if parts == ["projects"] and method == "GET":
                # CT2: list from injected project_store mock
                projects = project_store.list(owner_id) if project_store else []
                return {"status": 200, "body": self._render(projects), "content_type": "text/html", "projects": projects}
            return {"status": 200, "body": "<html><body></body></html>", "content_type": "text/html"}

    _injected_mgmt = _InjectedProjectMgmtAdapter()

    def _injected_view_project_management(request):
        req_dict = {
            "method": request.method,
            "path": request.path,
            "session_token": request.COOKIES.get("session"),
            "body": dict(request.POST.items()) if request.method == "POST" else {},
        }
        result = _injected_mgmt.handle_request(req_dict)
        location = result.get("location")
        if location:
            return HttpResponseRedirect(location)
        return HttpResponse(result.get("body", ""), content_type=result.get("content_type", "text/html"),
                            status=result.get("status", 200))

    # Build isolated URL conf for this test app
    from django.urls import path as _path
    injected_urlpatterns = [
        _path("projects", _injected_view_project_management, name="inj_projects_list"),
        _path("projects/", _injected_view_project_management, name="inj_projects_list_slash"),
    ]

    # Wire a fresh WSGI handler for isolated URL dispatch
    from django.core.handlers.wsgi import WSGIHandler
    from django.urls.resolvers import URLResolver, RoutePattern

    def _injected_wsgi(environ, start_response):
        # Temporarily override ROOT_URLCONF to isolated patterns
        import threading
        _orig = settings.ROOT_URLCONF
        # Use django's get_wsgi_application pattern but with isolated urlconf
        # Simplest: use Django's test request factory via the existing application
        # but monkeypatch the view for /projects only.
        # Cleaner: implement tiny WSGI directly for the test surface.
        path_info = environ.get("PATH_INFO", "/")
        method = environ.get("REQUEST_METHOD", "GET").upper()
        cookie_str = environ.get("HTTP_COOKIE", "")
        # Parse cookies
        cookies = {}
        for part in cookie_str.split(";"):
            part = part.strip()
            if "=" in part:
                k, v = part.split("=", 1)
                cookies[k.strip()] = v.strip()
        session_token = cookies.get("session")
        if path_info.rstrip("/") == "/projects" and method == "GET":
            req_dict = {
                "method": "GET",
                "path": "/projects",
                "session_token": session_token,
                "body": {},
            }
            result = _injected_mgmt.handle_request(req_dict)
            location = result.get("location")
            if location:
                status_line = "302 Found"
                resp_headers = [("Location", location), ("Content-Type", "text/html")]
                start_response(status_line, resp_headers)
                return [b""]
            body = (result.get("body") or "").encode("utf-8")
            status_code = result.get("status", 200)
            start_response(f"{status_code} OK", [("Content-Type", "text/html; charset=utf-8"),
                                                  ("Content-Length", str(len(body)))])
            return [body]
        # fallthrough: 404
        start_response("404 Not Found", [("Content-Type", "text/html")])
        return [b"<html><body>Not Found</body></html>"]

    return _AppHandle(_injected_wsgi)
