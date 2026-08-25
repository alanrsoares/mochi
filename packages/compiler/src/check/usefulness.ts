/**
 * Exhaustiveness by Maranget's usefulness algorithm over a pattern matrix
 * (*Warnings for pattern matching*, JFP 2007), per ADR 0066.
 *
 * The pass this replaces asked a depth-1 question — "is every constructor named
 * by an arm whose arguments are all irrefutable?" — which cannot see that a
 * group of narrowing arms is *jointly* total, so `A(Some(n)) | A(None) | B` was
 * rejected and the suggested fix (`_`) silently disabled exhaustiveness for the
 * whole match.
 *
 * `U(P, q)` is "does `q` match some value no row of `P` matches". A match is
 * exhaustive iff `U(P, (_))` is false; when it is true the same recursion
 * yields the *witness* — the value shape that escapes — which becomes the
 * diagnostic. Reduction is the usual pair: specialization (keep rows whose head
 * is `c` or a wildcard, splice `c`'s arity into the columns) and the default
 * matrix (rows with a wildcard head, first column dropped).
 *
 * Reference implementation consulted: `~/dev/rescript/compiler/ml/parmatch.ml`
 * — `satisfiable` (:1196), `full_match` (:846), `discr_pat` (:618),
 * `build_other` (:1037).
 */

import { match } from "@onrails/pattern";
import type { Pattern } from "../ast/ast";
import type { Registry } from "./check";

/**
 * The matrix works on its own pattern type rather than the AST's: it needs no
 * spans, and dropping them means witnesses can be *built* (a witness is a shape
 * that appears in no source location, so it has no span to carry).
 */
type P =
  | { k: "w" }
  | { k: "ctor"; name: string; args: readonly P[] }
  | { k: "bool"; v: boolean }
  | { k: "num"; v: number }
  | { k: "str"; v: string }
  | { k: "tuple"; elems: readonly P[] }
  | { k: "record"; fields: ReadonlyMap<string, P> }
  /** `rest` true → matches every length ≥ `elems.length`. */
  | { k: "arr"; elems: readonly P[]; rest: boolean }
  /** Lazy-List and anything else the matrix declines to reason about. */
  | { k: "opaque" };

const WILD: P = { k: "w" };
const wilds = (n: number): readonly P[] => Array.from({ length: n }, () => WILD);

/**
 * A column's head constructor. Records and tuples are single-constructor
 * products; arrays are indexed by length.
 */
type Head =
  | { t: "ctor"; name: string }
  | { t: "bool"; v: boolean }
  | { t: "num"; v: number }
  | { t: "str"; v: string }
  | { t: "tuple"; arity: number }
  | { t: "record" }
  | { t: "arr"; len: number };

type Row = readonly P[];
type Matrix = readonly Row[];

/** Result of the usefulness query: a witness row, or null when exhaustive. */
export type Witness = readonly P[] | null;

/**
 * Usefulness is exponential in the worst case, so the recursion carries fuel.
 * ReScript caps at 1000 and bails toward *exhaustive* (`parmatch.ml:1397`,
 * returning `Rnone` = "no matching value"), trading a missed warning for no
 * false positives — right when exhaustiveness is a warning. mochi's is the
 * advertised guarantee, so it bails the other way: out of fuel is reported as
 * non-exhaustive, and the caller says so plainly rather than blaming the code.
 */
const FUEL = 20_000;

// ---------------------------------------------------------------------------
// AST → matrix patterns
// ---------------------------------------------------------------------------

/** Split top-level or-patterns into separate rows — each alt is its own row. */
export const explode = (p: Pattern): readonly Pattern[] =>
  p.kind === "por" ? p.alts.flatMap(explode) : [p];

const toP = (p: Pattern): P =>
  match(p)
    .with({ kind: "pas" }, (pas): P => toP(pas.pat))
    // `_` and a binding always match; `()` does too — `unit` has one inhabitant,
    // so the type decides and the pattern discriminates nothing (ADR 0054).
    .with({ kind: "pwild" }, (): P => WILD)
    .with({ kind: "pbind" }, (): P => WILD)
    .with({ kind: "punit" }, (): P => WILD)
    .with({ kind: "plit" }, (lit): P => ({ k: "num", v: lit.value }))
    .with({ kind: "pbool" }, (b): P => ({ k: "bool", v: b.value }))
    .with({ kind: "pstr" }, (s): P => ({ k: "str", v: s.value }))
    .with({ kind: "ptuple" }, (t): P => ({ k: "tuple", elems: t.elems.map(toP) }))
    .with({ kind: "pctor" }, (c): P => ({ k: "ctor", name: c.ctor, args: c.args.map(toP) }))
    .with(
      { kind: "precord" },
      (r): P => ({
        k: "record",
        fields: new Map(r.fields.map((f) => [f.label, toP(f.pat)])),
      }),
    )
    .with(
      { kind: "parr" },
      (a): P => ({
        k: "arr",
        elems: a.elems.map(toP),
        rest: a.rest !== null,
      }),
    )
    // A lazy List pulls from its generator as it matches, so it cannot be
    // reasoned about positionally (check.ts forbids nesting one). Top-level
    // list switches keep their own rule; here the column is simply opaque.
    .with({ kind: "plist" }, (): P => ({ k: "opaque" }))
    // Or-patterns are exploded into rows before conversion.
    .with({ kind: "por" }, (): P => ({ k: "opaque" }))
    .exhaustive();

