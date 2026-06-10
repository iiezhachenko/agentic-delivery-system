# Component C2 (Identity & Auth) — implements CT1 failure obligations against the FROZEN contract.
# Traces: R5. LLD (internals) owned here (B8); seam is fixed (B3).
#
# CT1 seam: shared_data, C2 (Identity & Auth, caller) <-> C1 (Data Store, provider).
# This module handles the OAuth callback: receives provider token + user profile
# from the OAuth exchange and persists the freelancer identity record via the
# Data Store (CT1 seam).
#
# LLD internals:
#   - handle_callback delegates persistence to identity_record_store.save_identity.
#   - All exceptions from save_identity propagate unmodified (no swallowing):
#       ConnectionError  — store-unavailable: callback aborts, login fails.
#       ValueError       — constraint-violation: duplicate identity rejected.
#       RuntimeError     — partial-failure: ACID rollback, no partial record.
#   - Honors INV6: synchronous, no async/queue/distributed internals.
#   - Framework-agnostic plain Python at the contract layer (ADR-0002).
#   - Google OAuth 2.0 delegation (ADR-0005); provider token + profile_ref stored,
#     no stored credentials (E1 field-schema deferred to S1 cut FD3).

from __future__ import annotations

from typing import Any

from freelancer_app import data_store


def handle_callback(
    provider: str,
    provider_id: str,
    profile_ref: dict[str, Any],
) -> dict[str, Any]:
    """
    CT1 surface (caller side) — persist the freelancer identity record on
    successful OAuth callback.

    Calls Data Store (C1) via CT1 seam: save_identity(provider, provider_id,
    profile_ref).  All exceptions propagate to the caller unmodified — the
    callback aborts without producing a partial or duplicate identity record.

    Parameters
    ----------
    provider     : OAuth provider name, e.g. "google" (ADR-0005).
    provider_id  : Provider-scoped user identifier.
    profile_ref  : Opaque user profile dict from OAuth token exchange (E1).

    Returns
    -------
    dict — acknowledgement from the Data Store (non-None on success).

    Raises
    ------
    ConnectionError  — store-unavailable; propagated from Data Store.
    ValueError       — constraint-violation; propagated from Data Store.
    RuntimeError     — partial-failure; propagated from Data Store.
    """
    # Access via the package attribute so monkeypatch on
    # freelancer_app.data_store.identity_record_store takes effect at call time.
    record = data_store.identity_record_store.save_identity(
        provider=provider,
        provider_id=provider_id,
        profile_ref=profile_ref,
    )
    return record
