# Component C3 (Project Management) — implements CT9 against FROZEN contract. Traces: R4, R6, R9, R10. LLD (internals) owned here (B8); seam is fixed (B3).
#
# Exceptions for CT2 failure modes (store-unavailable, constraint-violation, not-found)
# and CT3 failure modes (no-valid-session → UnauthorizedError, callee-error → SessionResolutionError).
# Raised/propagated unmodified per frozen contract expected_behavior.


class StoreUnavailableError(Exception):
    """CT2 failure: PostgreSQL unreachable; propagated unmodified to caller."""


class ConstraintViolationError(Exception):
    """CT2 failure: FK/uniqueness violation; propagated unmodified to caller."""


class NotFoundError(Exception):
    """CT2 failure: project absent or wrong owner scope; propagated unmodified to caller."""


class UnauthorizedError(Exception):
    """CT3 failure: no-valid-session — C2 returned None; request rejected before any project op."""


class SessionResolutionError(Exception):
    """CT3 failure: callee-error — C2 raised during session resolution; request fails without any project op."""
