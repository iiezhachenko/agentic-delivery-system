# Component C3 (Project Management) — implements CT9 (provides) + consumes CT2 (C1) + CT3 (C2) against FROZEN contract.
# Traces: R4, R6, R9, R10. LLD (internals) owned here (B8); seam is fixed (B3).
from freelancer_app.project_management import project_store, session_resolver, exceptions

__all__ = ["project_store", "session_resolver", "exceptions"]
