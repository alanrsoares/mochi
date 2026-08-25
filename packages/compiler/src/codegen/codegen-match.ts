/** Codegen for `switch`/`match`: lowers each arm to either an @onrails/pattern `.with()` (flat matcher-object form) or a guard predicate (nested patterns, arrays/tuples/or-patterns), plus the bounded-pull IIFE for lazy-List arms. */
import { match } from "@onrails/pattern";
import type { Expr, ListPat, LitPat, MatchArm, MatchExpr, Pattern } from "../ast/ast";
import { type GenCtx, genExpr, genLambdaBody } from "./codegen-core";

/**
 * Emitted `switch` lowers to a match().with().exhaustive() chain targeting
 * @onrails/pattern (emitted into user JS too). Each arm is a single
 * pattern — the common subset both libraries share.
 *
 * A pattern always matches (→ `.otherwise`) when it binds without narrowing: a
 * wildcard, a plain name, or a record whose every field just binds.
 */
const isCatchAll = (p: Pattern): boolean =>
  p.kind === "pwild" ||
  p.kind === "pbind" ||
  (p.kind === "pas" && isCatchAll(p.pat)) ||
  // `()` is irrefutable: `unit` has exactly one inhabitant, so the type decides.
  p.kind === "punit" ||
  (p.kind === "precord" && p.fields.every((f) => isCatchAll(f.pat))) ||
  // A tuple always matches — its arity, not its position, does (irrefutable product).
  (p.kind === "ptuple" && p.elems.every(isCatchAll)) ||
  // [...all] / @{...all} — a bare rest with no fixed head matches anything.
  ((p.kind === "parr" || p.kind === "plist") && p.elems.length === 0 && p.rest !== null);

/**
 * Nested patterns can't lower to matcher objects: @onrails/pattern's matcher
 * compares object values shallowly (`!==`), so `{ value: { _tag: "Sm" } }`
 * never matches. An arm with nesting instead lowers to the guard form the
 * array/tuple arms already use — `.with((_v) => conds, (slot) => body)`.
 * `patConds` renders the refutable tests over a path expression; `patSlot`
 * renders the JS destructuring target for the binding names ("" = a hole, nothing
 * binds beneath). Lazy `plist` never reaches either: nested occurrences are
 * rejected by check.ts, and top-level arms go through `genListMatch`.
 */

/** A `{ key: sub }` entry, punned when the bound name IS the key. */
const keyedSlot = (key: string, sub: string): string => (sub === key ? key : `${key}: ${sub}`);

const patSlot = (p: Pattern, ctx: GenCtx): string =>
  match(p)
    .with({ kind: "pas" }, (pas) => {
      const inner = patSlot(pas.pat, ctx);
      return inner === "" ? pas.name : `${inner}, ${pas.name}`;
    })
    .with({ kind: "pbind" }, (p) => p.name)
    .withOneOf(
      [
        { kind: "pwild" },
        { kind: "punit" },
        { kind: "plit" },
        { kind: "pbool" },
        { kind: "pstr" },
        { kind: "plist" },
      ],
      () => "",
    )
    .with({ kind: "pctor" }, (p) => {
      const keys = ctx.ctorKeys.get(p.ctor);
      const entries = p.args.flatMap((a, i) => {
        const s = patSlot(a, ctx);
        return s === "" ? [] : [keyedSlot(keys?.[i] ?? `_${i}`, s)];
      });
      return entries.length ? `{ ${entries.join(", ")} }` : "";
    })
    .with({ kind: "precord" }, (p) => {
      const entries = p.fields.flatMap((f) => {
        const s = patSlot(f.pat, ctx);
        return s === "" ? [] : [keyedSlot(f.label, s)];
      });
      return entries.length ? `{ ${entries.join(", ")} }` : "";
    })
    .with({ kind: "ptuple" }, (p) => {
      const slots = p.elems.map((e) => patSlot(e, ctx));
      return slots.some((s) => s !== "") ? `[${slots.join(", ")}]` : "";
    })
    .with({ kind: "parr" }, (p) => {
      const slots = p.elems.map((e) => patSlot(e, ctx));
      if (p.rest?.kind === "pbind") slots.push(`...${p.rest.name}`);
      return slots.some((s) => s !== "") ? `[${slots.join(", ")}]` : "";
    })
    // Alternatives bind identical names at identical positions (checked), so any
    // alt's slot destructures the value for the whole arm.
    .with({ kind: "por" }, (p) => patSlot(p.alts[0]!, ctx))
    .exhaustive();

