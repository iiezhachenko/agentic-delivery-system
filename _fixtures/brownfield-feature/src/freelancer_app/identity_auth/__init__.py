# Component C2 (Identity & Auth) — implements CT8 against the FROZEN contract.
# Traces: R5. LLD (internals) owned here (B8); seam is fixed (B3).
from freelancer_app.identity_auth import oauth_callback, session_checker

__all__ = ["oauth_callback", "session_checker"]
