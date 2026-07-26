# 0015 — Preact/React host adapter (typed hooks module)

- **Status:** Accepted
- **Source:** docs dogfood (HeroCarousel hooks port, 2026-07-26); ADR 0011 /
  0012; F#-style “provide types for a host kit” discussion

## Context

Docs dogfood proved hooks *can* live in `.mochi` (Counter, HeroCarousel), but
the seam was shallow:

- Hand `preact-hooks.host.mochi` with weak / lying types (`useEffect` deps as
  opaque `c`, setters as opaque `b`).
- Homogeneous `[t]` cannot express React dep lists → ad-hoc `hookDeps` host
  packer.
- Surface TypeExpr rejected `() -> T` (`expected id, got rparen`), so honest
  nullary domains could not be written on `extern` even though ADR 0014 already
  has internal `unit`.

Per-app host files will rot. A **kit-owned adapter** should own hook schemes,
runtime helpers, and (later) Rules-of-Hooks checking — same niche as
`@mochi/plugin-styled-cva` / `@mochi/plugin-re-reduced`, not core JSX.

F# type providers are the right *metaphor* (compiler materializes a typed view
of a host kit), **not** the architecture: we do **not** ingest arbitrary
`.d.ts` into Algorithm W (ADR 0012 rejection).

## Decision

1. **Package `@mochi/plugin-preact`** (Preact first; React = peer alias /
   compat later). Exports:
   - `preactExtension: HostExtension` — register on the project plugin list.
   - Typed seam module `hooks.mochi` (honest `extern` schemes) + tiny JS
     runtime helpers (`hookDeps`, …).
   - Docs / apps import hooks from the package seam, not hand-copied hosts.

2. **Enable `() -> T` in TypeExpr** (parser + `typeExprToType` → `unit`).
   Closes the ADR 0014 surface gap for annotations / `extern`. Users still
   cannot bind the name `unit`; `()` is the write form.

3. **Preference order (ADR 0012)** stays:
   - typed `extern` on the seam (primary);
   - thin `inferCall` only when a signature would lie (updater overloads,
     future);
   - outbound `.d.mochi.ts` polish tertiary;
   - **no** inbound “TS is source of truth for HM”.

4. **Plugin growth (follow-on waves, not blocking v0):**
   - `inferCall` refinements (e.g. `setState` updater form);
   - optional `check` hook for Rules-of-Hooks;
   - virtual-module resolve so `import { useState } from "@mochi/preact"` works
     without a relative path (needs module-graph package resolution).

5. **Builtin `jsxPlugin` stays framework-agnostic.** The Preact adapter
   configures / documents the `h` pragma; it does not fork JSX parse.

## Consequences

- HeroCarousel / future hook UIs import `@mochi/plugin-preact` seam; delete
  app-local `preact-hooks.host.mochi` once migrated.
- `() -> T` works in `extern` / annots; bootstrap parser must mirror for
  fixpoint.
- Heterogeneous dep lists remain a host helper (`hookDeps`) until a deeper
  list story exists — acceptable, localized in the kit package.
- Opens Wave “Preact adapter” on the tracer; React flavor is a second adapter
  sharing the same patterns, not a core fork.
- **Later (done as tracer #52):** basic hover on `extern` declaration sites
  (surface scheme + `"module" "export"` + `///` docs).

## Alternatives rejected

- **Core React knowledge in `infer.ts`** — violates ADR 0011/0012.
- **Full F# type provider reading `preact` `.d.ts`** — imports TS type system;
  rejected by ADR 0012.
- **Keep per-app opaque hook hosts forever** — scales poorly; dogfood already
  duplicated comments / lies.
- **Require `let-rec` before shipping the adapter** — orthogonal; top-level
  recursion + kit types unblock dogfood now.
