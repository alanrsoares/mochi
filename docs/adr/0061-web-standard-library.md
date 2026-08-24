# 0061 — Web standard-library bindings

- **Status:** Accepted
- **Source:** `examples/snake/src/host/*.ts`, `packages/web/{dom,canvas}.mochi`

## Context

Snake's game and UI are Mochi, but browser APIs are isolated in handwritten TypeScript
host seams. The compiler already supports typed externs and opaque foreign types, but
the browser returns `null` and relies on mutable handles and callback cleanups.

## Decision

Ship browser APIs as `@mochi/web` modules, not compiler syntax. Public Mochi functions
are typed `extern`s over opaque DOM/Canvas types. The small runtime adapter converts
nullish browser results to Mochi's existing `Option`, and exposes mutation only through
named, typed operations such as `setFillStyle` and `storageSet`.

The initial modules are `@mochi/web/dom` and `@mochi/web/canvas`. They cover document
lookup, keyboard subscriptions, animation frames, storage, canvas lookup/context, and
basic 2D drawing. A later `@mochi/web/network` can add fetch/WebSocket after its task and
JSON contracts are designed.

## Consequences

Application Mochi code no longer needs null sentinels or untyped DOM host seams for this
surface. Browser-specific runtime code remains in a package, so the language and its
other targets stay platform-neutral. The adapter is intentionally narrow; it does not
ingest host `.d.ts` files or expose arbitrary property mutation.

## Alternatives rejected

- Browser primitives in the compiler or prelude: couples a general language to the web.
- Treating nullable APIs as non-null opaque values: unsound and the source of Snake's
  `nullEl` workaround.
- A generic `any` DOM bridge: loses the typed FFI boundary.
