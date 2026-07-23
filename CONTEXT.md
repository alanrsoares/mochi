# CONTEXT.md — the mochi domain model

The shared vocabulary for designing and discussing the compiler. When a term here has
a precise meaning, use it precisely. Identifiers are exact — they exist in `src/`.

Companion to `AGENTS.md` (how to work) and `docs/adr/` (why). This file is the
ubiquitous language the planning/design skills (`domain-modeling`, `grill-with-docs`,
`improve-codebase-architecture`) build on.

## The pipeline (terms)

```
string ─lex→ Located[] ─parse→ Program ─check→ Program ─typecheck→ Program ─codegen→ string
```

- **lex** — text to tokens. **parse** — tokens to AST. **check** — semantic validation
  (names, exhaustiveness), AST unchanged. **typecheck** — Algorithm W inference over the
  AST, AST unchanged. **codegen** — AST to JavaScript text.
- The AST is **not rewritten** by `check` or `typecheck` — they validate/annotate and
  pass the same `Program` through. Only `codegen` produces a new representation.

## Lexing

- **Token** (`Tok`) — `{ t, ... }` where `t` names the kind (`let`, `type`, `extern`,
  `switch`, `import`, `export`, `eq`, `arrow`, `tarrow`, `pipe`, `bar`, `lparen`,
  `at`, `hash`, `dot`, `colon`, `comma`, `num`, `bool`, `str`, `id`, `eof`, …).
  Digraphs: `|>` → `pipe`, `=>` → `arrow`, `->` → `tarrow`. Sigil punct: `@` → `at`,
  `#` → `hash`.
- **Located** — a token plus its `Span`.
- **Doc comment** — a `///` line. The lexer accumulates them in `pendingDoc` and
  attaches them to the next token. Plain `//` is a throwaway comment.

## Span

- **Span** — `{ start, end }`, **half-open byte offsets** into the source.
- **LineCol** — `{ line, col }`, 1-based, via `lineCol(src, offset)`.
- Every `Located`, every AST node, and every inferred `TypeAt` carries a `Span`. This
  is what makes hover, inlay hints, and diagnostics possible (see ADR on spans-first).

## AST (`src/ast.ts`)

- **Expr** kinds: `num`, `bool`, `str`, `ref`, `call`, `lambda`, `pipe`, `match`,
  `record`, `field`, `arr`, `list`, `map`.
- **Pattern** kinds: `pwild` (`_`), `pbind` (names the scrutinee), `plit`, `pbool`,
  `pstr`, `precord`, `pctor`, `parr`, `plist`. `ArrPat`/`ListPat` carry
  `elems: Pattern[]` and `rest: Pattern | null`.
- **LamParam** — `{kind:"name"}` or `{kind:"precord", fields}` (record-destructuring param).
- **Ctor** — `{ name, fields: CtorField[] }`. **CtorField** — `{ name: string | null, type }`.
  Labelled field → the label is the runtime key; unlabelled → positional `_0`, `_1`, ….
- **Stmt** kinds: `let`, `type`, `extern`, `import`. A `type` stmt is **either** a variant
  (`ctors` non-empty) **or** a transparent record alias (`alias` present, `ctors: []`) —
  never both.
- **TypeExpr** kinds: `tname`, `tarrow`, `tapp`, `tlist`.
- **isCtorName** — `/^[A-Z]/` — an identifier is a constructor iff it is capitalized.

## Collection sigils

| Surface | Token(s) | AST kind | Type |
|---|---|---|---|
| `[1, 2, 3]` | `lbracket`/`rbracket` | `arr` | eager `Array<a>` |
| `@{1, 2, 3}` | `at` + `lbrace` | `list` | lazy `List<a>` (pull-sequence) |
| `#{"a": 1}` | `hash` + `lbrace` | `map` | native `Map<k, v>` |
| `{x: 1, y: 2}` | `lbrace` (no sigil) | `record` | open/closed row |

