# 0001 — Sequence expression spread (Array / List / Set)

- **Status:** Proposed (spike)
- **Source:** `src/ast.ts` (`SeqElem`), `src/parser.ts` (`parseArr` / `parseList` / `parseHash`),
  `test/array-spread.spec.ts`

## Context

`Array.prepend` / `append` / `concat` (and List/Set counterparts) cover growth, but
`[a, ...xs, b]` is the obvious surface (and already valid as a *pattern* rest).
Record update already emits native `{ ...base, f: v }`.

## Decision

Shared slot model on Array, List, and Set literals:

```ts
type SeqElem = { kind: "expr"; expr: Expr } | { kind: "spread"; expr: Expr }
```

Any number of spreads, any position. Infer: fixed slots unify with `elem`; each
spread unifies with `con<elem>` for the same constructor (`Array` / `List` / `Set`).

| Surface | Codegen |
|---|---|
| `[a, ...xs]` | native `[a, ...xs]` |
| `@{a, ...xs}` | `_list` with `yield` / `yield*` |
| `#{a, ...s}` | `new Set([a, ...s])` (native dedupe) |

**Set literal:** `#{1, 2}` (no colons) is Set; `#{ "k": v }` stays Map; empty `#{}`
stays Map. Same colon disambiguation Python uses for `{}`.

## Consequences

- Cross-kind spreads are type errors (`@{...array}`, `#{...list}`, …).
- Bootstrap still has `EArr`/`EList` as `[Expr]` — no self-host parse of seq spreads
  or Set literals yet.
- Pattern `[head, ...tail]` / `@{h, ...t}` unchanged.

## Alternatives rejected

- **Single rest slot** (mirror `parr`) — can't express `[a, ...xs, b]`.
- **Desugar to concat helpers in the AST** — heavier than native spread / `yield*`.
- **New Set sigil** — `#{}` already owns the hash; colon-vs-not is enough.
