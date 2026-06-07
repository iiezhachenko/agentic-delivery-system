# aPRD — Freelancer Time-Tracking and Invoicing Web Application (FROZEN v1)

> Frozen, signed contract. Immutable — a later change is a new version + change request that re-triggers affected downstream stages (P8). Stable IDs (R*, AC*, A*, E*, C*) thread spec → design → code → test (P9). This is the single source of truth every downstream phase reads.

## PROJECT
A web application that lets freelancers log billable hours against client projects, set per-project rates and currencies, and export monthly PDF invoices summarising those hours.

## CLASS
greenfield

## ENTITIES
- **E1 — Freelancer**: Primary user of the system; logs hours and exports invoices. Authenticates via an external OAuth provider (no stored credentials).
- **E2 — Client Project**: A named project owned by a client, against which a freelancer logs billable hours. Carries a single currency and a single billable rate for all its time entries.
- **E3 — Time Entry**: A single logged unit of billable work (hours) tied to a project. Inherits the project's currency and rate; no per-entry rate or currency field.
- **E4 — Invoice**: A monthly PDF document summarising billable hours for a client project. Generated server-side on demand and streamed to the browser as a file download. Covers a fixed calendar month and contains line items plus an invoice total; no logo, legal fields, or payment terms.
- **E5 — Currency**: A currency designation applied to monetary amounts in the system. Set once at the project level; all entries and invoices for that project use the same currency.
- **E6 — Client**: The party that owns a project and to whom an invoice is addressed. Stored as a data record (name, contact details, billing address) visible only to the freelancer; no client login or portal.
- **E7 — Billable Rate**: A monetary rate (per hour) attached to a Client Project. All time entries in the project inherit this rate for invoice calculations.

## REQUIREMENTS
- **R1**: The system must be delivered as a web application.
- **R2**: A freelancer must be able to log billable hours against a client project.
- **R3**: A freelancer must be able to export a monthly PDF invoice.
- **R4**: The system must support multiple currencies.
- **R5**: A freelancer must be able to create and authenticate an account.
- **R6**: A freelancer must be able to create and manage client projects within the system.
- **R7**: All logged time entries must be persisted and associated with their project and freelancer.
- **R8**: The generated PDF invoice must aggregate the month's time entries into line items showing hours, rate, and total.
- **R9**: Each monetary value in the system (rate, line-item total, invoice total) must be stored and displayed with its associated currency.
- **R10**: A billable hourly rate must be configurable per project or per time entry to compute invoice monetary totals.

## CONSTRAINTS
- **C1**: The product must be a web application.
- **C2**: The system should be live within approximately two months.
- **C3**: This is a net-new build with no existing system or codebase.

## ASSUMPTIONS
> Each assumption fills one gap and is traceable to it (gap_ref → G*).

- **A1** (gap_ref: G1): PDF invoices are generated server-side: a backend service (e.g. a PDF library such as Puppeteer or WeasyPrint) generates the PDF file and streams it to the browser as a download. No client-side print-to-PDF flow is required.
- **A2** (gap_ref: G2): Authentication delegates to an external OAuth or social-login provider (e.g. Google or GitHub). The system stores only the provider token and user profile reference; it does not store hashed passwords or manage password resets internally.
- **A3** (gap_ref: G3): A client is a data record only — storing name, contact details, and billing address visible to the freelancer. Clients cannot log in or access any part of the system directly.
- **A4** (gap_ref: G4): Currency is set at the project level. Each Client Project carries a single currency; all of its time entries and the resulting invoice inherit that currency. No per-entry currency field is needed.
- **A5** (gap_ref: G5): No currency conversion is performed. Each project and invoice stays in the currency chosen at creation time. No exchange-rate data and no external rate service are required.
- **A6** (gap_ref: G6): No specific hosting provider is mandated. The team selects a simple managed host that keeps monthly running costs low and avoids lock-in to a single large cloud vendor.
- **A7** (gap_ref: G7): Each account belongs to exactly one freelancer. There is no organisation entity, no multi-user membership, and no role management.
- **A8** (gap_ref: G8): The billable rate is set at the project level. All time entries in a project share the same rate; no per-entry rate variation is supported.
- **A9** (gap_ref: G9): No specific compliance requirements apply. Standard data practices are used; no mandated audit logs, right-to-erasure data model, or data-residency hosting constraint.
- **A10** (gap_ref: G10): The invoice billing period is always a fixed calendar month. The export UI presents a month-picker; no custom date-range input is provided.
- **A11** (gap_ref: G11): There is no enforced limit on the number of clients or projects per freelancer account. Any number may be created without quota checks.
- **A12** (gap_ref: G12): The PDF invoice uses a minimal format containing only the line items (date, description, hours, rate, line total) and an invoice total. No logo, freelancer or client legal details, payment terms, due date, or custom invoice numbering are included.
- **A13** (gap_ref: G13): The system is built for small personal-tool scale (tens of users, low concurrency). A single-server deployment with a synchronous request cycle is sufficient; no background job queues, horizontal scaling, or caching layer is required.

