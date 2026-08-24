# 0059 — JS extern calling conventions

- **Status:** Accepted
- **Source:** current ReScript external interop guidance; ADR 0012

## Context

Mochi's typed `extern` could only import an ES module binding. Common JavaScript
boundaries also need globals, object methods, fields, and constructors. Open-world
inference made these easy to reach but erased the typed seam strict Mochi relies on.

## Decision

Keep an extern's declared Mochi type authoritative and add a small, closed,
codegen-only convention set after `=`:

```mochi
extern random : () -> number = global "Math" "random"
extern getId : Document -> string -> Element = send "getElementById"
extern title : Document -> string = get "title"
extern setTitle : Document -> string -> () = set "title"
extern date : number -> Date = new "Date"
```

The original `extern f : T = "module" "export"` stays the module convention.
`send` takes its receiver first; `get`/`set` use a receiver first; `new` looks up
a global constructor. These conventions only affect generated JavaScript and do
not alter HM inference or read host `.d.ts` files.

## Consequences

Interop remains explicit, typed, zero-wrapper at the source boundary, and small
enough to mirror in bootstrap. Future optional arguments, variadics, and tagged
templates require separate decisions.

## Alternatives rejected

- Host `.d.ts` ingestion as the inference source of truth.
- Per-library infer plugins as the default FFI path.
- An unbounded stringly metadata/attribute language.
