# Run delivery pipeline exclusively
- Do NOT generate or use Kiro's built-in spec files (requirements.md / design.md / tasks.md).
- Methodology = role prompts under `prompts/<phase>/<ROLE>.md`. Follow verbatim, in phase order.
- Read inputs from + write outputs to system's artifact tree (`.aprd/ .roadmap/ .adr/ .hld/ .build/`)
  at repo root (see `10-self-host.md`).
- Honor system's gates. Self-host (phases 0–3 frozen) → only gate = parity/value gate.
