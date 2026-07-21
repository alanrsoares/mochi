# 0008 — Drop the `${…}` Set literal

- **Status:** Accepted
- **Source:** `docs/CRITIQUE.md` §3; commit `507b8c9`

## Context

The collection family originally had four sigils: `[…]` Array, `@{…}` List, `#{…}` Map,
and `${…}` Set. `${…}` collides head-on with JS template-literal interpolation — the one
guaranteed misfire for a JS audience's muscle memory — and Sets are constructed rarely
enough that the sigil wasn't earning its cost.

## Decision

Remove the `${…}` Set literal entirely: drop the `set` expr kind and the `$` token; `$`
is illegal in source again. Sets are built via `Set.fromArray([...])`.

## Consequences

- One fewer sigil to learn; no clash with template-literal instinct.
- `Set` loses literal sugar — a deliberate, low-traffic trade.
- **Scope:** this resolves only the Set sigil. `#{…}` (Map) and `@{…}` (List) are kept —
  Map's sigil is load-bearing (no tuple type means `Map.of` can't be expressed). The
  broader two-sigils question (`docs/CRITIQUE.md` §3) remains as originally critiqued.

## Alternatives rejected

- Keep `${…}` — leaves the template-literal collision in place.
- A non-colliding replacement sigil for Set — unnecessary once Set went sigil-free.
