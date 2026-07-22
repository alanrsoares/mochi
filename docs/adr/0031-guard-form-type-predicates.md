# 0031 — Guard-form arms as type predicates (TS backend, gap 2)

- **Status:** Accepted (implemented)
- **Source:** conversation 2026-07-22; `docs/TS_EMIT_CHECKPOINT.md` (gap 2);
  `src/codegen.ts` (`genGuardArm`, `patTarget`, `fieldRefine`, `guardBaseType`);
  `src/codegen-ts.ts` (`guardBaseType` hook, `builtinDeclsIn` injection);
  `src/dts.ts` (`guardParamTs`, `builtinDeclsIn`); `docs/adr/0012` (nested
  patterns → guard form); `docs/adr/0026` (TS backend)

## Context

Nested patterns lower to a **guard form** (ADR 0012): `switch` arms whose pattern
isn't a flat matcher-object (`Some(Circle(r))`, `[Circle(r), ...rest]`, records
with nested fields, any `when` arm) emit `match(x).with((_v) => <boolean test>,
handler)`. The `handler` destructures the matched shape (`({ value: { _0: r } })`).

Against the self-hosted `bootstrap/`, `build --emit=ts` left these arms as
`tsc --strict` errors — and the checkpoint mislabeled the cause as "row-polymorphic
records". The real root cause is in ts-pattern's (`@onrails/pattern`) types:

    type Narrow<T, P> = P extends (input: T) => boolean
      ? [GuardTarget<P>] extends [never] ? T : NarrowObject<T, GuardTarget<P>>
      : …
    type GuardTarget<F> = F extends (input: any) => input is infer U ? U : never;

`Narrow` refines the **handler** input only when the guard is a *type predicate*
(`(x): x is U`). Our emitted guards are plain `boolean` guards, so `GuardTarget`
is `never` and the handler sees the **full union** `T`. Destructuring a variant
field off `T` is then TS2339 (`Property 'value' does not exist on Option<Stmt>`).
This accounted for ~20 of the bootstrap's TS2339s — the dominant `.with(guard, …)`
failure, not row-poly. (Annotating the guard *param* doesn't help: ts-pattern's
`with<const P extends Pattern<T>>` + the `Narrow<T, P>`-typed handler defeat
`&&`-narrowing inside the guard body even with an explicit `(_v: T)` annotation.)

## Decision

**Emit each guard-form arm as a type predicate whose target is the pattern's
narrowed type, and run the boolean test over a widened copy.**

```ts
.with((_v): _v is <TARGET> => { const _g: any = _v; return <test over _g>; },
      <handler>)
```

- `<TARGET>` is rendered from the pattern by `patTarget` (in `codegen.ts`, pure
  over `ctorKeys`): a ctor `C(…)` → `Extract<base, { _tag: "C" }>`; a nested
  ctor/record inside a field refines that field by **indexed access**
  (`…["value"]`); a ctor at an array head → a tuple-with-rest
  (`[Extract<…>, ...T[]]`). `base` is the scrutinee's concrete TS type, supplied
  by the `guardBaseType` codegen hook (`dts.guardParamTs`, concrete-only — a
  scrutinee with free vars can't name its generics in a value position, TS2304,
  so those stay the bare boolean guard). `GuardTarget<P>` now extracts `TARGET`,
  so the handler narrows exactly as the pattern does.
- The body tests a `const _g: any = _v` copy, so the boolean conditions never
  fight `_v`'s (un-narrowed) type — the predicate's *return type* carries the
  narrowing claim, the body just has to return a `boolean`.
- A predicate can name a builtin variant (`Option`) the module's type header
  never emitted — `referencedBuiltinTypeDecls` scans binding schemes and type-decl
  fields, not match-scrutinee types. `builtinDeclsIn` (in `dts.ts`) scans the
  emitted body text and injects any missing builtin decl (skipping names the
  header already declares), fixing the resulting TS2749.

The JS backend is untouched: `guardBaseType` returns `null` there, so `genGuardArm`
emits the original `(_v) => …` boolean guard, byte-identical.

## Consequences

- **−23 `tsc` errors: 266 → 243.** TS2339 23 → 1 (the lone survivor is a genuine
  row-poly record update, `{ ...st, sccs }` on a Tarjan accumulator — the *real*
  gap-2-as-originally-scoped, now a single tail case rather than the blocker).
  TS2749 stays 0 (builtin injection). The remaining 243 are the polymorphic
  higher-order tail ADR 0028 left open (TS2345 168, TS7006 40, TS18046 24), plus
  arity knock-ons (TS2554 3) and one row-poly TS2339.
- **JS backend byte-identical** — verified by the fixpoint self-host build in
  `bun run check` (792 tests green).
- Guard-form arms now carry precise handler types instead of leaning on
  ts-pattern's flow analysis, which never applied to boolean guards.
- New guard: a `nested` case in `test/ts-emit-tsc.spec.ts` (ctor-in-ctor,
  ctor-at-array-head) that fails to `tsc --strict`-clean without the predicate.

## Alternatives rejected

- **Annotate the guard param (`(_v: T) => …`).** Rejected: proven insufficient —
  ts-pattern's `const P` + `Narrow<T, P>`-typed handler still defeat `&&`
  narrowing in the guard body, *and* it does nothing for the handler (the actual
  failure), which needs `GuardTarget` to be non-`never`.
- **`match(scrutinee as any)`.** Clears every arm's error at once but erases the
  types of *all* handler params, including the flat arms that type fine today —
  it guts the value of emitting typed `.ts` at all.
- **`_v is any` predicate.** `GuardTarget<P>` = `any`, but `Narrow`'s
  `NarrowObject<T, any>` collapses back to `T` (Extract<T, any> isn't `never`), so
  the handler still sees the full union. No help.
- **Compute the narrowed type in the type system and thread it per node.** The
  narrowed type is exactly what the pattern denotes; rendering it structurally
  from the pattern (`Extract` + indexed access) is simpler than a second
  inference pass and needs only `ctorKeys`, which codegen already has.
- **Widen records to the full inferred field set (the old "gap 2" plan).** Doesn't
  address the dominant cause (guard-form handler narrowing). Left for the lone
  remaining row-poly TS2339 if it's ever worth an ADR of its own.
