# Composition root (INTEGRATE) — external OAuth 2.0 adapter seam for flow F1.
# Traces: R5, AC5. Composition LLD owned here (B8); component internals are
# IMPLEMENT's (§5.5); seams fixed (B3).
#
# This module is the boundary the frozen conftest mock_oauth_provider patches:
#   monkeypatch.setattr("freelancer_app.identity_auth.oauth_provider", mock, raising=False)
# The mock replaces this module at flow-test time; in production the real
# Google OAuth 2.0 exchange (ADR-0005) would be implemented here.
#
# External boundary — NOT a modeled component; no CT* covers this seam.
# Synchronous (INV6). Framework-agnostic plain Python.

from __future__ import annotations

from typing import Any


def exchange_code(code: str) -> dict[str, Any]:
    """
    Exchange an OAuth authorization code for provider token + user profile.

    External boundary: delegates to Google OAuth 2.0 (ADR-0005).
    The frozen conftest mock_oauth_provider patches this module for flow tests,
    so this body is only executed without mocking (production path).

    Parameters
    ----------
    code : Authorization code received from the OAuth provider callback.

    Returns
    -------
    dict with at least: provider, provider_id, profile keys.

    Raises
    ------
    RuntimeError — if the OAuth exchange fails (e.g. invalid code, network error).
    """
    # Production implementation wired in a later slice when Google OAuth
    # credentials are available (ADR-0005). At walking-skeleton level the
    # frozen conftest mock_oauth_provider replaces this module.
    raise NotImplementedError(
        "oauth_provider.exchange_code: real Google OAuth 2.0 exchange not wired yet. "
        "The frozen conftest mock_oauth_provider patches this module for flow tests."
    )
