# 0157 — `variadic` extern convention

- **Status:** Accepted
- **Date:** 2026-10-06
- **Source:** issue #166; extends the JS calling conventions of ADR 0059

## Decision

`extern` gains a `variadic` convention for host functions that take a rest
argument:

```mochi
extern max : [number] -> number = variadic "Math" "max"
extern log : [string] -> () = variadic "console" "log"
```

It names a global like `global "Math" "max"` but calls it with the list spread:
`const max = ($a0) => globalThis["Math"]["max"](...$a0);`. Mochi sees an
ordinary one-argument function over a list, so inference is unchanged and the
JS and TS backends share one emit.

The signature must be exactly one list parameter (`[a] -> r`); any other shape
is a parse error, since spreading a non-list would fail at runtime.

## Consequences

Direct bindings to `Math.max`, `console.log`, `Array.of` and similar need no
host wrapper. Leading fixed arguments before the spread are not supported; add
them in a later decision if a real binding needs it.

## Alternatives rejected

- A rest-parameter type (`...number`): needs new type syntax and inference rules.
- Auto-spreading any list-typed extern: changes the meaning of existing externs.
