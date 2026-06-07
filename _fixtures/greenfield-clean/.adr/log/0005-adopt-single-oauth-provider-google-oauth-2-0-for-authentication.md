---
id: ADR-0005
title: Adopt Single OAuth provider — Google OAuth 2.0 for authentication
status: Accepted
date: 2026-06-07
class: greenfield
scope: global
mode: foundation
category: Cross-cutting
traces: [R5, A2, AC5, INV1, C2, A7, A13]
supersedes: null
superseded_by: null
---

## Context

The system must allow a freelancer to create and authenticate an account (R5) via OAuth delegation — no stored passwords (INV1, A2). AC5 names both Google and GitHub as acceptable OAuth 2.0 providers. The system is a personal tool for a single freelancer with a single account per deployment (A7) at personal-tool scale (A13). The skeleton's FD2 authentication seam must be closed within the two-month build window (C2). Three options are available: Google OAuth 2.0 (single provider), GitHub OAuth 2.0 (single provider), and a configurable multi-provider abstraction. All satisfy INV1. The tension is between the concrete C2 setup cost of each approach and the flexibility value it provides, weighed against A7 and A13 — which together mean at most one provider is active per deployment and provider-switching flexibility is rarely exercised in practice.

## Decision

Adopt the **Single OAuth provider — Google OAuth 2.0** as the authentication delegation mechanism.

## Alternatives considered

- **Single OAuth provider — GitHub OAuth 2.0** — Fully compliant with INV1; satisfies A2 and AC5 (GitHub is explicitly named as acceptable); single provider means identical low integration surface area (one redirect URI, one callback handler, one token shape) as Google; same C2 and A7 characteristics. Rejected because the contract is indifferent between GitHub and Google on all R*, AC*, A*, and INV* forces — both satisfy R5/A2/AC5/INV1 identically. Google OAuth 2.0 is chosen as default among contract-equivalent equals: AC5 names it first and Google's implementation carries the OIDC standard (OpenID Connect layer more formally standardised). The difference is below the contract's resolution; this is an honest default pick.
- **Configurable multi-provider OAuth 2.0 / OIDC abstraction** — Compliant with INV1; satisfies A2 via provider-neutral OAuth delegation; compatible with A6's no-vendor-lock-in intent. Rejected because multi-provider routing logic, provider-selection UI, and per-provider secret management are concrete C2 build costs. A7 (single freelancer, single account per deployment) and A13 (personal-tool scale) mean the multi-provider flexibility is never exercised in practice — one provider is active. The abstraction adds complexity with no R*/AC* force activating its benefit at this scope; ruled out by C2 weighted against A7 and A13.

## Consequences

- **Positive:** Single redirect URI, single callback handler, single token shape — the FD2 skeleton authentication seam (AC5 OAuth round-trip) is implemented with minimum surface area under C2.
- **Positive:** Google's OIDC layer (OpenID Connect) provides a standardised ID token format, simplifying provider token storage (A2: system stores only the provider token and user profile reference) for the E1 Freelancer identity record.
- **Positive:** No provider-selection UI required — skeleton UI is simpler (one 'Sign in with Google' button); session establishment (AC5) requires fewer moving parts.
- **Accepted cost:** Freelancers without a Google account cannot authenticate — the system is inaccessible to them without a provider change.
- **Accepted cost:** Vendor dependency on Google's OAuth 2.0 service availability and consent-screen policy; a Google policy change (scope, consent, branding) directly affects all users.
- **Accepted cost:** Adding a second provider later (e.g., GitHub) requires refactoring the provider-specific callback and identity-record paths if built tightly around Google's endpoints.
- **Follow-on:** DP2 (tech stack): Python/Django with social-auth-app-django or Authlib supports Google OAuth 2.0 directly; the FD2 seam closes with library configuration, not custom OAuth code.
- **Follow-on:** DP4 (persistence): the E1 Freelancer identity record stores Google's provider token and OIDC sub (user profile reference) per A2; schema columns for provider_id, provider_token needed at skeleton time.
- **Follow-on:** INV1: the pick is the direct expression of INV1 — OAuth delegation, no stored passwords or password reset flows. No slice may later introduce Google password-based login as an alternative.
