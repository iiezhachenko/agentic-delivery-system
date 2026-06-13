ask: Invert ADP control into an MCP "ADP Powers" server — bake the loop, IO, schema-shaping, and gate-sequencing into code; add context projector + two-tier model fleet (local 8B + Claude) so per-step model context drops ~10× and ~55% of Claude tokens move to free local compute.
branch: feature/mcp-adp-powers
status: pending
date: 2026-06-13
scope:
  - CR-023: MCP driver loop — move STEP 0-6 control prose → code; spine modules become MCP tool bodies unchanged
  - CR-024: context projector — io-manifest hint→field-selector; adp_next projects inputs server-side (closes L7, the dominant token leak)
  - CR-025: two-tier fleet — adp_route_tier + local 8B endpoint; Class-A gated roles default to 8B free, Class-B judgment stays Claude
  - CR-026: role .md thinning — strip server-owned prose (dispatch/guards/schema); keep judgment-only; re-verify each via _fixtures/ both-directions
source: _self-host/00-analysis.md + _self-host/01-8b-offload.md
crs: CR-023, CR-024, CR-025, CR-026
