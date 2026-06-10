# Component C6 (Web Ingress) — implements CT8 against the FROZEN contract.
# Traces: R1. LLD (internals) owned here (B8); seam is fixed (B3).
#
# CT8 seam: sync_api, C6 (Web Ingress, caller) <-> C2 (Identity & Auth, provider).
# Web Ingress calls Identity & Auth on each authenticated route to verify a valid
# session before dispatching to a domain component.
#
# LLD internals:
#   - check(request_cookies): extracts session cookie; calls
#     identity_auth.session_checker.check_session via attribute access so the
#     frozen conftest monkeypatch takes effect; returns session dict (authenticated=True)
#     or {"authenticated": False} when absent/expired.
#   - handle_authenticated_request(request_cookies, dispatch_target): calls check();
#     on no valid session OR callee exception → redirects to login entry point, does
#     not dispatch. On valid session → dispatches (flow wired at INTEGRATE).
#   - Honors INV6: synchronous, no async/queue.
#   - Framework-agnostic plain Python at the contract layer (ADR-0002).
#   - MPA/SSR routing entry surface (ADR-0004).
#
# Failure modes (CT8):
#   no-valid-session  — session absent or expired; redirect to login, no dispatch.
#   callee-error      — Identity & Auth raises exception; treat as unauthenticated,
#                       redirect to login, no dispatch.

from __future__ import annotations

from typing import Any

from freelancer_app import identity_auth

# Login entry point URL (OAuth entry surface, ADR-0005).
_LOGIN_URL = "/login"


def check(request_cookies: dict[str, str]) -> dict[str, Any]:
    """
    CT8 surface — verify session presence for an authenticated route.

    Calls Identity & Auth (C2) via CT8 seam:
    identity_auth.session_checker.check_session(cookie_value).

    Access is via the package attribute so the frozen conftest monkeypatch on
    ``freelancer_app.identity_auth.session_checker`` takes effect at call time.

    Parameters
    ----------
    request_cookies : HTTP cookies dict from the incoming request.

    Returns
    -------
    dict — the session object from Identity & Auth (carries at minimum
           ``authenticated=True`` and ``identity_ref``) when the session is
           valid, or ``{"authenticated": False}`` when absent / expired / invalid.
    """
    cookie_value: str | None = request_cookies.get("session")
    session = identity_auth.session_checker.check_session(cookie_value)
    if session is not None:
        return session
    return {"authenticated": False}


def handle_authenticated_request(
    request_cookies: dict[str, str],
    dispatch_target: str,
) -> dict[str, Any]:
    """
    CT8 surface — gate an authenticated route: verify session then dispatch.

    No-valid-session or callee-error → redirect to the OAuth login entry point;
    do not dispatch to any domain component (CT8 failure modes).

    Valid session → dispatch to the target domain component (INTEGRATE wires
    the real dispatch; at the contract layer the dispatch path is not exercised
    by the contract tests).

    Parameters
    ----------
    request_cookies : HTTP cookies dict from the incoming request.
    dispatch_target : Name of the domain component to dispatch to on success.

    Returns
    -------
    dict — on redirect: ``{"redirect": "/login", "dispatched": False}``.
           on dispatch: ``{"dispatched": True, "session": <session_obj>}``
           (real domain dispatch wired at INTEGRATE).
    """
    try:
        session_result = check(request_cookies)
    except Exception:
        # CT8 callee-error: Identity & Auth raised — treat as unauthenticated.
        return {"redirect": _LOGIN_URL, "dispatched": False}

    authenticated = (
        session_result.get("authenticated")
        if isinstance(session_result, dict)
        else getattr(session_result, "authenticated", False)
    )

    if not authenticated:
        # CT8 no-valid-session: redirect to OAuth login entry point, no dispatch.
        return {"redirect": _LOGIN_URL, "dispatched": False}

    # Valid session — dispatch proceeds (domain wiring at INTEGRATE).
    return {"dispatched": True, "session": session_result}
