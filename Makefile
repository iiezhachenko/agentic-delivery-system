# ADP build targets. pack = build shippable tarball; gate (selftest both-directions + payload bar)
# runs INSIDE tools/pack/pack.mjs step 5 — HALT there emits no tarball (verify-before-done).
.PHONY: pack
pack:
	node tools/pack/pack.mjs
