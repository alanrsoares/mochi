# 0064 — Host call shape is a calling convention, not type syntax

- **Status:** Accepted
- **Source:** `packages/compiler/src/{ast/ast.ts,parser/parser.ts,codegen/codegen-decl.ts,dts/dts.ts,module/module.ts}`, `packages/dx/src/format.ts`, `bootstrap/{ast,parser,codegen}.mochi`, `test/curried-extern.spec.ts`
- **Refs:** #50

## Context

Mochi's surface is curried; its JS is not. Every arity-≥2 function lowers to one
flat implementation wrapped in `_curry`, so `f(a, b)`, `f(a)(b)`, and partial
application are all the same call. That works because mochi owns both sides.

At an `extern` it does not own both sides. Given

```mochi
extern makeAdder : number -> number -> number = "./m" "makeAdder"
```

codegen emitted `_curry(2, $makeAdder)` — correct when the host is flat
(`(a, b) => …`), **wrong** when the host is written curried (`a => b => …`): the
bridge calls `$makeAdder(a, b)`, so the second argument lands on the factory and
the callback it returns is never invoked. The signature cannot distinguish the two,
because `a -> b -> c` is the only type either host has.

Issue #50 proposed reading explicit parentheses as the distinction — `a -> b -> c`
flat, `a -> (b -> c)` a callback result — retained as surface metadata and erased
before unification.

## Decision

**The signature always describes mochi-side usage. The host's own shape is a
property of the JS artifact, so it goes in the calling-convention slot** beside
`global`/`send`/`get`/`set`/`new` ([ADR 0059](0059-js-extern-conventions.md)):

```mochi
extern add       : number -> number -> number = "./m" "add"                 // flat host (default)
extern makeAdder : number -> number -> number = curried "./m" "makeAdder"   // host is a => b => c
```

`curried` sets `ExternStmt.curried`; nothing about the type changes. Codegen
normalizes the host to the flat implementation `_curry` expects:

```js
import { makeAdder as $makeAdder } from "./m";
const makeAdder = _curry(2, ($a0, $a1) => $makeAdder($a0)($a1));
```

Consequences of putting it here rather than in the type:

- **Parentheses stay grouping.** `a -> (b -> c)` and `a -> b -> c` are one type
  with one emit, and `fmt` normalizes the former to the latter — stating the
  currying identity instead of hiding a second meaning inside it.
- **Every call shape keeps working** for both host shapes: `f(a, b)`, `f(a)(b)`,
  partial application. The convention changes *how the host is reached*, never what
  mochi code may write.
- **Nothing enters the type system.** No arity on `Type`, no unification change, no
  inference change, so no bootstrap type surgery.
- **The `.d.ts` sidecar describes the host**, so a `curried` host declares
  `(a: A) => (b: B) => R` — one argument per call, no partial-application overloads,
  since mochi's `_curry` wraps that host rather than being exported by it.
- **No migration.** Today's externs are flat and keep their meaning.

Below arity 2 the two host shapes coincide, so `curried` is accepted and ignored
(the plain import is already right). `curried` does not combine with the
`global`/`send`/`get`/`set`/`new` conventions — those name a *member* rather than a
module export, and stacking two shape rules on one seam is not worth the surface;
writing both is a parse error naming the fix.

## Why not the type-syntax route (#50 as proposed)

ReScript is the closest prior art — a curried ML-family language compiling to JS
with a real FFI — and it has now shipped all three designs. Reading v13's source:

- **Punctuation/attributes** (`[@bs]`, `(. a, b) => c`) — abandoned.
- **A nominal wrapper**, `function$<'a, arity>`, with a subtyping rule. The cast is
  still visible in `compiler/ml/ctype.ml:2319`: *"subtype: an uncurried function is
  cast to a curried one"*.
- **Arity in the type**, where it lives today: `Tarrow of arg * type_expr *
  commutable * arity` (`compiler/ml/types.ml:28`, `arity = int option`).
  Crucially, unification *compares* it — `ctype.ml:2330` matches two arrows only
  `when a1 = a2` — and application checks it, raising `Uncurried_arity_mismatch`
  with expected/provided arity (`typecore.ml:3857`), with partial application
  rewriting the arity in the type (`arity - nargs`).

The lesson is not "arity in types is wrong". It is: **if call shape can differ, the
typechecker must be able to see it — or it must not be in the type at all.** The
#50 proposal sat between: parentheses would change emitted call shape while being
erased before inference, so no diagnostic could ever fire and a stray pair of
parentheses would silently change generated code. That is the one combination
ReScript's arc rules out.

Given the choice between putting arity in mochi's `Type` (unify + application
checks + the whole bootstrap mirror) and keeping it out of the type system
entirely, the seam is where the information actually lives: an extern's shape is a
fact about a foreign file, exactly like the module specifier next to it.

## Consequences

- The `_curry`-over-a-curried-host bug is fixed, and stating the host's shape is
  now possible at all.
- One contextual keyword; no runtime helper (the adapter is inlined at the seam).
- `curried` is unverifiable — mochi cannot inspect the host, exactly as it cannot
  verify that `send "trim"` names a real method. Declaring it wrongly is the same
  class of mistake as declaring the wrong type for an extern.
- A host whose shape is *mixed* (`(a, b) => c => d`) still has no spelling. If that
  appears in practice, the convention can grow an explicit count
  (`curried(2)`) without disturbing the type grammar. Not built on speculation.

## Alternatives rejected

- **Grouping as arity intent (#50 as filed).** See above — codegen-visible,
  checker-invisible.
- **Arity on `Type`, ReScript v13 style.** The rigorous version, and the only one
  that could diagnose a bad call. Rejected for now on cost/benefit: it touches
  `types.ts`, `unify.ts`, `infer.ts`, `schemes.ts` and every bootstrap mirror to
  solve a problem that exists only at the FFI seam, where a convention already
  reaches. Revisit if callback-returning functions ever need first-class status
  inside the language.
- **A nominal `Fn2`/`Uncurried` type (PureScript, Scala.js, ReScript v10).** Loud
  and checkable, but it needs a builtin type, unification rules, and wrap/unwrap at
  every boundary — the full cost of the previous option plus new surface.
- **Uncurried by default (ReScript v11+, Gleam, Roc).** Predictable JS, and the
  question stops existing. Rejected: it breaks partial application, which the
  prelude and the self-host lean on throughout.
- **Formatter normalization of `f(a)(b)` → `f(a, b)`** (#50 step 3). Safe
  flattening needs the *emitted* parameter count, not the type: `getHandler = x =>
  makeCb(x)` has type `a -> b -> c` but compiles to a one-parameter arrow, so
  flattening its call breaks. That is cross-module codegen knowledge inside a tool
  that must also format broken files. Out of scope; its own ADR if ever.
