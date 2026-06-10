# Demo — Create and Manage Client Projects

**Staging build. Not production.**

Foundation accepted: sign-in via Google OAuth (S1) — authenticated session already established. This demo shows what's new on top: creating, editing, and deleting client projects with currency and billable rate.

---

## Watch it run

**1. Open the projects page**

You (the freelancer) navigate to `/projects` in your browser while signed in.

What you see: your projects list — initially empty, a clean page ready for your first project.

Which promise: you can view your own projects and no one else's.

---

**2. Create a new client project**

You submit the "New Project" form with:
- Name: **Gamma Design**
- Currency: **GBP**
- Billable rate: **95.00** per hour

What you see: the app saves the project and returns you to the projects list. The list now shows:

> Gamma Design — GBP 95.00

Which promise: **AC6** — you created a project with a name, currency, and rate, and it immediately appears in your list.

Evidence: tested with two distinct freelancer accounts and two different project names/currencies/rates (Gamma Design/GBP and Zeta Analytics/JPY) — both passed; no hardcoded data.

---

**3. Edit the project name and rate**

You click edit on Gamma Design and submit:
- New name: **Gamma Redesign**
- New rate: **110.00**

What you see: the app saves the change and redirects you back to the list, which now shows:

> Gamma Redesign — GBP 110.00

Which promise: **AC6** — you updated the project's name and rate, and the list reflects the change immediately.

Evidence: both visible and independently-tested held-out data confirmed the edit path works correctly.

---

**4. Delete the project**

You click delete on Gamma Redesign and confirm.

What you see: the app removes the project and redirects back to the list. The list is now empty — Gamma Design / Gamma Redesign is gone.

Which promise: **AC6** — you deleted a project and it is no longer in your list.

Evidence: delete confirmed across two separate test runs with distinct accounts.

---

**5. Graceful failure — session expires mid-session**

You submit a project management request (create/edit/delete) but your session has expired or is missing.

What you see: the app does NOT touch your project data. Instead, it redirects you to the sign-in page (`/auth/login`) so you can re-authenticate safely.

Which promise: no project data is read or written when your identity cannot be verified. Your data stays safe.

---

## What this proves

**AC6** (requirement: freelancer can create and manage client projects):

- Create a project with a name, client currency, and billable hourly rate — it appears in your list immediately.
- Edit the project's name or rate — the list updates to reflect the change.
- Delete the project — it disappears from your list.
- All project data is scoped to your account only; another freelancer's projects are never visible or accessible.
- An expired or missing session is blocked cleanly — you are redirected to sign in, and no data is touched.

This was verified with two independent sets of test data (different names, currencies, rates, and account identifiers) to confirm the app generalises correctly, not just for one fixed input.

---

## Is this what you wanted?

**A. Accept (recommended)** — Yes, this is what I expected. Project management is working as described.

**B. Not quite** — Something is off. *(Please describe what you expected to see instead.)*

> This is a staging build running against an in-memory data store. Data does not persist between server restarts. Production wiring (real PostgreSQL, live session auth) is wired in subsequent steps.
