# Composition root (INTEGRATE) — wires C6->C2->C1 along flow F1 against the
# FROZEN contracts. Traces: R1, R5, AC1, AC5.
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


# URL configuration — the walking-skeleton F1 HTTP entry points only (R1, R5).
# No gold-plating: only routes the flow exercises (Rule 7).
urlpatterns = [
    path("", _view_entry_page, name="entry"),
    path("auth/login", _view_auth_login, name="auth_login"),
    path("auth/callback", _view_auth_callback_safe, name="auth_callback"),
]

# Register URL patterns on the ROOT_URLCONF module (this module).
_this_module = sys.modules[__name__]
_this_module.urlpatterns = urlpatterns

# Override ROOT_URLCONF so Django resolves URLs from this module.
settings.ROOT_URLCONF = __name__

# WSGI entry — the frozen conftest wsgi_app fixture imports this callable:
#   from freelancer_app.wsgi import application
application = get_wsgi_application()
