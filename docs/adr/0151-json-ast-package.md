# 0151 — `@mochi/json`: first-class `Json` AST

- **Status:** Accepted
- **Date:** 2026-10-05
- **Source:** [#165](https://github.com/alanrsoares/mochi/issues/165) (subtask 3.3); [ADR 0150](0150-dict-string-keyed-dictionary.md)

## Context

Consuming untrusted JSON meant raw `extern` bindings or a hand-rolled AST per
project. With `Dict<a>` available, objects can be modeled as dictionaries.

## Decision

A workspace package `@mochi/json` (same shape as `@mochi/test`: a `.mochi` entry
plus a TS runtime adapter) exports:

```mochi
export type Json =
  | JNull | JBool(value: bool) | JNum(value: number)
  | JStr(value: string) | JArr(items: [Json]) | JObj(fields: Dict<Json>)
```

- `parse : string -> Result<Json, string>` — host `JSON.parse`; a syntax error is
  an `Err(message)` value, never a throw. Objects become null-prototype `Dict`s,
  so `__proto__` is an ordinary key.
- `stringify : Json -> Result<string, string>`. Non-finite numbers are rejected
  in both `parse` (e.g. `1e400`) and `stringify`: JSON cannot represent them.
- Option-returning accessors: `field`, `index`, `asString`, `asNumber`,
  `asBool`, `asArray`, `asObject`.

It is a package, not a prelude builtin: no compiler, seed or `.d.ts` change, and
programs that don't import it pay nothing.

## Consequences

- Numbers are JS doubles; integers beyond 2^53 lose precision, as in `JSON.parse`.
- Duplicate object keys: last wins (host behavior).
- Typed decoders/combinators (`decode`-style) are left to a later layer on top.
