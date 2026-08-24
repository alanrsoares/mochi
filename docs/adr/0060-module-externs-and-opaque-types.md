# 0060 — Module extern constructors and opaque foreign types

## Status

Accepted.

## Context

Mochi's `extern` declarations could import a JS function, and ADR 0059 added
direct global/property/method/constructor conventions. That covered
`new "Date"`, but not the common binding shape used by Three.js and similar
ESM packages: import a class constructor, construct it, then pass its instances
through typed methods. Declaring these objects as `a` loses the distinction
between unrelated host values.

## Decision

Add two small, codegen-only forms:

```mochi
extern type Vector3
extern vector3 : number -> number -> number -> Vector3 = new "three" "Vector3"
```

`extern type Name` creates a nominal, runtime-free foreign type. It has no
constructors and cannot be inspected or constructed in Mochi. The two-string
`new` form imports the named ESM export and emits a curried constructor wrapper.
The existing one-string `new "Date"` form continues to read from `globalThis`.

`send`, `get`, and `set` remain receiver-first and compose with opaque types in
ordinary declared signatures. No TypeScript declarations are read into HM.

## Consequences

Thin bindings can model package constructors and preserve host-object identity
at the Mochi boundary. The language does not gain optional arguments, imported
TypeScript types, structural casts, or kit-specific syntax; those remain future
binding/package concerns.
