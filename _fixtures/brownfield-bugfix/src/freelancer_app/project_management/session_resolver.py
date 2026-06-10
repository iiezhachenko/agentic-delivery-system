# Component C3 (Project Management) — implements CT3 (caller→C2) against FROZEN contract. Traces: R5, R6. LLD (internals) owned here (B8); seam is fixed (B3).
#
# CT3: sync_api seam — C3 calls C2 (Identity & Auth) to resolve authenticated session
# and obtain freelancer identity (E1 ref) for ownership scoping.
# Failure modes per CT3 contract:
#   no-valid-session → UnauthorizedError (C2 returned None; raise before any project op)
#   callee-error     → SessionResolutionError (C2 raised RuntimeError; wrap + raise)
# Framework-agnostic plain Python at contract layer (ADR-0002). Synchronous, no async (INV6).

from __future__ import annotations

from typing import Any

from freelancer_app.project_management.exceptions import (
    SessionResolutionError,
    UnauthorizedError,
)


class SessionResolver:
    """CT3 surface — resolve current request session to freelancer identity for ownership scoping."""

    def __init__(self, identity_auth: Any) -> None:
        # identity_auth: C2 IdentityAuth instance (real or frozen-conftest mock).
        self._auth = identity_auth

    def resolve(self, request_context: dict[str, Any]) -> dict[str, Any]:
        """
        Resolve session to freelancer identity.

        CT3 failure modes:
        - no-valid-session: C2 returns None → raise UnauthorizedError (no project op)
        - callee-error: C2 raises any exception → wrap in SessionResolutionError (no project op)

        Returns identity dict with at minimum {"freelancer_id": ..., "provider": ...}.
        """
        try:
            identity = self._auth.resolve_session(request_context)
        except Exception as exc:
            # CT3 callee-error: C2 raised during resolution; cannot determine ownership.
            raise SessionResolutionError(f"Session resolution failed: {exc}") from exc

        if identity is None:
            # CT3 no-valid-session: no authenticated identity; reject before any project op.
            raise UnauthorizedError("No authenticated session — request rejected")

        return identity
