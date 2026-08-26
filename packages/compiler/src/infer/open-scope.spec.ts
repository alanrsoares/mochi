/**
 * Open-world scope guards.
 *
 * `"use open"` hands an unknown ref a fresh type var so host globals need no
 * declaration. That must not extend to a name the module itself binds: such a
 * ref escaped its binder and would throw `ReferenceError` in the emitted JS.
 */

import { expect, test } from "bun:test";
import { inferProgram } from "@mochi/compiler/infer";
import { lex } from "@mochi/compiler/lexer";
import { parse } from "@mochi/compiler/parser";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";

const inferOpen = (src: string) =>
  inferProgram(unwrapOk(parse(unwrapOk(lex(src)))), {}, { open: true });

const messages = (src: string): string[] => unwrapErr(inferOpen(src)).map((d) => d.message);

test("open mode still lets undeclared host globals through", () => {
  const r = inferOpen(`let read = () => localStorage.getItem("k")`);
  expect(isErr(r)).toBe(false);
});

test("open mode rejects a ref that escaped its let-in body", () => {
  // `in` binds only `f(n)`; the `;` sequences a second expression OUTSIDE the
  // binder — the exact shape that shipped a broken theme toggle.
  const src = `let go = () => {
  let n = 1 in f(n);
  g(n)
}`;
  expect(messages(src)).toEqual(["'n' is not in scope here"]);
});

test("open mode rejects a lambda param used outside its lambda", () => {
  const src = `let outer = () =>
  let apply = y => y in
  apply(y)`;
  expect(messages(src)).toEqual(["'y' is not in scope here"]);
});

test("open mode rejects a switch binder used after the arm", () => {
  const src = `let f = v => {
  switch v {
    | Some(inner) => inner
    | None => 0
  };
  inner
}`;
  expect(messages(src)).toEqual(["'inner' is not in scope here"]);
});

test("a name bound only in a sibling function is still out of scope", () => {
  const src = `let a = () =>
  let tmp = 1 in tmp
let b = () => tmp`;
  expect(messages(src)).toEqual(["'tmp' is not in scope here"]);
});

test("shadowing a host global name does not poison other uses", () => {
  // `name` is a local binder in `a` AND a plausible global. Inside its own
  // binder it resolves normally; the guard only fires where it is unbound.
  const r = inferOpen(`let a = () =>
  let name = "x" in name`);
  expect(isErr(r)).toBe(false);
});

test("the diagnostic points at the offending use, not the binder", () => {
  const src = `let go = () => {
  let n = 1 in f(n);
  g(n)
}`;
  const [diag] = unwrapErr(inferOpen(src));
  // The last `n` — the one outside the binder — not either earlier occurrence.
  expect(diag?.span?.start).toBe(src.lastIndexOf("n"));
});
