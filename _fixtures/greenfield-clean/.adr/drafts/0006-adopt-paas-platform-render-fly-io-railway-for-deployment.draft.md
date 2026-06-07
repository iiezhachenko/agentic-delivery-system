---
id: ADR-0006
title: Adopt PaaS platform (e.g., Render, Fly.io, Railway) for deployment
status: Proposed
date: 2026-06-07
class: greenfield
scope: global
mode: foundation
category: Deployment topology
traces: [C1, C2, A6, A13, AC1, INV6, A1]
supersedes: null
superseded_by: null
---

## Context

The application must be deployed to a hosting target that makes it browser-reachable over HTTPS (C1, AC1) without single-vendor lock-in (A6), at personal-tool scale with no horizontal scaling required (A13, INV6), within a two-month build window (C2). Server-side PDF generation (A1) requires the runtime to support the relevant system libraries (WeasyPrint or equivalent). Three categories of deployment target are available: PaaS platforms (Render, Fly.io, Railway), VPS with manual server setup (DigitalOcean, Hetzner, Linode), and a single-container deployment on a container platform. All three satisfy C1/AC1, A6, A13/INV6, and are compatible with the Python/Django (DP2) and PostgreSQL (DP4) picks. The tension is between C2's constraint — minimising infrastructure configuration time before the skeleton is browser-reachable — and the operational control and portability that VPS or containers provide beyond what the contract requires.

## Decision

Adopt the **PaaS platform (e.g., Render, Fly.io, Railway)** as the hosting and deployment target.

## Alternatives considered

- **VPS with manual server setup (e.g., DigitalOcean Droplet, Hetzner Cloud, Linode/Akamai)** — Maximum A6 portability from dozens of providers; full OS-level control allows any system library; fixed monthly cost ($5–10/month) is lowest at A13 scale; SQLite would be trivially compatible (persistent filesystem). Rejected because nginx/Caddy configuration, TLS certificate management, OS security updates, process manager setup (systemd/Gunicorn supervisor), and deployment automation must all be built by the team before the skeleton is browser-reachable (AC1). This is concrete C2 infrastructure overhead — time spent on server provisioning rather than feature delivery — with no aPRD force requiring the deeper A6 portability or OS-level control a VPS provides over PaaS. Ruled out by C2: the setup cost is real and the benefit exceeds what the contract requires.
- **Container platform — single-container deployment (e.g., Fly.io Machines, Render Docker, DigitalOcean App Platform with Docker)** — Container image portability satisfies A6 with deterministic runtime pinning; single-container deployment is INV6-compliant; platform-managed TLS and HTTP routing provide network-facing operational simplicity comparable to PaaS; lower OS maintenance burden than VPS; WeasyPrint system dependencies (Cairo, Pango) are more reliably portable in a container than in a PaaS buildpack. Rejected because Dockerfile authoring and container build pipeline are initial setup steps absent from PaaS buildpack deployment — concrete C2 overhead. The container's portability advantage is marginal for the Python/Django/WeasyPrint stack where standard PaaS Python buildpacks support the required system dependencies (A1's PDF generation via WeasyPrint). No contract force (R*, AC*, A*, INV*) requires the stronger portability guarantee containers provide over PaaS for this specific stack and scale; the overhead is real and the incremental benefit is below the contract's resolution at A13 scale.

## Consequences

- **Positive:** Automated TLS and HTTPS endpoint provisioning closes the FD4 seam (AC1: browser-reachable over HTTPS) with zero server-configuration cost under C2.
- **Positive:** Managed Postgres add-on (Render Postgres, Railway Postgres) integrates with DP4 PostgreSQL pick — persistence seam (FD3) and deployment seam (FD4) close together on one platform.
- **Positive:** Multiple PaaS providers (Render, Fly.io, Railway) satisfy A6 — no single-vendor lock-in; switching requires build-pipeline reconfiguration, not code changes.
- **Positive:** Environment-variable injection (for Django SECRET_KEY, DATABASE_URL, Google OAuth client ID/secret) is platform-managed — no manual secret-file handling.
- **Accepted cost:** PaaS pricing models can change; free-tier sleep-on-idle behaviour on Render means slow first-request responses — a paid plan ($7–15/month) eliminates cold-start but adds cost.
- **Accepted cost:** Build-image customisability is constrained by the platform's Python buildpack; unusual system libraries outside standard buildpack support require a Docker layer or custom buildpack configuration.
- **Accepted cost:** Less control over the runtime environment than VPS or container deployment; OS-level debugging or direct process inspection is not available.
- **Follow-on:** DP4 (persistence): PostgreSQL pick aligns with PaaS managed Postgres add-ons — provision the add-on at skeleton time to exercise the FD3 persistence seam end-to-end.
- **Follow-on:** DP7 (OAuth provider): Google OAuth 2.0 requires the redirect URI to be registered in Google Cloud Console pointing to the PaaS-provisioned HTTPS domain; this domain must be known before OAuth client registration.
- **Follow-on:** INV6: PaaS single-instance deployment is the direct expression of INV6 — no horizontal scaling, no orchestration; the pick constrains all future slices to single-instance assumptions already encoded in INV6.