const patConds = (p: Pattern, path: string, ctx: GenCtx): string[] =>
  match(p)
    .with({ kind: "pas" }, (pas) => patConds(pas.pat, path, ctx))
    // `punit` needs no test: `unit` has exactly one inhabitant, so the type alone decides.
    .withOneOf(
      [{ kind: "pwild" }, { kind: "punit" }, { kind: "pbind" }, { kind: "plist" }],
      () => [],
    )
    .withOneOf([{ kind: "plit" }, { kind: "pbool" }, { kind: "pstr" }], (p) => [
      `${path} === ${litValue(p)}`,
    ])
    .with({ kind: "pctor" }, (p) => {
      const keys = ctx.ctorKeys.get(p.ctor);
      return [
        `${path}._tag === ${JSON.stringify(p.ctor)}`,
        ...p.args.flatMap((a, i) => patConds(a, `${path}.${keys?.[i] ?? `_${i}`}`, ctx)),
      ];
    })
    .with({ kind: "precord" }, (p) =>
      p.fields.flatMap((f) => patConds(f.pat, `${path}.${f.label}`, ctx)),
    )
    .with({ kind: "ptuple" }, (p) =>
      // No length guard — tuple arity is guaranteed by the type.
      p.elems.flatMap((e, i) => patConds(e, `${path}[${i}]`, ctx)),
    )
    .with({ kind: "parr" }, (p) => [
      `${path}.length ${p.rest ? ">=" : "==="} ${p.elems.length}`,
      ...p.elems.flatMap((e, i) => patConds(e, `${path}[${i}]`, ctx)),
    ])
    .with({ kind: "por" }, (p) => {
      // `(condsA) || (condsB) || …` — each alt's own conds &&-joined first.
      const alts = p.alts.map((a) => {
        const c = patConds(a, path, ctx);
        return c.length ? c.map((x) => `(${x})`).join(" && ") : "true";
      });
      return [alts.map((a) => `(${a})`).join(" || ")];
    })
    .exhaustive();

/** The handler parameter for a catch-all pattern: bind the name, destructure a record's/tuple's binds, or ignore the value. */
const catchAllParam = (p: Pattern, ctx: GenCtx): string => {
  // `[...all]` / `@{...all}` binds the whole collection to the rest name — NOT
  // a destructure: `[...all]` would copy the array and force a lazy List.
  if (p.kind === "parr" || p.kind === "plist")
    return p.rest?.kind === "pbind" ? `(${p.rest.name})` : "()";
  const slot = p.kind === "pas" ? patSlot(p.pat, ctx) : patSlot(p, ctx);
  return slot === "" ? "()" : `(${slot})`;
};

/**
 * A switch is a "lazy-List match" when it has a narrowing `@{}`/`@{h,...t}` arm
 * (a lone `@{...all}` is a catch-all, not narrowing). check.ts guarantees such a
 * switch is exactly the empty + single-head-cons pair, so it lowers directly.
 */
export const isListMatch = (m: MatchExpr): boolean =>
  m.arms.some((a) => a.pattern.kind === "plist" && !isCatchAll(a.pattern));

/** A lazy tail/rest: replay the still-buffered elements from index `from`, then drain whatever's left in the iterator. `_list` makes it re-iterable + lazy. */
const listTail = (from: number): string =>
  `_list(function* () { for (let _i = ${from}; _i < _b.length; _i++) yield _b[_i]; ` +
  "if (!_done) { let _s; while (!(_s = _it.next()).done) yield _s.value; } })";

/**
 * One narrowing lazy-List arm → an `if (cond) return call;`. A fixed arm `@{a,
 * b}` must see n+1 pulls to prove length exactly n; a cons arm `@{h, ...t}`
 * needs n pulls (length ≥ n) and binds its tail to a lazy List over the rest.
 * Element sub-patterns guard/bind via the general compiler against the buffer
 * (`_b[i]` is already pulled, so nested tests force nothing extra).
 */
