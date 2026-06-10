# HLD Skeleton — Freelancer Time-Tracking and Invoicing Web Application (FROZEN v1)

> Frozen, signed skeleton. Immutable — a later change is a new version + change request that re-triggers affected slices (H14). Stable IDs (C*, CT*, E*, F*) thread design → build → test. Phase 4 reads this + the `.hld/skeleton/*.json` artifacts it manifests. Gate: RECONCILE/CRITIQUE verdict **clean**.

## CLASS
greenfield

## SKELETON SLICE
S1 — walking skeleton: "Freelancer signs in via Google OAuth on the web application" (flow F1).

## BOUNDARY STRATEGY
Single-deployment monolith, flat structure (ADR-0001). Logical responsibility units inside one deployable — no distributed components, no broker, single-server synchronous (INV6).

## COMPONENTS (build DAG nodes)
- **C1 — Data Store**: durable relational persistence (PostgreSQL) for all application state. Realizes seam: persistence. depends_on: [].
- **C2 — Identity & Auth**: freelancer account + Google OAuth 2.0 delegation, session establishment. Owns E1. Realizes seams: domain, primary_external_integration. depends_on: [C1].
- **C3 — Project Management**: CRUD of client projects, client record, project currency + rate. Owns E2, E5, E6, E7. depends_on: [C1, C2].
- **C4 — Time Logging**: accept/persist/display billable time entries against a project. Owns E3. depends_on: [C1, C3].
- **C5 — Invoice Export**: aggregate a project's monthly time entries into a PDF invoice, compute totals, stream download. Owns E4. depends_on: [C1, C3].
- **C6 — Web Ingress**: HTTP/HTTPS entry, route to domain components, serve server-rendered HTML (MPA/SSR). depends_on: [C2, C3, C4, C5].

## CONTRACTS (one per edge)
CT1 C2→C1 shared_data · CT2 C3→C1 shared_data · CT3 C3→C2 sync_api · CT4 C4→C1 shared_data · CT5 C4→C3 sync_api · CT6 C5→C1 shared_data · CT7 C5→C3 sync_api · CT8 C6→C2 sync_api · CT9 C6→C3 sync_api · CT10 C6→C4 sync_api · CT11 C6→C5 sync_api. Distribution: 7 sync_api + 4 shared_data + 0 async.

## DATA MODEL
7 entities E1–E7, single-owner (E1→C2, E2/E5/E6/E7→C3, E3→C4, E4→C5 derived). PostgreSQL relational store (ADR-0003). Field schemas deferred per slice.

## WALKING-SKELETON FLOW
- **F1** (slice S1): path C6→C2→C1, via [CT8, CT1]. Crosses all 4 foundational seams (ingress, domain, persistence, primary_external_integration) once. Failure variant: CT1:store-unavailable → no session, redirect to login. traces R1, R5, AC1, AC5.

## BUILD ORDER (topological)
C1 → C2 → C3 → C4 → C5 → C6 (5 waves: [C1] · [C2] · [C3] · [C4,C5] · [C6]). No cycles.

## NFR
8 NFRs inventoried; mechanism set empty — satisfied by the flat-monolith frame (INV6/A13 forbid the classic scale mechanisms).
