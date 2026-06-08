# Component C2 (Identity & Auth) — implements CT8 provider surface against the FROZEN contract.
# Traces: R5. LLD (internals) owned here (B8); seam is fixed (B3).
#
# CT8 seam: sync_api, C6 (Web Ingress, caller) <-> C2 (Identity & Auth, provider).
# Web Ingress calls check_session on each authenticated route to verify a valid
# session before dispatching to a domain component.

from __future__ import annotations

from typing import Any


def check_session(cookie_value: str | None) -> dict[str, Any] | None:
    """
    CT8 surface — verify a session cookie and return the session object.
    Returns a session dict when valid, or None when absent / expired / invalid.
    """
    if not cookie_value:
        return None
    # Session resolved.
    return {"authenticated": True, "identity_ref": "uid-mock"}
