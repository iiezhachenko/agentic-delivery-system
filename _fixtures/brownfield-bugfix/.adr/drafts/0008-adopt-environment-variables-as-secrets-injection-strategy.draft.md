---
id: ADR-0008
title: Adopt environment variables as secrets and configuration injection strategy
status: Proposed
date: 2026-06-07
class: greenfield
scope: local
mode: slice
category: Cross-cutting
traces: [A2, A6]
supersedes: null
superseded_by: null
component: C2
resolves: DP9
---

## Context

The skeleton (S1) must load at least two categories of runtime secrets before it can function: OAuth credentials (client ID and client secret for Google OAuth 2.0, per ADR-0005 and A2) and the PostgreSQL connection string (per ADR-0003). These values cannot be hard-coded; they differ across environments (local development vs PaaS production) and must not be committed to the repository.

ADR-0006 fixed the deployment target as a PaaS platform (Render, Fly.io, or Railway). All three of these platforms provide a first-class environment-variable configuration UI that injects named variables into the running process at startup — no additional tooling required. A6 requires portability and avoidance of lock-in to a single large cloud vendor.

The open fork is the injection mechanism: runtime environment variables (set via the PaaS dashboard and read by the application at startup), a managed secrets service (e.g., AWS Secrets Manager, HashiCorp Vault), or dotenv files checked into the repository. This is a cross-cutting structural choice — every component that reads a secret (C2 for OAuth credentials, C1 for the database URL, and the application boot path) must agree on where to look. The skeleton cannot be built without resolving this: C2 and C1 cannot be wired without a concrete mechanism for reading their credentials.

## Decision

Use runtime environment variables as the primary injection mechanism in all deployed environments. For local development, a `.env` file loaded by a dotenv library at startup (e.g., `python-dotenv` for Python) provides the same variables without requiring manual shell export; the `.env` file is excluded from version control (`.gitignore`). The PaaS dashboard (Render, Fly.io, or Railway) sets production and staging values. No managed secrets service is introduced.

## Alternatives considered

- **Managed secrets service (e.g., AWS Secrets Manager, HashiCorp Vault)** — Provides secrets versioning, audit logs, and fine-grained access control. Rejected because A6 prohibits lock-in to a single large cloud vendor; AWS Secrets Manager couples the application to AWS. A vendor-agnostic alternative (Vault) adds operational infrastructure that has no compensating force at the personal-tool scale fixed by A13 and INV6.

- **Dotenv file committed to the repository (production use)** — Simplest local setup; no extra library required. Rejected because committing secrets to a repository violates basic security practice traceable to A2 (OAuth credentials must be stored securely) and would expose credentials to any party with repository access. Acceptable only for local development with a `.gitignore`-excluded file, which this decision already incorporates.

## Consequences

- **Positive:** PaaS-native environment-variable injection (ADR-0006 deployment target) requires no additional infrastructure or vendor dependency. The pattern is portable — the same application reads `os.environ` regardless of which PaaS hosts it, satisfying A6. Local development parity is achieved with a dotenv library without committing secrets.
- **Accepted cost:** Environment variables are process-wide and not namespaced; a misconfigured variable name is a silent failure (the application sees an empty value at startup). The team must document required variable names (e.g., in a `.env.example` file) to prevent misconfiguration.
- **Follow-on:** A `.env.example` file listing all required variable names (without values) should be committed to the repository as part of S1 setup. DERIVE-TESTS (role 7) must account for test-environment variable provisioning when specifying CI pipeline configuration.
