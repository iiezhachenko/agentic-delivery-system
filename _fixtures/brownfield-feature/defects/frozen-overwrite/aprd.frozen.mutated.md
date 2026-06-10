# aPRD — Freelancer Time-Tracking and Invoicing Web Application (FROZEN v1) — PLANTED DEFECT (frozen-overwrite / BF1)
#
# DEFECT: the feature was added by MUTATING the frozen baseline v1 in place (R6 reworded to mention tags;
# a new R11 + AC11 jammed into the frozen baseline) instead of creating aprd.v2 + a change request.
# Overlay → .aprd/aprd.frozen.md. The baseline aprd.lock declares status frozen + (in the v2 lock)
# supersedes.v1.content_sha256 f3a1c0...; this body no longer matches → immutability breach.
# The verifier MUST reject: a frozen artifact must never be overwritten (BF1) — change = new version.

> Frozen, signed contract. Immutable — a later change is a new version + change request (P8). Stable IDs (R*, AC*, A*, E*, C*) thread spec → design → code → test (P9).

## PROJECT
A web application that lets freelancers log billable hours against client projects, set per-project rates and currencies, and export monthly PDF invoices summarising those hours.

## CLASS
greenfield

## ENTITIES
- **E1 — Freelancer**: Primary user; logs hours and exports invoices. Authenticates via external OAuth.
- **E2 — Client Project**: A named project owned by a client, against which a freelancer logs billable hours. Carries a single currency and rate.

## REQUIREMENTS
- **R1**: The system must be delivered as a web application.
- **R2**: A freelancer must be able to log billable hours against a client project.
- **R6**: A freelancer must be able to create, manage, AND TAG client projects within the system.   <!-- DEFECT: baseline R6 reworded in the FROZEN v1 to absorb the tag feature. -->
- **R10**: A billable hourly rate must be configurable per project or per time entry to compute invoice monetary totals.
- **R11**: A freelancer must be able to tag a client project with a label.   <!-- DEFECT: new requirement INSERTED into the frozen baseline v1 instead of aprd.v2. -->

## ACCEPTANCE
- **AC6** (req_ref: R6): A freelancer can create a project, it appears in the list, and can be edited/deleted.
- **AC11** (req_ref: R11): The project's stored label field holds the submitted text and renders in the list.   <!-- DEFECT: new acceptance jammed into the frozen v1. -->

<!-- (Remaining baseline R3-R5,R7-R9 / AC1-AC5,AC7-AC10 / E3-E7 / A1-A13 unchanged — omitted in this defect overlay for brevity; the load-bearing breach is that the FROZEN v1 body was modified at all.) -->
