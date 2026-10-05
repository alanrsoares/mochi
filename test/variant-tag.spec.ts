// Custom variant discriminants (ADR 0156): `@tag("k")` on a variant type and
// `@as("v")` on a ctor override the runtime `{ _tag: "Ctor" }` shape so mochi can
// construct and match TypeScript discriminated unions such as `{ type: "click" }`.
import { expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { codegenTs, compile, emitDts } from "@mochi/compiler";
import { format } from "@mochi/dx/format";
import { compileAndEval, repoRoot } from "@mochi/test-support";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";

const root = repoRoot(import.meta.url);
const CLI = join(root, "packages/cli/src/cli.ts");

const EV = `type Ev =
  | @as("click") Click(x: number, y: number)
  | @as("key") Key(k: string)
  | Idle
`;

/** `@tag` precedes the whole declaration, `export` included. */
const tagged = (exported: boolean) => `@tag("type")\n${exported ? "export " : ""}${EV}`;

const messages = (src: string) => unwrapErr(compile(src)).map((d) => d.message);

test("constructors build the custom discriminant", () => {
  expect(compileAndEval(`${tagged(false)}let r = [Click(1, 2), Key("a"), Idle]`, "r")).toEqual([
    { type: "click", x: 1, y: 2 },
    { type: "key", k: "a" },
    { type: "Idle" },
  ]);
});

test("match and == read the custom key and literal", () => {
  const src = `${tagged(false)}
let describe = e => switch e {
  | Click(x, y) => "click \${show(x)},\${show(y)}"
  | Key(k) => "key \${k}"
  | Idle => "idle"
}
let r = [describe(Click(1, 2)), describe(Key("a")), describe(Idle), show(Idle == Idle), show(Key("a") == Idle)]`;
  expect(compileAndEval(src, "r")).toEqual(["click 1,2", "key a", "idle", "true", "false"]);
});

test("nested ctor patterns and guards use the custom discriminant", () => {
  const src = `${tagged(false)}
let f = (o: Option<Ev>) => switch o {
  | Some(Click(x, _)) => x
  | Some(Key(_)) => 0 - 1
  | _ => 0
}
let r = [f(Some(Click(7, 8))), f(Some(Key("k"))), f(None)]`;
  expect(compileAndEval(src, "r")).toEqual([7, -1, 0]);
});

test("untagged variants keep _tag", () => {
  expect(compileAndEval("type T = A | B(x: number)\nlet r = [A, B(1)]", "r")).toEqual([
    { _tag: "A" },
    { _tag: "B", x: 1 },
  ]);
});

test("the TS backend and .d.ts emit the custom union", () => {
  const ts = unwrapOk(codegenTs(tagged(true)));
  expect(ts).toContain('| { type: "click"; x: number; y: number }');
  expect(ts).toContain('| { type: "Idle" }');
  expect(ts).toContain('({ type: "key", k })');
  const dts = unwrapOk(emitDts(tagged(true)));
  expect(dts).toContain('| { type: "key"; k: string }');
});

test("the TS backend matches on the custom key", () => {
  const ts = unwrapOk(
    codegenTs(`${tagged(false)}let n = e => switch e { | Click(x, _) => x | _ => 0 }`),
  );
  expect(ts).toContain("switch ($match.type)");
  expect(ts).toContain('case "click"');
});

test("the formatter round-trips attributes", () => {
  const out = unwrapOk(format(tagged(true)));
  expect(out).toContain('@tag("type")\nexport type Ev =');
  expect(out).toContain('| @as("click") Click(x: number, y: number)');
  expect(out).toContain("| Idle");
  expect(unwrapOk(format(out))).toBe(out);
});

test("@as alone keeps the _tag key", () => {
  const src = `type T = @as("a") A | B\nlet r = [A, B]`;
  expect(compileAndEval(src, "r")).toEqual([{ _tag: "a" }, { _tag: "B" }]);
});

test("a duplicate discriminant literal is rejected", () => {
  expect(messages(`type T = @as("x") A | @as("x") B`)).toEqual([
    `duplicate discriminant "x" — constructor 'B' reuses it`,
  ]);
  expect(messages(`@tag("type") type T = @as("B") A | B`)).toHaveLength(1);
});

test("a discriminant key that is not a property name is rejected", () => {
  expect(messages(`@tag("a-b") type T = A | B`)[0]).toContain("not a valid property name");
});

test("a discriminant key may not collide with a field", () => {
  expect(messages(`@tag("x") type T = A(x: string) | B`)[0]).toContain("has a field named 'x'");
});

test("@tag must precede a variant type", () => {
  expect(isErr(compile(`@tag("t") let x = 1`))).toBe(true);
  expect(isErr(compile(`@tag("t") type P = { x: number }`))).toBe(true);
});

test("@{ ... } still parses as a lazy list statement", () => {
  // Parses (the failure is a type error: a bare list is not a unit statement).
  expect(unwrapErr(compile("@{1, 2}"))[0]?.kind).toBe("type");
});

// ---- cross-module ----------------------------------------------------------

const DEP = `@tag("type")\nexport ${EV}`;

test("an importer matches, builds and compares an imported tagged variant", async () => {
  const dir = mkdtempSync(join(repoRoot(import.meta.url), "test", ".variant-tag-"));
  try {
    writeFileSync(join(dir, "ev.mochi"), DEP);
    writeFileSync(
      join(dir, "main.mochi"),
      `import { Click, Key, Idle } from "./ev.mochi"
let describe = e => switch e { | Click(x, y) => "c\${show(x + y)}" | Key(k) => k | Idle => "idle" }
let nested = (o: Option<Ev>) => switch o { | Some(Click(x, _)) => x | _ => 0 - 1 }
let guarded = e => switch e { | Click(x, _) when x > 5 => "big" | _ => "other" }
export let out = [describe(Click(1, 2)), describe(Key("a")), describe(Idle), show(Idle == Idle), show(nested(Some(Click(7, 8)))), show(nested(None)), guarded(Click(9, 0)), guarded(Idle)]
`,
    );
    writeFileSync(
      join(dir, "ns.mochi"),
      `import * as E from "./ev.mochi"
let d = e => switch e { | E.Click(x, _) => x | E.Key(_) => 1 | E.Idle => 2 }
export let out = [d(E.Click(5, 6)), d(E.Key("k")), d(E.Idle)]
`,
    );
    for (const entry of ["main", "ns"])
      execFileSync("bun", [CLI, "build", join(dir, `${entry}.mochi`)], { cwd: root });
    const main = await import(join(dir, "main.js"));
    const ns = await import(join(dir, "ns.js"));
    expect(main.out).toEqual(["c3", "a", "idle", "true", "7", "-1", "big", "other"]);
    expect(ns.out).toEqual([5, 1, 2]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("compare and show treat a custom-tagged value as a plain record", () => {
  const src = `${tagged(false)}let r = [show(Click(1, 2)), show(compare(Key("a"), Key("b"))), show(Click(1, 2) == Click(1, 2)), show(Click(1, 2) == Click(1, 3))]`;
  expect(compileAndEval(src, "r")).toEqual([
    '{ type: "click", x: 1, y: 2 }',
    "-1",
    "true",
    "false",
  ]);
});

test("a quote or backslash in @as is escaped in JS, TS, .d.ts and the formatter", () => {
  const src = 'export type T = @as("a\\"b") A | @as("c\\\\d") B\n';
  expect(compileAndEval(`${src.replace("export ", "")}let r = [A, B]`, "r")).toEqual([
    { _tag: 'a"b' },
    { _tag: "c\\d" },
  ]);
  expect(unwrapOk(codegenTs(src))).toContain('{ _tag: "a\\"b" }');
  expect(unwrapOk(emitDts(src))).toContain('{ _tag: "c\\\\d" }');
  const out = unwrapOk(format(src));
  expect(out).toContain('@as("a\\"b") A');
  expect(unwrapOk(format(out))).toBe(out);
});