const genListArm = (p: ListPat, body: Expr, ctx: GenCtx): string => {
  const n = p.elems.length;
  const guards = p.elems.flatMap((ep, i) => patConds(ep, `_b[${i}]`, ctx));
  const cond = [p.rest ? `_pull(${n})` : `!_pull(${n + 1}) && _b.length === ${n}`, ...guards].join(
    " && ",
  );
  const params: string[] = [];
  const args: string[] = [];
  p.elems.forEach((ep, i) => {
    const slot = patSlot(ep, ctx);
    if (slot !== "") {
      params.push(slot);
      args.push(`_b[${i}]`);
    }
  });
  if (p.rest?.kind === "pbind") {
    params.push(p.rest.name);
    args.push(listTail(n));
  }
  return `  if (${cond}) return ((${params.join(", ")}) => ${genLambdaBody(body, ctx)})(${args.join(", ")});`;
};

/**
 * A lazy-List switch → an IIFE that pulls just enough elements to decide each
 * arm, buffering them so later arms can re-examine a prefix without re-forcing
 * it. Bounded pulls only — a pull-sequence is never fully forced, so this can't
 * use @onrails/pattern (not length-indexable). check.ts proved totality.
 */
const genListMatch = (m: MatchExpr, ctx: GenCtx): string => {
  const arms: string[] = [];
  let fallback = `(() => { throw new Error("non-exhaustive lazy-list switch"); })()`;
  for (const a of m.arms) {
    if (a.pattern.kind === "plist" && !isCatchAll(a.pattern)) {
      arms.push(genListArm(a.pattern, a.body, ctx));
    } else if (isCatchAll(a.pattern)) {
      // `@{...all}` / `_` / bind matches any list; a named rest binds a lazy
      // List over the whole thing (leftover buffer + iterator). Terminal arm.
      const rest =
        a.pattern.kind === "plist" && a.pattern.rest?.kind === "pbind" ? a.pattern.rest.name : null;
      fallback = rest
        ? `((${rest}) => ${genLambdaBody(a.body, ctx)})(${listTail(0)})`
        : genExpr(a.body, ctx);
      break;
    }
  }
  return (
    "((_it) => { const _b = []; let _done = false; " +
    "const _pull = (_n) => { while (_b.length < _n && !_done) { const _s = _it.next(); " +
    "if (_s.done) _done = true; else _b.push(_s.value); } return _b.length >= _n; };\n" +
    `${arms.join("\n")}\n  return ${fallback};\n` +
    `})(${genExpr(m.scrutinee, ctx)}[Symbol.iterator]())`
  );
};

export const genMatch = (m: MatchExpr, ctx: GenCtx): string => {
  if (isListMatch(m)) return genListMatch(m, ctx);
  const parts = [`match(${genExpr(m.scrutinee, ctx)})`];
  // TS backend (ADR 0031): the concrete scrutinee type each guard-form arm
  // narrows FROM. null in JS mode / for generic scrutinees → the bare guard form.
  const base = ctx.guardBaseType?.(m.scrutinee) ?? null;
  let catchAll: MatchArm | undefined;
  for (const arm of m.arms) {
    // A guarded arm narrows regardless of its pattern (the guard can be
    // false), so it always takes the guard form — even `_ when g`.
    if (arm.guard) {
      parts.push(`  ${genGuardArm(arm.pattern, arm.body, arm.guard, base, ctx)}`);
      continue;
    }
    if (isCatchAll(arm.pattern)) {
      catchAll ??= arm;
      continue;
    }
    parts.push(`  ${genWithArm(arm.pattern as NarrowingPattern, arm.body, base, ctx)}`);
  }
  if (catchAll) {
    parts.push(
      `  .otherwise(${catchAllParam(catchAll.pattern, ctx)} => ${genLambdaBody(catchAll.body, ctx)})`,
    );
  } else if (ctx.guardBaseType !== null && m.arms.some((a) => a.pattern.kind === "parr")) {
    // TS backend (ADR 0038): an eager-array match with no catch-all is the
    // `[]` + `[h, ...t]` length partition check.ts proved total. Its guard arms
    // test `.length` — they don't narrow `A[]` structurally, so `@onrails/pattern`'s
    // `.exhaustive()` still sees `A[]` leftover and types as
    // `NonExhaustiveError<A[]>` (TS2322). Close with a throwing `.otherwise`
    // instead: its `never` return is assignable to the declared type, and the
    // branch is dead (totality already proven). JS mode (`guardBaseType` null)
    // keeps `.exhaustive()` — emitted JS stays byte-identical.
    parts.push(`  .otherwise(() => { throw new Error("non-exhaustive match"); })`);
  } else {
    parts.push("  .exhaustive()");
  }
  return parts.join("\n");
};

