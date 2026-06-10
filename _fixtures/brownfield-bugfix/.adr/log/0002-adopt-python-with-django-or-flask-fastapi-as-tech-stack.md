---
id: ADR-0002
title: Adopt Python with Django or Flask/FastAPI as tech stack
status: Accepted
date: 2026-06-07
class: greenfield
scope: global
mode: foundation
category: Tech stack
traces: [R1, C1, A1, A2, C2, A6, A13, AC3, AC5, INV6]
supersedes: null
superseded_by: null
---

## Context

The system requires a server-side language, runtime, and web framework capable of: delivering a browser-reachable application (R1, C1), generating PDF invoices server-side as file downloads (A1, AC3), delegating authentication to an OAuth provider (A2, AC5), and running on multiple PaaS and VPS platforms without vendor lock-in (A6). All of this must be delivered within a two-month timeline (C2) at personal-tool scale with low concurrency (A13, INV6). Three mature stacks are available — Python, Node.js, and Ruby on Rails — all of which satisfy the PDF-generation, OAuth, portability, and scale requirements without breaching any hard constraint. The decisive tension is C2: the extent to which each stack's conventions reduce non-feature setup cost before productive feature work begins.

## Decision

Adopt **Python with Django or Flask/FastAPI** as the server-side language, runtime, and web framework.

## Alternatives considered

- **Node.js (LTS) with Express or Fastify** — Satisfies A1 via mature npm PDF libraries (Puppeteer, PDFKit); satisfies A2 via Passport.js/openid-client for AC5; broad PaaS support maintains A6; lightweight at A13 scale under INV6. Rejected because Express/Fastify are minimally opinionated — routing conventions, error handling, and session management require explicit team decisions before productive feature work begins. This is concrete setup overhead under C2's two-month timeline that Django's built-in ORM, session framework, and CRUD conventions absorb. The aPRD raises no force (scale, portability, PDF, OAuth) on which Node.js outperforms Python; the C2 deficit is the only contract-grounded differentiator, and it favours Python/Django.
- **Ruby with Ruby on Rails** — Satisfies A1 via Prawn/WickedPDF gems for AC3; satisfies A2 via OmniAuth for AC5; broad PaaS support maintains A6; single-process deployment fits INV6 and A13; Rails scaffold generators and ActiveRecord deliver working CRUD rapidly under C2. Rejected because Rails delivers strong C2 benefit when DP6 aligns with Rails' server-rendered template model, but if DP6 diverges (REST API + SPA or hybrid), Rails' conventions require additional configuration that consumes C2 time. Django's ORM and session management deliver C2 benefit independent of DP6's outcome, making Python a more robust choice under C2 across the decision space. No other aPRD force distinguishes Rails from Python/Django.

## Consequences

- **Positive:** Django's built-in ORM satisfies the E1–E7 relational model (R7) with minimal boilerplate, accelerating S1 (skeleton persistence seam) and S4 (project management) under C2.
- **Positive:** social-auth-app-django / Authlib directly supports AC5 OAuth round-trip (A2), closing the FD2 seam with a mature library.
- **Positive:** WeasyPrint / ReportLab libraries satisfy A1's server-side PDF generation requirement for S3 (AC3).
- **Positive:** Django's sync WSGI model (Gunicorn) is a direct expression of INV6's single-server synchronous assumption.
- **Accepted cost:** Django's full-stack conventions impose structure that may exceed A13 personal-tool scale needs; the ORM, admin, and middleware stack carry overhead unused by the feature set.
- **Accepted cost:** Flask/FastAPI require explicit ORM and session wiring comparable to Node/Express effort — the pick's C2 advantage is realised primarily through Django-style conventions, not the Python language alone.
- **Accepted cost:** Python's sync WSGI deployment requires a process manager (Gunicorn, uWSGI) and WSGI-compatible PaaS configuration — a concrete deployment step Node.js process management avoids.
- **Follow-on:** DP4 (persistence): Django's ORM works best with PostgreSQL or SQLite — both relational options. Django does not natively integrate with MongoDB without third-party packages; a Document store pick in DP4 would add ORM adapter cost.
- **Follow-on:** DP6 (API style): Django's template engine supports MPA directly; Django REST Framework adds the JSON API layer for SPA approaches — both paths are well-supported, consistent with the rationale's DP6-independence claim.
- **Follow-on:** DP10 (deployment): Python/Django's WSGI deployment model requires a platform that supports Gunicorn or equivalent; all PaaS and VPS options support this, so no constraint on DP10.
