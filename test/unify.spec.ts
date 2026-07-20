import { expect, test } from "bun:test";
import { isErr, isOk, unwrapErr } from "@onrails/result";
import {
  type Fresh,
  mkFresh,
  rEmpty,
  rExtend,
  rVar,
  showType,
  type Type,
  tApp,
  tArrow,
  tBool,
  tNumber,
  tRecord,
  tString,
  tVar,
} from "../src/types";
import { emptySubst, type Subst, unify, zonk } from "../src/unify";

// Unify a and b in a fresh context; return the zonked form of `view` (default a).
const run = (a: Type, b: Type, view?: Type): { ok: boolean; show: string; s: Subst; f: Fresh } => {
  const s = emptySubst();
  const f = mkFresh(100); // start high so fresh ids don't collide with test vars
  const r = unify(a, b, s, f);
  return { ok: isOk(r), show: isOk(r) ? showType(zonk(view ?? a, s)) : "", s, f };
};

test("bind a variable to a concrete type", () => {
  const r = run(tVar(0), tNumber);
  expect(r.ok).toBe(true);
  expect(r.show).toBe("number");
});

test("unify a -> a with number -> b propagates through both", () => {
  const s = emptySubst();
  const f = mkFresh(100);
  const res = unify(tArrow(tVar(0), tVar(0)), tArrow(tNumber, tVar(1)), s, f);
  expect(isOk(res)).toBe(true);
  expect(showType(zonk(tVar(0), s))).toBe("number");
  expect(showType(zonk(tVar(1), s))).toBe("number");
});

test("con name mismatch fails", () => {
  const r = unify(tNumber, tBool, emptySubst(), mkFresh());
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).message).toContain("cannot unify number with bool");
});

test("occurs check rejects an infinite type", () => {
  const r = unify(tVar(0), tArrow(tVar(0), tNumber), emptySubst(), mkFresh());
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).message).toContain("infinite type");
});

// ---- deep generics ----

test("List<'a> unifies with List<number> and binds the arg", () => {
  const r = run(tApp("List", tVar(0)), tApp("List", tNumber));
  expect(r.ok).toBe(true);
  expect(r.show).toBe("List<number>");
});

test("deeply nested generics unify all the way down", () => {
  // List<Option<'a>>  ~  List<Option<number>>
  const a = tApp("List", tApp("Option", tVar(0)));
  const b = tApp("List", tApp("Option", tNumber));
  const r = run(a, b);
  expect(r.ok).toBe(true);
  expect(r.show).toBe("List<Option<number>>");
});

test("multi-param generic: Map<'k, 'v> ~ Map<string, List<number>>", () => {
  const a = tApp("Map", tVar(0), tVar(1));
  const b = tApp("Map", tString, tApp("List", tNumber));
  const s = emptySubst();
  const res = unify(a, b, s, mkFresh(100));
  expect(isOk(res)).toBe(true);
  expect(showType(zonk(tVar(0), s))).toBe("string");
  expect(showType(zonk(tVar(1), s))).toBe("List<number>");
});

test("generic arity mismatch fails", () => {
  const r = unify(tApp("Pair", tNumber), tApp("Pair", tNumber, tBool), emptySubst(), mkFresh());
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).message).toContain("cannot unify");
});

test("nested generic arg conflict fails with a deep message", () => {
  const a = tApp("List", tApp("Option", tNumber));
  const b = tApp("List", tApp("Option", tString));
  const r = unify(a, b, emptySubst(), mkFresh());
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).message).toContain("cannot unify number with string");
});

// ---- row polymorphism (duck typing) ----

test("open record absorbs the extra field of a closed one", () => {
  // { x: number | 'r }  ~  { x: number, y: string }
  const open = tRecord(rExtend("x", tNumber, rVar(0)));
  const closed = tRecord(rExtend("x", tNumber, rExtend("y", tString, rEmpty)));
  const r = run(open, closed, open);
  expect(r.ok).toBe(true);
  expect(r.show).toBe("{ x: number, y: string }");
});

test("two closed records with differing fields fail on the odd field", () => {
  const need = tRecord(rExtend("x", tNumber, rExtend("y", tString, rEmpty)));
  const have = tRecord(rExtend("x", tNumber, rEmpty));
  const r = unify(need, have, emptySubst(), mkFresh(100));
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).message).toContain("field 'y'"); // "extra"/"missing" per direction

  // and the missing-field message appears when the closed record is on the left
  const r2 = unify(have, need, emptySubst(), mkFresh(100));
  expect(isErr(r2)).toBe(true);
  expect(unwrapErr(r2).message).toContain("missing field 'y'");
});

test("field type conflict fails", () => {
  const a = tRecord(rExtend("x", tNumber, rEmpty));
  const b = tRecord(rExtend("x", tString, rEmpty));
  const r = unify(a, b, emptySubst(), mkFresh(100));
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).message).toContain("cannot unify number with string");
});

test("two open records merge and share a tail", () => {
  // { x: number | 'r0 }  ~  { y: string | 'r1 }
  const left = tRecord(rExtend("x", tNumber, rVar(0)));
  const right = tRecord(rExtend("y", tString, rVar(1)));
  const s = emptySubst();
  const res = unify(left, right, s, mkFresh(100));
  expect(isOk(res)).toBe(true);
  const shown = showType(zonk(left, s));
  expect(shown).toContain("x: number");
  expect(shown).toContain("y: string");
});

test("record holding a generic field unifies deeply", () => {
  // { items: List<'a> | 'r }  ~  { items: List<number>, size: number }
  const a = tRecord(rExtend("items", tApp("List", tVar(0)), rVar(1)));
  const b = tRecord(rExtend("items", tApp("List", tNumber), rExtend("size", tNumber, rEmpty)));
  const r = run(a, b, a);
  expect(r.ok).toBe(true);
  expect(r.show).toBe("{ items: List<number>, size: number }");
});
