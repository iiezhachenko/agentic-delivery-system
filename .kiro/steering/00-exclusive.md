# Run the delivery pipeline exclusively
- Do NOT generate or use Kiro's built-in spec files (requirements.md / design.md / tasks.md).
- The methodology is the role prompts under `prompts/<phase>/<ROLE>.md`. Follow them verbatim, in phase order.
- Read inputs from and write outputs to the system's artifact tree (`.aprd/ .roadmap/ .adr/ .hld/ .build/`)
  at the repo root (see `10-self-host.md`).
- Honor the system's gates. For self-host (phases 0–3 frozen) the only gate is the parity/value gate.
