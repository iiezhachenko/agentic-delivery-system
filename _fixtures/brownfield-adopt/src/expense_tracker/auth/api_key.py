# api_key — API-key auth (Bearer token, validated against env-var store).
# Resolves caller identity from X-Api-Key header.
# No OAuth (simpler than freelancer_app — key-based only).

import os


def resolve_identity(api_key: str) -> dict | None:
    """
    Validate api_key against EXPENSE_API_KEYS env var (comma-separated key:owner_id pairs).
    Returns {owner_id} on match; None on miss.
    """
    store_raw = os.environ.get("EXPENSE_API_KEYS", "")
    for entry in store_raw.split(","):
        entry = entry.strip()
        if not entry:
            continue
        key, _, owner_id = entry.partition(":")
        if key.strip() == api_key:
            return {"owner_id": owner_id.strip()}
    return None
