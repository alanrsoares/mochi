# Mutual recursion

## Status

**Implemented** (`src/infer.ts`, commit `e9e3b1f`). Top-level `let`s are type-checked by
**strongly-connected component** of the reference graph, so both self-recursion and
mutual recursion type — regardless of definition order.

```alang
let fact = n => switch n { | 0 => 1 | _ => mul(n, fact(sub(n, 1))) }   // ✓ self-recursion

let isEven = n => switch n { | 0 => true  | _ => isOdd(sub(n, 1)) }    // ✓ mutual —
let isOdd  = n => switch n { | 0 => false | _ => isEven(sub(n, 1)) }   //   forward ref OK
```

(See `example.al` for the mutual `isEven`/`isOdd` pair, which the example test compiles.)

## How it works: SCC grouping (Tarjan)

Type-check top-level `let`s by strongly-connected component of the reference graph
instead of one at a time.

1. **Build the reference graph.** Node per top-level `let`. Edge `A → B` when `A`'s body
   references name `B` (walk the body's `ref` nodes; only edges to other top-level lets
   matter — builtins/ctors are already in `env`).

2. **Condense into SCCs, in topological order** (Tarjan yields reverse-topo — reverse
   it). A singleton with no self-edge is an ordinary binding; a singleton with a
   self-edge is self-recursion; a component with ≥2 members is mutual recursion.

3. **Per component, in order:**
   - Pre-bind **every** name in the component to a fresh monotype (`mono(freshVar)`).
   - Infer each body against that shared env.
   - Unify each body's result with its pre-bound self-var.
   - **Generalize the whole group together** once all bodies are inferred, so members can
     be used polymorphically outside the group. Not mid-group — recursion within the
     group stays monomorphic, matching ML's `let rec … and …`.

The no-edge singleton and self-edge singleton fall out as the 1-element cases.

## Scope / caveats

- **Monomorphic within a group** — standard HM restriction (polymorphic recursion is
  undecidable). Fine.
- **Spans** — the component's span set is carried, so a type error inside a mutual group
  still points at the right binding.
- **Codegen** — no special handling: JS `const` closures already resolve mutual
  references at call time (functions aren't invoked until after all `const`s initialize).
  This was purely a type-checking concern.
