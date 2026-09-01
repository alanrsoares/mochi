// Slice — self-hosted `.d.ts` emit. bootstrap/dts.mochi is compiled by the TS
// compiler, evaluated, and asked for the declaration text of a corpus of
// programs; it must match the TS `emitDts` byte for byte. The printers are
// shared with the typed-TS backend (codegen-ts), so this pins the driver:
// declaration order, builtin variant decls, the `_Curry` import, and the
// `import type * as D` lines a namespace alias needs.
import { expect, test } from "bun:test";
import { emitDtsBootstrap } from "@mochi/compiler/bootstrap";
import { emitDts } from "@mochi/compiler/dts";
import { unwrapOk } from "@onrails/result";

type AlResult = { _tag: "Ok"; value: string } | { _tag: "Err"; error: unknown };

const alDts = (src: string): string => {
  const r = emitDtsBootstrap(src, "@mochi/runtime") as AlResult;
  if (r._tag === "Err") throw new Error(`bootstrap emitDts failed: ${JSON.stringify(r.error)}`);
  return r.value;
};

const tsDts = (src: string): string => unwrapOk(emitDts(src));

const cases: Record<string, string> = {
  "a plain binding": "let answer = 42",
  "a lambda binding curries": "let add = (a, b) => a + b",
  "a docstring rides along": "/// increments\nlet inc = n => n + 1",
  "a variant type declares its tagged union":
    "type Shape = | Circle(r: number) | Square(s: number)",
  "a record alias": "type Point = { x: number, y: number }",
  "a transparent alias": "type Id = number",
  "a generic binding names its type parameters": "let id = x => x",
  "a builtin variant in a binding type is declared": "let head = xs => Array.get(0, xs)",
  "a synthetic $-binder declares nothing": "let f = ((a, b)) => a + b",
  "an opaque extern type": "extern type Vector3",
  "polymorphic record field access": "let nameOf = r => r.name",
};

for (const [name, src] of Object.entries(cases)) {
  test(`dts parity: ${name}`, () => {
    expect(alDts(src)).toBe(tsDts(src));
  });
}
