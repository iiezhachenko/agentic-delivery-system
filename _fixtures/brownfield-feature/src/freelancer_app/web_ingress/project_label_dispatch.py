# Component C6 wiring — additive seam for CT9 set-label dispatch (C3 provides, C6 caller). Traces: R11, R13.
# Feature-add (CR-001). LLD owned here (B8); seam fixed (B3).
#
# CT9: sync_api seam — C6 (Web Ingress) dispatches the authenticated set-label HTTP request in-process to
# C3 (Project Management); returns a server-rendered HTML response dict. ADDITIVE new file in the web_ingress
# namespace per slice delta Rule 4 — never edits existing C6 code (dispatcher.py untouched; BF6).
#
# Failure modes surfaced at the C6 boundary:
#   no-valid-session (UnauthorizedError from C3) → 302 redirect to /auth/login (CT3 failure mode)
#   not-found        (NotFoundError from C3)     → 404 response (CT9 failure mode)
#   store-unavailable (StoreUnavailableError from C3, CT2 label write) → 503 response; label NOT persisted
# Framework-agnostic plain Python at contract layer (ADR-0002). Synchronous, no async (INV6).

from __future__ import annotations

from typing import Any

from freelancer_app.project_management.exceptions import (
    ConstraintViolationError,
    NotFoundError,
    StoreUnavailableError,
    UnauthorizedError,
)


def dispatch_project_label_request(
    request: dict[str, Any],
    project_management: Any,
    identity_auth: Any,
) -> dict[str, Any]:
    """
    CT9 surface — dispatch the authenticated set-label/read request to Project Management; return response dict.

    Returns: dict — {status: int, body: str, content_type: str}

    CT2 label-write failure surfaced here (not re-raised):
    - store-unavailable (StoreUnavailableError) → 503 response, label not persisted, detail NOT leaked
    - constraint-violation (ConstraintViolationError) → 409 response
    """
    try:
        return project_management.handle_request(request)
    except UnauthorizedError:
        # CT3:no-valid-session — redirect to sign-in entry point.
        return {"status": 302, "body": "", "content_type": "text/html", "location": "/auth/login"}
    except NotFoundError:
        return {"status": 404, "body": "<html>Not Found</html>", "content_type": "text/html"}
    except StoreUnavailableError:
        # CT2:store-unavailable on the label write — surface as 503; label not persisted.
        return {"status": 503, "body": "<html>Service Unavailable</html>", "content_type": "text/html"}
    except ConstraintViolationError:
        return {"status": 409, "body": "<html>Conflict</html>", "content_type": "text/html"}