/** A literal pattern rendered as a JS value for the matcher object / `.with`. */
const litValue = (p: LitPat): string =>
  p.kind === "plit" ? p.raw : p.kind === "pbool" ? String(p.value) : JSON.stringify(p.value);

/**
 * A sub-pattern the flat matcher-object form can express: a bind, wildcard, or
 * primitive literal (the matcher compares values with `!==`, so only
 * primitives are meaningful there). Anything deeper routes to the guard form.
 */
const isFlatSub = (p: Pattern): boolean =>
  p.kind === "pbind" ||
  p.kind === "pwild" ||
  p.kind === "plit" ||
  p.kind === "pbool" ||
  p.kind === "pstr";

/**
 * TS backend (ADR 0031): render a guard-form pattern to the type-predicate
 * target it narrows to, from the scrutinee's concrete `base` type. A ctor
 * contributes `Extract<base, { _tag: "C" }>`; a nested ctor/record inside a field
 * refines that field via indexed access, so the handler input narrows exactly as
 * the pattern does. Pure over `ctx.ctorKeys`; only reachable in TS mode.
 */
const patTarget = (p: Pattern, base: string, ctx: GenCtx): string =>
  match(p)
    .with({ kind: "pas" }, (pas) => patTarget(pas.pat, base, ctx))
    .with({ kind: "pctor" }, (p) => {
      const member = `Extract<${base}, { _tag: ${JSON.stringify(p.ctor)} }>`;
      const keys = ctx.ctorKeys.get(p.ctor);
      const refines = p.args.flatMap((a, i) => {
        const key = keys?.[i] ?? `_${i}`;
        const sub = fieldRefine(a, `${member}[${JSON.stringify(key)}]`, ctx);
        return sub ? [`${JSON.stringify(key)}: ${sub}`] : [];
      });
      return refines.length ? `${member} & { ${refines.join("; ")} }` : member;
    })
    .with({ kind: "precord" }, (p) => {
      const refines = p.fields.flatMap((f) => {
        const sub = fieldRefine(f.pat, `${base}[${JSON.stringify(f.label)}]`, ctx);
        return sub ? [`${JSON.stringify(f.label)}: ${sub}`] : [];
      });
      return refines.length ? `${base} & { ${refines.join("; ")} }` : base;
    })
    .with({ kind: "ptuple" }, (p) => {
      const subs = p.elems.map((e, i) => fieldRefine(e, `(${base})[${i}]`, ctx));
      return subs.every((s) => s === null)
        ? base
        : `[${p.elems.map((_, i) => subs[i] ?? `(${base})[${i}]`).join(", ")}]`;
    })
    .with({ kind: "parr" }, (p) => {
      const elemType = `(${base})[number]`;
      const subs = p.elems.map((e) => fieldRefine(e, elemType, ctx));
      if (subs.every((s) => s === null)) return base;
      const heads = subs.map((s) => s ?? elemType).join(", ");
      return `[${heads}${p.rest ? `, ...${base}` : ""}]`;
    })
    // or-patterns: keep the base (per-alt narrowing would need a union target).
    .withOneOf(
      [
        { kind: "pwild" },
        { kind: "punit" },
        { kind: "pbind" },
        { kind: "plit" },
        { kind: "pbool" },
        { kind: "pstr" },
        { kind: "plist" },
        { kind: "por" },
      ],
      () => base,
    )
    .exhaustive();

/** A field's refined type when its sub-pattern narrows it, else null (the field keeps its declared type — a bind/wildcard/literal needs no narrowing). */
function fieldRefine(p: Pattern, fieldBase: string, ctx: GenCtx): string | null {
  if (p.kind === "pctor") return patTarget(p, fieldBase, ctx);
  if (p.kind === "precord") {
    const t = patTarget(p, fieldBase, ctx);
    return t === fieldBase ? null : t;
  }
  return null;
}

/**
 * The general arm: predicate + destructuring handler, built by the pattern
 * compiler. Handles arbitrary nesting (`Sm(Sm(n))`, `Ok((a, b))`, ctors inside
 * tuples/arrays) and `when` guards. A guard runs after the structural tests
 * (&&-short-circuit), with the pattern's binds rebound from the root by the same
 * destructuring slot the handler uses. In TS mode (`base` set) the arm is a type
 * predicate `(_v): _v is <target>` whose body tests a widened `_g` copy — so the
 * handler input narrows (ADR 0031) without the boolean body fighting `_v`'s type.
 */
