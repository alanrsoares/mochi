/** Unification for the HM type system. Uses a mutable substitution (union-find style) threaded through as `Subst`; every entry point returns a Result so type errors are values, consistent with the rest of the compiler. */
import { err, isErr, isOk, ok, type Result } from "@onrails/result";
import {
  type Fresh,
  freshRowVar,
  freshVar,
  type LitType,
  type Row,
  rExtend,
  showType,
  TUPLE,
  type Type,
  tNumber,
  tString,
  type UnionType,
} from "../ast/types";

export type Subst = { tvars: Map<number, Type>; rvars: Map<number, Row> };
export const emptySubst = (): Subst => ({ tvars: new Map(), rvars: new Map() });

export type TypeErr = { message: string };
const fail = (message: string): Result<never, TypeErr> => err({ message });

export const resolve = (t: Type, s: Subst): Type => {
  let cur = t;
  while (cur.kind === "var") {
    const next = s.tvars.get(cur.id);
    if (!next) break;
    cur = next;
  }
  return cur;
};

export const resolveRow = (r: Row, s: Subst): Row => {
  let cur = r;
  while (cur.kind === "rvar") {
    const next = s.rvars.get(cur.id);
    if (!next) break;
    cur = next;
  }
  return cur;
};

/** Fully apply the substitution ("zonk") — for display and assertions. */
export const zonk = (t: Type, s: Subst): Type => {
  const r = resolve(t, s);
  switch (r.kind) {
    case "var":
      return r;
    case "con":
      return { kind: "con", name: r.name, args: r.args.map((a) => zonk(a, s)) };
    case "arrow":
      return { kind: "arrow", from: zonk(r.from, s), to: zonk(r.to, s) };
    case "record":
      return { kind: "record", row: zonkRow(r.row, s) };
    case "lit":
      return r;
    case "union":
      return { kind: "union", members: r.members.map((m) => zonk(m, s)) };
  }
};

const zonkRow = (row: Row, s: Subst): Row => {
  const r = resolveRow(row, s);
  return r.kind === "extend" ? rExtend(r.label, zonk(r.type, s), zonkRow(r.rest, s)) : r;
};

const occurs = (id: number, t: Type, s: Subst): boolean => {
  const r = resolve(t, s);
  switch (r.kind) {
    case "var":
      return r.id === id;
    case "con":
      return r.args.some((a) => occurs(id, a, s));
    case "arrow":
      return occurs(id, r.from, s) || occurs(id, r.to, s);
    case "record":
      return occursRow(id, r.row, s);
    case "lit":
      return false;
    case "union":
      return r.members.some((m) => occurs(id, m, s));
  }
};

const occursRow = (id: number, row: Row, s: Subst): boolean => {
  const r = resolveRow(row, s);
  return r.kind === "extend" && (occurs(id, r.type, s) || occursRow(id, r.rest, s));
};

const rowVarOccurs = (id: number, row: Row, s: Subst): boolean => {
  const r = resolveRow(row, s);
  if (r.kind === "rvar") return r.id === id;
  if (r.kind === "extend") return rowVarOccursInType(id, r.type, s) || rowVarOccurs(id, r.rest, s);
  return false;
};

const rowVarOccursInType = (id: number, t: Type, s: Subst): boolean => {
  const r = resolve(t, s);
  switch (r.kind) {
    case "var":
      return false;
    case "con":
      return r.args.some((a) => rowVarOccursInType(id, a, s));
    case "arrow":
      return rowVarOccursInType(id, r.from, s) || rowVarOccursInType(id, r.to, s);
    case "record":
      return rowVarOccurs(id, r.row, s);
    case "lit":
      return false;
    case "union":
      return r.members.some((m) => rowVarOccursInType(id, m, s));
  }
};

const COLLECTIONS = new Set(["Array", "List", "Set", "Map"]);

const isTupleT = (t: Type): boolean => t.kind === "con" && t.name === TUPLE;

