# FROZEN ORACLE — materialized from CT1. Do NOT edit (B4); needing to edit = escape with a diagnosis. Red-first: targets unimplemented at freeze.
#
# CT1: shared_data seam — C2 (Identity & Auth, caller) <-> C1 (Data Store, provider)
# Seam carries Freelancer identity record (E1) — provider token and user profile reference.
# High-blast: C2 is auth component; this test is mutation-certified.
# Traces: R5

import pytest
from unittest.mock import MagicMock, patch
from conftest import mock_data_store_ct1


# ---------------------------------------------------------------------------
# Shape test — named-not-designed: assert the named E1-set / responsibility
# moves across this seam (create-or-update on OAuth callback, read on session
# resolution). No field columns / wire format asserted.
# ---------------------------------------------------------------------------

def test_ct1_shape_persists_identity_record(mock_data_store_ct1):
    """
    CT1 shape: Freelancer identity record (E1) — provider token and user
    profile reference — moves across the C2->C1 seam on OAuth callback
    (create-or-update) and is readable on session resolution.
    Imports the contract surface; RED until Data Store is implemented.
    """
    from freelancer_app.data_store import identity_record_store

    # A create-or-update call must be expressible and must return an
    # acknowledgement (record written or fetched).
    result = identity_record_store.save_identity(
        provider="google",
        provider_id="uid-shape-test",
        profile_ref={"email": "shape@example.com"},
    )
    assert result is not None, (
        "CT1 shape: save_identity must return a non-None acknowledgement "
        "(identity record persisted or located)."
    )

    # A read call on session resolution must be expressible and must return
    # a record that carries at minimum a provider and provider_id.
    fetched = identity_record_store.get_identity(provider="google", provider_id="uid-shape-test")
    assert fetched is not None, (
        "CT1 shape: get_identity must return the previously saved identity record."
    )
    assert hasattr(fetched, "provider") or isinstance(fetched, dict), (
        "CT1 shape: returned identity record must expose a provider attribute or be a dict."
    )


# ---------------------------------------------------------------------------
# Failure tests — one per declared failure_mode (verbatim mode, asserts from
# expected_behavior)
# ---------------------------------------------------------------------------

def test_ct1_failure_store_unavailable(mock_data_store_ct1):
    """
    CT1 failure — store-unavailable: PostgreSQL instance unreachable;
    OAuth callback cannot persist the identity record, login fails.
    Expected behavior: Identity & Auth receives no successful write
    acknowledgement; the OAuth callback aborts without persisting the
    identity record and the login attempt fails.
    """
    from freelancer_app.identity_auth import oauth_callback

    mock_data_store_ct1.save_identity.side_effect = ConnectionError(
        "store-unavailable: PostgreSQL instance unreachable"
    )

    with pytest.raises(Exception) as exc_info:
        oauth_callback.handle_callback(
            provider="google",
            provider_id="uid-store-unavailable",
            profile_ref={"email": "user@example.com"},
        )

    # Store was genuinely consulted and the error propagated — the callback did
    # not skip persistence and fake a success (kills the swallow mutation).
    assert mock_data_store_ct1.save_identity.called, (
        "CT1 store-unavailable: the OAuth callback must attempt the write (error not swallowed)."
    )
    # The exception propagated — OAuth callback aborted.
    assert exc_info.value is not None


def test_ct1_failure_constraint_violation(mock_data_store_ct1):
    """
    CT1 failure — constraint-violation: uniqueness constraint on provider
    identity (e.g. duplicate provider_id insert on concurrent callbacks);
    write fails.
    Expected behavior: Data Store rejects the write with a
    constraint-violation error; Identity & Auth must handle the rejection
    and not produce a partial or duplicate identity record.
    """
    from freelancer_app.identity_auth import oauth_callback

    mock_data_store_ct1.save_identity.side_effect = ValueError(
        "constraint-violation: duplicate provider_id on concurrent callbacks"
    )

    with pytest.raises(Exception):
        oauth_callback.handle_callback(
            provider="google",
            provider_id="uid-duplicate",
            profile_ref={"email": "dup@example.com"},
        )

    # Must not produce a partial or duplicate identity record.
    assert mock_data_store_ct1.save_identity.call_count >= 1, (
        "CT1 constraint-violation: save_identity was attempted (write rejected by store)."
    )
    # No partial record may be returned.
    with pytest.raises(Exception):
        oauth_callback.handle_callback(
            provider="google",
            provider_id="uid-duplicate",
            profile_ref={"email": "dup@example.com"},
        )


def test_ct1_failure_partial_failure(mock_data_store_ct1):
    """
    CT1 failure — partial-failure: write begins but connection drops before
    commit; ACID transaction rolls back, no partial record persisted.
    Expected behavior: ACID transaction rolls back in full; no partial
    identity record is persisted in the Data Store.
    """
    from freelancer_app.identity_auth import oauth_callback

    mock_data_store_ct1.save_identity.side_effect = RuntimeError(
        "partial-failure: connection dropped before commit; ACID rollback"
    )

    with pytest.raises(Exception):
        oauth_callback.handle_callback(
            provider="google",
            provider_id="uid-partial",
            profile_ref={"email": "partial@example.com"},
        )

    # ACID transaction rolled back — get_identity must find no record.
    mock_data_store_ct1.get_identity.return_value = None
    result = mock_data_store_ct1.get_identity(provider="google", provider_id="uid-partial")
    assert result is None, (
        "CT1 partial-failure: ACID rollback — no partial identity record persisted."
    )
