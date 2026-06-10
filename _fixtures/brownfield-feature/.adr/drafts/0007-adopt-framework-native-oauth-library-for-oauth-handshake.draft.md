---
id: ADR-0007
title: Adopt framework-native OAuth library for OAuth handshake within Identity & Auth
status: Proposed
date: 2026-06-07
class: greenfield
scope: local
mode: slice
category: Cross-cutting
traces: [R5, A2, AC5]
supersedes: null
superseded_by: null
component: C2
resolves: DP8
---

## Context

The skeleton (S1) must complete a full Google OAuth 2.0 round-trip — initiate redirect, receive callback, exchange code for token, persist provider token and user profile reference (E1), and establish an authenticated session — before any downstream slice depends on it (FD2, seam `primary_external_integration`). ADR-0005 fixed the provider as Google OAuth 2.0; ADR-0002 fixed the runtime as Python (Django or Flask/FastAPI). C2 (Identity & Auth) owns the handshake and must run end-to-end in S1.

The open fork is which library or mechanism implements the OAuth handshake inside C2. The skeleton cannot be built without resolving this: some concrete library or code path must wire the redirect, callback, and token exchange routes. The contracts (CT3, CT8) expose only a session presence signal and a freelancer identity reference — they are library-agnostic — but C2's implementation requires a library choice now.

Four candidate approaches emerge from `fork_evidence` constrained to the Python runtime: a Django-integrated OAuth library (django-allauth or social-django), a Flask/FastAPI-compatible OAuth library (Authlib or flask-dance), a generic framework-native OAuth middleware matching the chosen framework, or hand-rolled OAuth 2.0 client code. The provider token and profile reference (E1) must survive the callback and be written to the data store (INV1: no stored passwords).

## Decision

Use a framework-native OAuth 2.0 library that matches the Python web framework chosen under ADR-0002: django-allauth (or social-django) if Django is adopted, or Authlib (or flask-dance) if Flask/FastAPI is adopted. The specific library is locked when the framework is confirmed during S1 implementation; the decision recorded here is the category — framework-native library, not hand-rolled code, not a cross-runtime library.

## Alternatives considered

- **Hand-rolled OAuth 2.0 client code** — A custom implementation of the authorization code flow (redirect, state parameter, callback, token exchange, token validation) using only HTTP client primitives. Fully compatible with A6 (no vendor lock-in) and A2/R5/AC5. Rejected because it requires implementing and maintaining CSRF state handling, token validation, and error-path coverage that framework-native libraries provide tested out-of-the-box; the added maintenance burden has no compensating force at the small personal-tool scale fixed by A13 and INV6.

- **Passport.js (Node.js)** — A mature OAuth middleware ecosystem for Node.js. Rejected because ADR-0002 fixed the runtime as Python; Passport.js is incompatible with the chosen stack.

- **OmniAuth (Ruby)** — A Ruby authentication framework. Rejected because ADR-0002 fixed the runtime as Python; OmniAuth is incompatible with the chosen stack.

## Consequences

- **Positive:** Framework-native libraries for Python (django-allauth, Authlib) handle CSRF state, callback routing, and token exchange as tested, maintained code. OAuth round-trip (AC5) can be wired in S1 without building and testing security-critical protocol handling from scratch.
- **Accepted cost:** The exact library (django-allauth vs Authlib vs flask-dance) is not pinned until the framework is confirmed under ADR-0002. The S1 implementer makes the final sub-selection; this ADR bounds the decision space to the framework-native category.
- **Follow-on:** When S1 is implemented, the confirmed library should be recorded as an implementation note on this ADR (or a follow-on ADR if the sub-selection requires justification). DERIVE-TESTS (role 7) must account for the OAuth callback route when specifying integration test coverage for C2.
