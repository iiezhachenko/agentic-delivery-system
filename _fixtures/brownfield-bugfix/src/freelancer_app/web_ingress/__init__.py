# Component C6 (Web Ingress) — implements CT8 against the FROZEN contract.
# Traces: R1. LLD (internals) owned here (B8); seam is fixed (B3).
from freelancer_app.web_ingress import session_gate

__all__ = ["session_gate"]