// ---------------------------------------------------------------------------
// Column analysis
// ---------------------------------------------------------------------------

const headOf = (p: P): Head | null => {
  switch (p.k) {
    case "w":
      return null;
    case "ctor":
      return { t: "ctor", name: p.name };
    case "bool":
      return { t: "bool", v: p.v };
    case "num":
      return { t: "num", v: p.v };
    case "str":
      return { t: "str", v: p.v };
    case "tuple":
      return { t: "tuple", arity: p.elems.length };
    case "record":
      return { t: "record" };
    case "arr":
      return { t: "arr", len: p.elems.length };
    case "opaque":
      return null;
  }
};

/**
 * The labels a record column discriminates on: the **union across the whole
 * column**, not any single row's shape. Rows that omit a label are padded with
 * a wildcard for it — `discr_pat` accumulates exactly this
 * (`parmatch.ml:627-639`). A record is always a complete signature: the type
 * guarantees every mentioned label is present, and row polymorphism only means
 * *unmentioned* labels are not columns at all.
 */
const recordLabels = (col: readonly P[]): readonly string[] => {
  const seen: string[] = [];
  for (const p of col)
    if (p.k === "record")
      for (const label of p.fields.keys()) if (!seen.includes(label)) seen.push(label);
  return seen;
};

type ArrShape = {
  /** Lengths matched exactly (no `...rest`). */
  readonly fixed: ReadonlySet<number>;
  /** Smallest arity among rest patterns — covers every length ≥ it. */
  readonly restFrom: number | null;
};

const arrShape = (col: readonly P[]): ArrShape => {
  const fixed = new Set<number>();
  let restFrom: number | null = null;
  for (const p of col) {
    if (p.k !== "arr") continue;
    if (p.rest) restFrom = restFrom === null ? p.elems.length : Math.min(restFrom, p.elems.length);
    else fixed.add(p.elems.length);
  }
  return { fixed, restFrom };
};

/**
 * Array lengths are an infinite signature, so OCaml calls arrays never-complete
 * (`full_match`, `Tpat_array -> false`) — its array patterns are fixed-length
 * only. mochi has `[x, ...xs]`, which covers every length ≥ its head arity, so
 * a column *is* completable: `[]` plus `[x, ...xs]` is total, which is what
 * this language already accepted before the matrix existed. Complete iff some
 * rest pattern exists and every shorter length is matched exactly.
 */
const arrComplete = ({ fixed, restFrom }: ArrShape): boolean =>
  restFrom !== null && Array.from({ length: restFrom }, (_, i) => i).every((i) => fixed.has(i));

/** The smallest length no row covers — the witness when a column is incomplete. */
const arrMissingLen = ({ fixed, restFrom }: ArrShape): number => {
  for (let n = 0; ; n++) if (!fixed.has(n) && (restFrom === null || n < restFrom)) return n;
};

/**
 * Lengths worth specializing on when the column is complete. Every length ≥
 * `restFrom` is covered by the rest row, so one representative at or above the
 * longest fixed pattern stands for all of them.
 */
const arrLengths = (shape: ArrShape): readonly number[] => {
  const maxFixed = shape.fixed.size === 0 ? -1 : Math.max(...shape.fixed);
  const top = Math.max(maxFixed, shape.restFrom ?? 0);
  return Array.from({ length: top + 1 }, (_, i) => i);
};

// ---------------------------------------------------------------------------
// Specialization and default matrix
// ---------------------------------------------------------------------------

/** Sub-patterns of `p` under head `c`, or null when `p` cannot match `c`. */
function specializeRow(c: Head, p: P, labels: readonly string[]): readonly P[] | null {
  switch (c.t) {
    case "ctor":
      return p.k === "ctor" && p.name === c.name ? p.args : null;
    case "bool":
      return p.k === "bool" && p.v === c.v ? [] : null;
    case "num":
      return p.k === "num" && p.v === c.v ? [] : null;
    case "str":
      return p.k === "str" && p.v === c.v ? [] : null;
    case "tuple":
      return p.k === "tuple" ? p.elems : null;
    case "record":
      return p.k === "record" ? labels.map((l) => p.fields.get(l) ?? WILD) : null;
    case "arr": {
      if (p.k !== "arr") return null;
      if (!p.rest) return p.elems.length === c.len ? p.elems : null;
      // A rest pattern of arity k matches every length ≥ k; the tail it binds
      // is a bind/wild, so it contributes wildcards, never constraints.
      return p.elems.length <= c.len ? [...p.elems, ...wilds(c.len - p.elems.length)] : null;
    }
  }
}

