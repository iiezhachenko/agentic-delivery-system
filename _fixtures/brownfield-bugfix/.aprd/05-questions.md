# Clarifying Questions

A few choices to confirm before we build. For each question, reply with the letter that fits best — or pick **Something else** and describe it. Where an option is marked **(recommended)**, that is the default we will use if you skip the question. The assumptions at the end are lower-priority defaults we will apply unless you tell us otherwise.

## Questions

### Q1 · How should the system generate PDF invoices?
<!-- gap_ref: G1 -->
- **A.** The server generates the PDF file automatically and sends it to your browser for download — no manual print step needed. **(recommended)**
- **B.** The invoice is shown as a web page in your browser and you use your browser's print-to-PDF feature to save it — no server-side PDF library required.
- **C.** Something else — please describe.

### Q2 · How will users log in to the system?
<!-- gap_ref: G2 -->
- **A.** Email and password — the system manages credentials, sessions, and password resets directly with no third-party auth service. **(recommended)**
- **B.** Sign in via an external provider (e.g. Google or GitHub login, or company SSO) — the system delegates authentication and stores only the provider token, not a password.
- **C.** Something else — please describe.

### Q3 · What is a "client" in this system — a record you manage, or a user who can log in?
<!-- gap_ref: G3 -->
- **A.** A record only — the client entity stores name, contact details, and billing address visible to you as the freelancer; clients cannot log in or view anything directly. **(recommended)**
- **B.** A portal user — each client can log in to view their own invoices and interact with the system, requiring a separate client account and login flow.
- **C.** Something else — please describe.

### Q4 · Can different time entries on one project use different currencies, or does each project use a single currency?
<!-- gap_ref: G4 -->
- **A.** Each project uses one currency — all time entries and the resulting invoice share the currency set on the project; no per-entry currency needed. **(recommended)**
- **B.** Each individual time entry can have its own currency — the invoice must then handle line items in mixed currencies.
- **C.** Something else — please describe.

### Q5 · Does the system need to convert amounts between currencies, or does each project simply stay in the currency it was created in?
<!-- gap_ref: G5 -->
- **A.** No conversion needed — each project and invoice stays in its chosen currency; no exchange-rate data or external rate service is required. **(recommended)**
- **B.** Live currency conversion is needed — the system connects to an exchange-rate API, converts amounts on demand, and stores both original and converted values.
- **C.** Something else — please describe.

### Q6 · Do you have a specific hosting or infrastructure requirement, or is the team free to choose?
<!-- gap_ref: G6 -->
- **A.** No preference — the team picks the hosting provider and stack (any cloud, VPS, or PaaS) based on cost, timeline, and fit. **(recommended)**
- **B.** A specific provider or constraint is required (e.g. AWS only, Azure, on-premises, or a particular data-residency region) — the stack must conform to that provider's services and tooling.
- **C.** Something else — please describe.

## Assumptions we will make unless you tell us otherwise

- **(G7)** Each account belongs to a single freelancer — no organisation entity, no multi-user membership, no role management.
- **(G8)** Billable rate is set at the project level — all time entries in a project share the same rate; no per-entry rate variation.
- **(G9)** No specific compliance requirements — standard data practices apply with no mandated audit logs, right-to-erasure data model, or data-residency hosting constraint.
- **(G10)** Invoice billing period is always a fixed calendar month — the export UI presents a month-picker with no custom date-range input.
- **(G11)** No limit on clients or projects per account — a freelancer account can hold any number with no enforced quota.
- **(G12)** Minimal invoice format — the PDF contains line items (date, description, hours, rate, line total) and an invoice total only; no logo, legal fields, payment terms, or custom numbering.
- **(G13)** Small personal tool scale — a single-server deployment suffices; no background job queues, horizontal scaling, or caching layer required.
