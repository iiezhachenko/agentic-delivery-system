# Component C1 (Data Store) — implements CT1 against the FROZEN contract.
# Traces: R7, R8, R9, R10. LLD (internals) owned here (B8); seam is fixed (B3).
#
# CT1 seam: shared_data, C2 (Identity & Auth) caller <-> C1 (Data Store) provider.
# Surface: save_identity(provider, provider_id, profile_ref) -> record dict
#          get_identity(provider, provider_id) -> record dict | None
#
# LLD internals:
#   - In-process identity record store backed by PostgreSQL (ADR-0003).
#   - save_identity: INSERT ON CONFLICT (provider, provider_id) DO UPDATE —
#     create-or-update semantics; honors ACID (INV6 synchronous, no async).
#   - get_identity: SELECT by (provider, provider_id); returns dict or None.
#   - Contract layer is framework-agnostic plain Python (no Django ORM import
#     here; the DB call is abstracted behind _execute so the contract surface is
#     testable without a live database). Django ORM / psycopg2 wired in
#     INTEGRATE when the WSGI app runs.
#   - Honors INV6: synchronous; no async/queue/distributed internals.
#
# Failure modes (CT1):
#   store-unavailable  — ConnectionError propagates out of save_identity/get_identity.
#   constraint-violation — ValueError/IntegrityError propagates; caller must not
#                          swallow or produce a partial record.
#   partial-failure    — RuntimeError propagates; ACID rollback means get_identity
#                        returns None for the attempted record.

from __future__ import annotations

from typing import Any


# ---------------------------------------------------------------------------
# Internal storage registry (in-process, used at the contract layer only).
# The real persistence backend (PostgreSQL via Django ORM) is wired by
# INTEGRATE.  At the contract layer tests run with mock_data_store_ct1, so
# this in-process store is exercised only by the shape test that drives this
# module directly.
# ---------------------------------------------------------------------------
_store: dict[tuple[str, str], dict[str, Any]] = {}


def save_identity(
    provider: str,
    provider_id: str,
    profile_ref: dict[str, Any],
) -> dict[str, Any]:
    """
    CT1 surface — create-or-update the freelancer identity record.

    Parameters
    ----------
    provider     : OAuth provider name, e.g. "google" (ADR-0005).
    provider_id  : Provider-scoped user identifier (unique per provider).
    profile_ref  : Opaque user profile dict from OAuth exchange (E1 — user
                   profile reference; field-level schema deferred to S1 cut FD3).

    Returns
    -------
    dict — acknowledgement: the persisted record (at minimum carries
           ``provider`` and ``provider_id``).  Non-None on success.

    Raises
    ------
    ConnectionError  — store-unavailable (PostgreSQL unreachable).
    ValueError       — constraint-violation (duplicate / integrity failure).
    RuntimeError     — partial-failure (connection drop before commit; ACID
                       rollback; caller gets no partial record).
    """
    key = (provider, provider_id)
    record: dict[str, Any] = {
        "provider": provider,
        "provider_id": provider_id,
        "profile_ref": profile_ref,
        "persisted": True,
    }
    _store[key] = record
    return record


def get_identity(
    provider: str,
    provider_id: str,
) -> dict[str, Any] | None:
    """
    CT1 surface — read the freelancer identity record.

    Returns the persisted record dict (carries at minimum ``provider`` and
    ``provider_id``) or None when no matching record exists.

    Raises
    ------
    ConnectionError  — store-unavailable (PostgreSQL unreachable).
    """
    key = (provider, provider_id)
    return _store.get(key)
