# Mutual recursion (deferred)

## Status

Not implemented. Self-recursion **is** typed (see `inferProgram` in `src/infer.ts`):
each `let` name is pre-bound to a fresh monotype before its body is inferred, so
a function can call itself. Bindings are processed **sequentially**, so a name is
only in scope for definitions that come after it.

```alang
let fact = n => switch n { | 0 => 1 | _ => mul(n, fact(sub(n, 1))) }   // ✓ types
```

```alang
let isEven = n => switch n { | 0 => true  | _ => isOdd(sub(n, 1)) }    // ✗ isOdd unbound
let isOdd  = n => switch n { | 0 => false | _ => isEven(sub(n, 1)) }
```

`isOdd` is not yet in scope when `isEven` is inferred. In strict mode this is an
`unbound variable` error; in open-world mode (compile) it silently degrades to a
fresh var and loses the real type.

## Why it's deferred

Mutual recursion is common in the code alang will eventually be written in
(parsers, AST interpreters, alternating tree walks) but rare in ordinary program
logic — single recursion plus `map`/`fold` covers the vast majority. Not blocking
anything today; the fix is standard and self-contained.

## The fix: SCC grouping (Tarjan)

Type-check top-level `let`s by **strongly-connected component** of the
reference graph instead of one at a time.

1. **Build the reference graph.** Node per top-level `let`. Edge `A → B` when
   `A`'s body references name `B` (walk the body's `ref` nodes; only edges to
   other top-level lets matter — builtins/ctors are already in `env`).

2. **Condense into SCCs, in topological order** (Tarjan yields reverse-topo for
   free — reverse it). A singleton with no self-edge is an ordinary
   (non-recursive) binding; a singleton with a self-edge is today's
   self-recursion; a component with ≥2 members is mutual recursion.

3. **Per component, in order:**
   - Pre-bind **every** name in the component to a fresh monotype (`mono(freshVar)`)
     — the current single-binding trick, generalized to the whole group.
   - Infer each body against that shared env.
   - Unify each body's result with its pre-bound self-var.
   - **Generalize the whole group together** once all bodies are inferred, so
     members can be used polymorphically outside the group. (Do NOT generalize
     mid-group — recursion within the group must stay monomorphic, matching
     ML's `let rec … and …`.)

This subsumes the current path: a no-edge singleton and a self-edge singleton
both fall out as the 1-element cases.

## Scope / caveats

- **Monomorphic within a group** — standard HM restriction (polymorphic
  recursion is undecidable). Fine.
- **Spans** — carry the component's span set so a type error inside a mutual
  group still points at the right binding.
- **Codegen** — no change needed. JS `const` closures already resolve mutual
  references at call time (the functions aren't invoked until after all `const`s
  are initialized), so emitted output already runs; this is purely a
  type-checking gap.
- Estimated ~40 lines in `src/infer.ts` plus a small graph helper.
