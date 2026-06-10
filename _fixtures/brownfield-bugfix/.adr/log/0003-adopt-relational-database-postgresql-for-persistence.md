---
id: ADR-0003
title: Adopt Relational database — PostgreSQL for persistence
status: Accepted
date: 2026-06-07
class: greenfield
scope: global
mode: foundation
category: Persistence
traces: [R7, R8, R9, R10, E1, E2, E3, E4, E5, E6, E7, A2, A6, A13, C2, AC7, AC8, AC9, AC10, INV3, INV4, INV6]
supersedes: null
superseded_by: null
---

## Context

All application state — freelancer identity (E1), client projects (E2), time entries (E3), invoices (E4), and related entities (E5–E7) — must be persisted durably and correctly. The entity model is explicitly relational: freelancers own client projects via foreign key, projects own time entries, time entries aggregate into invoices (R7). Invoice generation requires aggregate functions over time entries for line-item totalling (R8), with currency (R9) and rate-derived totals (R10) per entry. Acceptance criteria AC7 (entry survives navigation), AC8 (PDF line items), AC9 (currency alongside amounts), and AC10 (rate × hours = line total) all require correct cross-entity data integrity. INV3 (project-level currency) and INV4 (project-level rate) are relational invariants. The system must avoid single-vendor lock-in on hosting (A6) and must store only the provider token and user profile reference from OAuth (A2) without passwords. The deployment target (C2-aligned) is PaaS platforms that frequently use ephemeral filesystems on basic tiers. Three datastores are available: PostgreSQL (managed relational), SQLite (embedded relational), and MongoDB (document store). All three are single-server compatible (INV6, A13).

## Decision

Adopt the **Relational database — PostgreSQL** as the datastore for all application persistence.

## Alternatives considered

- **Relational database — SQLite (embedded)** — Satisfies the same relational contract as PostgreSQL: foreign keys, SQL joins, and aggregate functions address R7, R8, R9, R10, AC7, AC8, AC9, AC10; INV3 and INV4 are equally expressible as schema constraints; Django ORM requires minimal configuration change; zero separate database process simplifies A13-scale deployment. Rejected because SQLite introduces a concrete deployment risk under C2: PaaS platforms frequently use ephemeral filesystems on basic tiers, requiring persistent-volume configuration that may not be available or requires additional setup — a configuration burden that does not exist with a managed PostgreSQL add-on. This concrete deployment-path constraint under C2 tips the choice to PostgreSQL, whose managed offerings on the same platforms eliminate the volume-mount concern.
- **Document store — MongoDB** — Can store freelancer profile and project documents, satisfying A2/E1 at a basic level; deployable on a single server (INV6-compatible); provides schema-flexibility during early development with no formal migrations. Rejected because the aPRD entity model (E1–E7) is explicitly relational. MongoDB provides no native referential integrity, so the R7 requirement (time entries associated with their project and freelancer) and AC7 (entry survives navigation) must be enforced at the application layer — a source of silent data-integrity failures if missed. INV3 (project-level currency) and INV4 (project-level rate) are schema-level relational invariants; enforcing them in a document store requires application-layer discipline that schema constraints automatically provide. R8/AC8's invoice aggregation requires a MongoDB aggregation pipeline rather than a SQL query — higher S3 implementation complexity with no contract-grounded benefit. Ruled out by R7, R8, INV3, INV4 combined: the relational mismatch is fundamental to the aPRD's data model, not incidental.

## Consequences

- **Positive:** Schema-level foreign-key integrity enforces the E1→E2→E3→E4 entity chain, satisfying R7 and AC7 with no application-layer redundancy.
- **Positive:** SQL aggregate functions (SUM, GROUP BY) directly support invoice line-item totalling (R8, AC8, R9, AC9, R10, AC10) in S3 without application-layer reduce logic.
- **Positive:** ACID transactions guarantee the persistence seam (FD3) is durable — provider token and user profile reference survive the OAuth callback per A2.
- **Positive:** PostgreSQL managed add-ons on PaaS platforms (Render, Railway) require no volume-mount configuration, simplifying DP10 deployment under C2.
- **Positive:** Django ORM (DP2 pick) integrates with PostgreSQL natively via Alembic/Django migrations — schema evolution per slice is managed.
- **Accepted cost:** Two-process deployment: application server + managed Postgres instance; slightly more hosting cost than embedded SQLite at A13 scale.
- **Accepted cost:** Schema migration management (Alembic or Django migrations) adds one deployment step per slice that embedded SQLite would not require for simple cases.
- **Accepted cost:** Upfront schema design for the FD3 skeleton seam (Freelancer identity table) must be committed before the skeleton can exercise persistence.
- **Follow-on:** DP10 (deployment): the PostgreSQL pick eliminates the PaaS ephemeral-filesystem concern for SQLite; DP10 should prefer PaaS platforms that provide managed Postgres add-ons (Render, Railway, Fly.io with attached Postgres) over bare VPS self-install.
- **Follow-on:** S4 (project management slice): Client Project, Client, and Currency schema columns must be designed at S4 time (deferred per cut); the PostgreSQL relational model is ready to receive them.
- **Follow-on:** S3 (invoice export slice): invoice aggregation queries are SQL GROUP BY + SUM against the time-entry table — the PostgreSQL pick makes this the natural implementation path; no aggregation pipeline design work is required.
