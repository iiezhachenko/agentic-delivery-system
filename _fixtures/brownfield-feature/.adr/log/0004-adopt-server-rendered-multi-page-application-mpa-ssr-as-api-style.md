---
id: ADR-0004
title: Adopt Server-rendered multi-page application (MPA / SSR) as API style
status: Accepted
date: 2026-06-07
class: greenfield
scope: global
mode: foundation
category: API style
traces: [R1, C1, AC1, A1, C2, A13, A2, INV6]
supersedes: null
superseded_by: null
---

## Context

The application's HTTP surface must be shaped to serve a browser-reachable frontend (R1, C1, AC1) within a two-month build window (C2) at personal-tool scale (A13) on a single synchronous server (INV6). The feature set consists of CRUD forms for time entries, projects, and invoices (AC2, AC6, AC10), an OAuth authentication round-trip (A2, AC5), and a server-side PDF file download (A1, AC3). The question is whether to deliver this as a server-rendered multi-page application (MPA), a REST/JSON API backend with a single-page application (SPA) frontend, or a hybrid server-rendered approach augmented with a client-side interaction library. No acceptance criterion requires real-time inline updates without page reloads, offline capability, or a mobile client. The tension is between C2's constraint — eliminating non-feature setup cost — and the future integration flexibility a clean API contract would provide, weighed against the actual AC* requirements at A13 scale.

## Decision

Adopt the **Server-rendered multi-page application (MPA / SSR)** as the application's HTTP surface and UI delivery model.

## Alternatives considered

- **REST/JSON API backend with a single-page application frontend** — Satisfies R1/C1/AC1; INV6-compatible; A1's PDF streaming is a standard server route triggered by link navigation. Rejected because two separate build pipelines (server + SPA), CORS configuration, and token-based session management are concrete C2 setup costs. No AC* requires the real-time inline interactivity or future integration surface a SPA provides at A13 personal-tool scale — the CRUD feature set is fully served by server-rendered forms. The added complexity consumes C2 timeline for no contract-grounded benefit at this scope, ruled out by C2 weighted against A13.
- **Hybrid: server-rendered HTML with API endpoints for dynamic interactions (e.g., HTMX or light SPA islands)** — Retains single-process deployment (INV6-compatible); HTMX/Turbo are lightweight and compatible with Django templates (DP2 pick); A1's PDF streaming endpoint remains a standard server route; gradual adoption path possible. Rejected because the hybrid adds a client-side interaction library (HTMX/Turbo) and a two-response-format convention (full HTML vs partial HTML) that must be maintained across slices. No AC* requires the targeted interactivity the hybrid provides beyond what MPA server-rendered forms already deliver — AC2, AC6, AC10 are satisfied by standard form submission with full-page response. The overhead exists (C2 cost) with no AC*-grounded return at A13 scale.

## Consequences

- **Positive:** Single deployable artifact with no frontend build pipeline — the skeleton (S1) reaches the FD1 ingress seam faster under C2.
- **Positive:** Session cookies + CSRF via Django middleware close the FD2 OAuth seam (AC5) with no CORS or token-based complexity.
- **Positive:** A1's server-side PDF file-streaming endpoint (AC3) is a standard Django view — no additional integration surface beyond the MPA route.
- **Positive:** Full-page navigation is standard-browser-compatible, satisfying AC1 with zero client-side framework overhead.
- **Accepted cost:** Full-page reloads on every form submission and list navigation; inline editing or dynamic filtering requires JavaScript augmentation if desired in a later slice — no AC* currently requires it, so the cost is deferred.
- **Accepted cost:** If a richer frontend is required after delivery (e.g., mobile app or third-party API consumer), migrating from MPA to an API-driven model requires significant server-layer refactoring.
- **Follow-on:** DP1 (architecture): MPA / SSR is the most natural companion to the flat-monolith pick — all HTTP views and template logic co-located in one flat codebase.
- **Follow-on:** DP2 (tech stack): Django's template engine and class-based views are optimised for MPA; the pick is coherent with Python/Django.
- **Follow-on:** S2 (time-entry slice): time-entry form submission and list rendering are straightforward Django form views + template rendering — no frontend framework needed.
- **Follow-on:** S4 (project management slice): project CRUD follows the same MPA pattern — Django ModelForm + redirect-after-POST, satisfying AC6.
