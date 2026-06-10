# Delivery Roadmap — Proposed Build Order

We've planned your project as a sequence of working increments. Each one is something you can watch run end-to-end and sign off before we move to the next — so you see value early and often, not all at the end.

## What you'll see first

**S1 — Sign in via OAuth on the web application** — the foundation increment. You'll see a real login flow: click "Sign in", get redirected to the OAuth provider (e.g. Google), approve, and land back in the app as an authenticated user. This one always comes first: it proves every moving part connects end-to-end and retires the riskiest unknowns before we build features on top of it.

## The proposed order

1. **S1 — Sign in via OAuth on the web application** — Foundation that everything else sits on. Proves the OAuth provider round-trip works and wires together all four layers of the system (web layer, business logic, database, external auth service) in one live end-to-end path. Every other slice depends on a working authenticated session, so this must come first.

2. **S4 — Create and manage client projects with currency and billable rate** — Builds the project container. Time entries and invoices both need a project to attach to — this slice creates that structure so the two downstream capabilities (logging time and exporting invoices) have something to work with.

3. **S2 — Log and persist billable time entries against a project** — Delivers the core daily-use capability. Once projects exist and the user is authenticated, they can start logging billable hours against a project and have those entries saved. This is the data that the invoice export will draw from.

4. **S3 — Export a monthly PDF invoice with line items and monetary totals** — Delivers the terminal product output. Pulls together the authenticated session, the projects, and the logged time entries to generate a real PDF invoice — and retires the server-side PDF generation risk (proving the PDF library, file generation, and browser-stream delivery all work).

## Want a different order?

This order is set by what each capability needs built first — there's no alternative order that doesn't build something before the parts it depends on. Confirm to proceed, or tell us if a priority looks wrong.

Reply with the letter that fits:

- **A.** Build it in this order. *(recommended)*
- **B.** Something else — tell us which capability matters most and we'll re-order around it.

*S1 stays first regardless of your choice — it's the foundation that proves the rest can be built.*
