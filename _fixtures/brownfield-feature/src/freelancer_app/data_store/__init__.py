# Component C1 (Data Store) — implements CT1 against the FROZEN contract.
# Traces: R7, R8, R9, R10. LLD (internals) owned here (B8); seam is fixed (B3).
from freelancer_app.data_store import identity_record_store

__all__ = ["identity_record_store"]