const genGuardArm = (
  p: Pattern,
  body: Expr,
  guard: Expr | undefined,
  base: string | null,
  ctx: GenCtx,
): string => {
  const root = base ? "_g" : "_v";
  const conds = patConds(p, root, ctx);
  const slot = p.kind === "pas" ? patSlot(p.pat, ctx) : patSlot(p, ctx);
  if (guard)
    conds.push(
      slot === "" ? `(${genExpr(guard, ctx)})` : `((${slot}) => ${genExpr(guard, ctx)})(${root})`,
    );
  const test = conds.length ? conds.join(" && ") : "true";
  const handler =
    p.kind === "pas"
      ? `(${p.name}) => ${slot === "" ? genLambdaBody(body, ctx) : `((${slot}) => ${genLambdaBody(body, ctx)})(${p.name})`}`
      : `${slot === "" ? "()" : `(${slot})`} => ${genLambdaBody(body, ctx)}`;
  // Emit a type predicate ONLY when it actually refines (target ≠ base): a
  // whole-value pattern with no field narrowing (`[]`, `_ when g`) gains nothing
  // from `_v is base` and would trip TS2677 when `base` is a row-poly `{…} & R`
  // param — the closed `base` string isn't assignable to the open param. The
  // plain boolean guard leaves `_v` at its declared (open) type. (ADR 0031/0034)
  if (base) {
    const target = patTarget(p, base, ctx);
    return target !== base
      ? `.with((_v): _v is ${target} => { const _g: any = _v; return ${test}; }, ${handler})`
      : `.with((_v) => { const _g: any = _v; return ${test}; }, ${handler})`;
  }
  return `.with((_v) => ${test}, ${handler})`;
};

/** A pattern refined by `genGuardArm`'s ctor/record/tuple/array/or handling — the subset `genWithArm` may still take the flat matcher-object fast path for. */
type NarrowingPattern = Extract<
  Pattern,
  { kind: "pctor" | "plit" | "pbool" | "pstr" | "precord" | "parr" | "ptuple" | "por" | "pas" }
>;

const genWithArm = (p: NarrowingPattern, body: Expr, base: string | null, ctx: GenCtx): string =>
  match(p)
    // Array/tuple/or arms always take the guard form (not matcher-object-able).
    .withOneOf([{ kind: "parr" }, { kind: "ptuple" }, { kind: "por" }, { kind: "pas" }], (p) =>
      genGuardArm(p, body, undefined, base, ctx),
    )
    .withOneOf(
      [{ kind: "plit" }, { kind: "pbool" }, { kind: "pstr" }],
      (p) => `.with(${litValue(p)}, () => ${genLambdaBody(body, ctx)})`,
    )
    .with({ kind: "precord" }, (p) => {
      if (!p.fields.every((f) => isFlatSub(f.pat)))
        return genGuardArm(p, body, undefined, base, ctx);
      const lits = p.fields.flatMap((f) =>
        f.pat.kind === "plit" || f.pat.kind === "pbool" || f.pat.kind === "pstr"
          ? [`${f.label}: ${litValue(f.pat)}`]
          : [],
      );
      const slot = patSlot(p, ctx);
      return `.with({ ${lits.join(", ")} }, ${slot === "" ? "()" : `(${slot})`} => ${genLambdaBody(body, ctx)})`;
    })
    .with({ kind: "pctor" }, (p) => {
      // pctor — the flat fast path keeps the readable matcher-object form.
      if (!p.args.every(isFlatSub)) return genGuardArm(p, body, undefined, base, ctx);
      const binds: string[] = []; // "value: r" (or "_0: r" positionally)
      const litFields: string[] = []; // "value: 5" — narrows further
      const keys = ctx.ctorKeys.get(p.ctor);
      p.args.forEach((a, i) => {
        const key = keys?.[i] ?? `_${i}`;
        if (a.kind === "pbind") binds.push(keyedSlot(key, a.name));
        else if (a.kind === "plit" || a.kind === "pbool" || a.kind === "pstr")
          litFields.push(`${key}: ${litValue(a)}`);
        // pwild → don't bind
      });
      const patObj = [`_tag: ${JSON.stringify(p.ctor)}`, ...litFields].join(", ");
      const param = binds.length ? `({ ${binds.join(", ")} })` : "()";
      return `.with({ ${patObj} }, ${param} => ${genLambdaBody(body, ctx)})`;
    })
    .exhaustive();
