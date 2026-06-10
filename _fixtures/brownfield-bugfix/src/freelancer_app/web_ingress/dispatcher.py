# Component C3 (Project Management) — additive seam for CT9 (C3 provides, C6 caller). Traces: R1, R6. LLD (internals) owned here (B8); seam is fixed (B3).
#
# CT9: sync_api seam — C6 (Web Ingress) dispatches authenticated HTTP request in-process
# to C3 (Project Management); returns server-rendered HTML response dict.
# Added as new additive file in web_ingress namespace per slice delta Rule 4 (never edits
# existing C6 code — new file only).
#
# Failure modes per CT9 contract:
#   callee-error  — C3 raises RuntimeError; return HTTP 500 response (raw exception NOT propagated)
#   not-found     — C3 raises NotFoundError; return HTTP 404 response
# Framework-agnostic plain Python at contract layer (ADR-0002). Synchronous, no async (INV6).

from __future__ import annotations

from typing import Any

from freelancer_app.project_management.exceptions import NotFoundError, UnauthorizedError


def dispatch_project_request(
    request: dict[str, Any],
    project_management: Any,
    identity_auth: Any,
) -> dict[str, Any]:
    """
    CT9 surface — dispatch authenticated request to Project Management; return response dict.

    Parameters
    ----------
    request         : Incoming request dict (carries path, session_token, etc.).
    project_management : C3 ProjectManagement handle_request callable (real or mock).
    identity_auth   : C2 IdentityAuth instance (passed through for session resolution inside C3).

    Returns
    -------
    dict — {status: int, body: str, content_type: str}

    CT9 failure modes (handled here, not re-raised):
    - callee-error (RuntimeError from C3) → 500 response, error detail NOT in body
    - not-found (NotFoundError from C3)   → 404 response

    CT3 failure mode surfaced at C6 boundary:
    - no-valid-session (UnauthorizedError from C3) → 302 redirect to /auth/login (sign-in)
    """
    try:
        response = project_management.handle_request(request)
        return response
    except UnauthorizedError:
        # CT3:no-valid-session — C3 rejected request (no authenticated session).
        # Web Ingress redirects to sign-in entry point (failure_path.arrives_at).
        return {"status": 302, "body": "", "content_type": "text/html", "location": "/auth/login"}
    except NotFoundError:
        # CT9 not-found: C3 could not locate the requested resource.
        return {"status": 404, "body": "<html>Not Found</html>", "content_type": "text/html"}
    except RuntimeError:
        # CT9 callee-error: unhandled exception in C3; return 500 without leaking internals.
        return {"status": 500, "body": "<html>Internal Server Error</html>", "content_type": "text/html"}