There is **no Set literal.** The `${…}` sigil was removed (ADR 0008); `$` is not a
token. Sets are built via `Set.fromArray([...])`. `List` is lazy — its patterns lower
to a buffered pull, not to `@onrails/pattern`.

## Types & schemes (`src/types.ts`, `src/infer.ts`)

- **Type** — `var | con | arrow | record`. Constructors `tVar`, `tCon`, `tArrow`,
  `tRecord`, `tApp` (sugar for `tCon` with args).
- **Row** — `empty | rvar | extend`. Constructors `rEmpty`, `rVar`, `rExtend`. Records
  are rows; **row polymorphism** is real (open tails), not faked subtyping.
- **Scheme** — `{ vars, rvars, type }` — a generalized (∀-quantified) type. **Env** —
  `Map<string, Scheme>`. `mono(t)`, `generalize(env, t, s)`, `instantiate(sc, f)`.
- **Fresh** — `{ next }`; the inference supply starts at `1000`, so any type-var id
  `< 1000` is a prelude/alias marker, not an inference var.
- **AliasDef** — `{ name, params, template }`. `foldAliases(t, aliases)` folds a
  matching closed record back to its alias name **for display only** (ADR 0005).
- **Numeric:** one runtime type, `number`. `int`/`float` are transparent aliases today —
  same checking, erase to `number` — with the names reserved for a future split (ADR 0006).

## Unification (`src/unify.ts`)

- **Subst** — `{ tvars: Map<number, Type>, rvars: Map<number, Row> }`.
- **TypeErr** — `{ message }` — unify's narrow error, distinct from `AlangError`.
- `resolve`/`resolveRow` (one-level follow), `zonk`/`zonkRow` (fully apply a subst),
  the `occurs` family (occurs-check), `bindVar`/`bindRowVar`, and `rewriteRow` — which
  brings a label to a row's head, extending an open `rvar` tail with a fresh field +
  fresh tail. That is the mechanism behind row polymorphism.

## Effects — a convention, not a feature

mochi's type system does **not** track effects. There is no effect row, no `IO`/`Task`
type the checker enforces. The discipline is: an effectful `extern` *should* be typed to
return `Task a`, and effects stay at the FFI boundary. This is unenforceable mechanically
(the compiler can't inspect a JS export's body) and is deliberate (ADR 0004).

## Extern / FFI

- Surface: `extern name : type = "module" "export"`.
- Lowers to `import { <export> as <name> } from "<module>";` (bare `import { name }` if
  they match), plus `export { name };` if the extern is exported.

## Module graph (`src/module.ts`)

- **ModuleOutput** — `{ path, js }`. **Loaded** — `{ path, prog }`. **ReadFile** —
  `(path) => Promise<string>`.
- `loadGraph` does DFS with cycle detection (`import cycle through '…'`); `compileGraph`
  compiles each module against its dependencies' already-built `Env`/registry; a missing
  export errors `'<mod>' has no export '<name>'`.
- The driver returns `ResultAsync`, never `Promise<Result>` — one railway across the seam.

## Currying

- The prelude is **data-last** so operations compose under `|>`.
- Surface types stay curried (`a -> b -> c`), but codegen emits **flat** JS functions
  wrapped in `_curry(n, f)` — an over-application-safe bridge; saturated calls allocate
  no closures. `collapseLambda` flattens curried lambda chains at arity ≥ 2 (ADR 0003).

## Invariants (always true)

- `check` and `typecheck` never mutate the AST; they return the same `Program`.
- `codegen` is pure and cannot fail (returns `string`, not `Result`).
- Every stage except `codegen` and `format` returns `Result<_, AlangError>`.
- `format` runs lex + parse only — it never type-checks.
- A `switch` is checked for exhaustiveness (including over imported variants) before codegen.
- Generated `switch` uses `@onrails/pattern` (`_tag` discriminant); lazy-`List` matches
  lower to a self-contained pull IIFE instead.
