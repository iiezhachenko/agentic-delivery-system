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

class _IdentityAuthAdapter:
    """Adapter: exposes resolve_session() (CT3 shape) over real C2 session_checker (CT8 shape).
    CT3 contract: resolve_session(request_context) -> identity dict or None.
    Bridges CT8 check_session(cookie_value) to the CT3 interface C3's SessionResolver expects.
    Composition wiring — not a component rewrite (B8).
    """

    def resolve_session(self, request_context: dict) -> dict | None:
        cookie_value = request_context.get("session_token")
        return session_gate.check({"session": cookie_value} if cookie_value else {})


class _ProjectManagementAdapter:
    """Adapter: exposes handle_request(request) (CT9 shape) by composing real C3 internals.
    Wires SessionResolver (CT3) + ProjectStore (CT2) for HTTP project CRUD requests.
    Composition wiring — not a component rewrite (B8).
    """

    def __init__(self, identity_auth_adapter: _IdentityAuthAdapter) -> None:
        self._session_resolver = _session_resolver_mod.SessionResolver(identity_auth_adapter)
        # Data Store bound via module reference — real C1 at runtime.
        self._project_store = None  # bound lazily: import avoids circular at module load

    def handle_request(self, request: dict) -> dict:
        # Resolve session (CT3); UnauthorizedError propagates to dispatcher.
        from freelancer_app.project_management.project_store import ProjectStore
        from freelancer_app.data_store import identity_record_store as _ids
        _store = ProjectStore(_ids)

        session_ctx = {"session_token": request.get("session_token")}
        identity = self._session_resolver.resolve(session_ctx)

        method = request.get("method", "GET").upper()
        owner_id = identity["freelancer_id"]

        if method == "POST" and request.get("path", "").rstrip("/") in ("/projects", "/projects/"):
            body = request.get("body", {})
            record = _store.create({"name": body.get("name"), "owner_id": owner_id,
                                    "client": body.get("client_name"),
                                    "currency": body.get("currency"),
                                    "billable_rate": body.get("billable_rate")})
            return {"status": 201, "project": record, "body": "", "content_type": "text/html"}
        elif method == "GET" and request.get("path", "").rstrip("/") in ("/projects", "/projects/"):
            projects = _store.list(owner_id)
            body_html = "<html><body>" + "".join(
                f"<li>{p.get('name','')}</li>" for p in projects
            ) + "</body></html>"
            return {"status": 200, "body": body_html, "content_type": "text/html", "projects": projects}
        else:
            return {"status": 200, "body": "<html><body></body></html>", "content_type": "text/html"}


_identity_auth_adapter = _IdentityAuthAdapter()
_project_mgmt_adapter = _ProjectManagementAdapter(_identity_auth_adapter)


def _view_project_management(request):
    """
    /projects/* — F4 CT9 dispatch: authenticated project CRUD.
    Calls dispatch_project_request with real C3 adapter; honors CT3/CT2 failure modes.
    Additive route; does not touch F1 skeleton routes (H14).
    """
    from freelancer_app.project_management.exceptions import UnauthorizedError, NotFoundError
    req_dict = {
        "method": request.method,
        "path": request.path,
        "session_token": request.COOKIES.get("session"),
        "body": {},
    }
    if request.method == "POST":
        import json as _json
        try:
            req_dict["body"] = _json.loads(request.body or b"{}")
        except Exception:
            req_dict["body"] = {}

    result = dispatch_project_request(
        request=req_dict,
        project_management=_project_mgmt_adapter,
        identity_auth=_identity_auth_adapter,
    )
    status = result.get("status", 200)
    location = result.get("location")
    if location:
        return HttpResponseRedirect(location)
    return HttpResponse(result.get("body", ""), content_type=result.get("content_type", "text/html"),
                        status=status)


# URL configuration — F1 skeleton (frozen) + F4 slice S4 additive routes.
# Skeleton routes not edited; S4 routes appended only (H14, delta Rule 3). Traces: R1, R5, R4, R6, R9, R10.
urlpatterns = [
    path("", _view_entry_page, name="entry"),
    path("auth/login", _view_auth_login, name="auth_login"),
    path("auth/callback", _view_auth_callback_safe, name="auth_callback"),
    # S4 additive routes — F4 CT9 dispatch (R4, R6, R9, R10, AC6).
    path("projects", _view_project_management, name="projects_list"),
    path("projects/", _view_project_management, name="projects_list_slash"),
]

# Register URL patterns on the ROOT_URLCONF module (this module).
_this_module = sys.modules[__name__]
_this_module.urlpatterns = urlpatterns

# Override ROOT_URLCONF so Django resolves URLs from this module.
settings.ROOT_URLCONF = __name__

# WSGI entry — the frozen conftest wsgi_app fixture imports this callable:
#   from freelancer_app.wsgi import application
application = get_wsgi_application()
