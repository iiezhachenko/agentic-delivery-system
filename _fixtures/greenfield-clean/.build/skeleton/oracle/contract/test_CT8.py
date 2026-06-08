# FROZEN ORACLE — materialized from CT8. Do NOT edit (B4); needing to edit = escape with a diagnosis. Red-first: targets unimplemented at freeze.
#
# CT8: sync_api seam — C6 (Web Ingress, caller) <-> C2 (Identity & Auth, provider)
# Seam carries session presence signal — Web Ingress calls Identity & Auth on each
# authenticated route to verify a valid session before dispatching.
# High-blast: C2 is auth component (provider); this test is mutation-certified.
# Traces: R1, R5

import pytest
from unittest.mock import MagicMock, patch
from conftest import mock_identity_auth_ct8


# ---------------------------------------------------------------------------
# Shape test — named-not-designed: assert the session-presence signal moves
# across the C6->C2 seam. Result is authenticated (dispatch proceeds) or
# unauthenticated (redirect to login). No wire format / internal fields asserted.
# ---------------------------------------------------------------------------

def test_ct8_shape_session_presence_signal(mock_identity_auth_ct8):
    """
    CT8 shape: Session presence signal moves across C6->C2 seam.
    Web Ingress calls Identity & Auth to verify session on authenticated routes.
    Result: authenticated → dispatch proceeds; unauthenticated → redirect to login.
    RED until Identity & Auth is implemented.
    """
    from freelancer_app.web_ingress import session_gate

    # Authenticated case: mock returns a valid session.
    mock_identity_auth_ct8.check_session.return_value = {
        "authenticated": True,
        "identity_ref": "uid-shape-test",
    }
    result = session_gate.check(request_cookies={"session": "valid-token"})
    assert result is not None, "CT8 shape: check must return a result object."
    # Must indicate dispatch is allowed when session is valid.
    is_authenticated = (
        result.get("authenticated") if isinstance(result, dict)
        else getattr(result, "authenticated", None)
    )
    assert is_authenticated, (
        "CT8 shape: valid session must yield authenticated=True (dispatch proceeds)."
    )

    # Unauthenticated case: mock returns no valid session.
    mock_identity_auth_ct8.check_session.return_value = None
    result_unauth = session_gate.check(request_cookies={})
    # Must not dispatch — result signals redirect / unauthenticated.
    is_authenticated_unauth = (
        result_unauth.get("authenticated") if isinstance(result_unauth, dict)
        else getattr(result_unauth, "authenticated", False)
    ) if result_unauth is not None else False
    assert not is_authenticated_unauth, (
        "CT8 shape: absent/expired session must yield unauthenticated result (redirect to login)."
    )


# ---------------------------------------------------------------------------
# Failure tests — one per declared failure_mode (verbatim mode, asserts from
# expected_behavior)
# ---------------------------------------------------------------------------

def test_ct8_failure_no_valid_session(mock_identity_auth_ct8):
    """
    CT8 failure — no-valid-session: no session cookie present or session is
    expired; Web Ingress must redirect to the OAuth login entry point rather
    than dispatching to the domain component.
    Expected behavior: Identity & Auth returns no valid session; Web Ingress
    must redirect to the OAuth login entry point and must not dispatch the
    request to any domain component.
    """
    from freelancer_app.web_ingress import session_gate

    mock_identity_auth_ct8.check_session.return_value = None

    response = session_gate.handle_authenticated_request(
        request_cookies={},
        dispatch_target="project_management",
    )

    # Must redirect to OAuth login entry point.
    redirect_location = (
        response.get("redirect") if isinstance(response, dict)
        else getattr(response, "redirect_url", None)
    )
    assert redirect_location is not None, (
        "CT8 no-valid-session: Web Ingress must redirect to OAuth login entry point."
    )
    # Must not dispatch to any domain component.
    dispatched = (
        response.get("dispatched") if isinstance(response, dict)
        else getattr(response, "dispatched", False)
    )
    assert not dispatched, (
        "CT8 no-valid-session: Web Ingress must not dispatch to any domain component."
    )


def test_ct8_failure_callee_error(mock_identity_auth_ct8):
    """
    CT8 failure — callee-error: Identity & Auth raises an exception during
    session check (e.g. store lookup failure); Web Ingress must treat the
    request as unauthenticated and redirect.
    Expected behavior: Identity & Auth raises an exception; Web Ingress must
    treat the request as unauthenticated and redirect to the login entry
    point without dispatching to any domain component.
    """
    from freelancer_app.web_ingress import session_gate

    mock_identity_auth_ct8.check_session.side_effect = RuntimeError(
        "callee-error: store lookup failure during session check"
    )

    response = session_gate.handle_authenticated_request(
        request_cookies={"session": "maybe-valid"},
        dispatch_target="project_management",
    )

    # Must treat as unauthenticated and redirect.
    redirect_location = (
        response.get("redirect") if isinstance(response, dict)
        else getattr(response, "redirect_url", None)
    )
    assert redirect_location is not None, (
        "CT8 callee-error: Web Ingress must redirect to login entry point on Identity & Auth exception."
    )
    # Must not dispatch.
    dispatched = (
        response.get("dispatched") if isinstance(response, dict)
        else getattr(response, "dispatched", False)
    )
    assert not dispatched, (
        "CT8 callee-error: Web Ingress must not dispatch to any domain component on exception."
    )