/** `((a, b)) =>` vs `(a, b) =>` — extra parens are a tuple param (ADR 0083). */
const TUPLE_PAREN_HINT = "((a, b)) => takes one tuple; (a, b) => takes two arguments";

const tupleParenMsg = (a: Type, b: Type, shown: string): string =>
  isTupleT(a) !== isTupleT(b) ? `${shown} — ${TUPLE_PAREN_HINT}` : shown;

/** Array vs List/Set/Map (and List vs Set, …) — name the qualified fix (ADR 0080). */
const collectionUnifyMsg = (aName: string, bName: string, shown: string): string => {
  if (aName === bName || !COLLECTIONS.has(aName) || !COLLECTIONS.has(bName)) return shown;
  const other = aName === "Array" ? bName : bName === "Array" ? aName : null;
  const hint =
    other === "List"
      ? "unqualified map/filter/length expect Array; use List.map"
      : other === "Set"
        ? "unqualified map/filter/length expect Array; convert with Set.toArray or use Set.*"
        : other === "Map"
          ? "unqualified map/filter/length expect Array; use Map.*"
          : `${aName} and ${bName} are distinct collections`;
  return `${shown} — ${hint}`;
};

/**
 * `show` renders a type for error messages. It defaults to `showType`, but callers with alias context (infer.ts's `u()` seam) pass a folding renderer so a mismatch reads `… with Point`, not `… with { x: number, y: number }` (CRITIQUE §4.1). Invoked only on the failure path, so folding is free.
 */
export const unify = (
  a: Type,
  b: Type,
  s: Subst,
  f: Fresh,
  show: (t: Type) => string = showType,
): Result<Subst, TypeErr> => {
  const ra = resolve(a, s);
  const rb = resolve(b, s);

  if (ra.kind === "var" && rb.kind === "var" && ra.id === rb.id) return ok(s);
  if (ra.kind === "var") return bindVar(ra.id, rb, s, show);
  if (rb.kind === "var") return bindVar(rb.id, ra, s, show);

  if (ra.kind === "con" && rb.kind === "con") {
    if (ra.name !== rb.name || ra.args.length !== rb.args.length)
      return fail(
        tupleParenMsg(
          ra,
          rb,
          collectionUnifyMsg(ra.name, rb.name, `cannot unify ${show(ra)} with ${show(rb)}`),
        ),
      );
    // deep generics: unify type arguments position by position
    let cur = s;
    for (let i = 0; i < ra.args.length; i++) {
      const step = unify(ra.args[i]!, rb.args[i]!, cur, f, show);
      if (isErr(step)) return step;
      cur = step.value;
    }
    return ok(cur);
  }

  if (ra.kind === "arrow" && rb.kind === "arrow") {
    const s1 = unify(ra.from, rb.from, s, f, show);
    return isErr(s1) ? s1 : unify(ra.to, rb.to, s1.value, f, show);
  }

  if (ra.kind === "record" && rb.kind === "record") return unifyRows(ra.row, rb.row, s, f, show);

  // Literal / finite-union algebra (ADR 0012 / Wave 7). Symmetric where both
  // sides are lit/union; lit widens to `string` / `number` so string-expecting
  // hosts still accept `"rose"`. General `string` does *not* unify with a
  // literal union (rejects untyped string vars against `$tone`).
  if (ra.kind === "lit" || rb.kind === "lit" || ra.kind === "union" || rb.kind === "union")
    return unifyLitUnion(ra, rb, s, f, show);

  // Arity hint (CRITIQUE §4.4): a function type on exactly one side almost
  // always means a curried call got the wrong number of arguments — a value was
  // expected but a partially-applied function turned up (too few args), or vice
  // versa. Say so, instead of the baffling raw `X with A -> B` mismatch.
  if ((ra.kind === "arrow") !== (rb.kind === "arrow")) {
    const [fn, val] = ra.kind === "arrow" ? [ra, rb] : [rb, ra];
    return fail(
      tupleParenMsg(
        ra,
        rb,
        `cannot unify ${show(ra)} with ${show(rb)} — a function (${show(fn)}) ` +
          `was used where a ${show(val)} was expected; a call may be missing an argument`,
      ),
    );
  }

  return fail(tupleParenMsg(ra, rb, `cannot unify ${show(ra)} with ${show(rb)}`));
};

