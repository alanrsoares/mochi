# 0062 — Angle-bracket generic syntax

- **Status:** Accepted
- **Source:** `packages/compiler/src/{parser,infer}/`, `bootstrap/{parser,infer,schemes}.mochi`

## Context

Mochi used ML-style juxtaposition for generic binders and applications
(`type Result a e`, `Task a e`). That differs from the JavaScript and TypeScript
ecosystem Mochi targets, including the host declarations where users most often
encounter generic types.

## Decision

Generic binders and applications use angle brackets everywhere:

```mochi
type Result<T, E> = | Ok(value: T) | Err(error: E)

extern map<T, U> : (T -> U) -> T -> U = "./runtime.js" "map"
extern run<T, E> : Task<T, E> -> Result<T, E> = "./runtime.js" "run"
```

Explicit binders resolve before ordinary nominal type names, so uppercase `T` and `U`
are quantified scheme variables. The parser keeps accepting the old spelling during
the migration, but the formatter always writes the angle-bracket form.

## Consequences

Mochi has one familiar generic notation across declarations, annotations, externs,
documentation, and generated examples. This changes no JavaScript output or FFI calling
conventions. The parser, formatter, inference path, and self-hosted compiler carry the
binder list.

## Alternatives rejected

- Keep ML-style juxtaposition as the canonical spelling: concise but mismatched with the
  ecosystem Mochi interoperates with.
- Adopt TS declarations directly: would make `.d.ts` ingestion the source of truth, contrary to ADR 0012.
