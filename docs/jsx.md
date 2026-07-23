# JSX for mochi

## Status

**Proposed, not implemented.** No JSX tokens in the lexer, no JSX node in the
AST, no codegen. This doc plans it. The load-bearing insight: JSX for an
HM/ML-family language compiling to JS is a **solved problem** — ReScript did it.
Crib the design instead of inventing one.

## Why

JSX is sugar, not a type-system feature. In mochi the payoff is sharper than in
most languages because JSX props are just a **record**, and mochi already infers
records with Hindley-Milner. A component's prop type comes out for free — no
prop-types, no `@param`, no annotation. Hover shows the inferred props. That is
the whole reason JSX is worth adding here: it costs almost nothing on the type
side and reuses machinery that already exists.

The only real cost is lexing (`<` is context-sensitive). Everything else is a
desugar into calls mochi can already type and emit.

## Design

### One desugar rule, case-driven

mochi already treats a Capitalized name as a constructor. Reuse that split:

```
<div class={c}>{kid}</div>   →   jsx("div", { class: c }, [kid])
<Foo x={1}>{kid}</Foo>       →   Foo({ x: 1, children: [kid] })
<>{a}{b}</>                  →   fragment([a, b])
```

- **lowercase tag** → runtime call `jsx(tag, props, children)`, `tag` a string.
- **Capitalized tag** → plain function call `Foo(record)`. Props is a record →
  HM infers the component's prop type. This is the win.
- **fragment** `<>…</>` → `fragment([...children])`.

### Pluggable runtime via `extern`

`jsx`, `fragment`, and the `Element` type are **`extern`s**, not builtins. mochi
already has `extern name : type = "module" "export"`. So the runtime (React,
Preact, a hand-rolled vdom) is chosen by swapping the imported module — no
pragma, no compiler flag.

```mochi
type Element  // opaque, no runtime

extern jsx : string -> a -> [Element] -> Element = "react/jsx-runtime" "jsx"
extern fragment : [Element] -> Element = "react/jsx-runtime" "Fragment"
```

### Typing under HM

- **`Element`** — one opaque nominal type, no runtime.
- **Children** — `Element`, or `string` / `number` (text). Small coercion set,
  held as `[Element]` after coercion.
- **Component props** — fully inferred. `let Foo = ({ x, children }) => <div/>`
  gives `Foo : { x: a, children: [Element] } -> Element`. Falls out of existing
  record + call inference — the point of the case-driven rule.
- **Intrinsic props** (`div`'s `class`, `onClick`, …) — do NOT type-table all of
  HTML early. Start **loose** (open/untyped intrinsic prop bag). A later slice
  can generate an intrinsic prop-type table. Big table, defer.

## Syntax cost: the lexer

`<` is context-sensitive — less-than operator vs tag-open. This is the only hard
part. Options:

### Option A — parser-driven lexing (RECOMMENDED)

Parser pushes a "JSX mode" flag to the lexer at known JSX-entry positions (after
`=>`, `(`, inside a `{…}` child hole, return position). Correct; some coupling.
ReScript and Babel both do this.

- **Pros**: correct on all `a < b` edge cases; no whitespace heuristics.
- **Cons**: lexer/parser coupling — a mode flag the parser sets.

### Option B — pre-lex heuristic

`<` immediately followed by an ident or `>` with no space = tag-open.

- **Pros**: cheap, no coupling.
- **Cons**: ~95% right; breaks on spacing-sensitive edge cases. Wrong bet for a
  typed language that should never guess.

### Option C — sigil escape

Require a marker before JSX. Rejected — ugly, not Cheng-Lou-minimal.

**Recommendation: Option A.** mochi's lexer is a pass, but a small mode flag
pushed at the few known JSX-entry positions is clean enough and correct. The
heuristic (B) trades correctness for a saving mochi shouldn't want.

## Build sequence

1. **Runtime contract**: `type Element` + `extern jsx` / `extern fragment`. No
   compiler code yet — just the typed surface the desugar targets.
2. **Lexer**: JSX mode (parser-pushed, Option A). Tokens: `<`, `</`, `/>`,
   tag-name, attr name/value, `{`…`}` child hole, text run.
3. **AST/parser**: a `jsx` Expr node `{ tag, attrs, children, span }`; split
   lowercase vs Capitalized at parse or desugar time.
4. **Codegen**: node → `jsx("div", props, kids)` / `Foo(props)` / `fragment(kids)`.
5. **Infer**: `Element` type, children coercion (`string`/`number` → text),
   component-as-record-fn. Mostly falls out of existing call + record inference.
6. **Intrinsic props**: loose bag first; generated prop-type table later. LSP
   hover shows inferred component props once (5) lands.

Biggest leverage: **Capitalized-tag = record-fn call** reuses the whole record +
call inference path. Intrinsics stay loose at first. The lexer mode (step 2) is
the only genuinely new work.