const isPrim = (t: Type, name: string): boolean =>
  t.kind === "con" && t.name === name && t.args.length === 0;

const cloneSubst = (s: Subst): Subst => ({
  tvars: new Map(s.tvars),
  rvars: new Map(s.rvars),
});

const adoptSubst = (dst: Subst, src: Subst): void => {
  dst.tvars = src.tvars;
  dst.rvars = src.rvars;
};

/** Rewrite subst entries that resolve to `lit` into the lit's base prim. */
const widenLitBindings = (lit: LitType, s: Subst): void => {
  const base = lit.base === "string" ? tString : tNumber;
  for (const [id, t] of s.tvars) {
    const z = resolve(t, s);
    if (z.kind === "lit" && z.base === lit.base && z.value === lit.value) s.tvars.set(id, base);
  }
};

/** Lit ∈ union, or lit widens to its base prim. */
const unifyLitUnion = (
  a: Type,
  b: Type,
  s: Subst,
  f: Fresh,
  show: (t: Type) => string,
): Result<Subst, TypeErr> => {
  if (a.kind === "lit" && b.kind === "lit") {
    if (a.base === b.base && a.value === b.value) return ok(s);
    // Distinct singletons of the same base (e.g. array `["a","b"]`, Map keys):
    // widen any subst bindings of either lit to the base prim, then succeed.
    if (a.base === b.base) {
      widenLitBindings(a, s);
      widenLitBindings(b, s);
      return ok(s);
    }
    return fail(`cannot unify ${show(a)} with ${show(b)}`);
  }

  if (a.kind === "lit" && isPrim(b, a.base)) return ok(s);
  if (b.kind === "lit" && isPrim(a, b.base)) return ok(s);

  if (a.kind === "lit" && b.kind === "union") return litInUnion(a, b, s, f, show);
  if (b.kind === "lit" && a.kind === "union") return litInUnion(b, a, s, f, show);

  if (a.kind === "union" && b.kind === "union") {
    // Set equality: every member of each side unifies with the other union.
    let cur = s;
    for (const m of a.members) {
      const tryM = unifyMemberAgainstUnion(m, b, cur, f, show);
      if (isErr(tryM)) return tryM;
      cur = tryM.value;
    }
    for (const m of b.members) {
      const tryM = unifyMemberAgainstUnion(m, a, cur, f, show);
      if (isErr(tryM)) return tryM;
      cur = tryM.value;
    }
    return ok(cur);
  }

  // Concrete type ⊆ finite union when the union is not literal-only (e.g.
  // useState setter domain `T | (T -> T)`). Literal unions keep ADR 0012:
  // general `string` must not widen into `"rose" | "amber"`.
  const isLitOnlyUnion = (u: UnionType): boolean => u.members.every((m) => m.kind === "lit");
  if (a.kind === "union" && b.kind !== "union" && b.kind !== "lit" && !isLitOnlyUnion(a)) {
    return unifyMemberAgainstUnion(b, a, s, f, show);
  }
  if (b.kind === "union" && a.kind !== "union" && a.kind !== "lit" && !isLitOnlyUnion(b)) {
    return unifyMemberAgainstUnion(a, b, s, f, show);
  }

  // `string` / other concrete types do not unify with a literal union — that
  // would accept untyped string vars against `$tone: "rose" | …`.
  return fail(`cannot unify ${show(a)} with ${show(b)}`);
};

