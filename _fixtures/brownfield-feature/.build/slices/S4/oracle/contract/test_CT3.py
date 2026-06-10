# FROZEN ORACLE — materialized from CT3. Do NOT edit (B4); needing to edit = escape with a diagnosis. Red-first: targets unimplemented at freeze.
# CT3: sync_api seam between C3 (Project Management, caller) and C2 (Identity & Auth, provider).
# Carries authenticated freelancer session signal; C3 calls C2 in-process to resolve session and
# obtain freelancer identity (E1 reference) for ownership scoping.
# C2 (Identity & Auth) mocked via conftest fixture — mutation-certified (C2/auth, high-blast).

import pytest
from unittest.mock import MagicMock

from freelancer_app.project_management.session_resolver import SessionResolver  # does not exist yet — red


# ── shape test ────────────────────────────────────────────────────────────────

def test_ct3_shape_resolves_authenticated_session(mock_identity_auth):
    """CT3 shape: seam resolves current session to freelancer identity (E1 ref) for ownership scoping."""
    resolver = SessionResolver(identity_auth=mock_identity_auth)

    mock_identity_auth.resolve_session.return_value = {"freelancer_id": "freelancer-42", "provider": "google"}

    identity = resolver.resolve(request_context={"session_token": "tok-abc"})

    assert mock_identity_auth.resolve_session.called
    assert identity["freelancer_id"] == "freelancer-42"


# ── failure tests ─────────────────────────────────────────────────────────────

def test_ct3_failure_no_valid_session(mock_identity_auth):
    """CT3 failure: no-valid-session — session absent/expired; C2 returns no identity; C3 rejects request as unauthorized; no project data read or written."""
    from freelancer_app.project_management.exceptions import UnauthorizedError  # red

    resolver = SessionResolver(identity_auth=mock_identity_auth)
    mock_identity_auth.resolve_session.return_value = None  # no authenticated identity

    with pytest.raises(UnauthorizedError):
        resolver.resolve(request_context={"session_token": None})

    # project data must NOT have been read or written — resolver raised before any project op
    assert mock_identity_auth.resolve_session.called


def test_ct3_failure_callee_error(mock_identity_auth):
    """CT3 failure: callee-error — C2 raises exception during session resolution; C3 cannot determine ownership; request fails without processing any project operation."""
    from freelancer_app.project_management.exceptions import SessionResolutionError  # red

    resolver = SessionResolver(identity_auth=mock_identity_auth)
    mock_identity_auth.resolve_session.side_effect = RuntimeError("store lookup failure in identity component")

    with pytest.raises(SessionResolutionError):
        resolver.resolve(request_context={"session_token": "tok-bad"})

    assert mock_identity_auth.resolve_session.call_count == 1
