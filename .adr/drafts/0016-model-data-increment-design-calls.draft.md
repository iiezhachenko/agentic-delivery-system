---
id: ADR-0016
title: MODEL-DATA increment design calls
status: Proposed
date: 2026-06-08
class: self-host
scope: global
mode: foundation
source: _decisions.md
supersedes: null
superseded_by: null
---

## Decision

- **D16 — MODEL-DATA increment design calls (RESOLVED 2026-06-08, under D14 pattern).** Made authoring the 4th Phase-3 increment (MODEL-DATA). **(1) Slice data scope = the entities its introduced box owns + reads (the data-level mirror of DERIVE-COMPONENTS touched_components):** `owned-introduced` = an entity in an introduced (`fleshed_this_slice:true`) box's frozen `owns_entities[]`, carried BY REFERENCE from the frozen `data-model.json`, **verified two ways** (in `owns_entities[]` AND sole `read-write` writer in frozen `accessed_by` via a touched `shared_data` contract); `referenced-read` = an entity the introduced box READS via a touched contract but is owned by a touched REUSED box (e.g. E1 Freelancer read by C3 via CT3). **The D14 trap (load-bearing exclusion):** an entity owned by a DIFFERENT slice's introduced box + unread by this slice is EXCLUDED (E3@C4=S2, E4@C5=S3 absent from S4's scope) — modeled in the skeleton, fleshed by ITS owning slice. **(2) `new_entities`=[] in greenfield (CORRECT, cf `new_components`/`new_contracts`/MAP-NFR mechanisms=[]):** the skeleton modeled the FULL aPRD E-set (bijection); a slice homes a subset. **MODEL-DATA NEVER mints an E*** (Phase-0 element) — a slice requirement needing a thing with no aPRD `E*` → `aprd_defects[]` → Phase 0. **(3) Field-schema accountability, never authoring:** `field_schema_owned_here:true` flags the owned-introduced entity whose frozen `field_schema_deferred_to == target slice` (S4 owns E2/E5/E6/E7's deferred schemas) — but the column/type/DDL layout STAYS deferred (§1.2 named-not-designed through all HLD; realized at the slice's IMPLEMENT, D12). The flag names the on-the-hook slice; it never produces a schema. **(4) Output `.hld/slices/<slice_id>/data-model.json`** (§10 tree; resumability sentinel = its presence); entities carried verbatim from frozen (`ownership_fidelity.re_owned_entities`/`remodeled_entities` MUST be empty — H14 at the data level). **Reuse this owned/referenced scope + carry-by-reference pattern for MAP-NFR→RECONCILE/CRITIQUE increment.** Reopen to author the remaining Phase-3 increment modes.
