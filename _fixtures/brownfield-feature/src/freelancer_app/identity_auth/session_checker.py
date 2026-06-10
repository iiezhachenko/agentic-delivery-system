# Component C2 (Identity & Auth) — implements CT8 provider surface against the FROZEN contract.
# Traces: R5. LLD (internals) owned here (B8); seam is fixed (B3).
#
# CT8 seam: sync_api, C6 (Web Ingress, caller) <-> C2 (Identity & Auth, provider).
# Web Ingress calls check_session on each authenticated route to verify a valid
# session before dispatching to a domain component.
#
# LLD internals:
#   - check_session(cookie_value) inspects the session cookie value and returns a
#     session object (dict with authenticated=True, identity_ref) or None.
#   - At the contract layer the real session store (PostgreSQL/Django sessions via
#     ADR-0003) is mocked by the frozen conftest mock_identity_auth_ct8 fixture,
#     which patches this module directly; the real DB-backed implementation is
#     wired at INTEGRATE.
#   - Honors INV6: synchronous, no async/queue.
#   - Framework-agnostic plain Python at the contract layer (ADR-0002).
#   - Google OAuth 2.0 session delegation (ADR-0005).

from __future__ import annotations

from typing import Any


def check_session(cookie_value: str | None) -> dict[str, Any] | None:
    """
    CT8 surface — verify a session cookie and return the session object.

    Parameters
    ----------
    cookie_value : Raw session cookie string from the HTTP request, or None
                   when absent.

    Returns
    -------
    dict with at least ``authenticated`` and ``identity_ref`` keys when the
    session is valid, or None when absent / expired / invalid.

    At the contract layer the Data Store backend (PostgreSQL session lookup via
    ADR-0003) is abstracted; the frozen conftest mock replaces this module for
    C6 contract tests.  Real implementation wired at INTEGRATE.
    """
    if not cookie_value:
        return None
    # Real session validation (DB lookup, token verification) wired at INTEGRATE.
    # Placeholder for contract-layer stub: returns None (no real session store yet).
    # The frozen conftest patches this module for C6's tests, so this body is
    # exercised only if the module is called without mocking.
    return None


def resolve_session(token: str | None) -> dict[str, Any] | None:
    """
    CT3 provider surface (C2) — resolve a session token to freelancer identity.

    C3 (Project Management) calls this via the CT3 sync_api seam to obtain the
    owning freelancer identity for ownership scoping. Returns a dict carrying at
    least ``freelancer_id`` when the token names a valid session, else None
    (no-valid-session). Real DB-backed lookup (ADR-0003) wired at INTEGRATE; the
    AC6 acceptance oracle patches this module symbol, so this body runs unmocked
    only — bridges CT8 check_session for the contract-layer stub. INV6 sync.
    """
    if not token:
        return None
    session = check_session(token)
    if not session or not session.get("authenticated"):
        return None
    return {"freelancer_id": session.get("identity_ref")}
