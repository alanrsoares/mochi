// Unification for the HM type system. Uses a mutable substitution (union-find
// style) threaded through as `Subst`; every entry point returns a Result so
// type errors are values, consistent with the rest of the compiler.
import { err, isErr, ok, type Result } from "@onrails/result";
import { type Fresh, freshRowVar, freshVar, type Row, rExtend, showType, type Type } from "./types";

export type Subst = { tvars: Map<number, Type>; rvars: Map<number, Row> };
export const emptySubst = (): Subst => ({ tvars: new Map(), rvars: new Map() });

export type TypeErr = { message: string };
const fail = (message: string): Result<never, TypeErr> => err({ message });

// ---- resolution (follow variable chains one level to a head) --------------

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

// Fully apply the substitution ("zonk") — for display and assertions.
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
  }
};

const zonkRow = (row: Row, s: Subst): Row => {
  const r = resolveRow(row, s);
  return r.kind === "extend" ? rExtend(r.label, zonk(r.type, s), zonkRow(r.rest, s)) : r;
};

// ---- occurs checks ---------------------------------------------------------

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
  }
};

// ---- unification -----------------------------------------------------------

// `show` renders a type for error messages. It defaults to `showType`, but
// callers with alias context (infer.ts's `u()` seam) pass a folding renderer so
// a mismatch reads `… with Point`, not `… with { x: number, y: number }`
// (CRITIQUE §4.1). It's invoked only on the failure path, so folding is free.
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
      return fail(`cannot unify ${show(ra)} with ${show(rb)}`);
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

  // Arity hint (CRITIQUE §4.4): a function type on exactly one side almost
  // always means a curried call got the wrong number of arguments — a value was
  // expected but a partially-applied function turned up (too few args), or vice
  // versa. Say so, instead of the baffling raw `X with A -> B` mismatch.
  if ((ra.kind === "arrow") !== (rb.kind === "arrow")) {
    const [fn, val] = ra.kind === "arrow" ? [ra, rb] : [rb, ra];
    return fail(
      `cannot unify ${show(ra)} with ${show(rb)} — a function (${show(fn)}) ` +
        `was used where a ${show(val)} was expected; a call may be missing an argument`,
    );
  }

  return fail(`cannot unify ${show(ra)} with ${show(rb)}`);
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

// ---- row unification -------------------------------------------------------

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

// Bring `label` to the head of a row, extending an open tail if needed.
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