const specialize = (m: Matrix, c: Head, arity: number, labels: readonly string[]): Matrix =>
  m.flatMap((row) => {
    const [head, ...rest] = row;
    if (head === undefined) return [];
    const sub = head.k === "w" ? wilds(arity) : specializeRow(c, head, labels);
    return sub === null ? [] : [[...sub, ...rest]];
  });

/** Rows whose head matches anything, with that column dropped. */
const defaultMatrix = (m: Matrix): Matrix =>
  m.flatMap((row) => (row[0]?.k === "w" ? [row.slice(1)] : []));

// ---------------------------------------------------------------------------
// The usefulness query
// ---------------------------------------------------------------------------

/**
 * `exhausted` is a sticky flag rather than a thrown marker — the compiler
 * reserves throws for `ParseAbort` and one codegen invariant. Once it is set
 * the recursion unwinds by reporting "exhaustive" locally, and the entry point
 * reads the flag to convert that into the non-exhaustive verdict.
 */
type Ctx = { readonly reg: Registry; fuel: number; exhausted: boolean };

/**
 * Is a wildcard row useful against `m` — i.e. is there a value of `width`
 * columns that no row matches? Returns that value as a witness, or null.
 */
function useful(m: Matrix, width: number, ctx: Ctx): Witness {
  if (ctx.fuel-- <= 0) {
    ctx.exhausted = true;
    return null;
  }
  if (width === 0) return m.length === 0 ? [] : null;
  // A row of all-wildcards at width>0 still covers everything below it.
  if (m.length === 0) return wilds(width);

  const col = m.flatMap((row) => (row[0] === undefined ? [] : [row[0]]));
  const heads = col.flatMap((p) => {
    const h = headOf(p);
    return h === null ? [] : [h];
  });

  if (heads.length === 0) {
    // Column is all wildcards — nothing to split on.
    const sub = useful(defaultMatrix(m), width - 1, ctx);
    return sub === null ? null : [WILD, ...sub];
  }

  const kind = heads[0]!.t;
  const labels = kind === "record" ? recordLabels(col) : [];

  const tryHeads = (cs: readonly Head[], arityOf: (c: Head) => number): Witness => {
    for (const c of cs) {
      const arity = arityOf(c);
      const sub = useful(specialize(m, c, arity, labels), arity + width - 1, ctx);
      if (sub !== null) return [rebuild(c, sub.slice(0, arity), labels), ...sub.slice(arity)];
    }
    return null;
  };

  // Products: one constructor, always complete — descend straight into it.
  if (kind === "tuple") {
    const arity = (heads[0] as { t: "tuple"; arity: number }).arity;
    return tryHeads([{ t: "tuple", arity }], () => arity);
  }
  if (kind === "record") return tryHeads([{ t: "record" }], () => labels.length);

  if (kind === "ctor") {
    const names = heads.flatMap((h) => (h.t === "ctor" ? [h.name] : []));
    const owner = ctx.reg.ctor.get(names[0]!)?.type;
    const all = owner === undefined ? undefined : ctx.reg.type.get(owner);
    if (all?.every((n) => names.includes(n)) === true)
      return tryHeads(
        all.map((name): Head => ({ t: "ctor", name })),
        (c) => (c.t === "ctor" ? (ctx.reg.ctor.get(c.name)?.arity ?? 0) : 0),
      );
    // Incomplete: a constructor nobody named is the witness.
    const missing = all?.find((n) => !names.includes(n));
    const sub = useful(defaultMatrix(m), width - 1, ctx);
    if (sub === null) return null;
    const arity = missing === undefined ? 0 : (ctx.reg.ctor.get(missing)?.arity ?? 0);
    const head: P = missing === undefined ? WILD : { k: "ctor", name: missing, args: wilds(arity) };
    return [head, ...sub];
  }

  if (kind === "bool") {
    const vs = new Set(heads.flatMap((h) => (h.t === "bool" ? [h.v] : [])));
    if (vs.has(true) && vs.has(false))
      return tryHeads(
        [
          { t: "bool", v: true },
          { t: "bool", v: false },
        ],
        () => 0,
      );
    const sub = useful(defaultMatrix(m), width - 1, ctx);
    return sub === null ? null : [{ k: "bool", v: !vs.has(true) }, ...sub];
  }

  if (kind === "arr") {
    const shape = arrShape(col);
    if (arrComplete(shape))
      return tryHeads(
        arrLengths(shape).map((len): Head => ({ t: "arr", len })),
        (c) => (c.t === "arr" ? c.len : 0),
      );
    const sub = useful(defaultMatrix(m), width - 1, ctx);
    const len = arrMissingLen(shape);
    return sub === null ? null : [{ k: "arr", elems: wilds(len), rest: false }, ...sub];
  }

  // Infinite signatures (numbers, strings) and opaque columns are never
  // complete — only a wildcard row covers them. The witness enumerates from a
  // seed until it finds a value nobody matched, as `build_other` does
  // (`parmatch.ml:1022`): ints walk 0, 1, 2…; strings grow by length, "" then
  // "*" then "**", so the report names a concrete literal.
  const sub = useful(defaultMatrix(m), width - 1, ctx);
  if (sub === null) return null;
  return [freshLiteral(kind, heads), ...sub];
}

