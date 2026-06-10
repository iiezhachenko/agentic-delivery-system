---
id: ADR-0001
title: Adopt Single-deployment monolith (flat structure) as architectural style
status: Accepted
date: 2026-06-07
class: greenfield
scope: global
mode: foundation
category: Architectural style
traces: [R1, C1, AC1, C2, A13, INV6]
supersedes: null
superseded_by: null
---

## Context

The system must be implemented as a single-server, synchronous application (INV6) serving a personal-tool audience of tens of users (A13), reachable via a browser at an HTTPS endpoint (R1, C1, AC1). The build must deliver a deployable skeleton within a two-month window (C2). Two structural approaches are available: a flat single-deployment monolith and a modular monolith with enforced internal boundaries. Both satisfy INV6 and A13. The tension is between C2's constraint — minimising time-to-skeleton — and the desire for mechanical cross-domain separation across the four functional domains (auth, projects, time logging, invoices) that will accumulate over subsequent slices. The modular variant's protection value grows with codebase size and team turnover; at A13 scale the codebase stays small and the project may end after three slices, making payoff speculative rather than certain.

## Decision

Adopt the **Single-deployment monolith (flat structure)** as the architectural style.

## Alternatives considered

- **Modular monolith with enforced internal module boundaries** — Single deployable unit fully compliant with INV6 and A13; internal module boundaries map onto the aPRD's functional domains (R2, R3, R5, R6, R7), providing mechanical prevention of unintended cross-domain coupling; deployment pipeline is as simple as the flat variant. Rejected because the upfront cost of establishing module-boundary conventions, enforcement tooling, and public-API declarations before the skeleton is buildable consumes C2's two-month timeline for structural protection that only pays off at scale A13 rules out. At tens of users and low concurrency, the codebase stays small enough that flat-monolith discipline is adequate; the added scaffolding overhead is concrete build cost with speculative payoff — ruled out by C2 weighted against A13.

## Consequences

- **Positive:** Minimal project scaffolding means the skeleton reaches the FD1 seam (ingress, HTTP/HTTPS, AC1) faster under C2.
- **Positive:** Single deployable artifact keeps the deployment pipeline straightforward for all slices (FD4 / DP10).
- **Positive:** No inter-module coordination overhead; A13 scale makes flat structure operationally adequate for the entire project lifetime.
- **Accepted cost:** No enforced boundary between auth, projects, time logging, and invoicing domains; coupling will grow organically as slices accumulate — mitigated only by code discipline.
- **Accepted cost:** Retroactive boundary extraction is non-trivial if the project grows beyond A13 scale assumptions after delivery.
- **Follow-on:** DP2 (tech stack): chosen framework should have lightweight scaffolding consistent with a flat structure; heavy convention-over-configuration frameworks that impose their own module layout are compatible but may add overhead.
- **Follow-on:** DP6 (API style): a flat monolith is equally compatible with MPA and SPA patterns; no constraint imposed, but MPA server-rendering has the most natural fit with a single flat codebase.
- **Follow-on:** INV6: the single-deployment flat monolith is the most direct architectural expression of INV6's single-server synchronous mandate; slices must not introduce a structure that implies distributed components.