const unifyMemberAgainstUnion = (
  member: Type,
  u: UnionType,
  s: Subst,
  f: Fresh,
  show: (t: Type) => string,
): Result<Subst, TypeErr> => {
  if (member.kind === "lit") return litInUnion(member, u, s, f, show);
  for (const m of u.members) {
    const trial = cloneSubst(s);
    const step = unify(member, m, trial, f, show);
    if (isOk(step)) {
      adoptSubst(s, trial);
      return ok(s);
    }
  }
  return fail(`cannot unify ${show(member)} with ${show(u)}`);
};

const litInUnion = (
  lit: LitType,
  u: UnionType,
  s: Subst,
  f: Fresh,
  show: (t: Type) => string,
): Result<Subst, TypeErr> => {
  for (const m of u.members) {
    // Exact singleton match — do not use lit↔lit widening (that is for
    // homogeneous collections, not `$tone` membership).
    if (m.kind === "lit" && m.base === lit.base && m.value === lit.value) return ok(s);
    if (m.kind === "lit") continue;
    const trial = cloneSubst(s);
    const step = unify(lit, m, trial, f, show);
    if (isOk(step)) {
      adoptSubst(s, trial);
      return ok(s);
    }
  }
  return fail(`cannot unify ${show(lit)} with ${show(u)}`);
};

const bindVar = (
  id: number,
  t: Type,
  s: Subst,
  show: (t: Type) => string,
): Result<Subst, TypeErr> => {
  if (occurs(id, t, s)) return fail(`infinite type: 't${id} occurs in ${show(zonk(t, s))}`);
  s.tvars.set(id, t);
  return ok(s);
};

const unifyRows = (
  r1: Row,
  r2: Row,
  s: Subst,
  f: Fresh,
  show: (t: Type) => string = showType,
): Result<Subst, TypeErr> => {
  const a = resolveRow(r1, s);
  const b = resolveRow(r2, s);

  if (a.kind === "empty" && b.kind === "empty") return ok(s);
  if (a.kind === "rvar") return bindRowVar(a.id, b, s);
  if (b.kind === "rvar") return bindRowVar(b.id, a, s);
  if (a.kind === "empty" && b.kind === "extend") return fail(`record missing field '${b.label}'`);
  if (a.kind === "extend" && b.kind === "empty") return fail(`record has extra field '${a.label}'`);

  // both extend: pull a's label out of b, unify the field types, recurse on the rest
  if (a.kind === "extend" && b.kind === "extend") {
    const rw = rewriteRow(b, a.label, s, f);
    if (isErr(rw)) return rw;
    const s1 = unify(a.type, rw.value.type, s, f, show);
    return isErr(s1) ? s1 : unifyRows(a.rest, rw.value.rest, s1.value, f, show);
  }

  return fail("cannot unify records");
};

/** Bring `label` to the head of a row, extending an open tail if needed. */
const rewriteRow = (
  row: Row,
  label: string,
  s: Subst,
  f: Fresh,
): Result<{ type: Type; rest: Row }, TypeErr> => {
  const r = resolveRow(row, s);
  if (r.kind === "empty") return fail(`record missing field '${label}'`);
  if (r.kind === "extend") {
    if (r.label === label) return ok({ type: r.type, rest: r.rest });
    const sub = rewriteRow(r.rest, label, s, f);
    return isErr(sub)
      ? sub
      : ok({ type: sub.value.type, rest: rExtend(r.label, r.type, sub.value.rest) });
  }
  // open tail: invent the field and a fresh tail, growing the record
  const freshT = freshVar(f);
  const freshTail = freshRowVar(f);
  s.rvars.set(r.id, rExtend(label, freshT, freshTail));
  return ok({ type: freshT, rest: freshTail });
};

const bindRowVar = (id: number, row: Row, s: Subst): Result<Subst, TypeErr> => {
  const r = resolveRow(row, s);
  if (r.kind === "rvar" && r.id === id) return ok(s);
  if (rowVarOccurs(id, r, s)) return fail("infinite record type");
  s.rvars.set(id, r);
  return ok(s);
};
