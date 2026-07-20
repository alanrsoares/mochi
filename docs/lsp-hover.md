# LSP: hover-first ergonomics (TypeScript-LSP feel)

## Status

**Steps 1 + 3 shipped.** Hover now leads with the symbol's kind and name
(`let x: T`, `(parameter) x: T`, `(property) x: T`) and surfaces a leading `//`
comment block as a prose paragraph below the fence. Steps 2 (render
polymorphism), 4 (named params in function types), and lambda-param
*binding-site* hover remain open — see the per-step notes below.

The LSP already commits to the TypeScript balance — inlay hints are sparse
(top-level `let` bindings only, `src/inlay.ts`) and everything else is served by
hover on demand (`src/hover.ts`). This doc plans making **hover carry the
weight** so the surface reads like TS, rather than adding more always-on inlays.

### What shipped

- `TypeAt` (`src/infer.ts`) gained an optional `symbol: { kind; name; doc? }`.
  The inferrer tags it at the three sites where it knows a name: the top-level
  `let` binding (`nameSpan`, kind `let`, carrying any doc), a `pbind` pattern
  (kind `parameter`), and a `field` access (kind `property`).
- `hoverAt` returns `{ code, doc? }` instead of a bare string; the server fences
  `code` and appends `doc` as a paragraph. Bare types (no symbol) are unchanged.
- The lexer attaches an own-line leading `//` block to the next token as `doc`
  (consecutive lines join; a blank line or a trailing comment breaks it); the
  parser rides it onto the `let` node (`doc?: string` on the AST).

### Still open

- **Lambda-param binding-site hover.** A `LamParam` carries no span (`src/ast.ts`),
  so hovering the *binding* `x` in `(x) => …` still finds nothing — only *uses*
  of `x` (which are `ref`s, left bare) hover. Closing this needs spans on
  `LamParam`, a parser change. Use sites already work.
- **Steps 2 + 4** (polymorphism rendering, named function-type params) unstarted.

## Why

TypeScript's hover always leads with *what the symbol is*, then its type, then
docs:

```
(parameter) x: number
let user: User
function map<a, b>(f: a -> b, xs: [a]) -> [b]
```

alang's hover today dumps the bare inferred type only:

```alang
User
```

No name, no kind, no docs, no visible polymorphism. It is correct but flat. To
feel like TS we enrich the hover payload, not the inlay density.

## Grounding facts

- `let` has **no annotation syntax** (`src/ast.ts`, `kind: "let"` carries only
  `name`/`value`). Every top-level `let` is genuinely inferred, so the
  top-level-`let` inlay is already the minimum floor — there are no "redundant"
  inlays to suppress.
- `hoverAt(src, offset)` returns only the **type string** for the tightest span
  (`src/hover.ts`). It does not know the *name* or *kind* of the symbol under
  the cursor.
- `showScheme` currently discards quantifiers — `showType(foldAliases(sc.type))`
  (`src/infer.ts:779`). Polymorphism is invisible in both hover and inlay.
- The server (`src/lsp/server.ts`) is a thin adapter: hover wraps the string in
  an ```` ```alang ```` fence; inlays map offset → Position with kind `Type`.

## Plan

Ranked by feel-per-effort. Ship **1 + 3** first (they make hover the primary
surface); **2** pairs naturally with **1**.

### 1. Kind + name lead in hover (biggest win) — ✅ shipped

Prefix the type with the symbol's kind and name, TS-style:

| Symbol under cursor        | Hover renders            |
| -------------------------- | ------------------------ |
| top-level `let`            | `let name: T`            |
| lambda / pattern parameter | `(parameter) name: T`    |
| record field access        | `(property) name: T`     |

**Blocker:** `hoverAt` only knows the type, not the symbol identity. Fix by
extending the `TypeAt` record (produced in `src/infer.ts`) to carry an optional
`symbol: { kind: "let" | "parameter" | "property"; name: string }`, populated
where the inferrer already knows it is binding or projecting a name. Then
`hoverAt` formats `kind name: type` when `symbol` is present, falling back to
the bare type otherwise. Server change is cosmetic (the string is still fenced).

### 2. Render polymorphism

Make `showScheme` emit quantified vars instead of collapsing to a monotype-
looking string — e.g. `map<a, b>: (a -> b) -> [a] -> [b]` or a `forall a.`
prefix. Use `Scheme.vars` / `Scheme.rvars` (currently ignored). Hovering a
generic binding then shows its generic signature, as TS does. Once this lands,
route hover for top-level `let` through `showScheme` (not `showType`) so it
matches the inlay.

### 3. Doc-comment surfacing — ✅ shipped

A leading `//` comment on a binding becomes a prose paragraph below the code
fence in the hover markdown — the JSDoc feel:

````
```alang
let user: User
```
The currently authenticated account.
````

Requires the lexer/parser to attach a leading comment to the following `let`
(a `doc?: string` on the node), then the server appends it after the fence.
Cheap, high delight.

### 4. Named params in function types (optional)

`(x: number, y: number) => number` reads better than
`number -> number -> number`. Pull param names from the lambda AST when hovering
a function binding. Nice-to-have; defer until 1–3 prove the direction.

### 5. Inlays stay client-gated (no code)

VS Code already gates the inlay provider behind the user's `inlayHints.enabled`
setting; the server advertises the capability and the client dials it
off / on-hover / always. This is configuration, not a code change — document it
in the extension README rather than touching the server.

## Non-goals

- No new inlay kinds for pattern-bound names (switch arms, destructuring). That
  is the noise this design deliberately avoids — those stay hover-only.
- No effect/purity annotations in hover; effects are a convention, not a type
  (see `docs/effects.md`).