## OUT_OF_SCOPE
- Client-side browser print-to-PDF flow (declined alternative for G1).
- Email and password authentication — including stored hashed credentials, in-house session management, and password reset flows (declined alternative for G2).
- Client login portal — a second authenticated user type, client-facing UI, and separate authentication flow for clients (declined alternative for G3).
- Per-time-entry currency and mixed-currency invoice line items (declined alternative for G4).
- Live exchange-rate conversion — including external rate API integration, rate snapshots, and converted-amount columns in the data model (declined alternative for G5).
- Lock-in to a single large cloud vendor or mandatory use of a specific hosting provider (reflects client free-text decision for G6).
- Organisation or team accounts — multiple freelancers under one organisation, membership management, and role-based access control (declined alternative for G7).
- Per-time-entry billable rate variation — a rate column on individual time entries and rate-history modelling (declined alternative for G8).
- GDPR or equivalent compliance features — audit-log tables, soft-delete/erasure capability, and data-residency hosting constraints (declined alternative for G9).
- Configurable billing period (arbitrary start and end date) for invoice export (declined alternative for G10).
- Enforced quota or cap on the number of clients or projects per account (declined alternative for G11).
- Full-featured invoice fields — logo, freelancer and client legal details, payment terms, due date, sequential invoice numbering, tax fields, and notes (declined alternative for G12).
- Multi-tenant SaaS scale infrastructure — background job queues, connection pooling, caching layer, and horizontal scaling deployment (declined alternative for G13).

## ACCEPTANCE
- **AC1** (req_ref: R1): The application is reachable over HTTP/HTTPS in a standard web browser and renders its entry page without requiring a native app install.
- **AC2** (req_ref: R2): Given a freelancer is signed in and a client project exists, when the freelancer submits a new time entry (date, description, hours) for that project, the entry appears in the project's time-entry list.
- **AC3** (req_ref: R3): Given a freelancer is signed in, when the freelancer selects a project and a calendar month and triggers invoice export, the browser receives a file download with content-type `application/pdf`.
- **AC4** (req_ref: R4): A freelancer can set a different currency on each of two distinct projects; the invoice for each project displays only that project's currency alongside its monetary amounts, with no cross-project currency mixing.
- **AC5** (req_ref: R5): A freelancer can initiate sign-in via the configured OAuth provider (e.g. Google or GitHub), complete the OAuth flow, and arrive at an authenticated session in the application — no password entry is required.
- **AC6** (req_ref: R6): A freelancer can create a new client project (supplying name, associated client, currency, and billable rate), and the project then appears in the freelancer's project list. The freelancer can subsequently edit the project's name or rate and delete the project.
- **AC7** (req_ref: R7): After a freelancer logs a time entry and navigates away from the page, the entry is still present in the project's time-entry list on return, and it remains linked to the same project and the same freelancer account.
- **AC8** (req_ref: R8): The PDF downloaded for a given project and calendar month contains exactly one line item per time entry logged in that month, each line item showing the entry date, description, hours, rate, and computed line total, plus an invoice total equal to the sum of all line totals.
- **AC9** (req_ref: R9): In the application UI and in the downloaded PDF, the billable rate field, each line-item total, and the invoice total each display the project's currency identifier alongside the numeric amount.
- **AC10** (req_ref: R10): A freelancer can set a single billable rate on a project; when a time entry is logged for that project, its computed line total equals hours multiplied by that project rate, as reflected in the downloaded PDF invoice.
