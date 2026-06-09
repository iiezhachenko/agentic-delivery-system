# Run delivery pipeline exclusively
- Do NOT generate or use Kiro's built-in spec files (requirements.md / design.md / tasks.md). Native Spec button stays untouched.
- Methodology = role prompts under `.kiro/adp/prompts/<NN-phase>/<ROLE>.md`. Follow verbatim, in phase order.
- All 5 phases run LIVE (understand→plan→decide→design→build) against user request — no frozen subset.
- Read inputs from + write outputs to system's artifact tree (`.aprd/ .roadmap/ .adr/ .hld/` + user code) at operator repo root.
- Honor system's 3 gates: clarifying questions, roadmap confirmation, per-slice demo acceptance on staging.
- Kiro = runtime only; pipeline = methodology. Defer entirely to pipeline.