const freshLiteral = (kind: Head["t"], heads: readonly Head[]): P => {
  if (kind === "num") {
    const taken = new Set(heads.flatMap((h) => (h.t === "num" ? [h.v] : [])));
    for (let i = 0; ; i++) if (!taken.has(i)) return { k: "num", v: i };
  }
  if (kind === "str") {
    const taken = new Set(heads.flatMap((h) => (h.t === "str" ? [h.v] : [])));
    for (let i = 0; ; i++) {
      const s = "*".repeat(i);
      if (!taken.has(s)) return { k: "str", v: s };
    }
  }
  return WILD;
};

/** Reassemble a witness head from the sub-witnesses specialization produced. */
const rebuild = (c: Head, args: readonly P[], labels: readonly string[]): P => {
  switch (c.t) {
    case "ctor":
      return { k: "ctor", name: c.name, args };
    case "tuple":
      return { k: "tuple", elems: args };
    case "record":
      return { k: "record", fields: new Map(labels.map((l, i) => [l, args[i] ?? WILD])) };
    case "arr":
      return { k: "arr", elems: args, rest: false };
    case "bool":
      return { k: "bool", v: c.v };
    case "num":
      return { k: "num", v: c.v };
    case "str":
      return { k: "str", v: c.v };
  }
};

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/** Render a witness the way the user would have to write it as an arm. */
export function showWitness(p: P): string {
  switch (p.k) {
    case "w":
    case "opaque":
      return "_";
    case "bool":
      return String(p.v);
    case "num":
      return String(p.v);
    case "str":
      return JSON.stringify(p.v);
    case "ctor":
      return p.args.length === 0 ? p.name : `${p.name}(${p.args.map(showWitness).join(", ")})`;
    case "tuple":
      return `(${p.elems.map(showWitness).join(", ")})`;
    case "record":
      return `{ ${[...p.fields].map(([l, q]) => `${l}: ${showWitness(q)}`).join(", ")} }`;
    case "arr":
      return `[${[...p.elems.map(showWitness), ...(p.rest ? ["..."] : [])].join(", ")}]`;
  }
}

/**
 * A witness that is one constructor applied to nothing but wildcards is the
 * shape the pre-matrix checker used to report as `missing X` — keep that
 * wording for it, so the common "you forgot a variant" case reads the same as
 * it always has and only genuinely nested gaps get the longer form.
 */
export const isPlainCtor = (p: P): p is P & { k: "ctor" } =>
  p.k === "ctor" && p.args.every((a) => a.k === "w");

/**
 * Witnesses that say nothing a constructor name would not say better: a bare
 * wildcard (every arm was guarded, so nothing is covered) or one constructor
 * over wildcards. For these the caller keeps the legacy `missing X` wording.
 */
export const isWideWitness = (p: P): boolean => p.k === "w" || isPlainCtor(p);

export const witnessCtorName = (p: P): string | null => (p.k === "ctor" ? p.name : null);

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export type ExhaustResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly witness: P }
  | { readonly ok: false; readonly exhausted: true };

/**
 * Is this set of (unguarded) arm patterns total? Guarded arms must not be
 * passed — a guard can be false, so such an arm proves nothing.
 */
export function checkExhaustive(patterns: readonly Pattern[], reg: Registry): ExhaustResult {
  const rows: Matrix = patterns.flatMap((p) => explode(p).map((alt) => [toP(alt)]));
  const ctx: Ctx = { reg, fuel: FUEL, exhausted: false };
  const w = useful(rows, 1, ctx);
  if (ctx.exhausted) return { ok: false, exhausted: true };
  return w === null ? { ok: true } : { ok: false, witness: w[0] ?? WILD };
}
