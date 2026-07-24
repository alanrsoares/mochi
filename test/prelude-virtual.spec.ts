import { expect, test } from "bun:test";
import { resolve } from "node:path";
import { definitionAt, prepareRenameAt, referencesAt, renameAt } from "../src/nav";
import { preludeEnv } from "../src/prelude";
import {
  PRELUDE_PATH,
  preludeDoc,
  preludeOrigins,
  preludeVirtualSource,
} from "../src/prelude-virtual";

const pos = (src: string, name: string, n = 0): number => {
  let from = 0;
  for (let i = 0; i <= n; i++) {
    const idx = src.indexOf(name, from);
    if (idx < 0) throw new Error(`'${name}' #${i} not found`);
    if (i === n) return idx;
    from = idx + name.length;
  }
  throw new Error("unreachable");
};

test("prelude virtual spans cover the declared names", () => {
  const { source, origins } = {
    source: preludeVirtualSource(),
    origins: preludeOrigins(),
  };
  for (const [name, loc] of origins.value) {
    expect(loc.path).toBe(PRELUDE_PATH);
    expect(source.slice(loc.span.start, loc.span.end)).toBe(name);
  }
  for (const [name, loc] of origins.type) {
    expect(source.slice(loc.span.start, loc.span.end)).toBe(name);
  }
  for (const [name, loc] of origins.ctor) {
    expect(source.slice(loc.span.start, loc.span.end)).toBe(name);
  }
});

test("prelude virtual source carries /// docs above defs", () => {
  const source = preludeVirtualSource();
  expect(source).toContain("/// Optional value");
  expect(source).toContain("/// Present `Option` value.");
  expect(source).toContain("/// Map over an Array.");
  // Doc sits immediately above the name's declaration line.
  const some = preludeOrigins().ctor.get("Some")!;
  const before = source.slice(0, some.span.start);
  expect(before.endsWith("/// Present `Option` value.\n  | ")).toBe(true);
});

test("every preludeEnv entry has a docstring", () => {
  for (const name of Object.keys(preludeEnv)) {
    expect(preludeDoc(name)).toBeTruthy();
  }
});

test("definitionAt on Result.map jumps to the namespace member", () => {
  const src = "let f = Result.map(identity)";
  const onNs = definitionAt(src, pos(src, "Result"), "/t.mochi");
  const onMem = definitionAt(src, pos(src, "map"), "/t.mochi");
  expect(onNs?.path).toBe(PRELUDE_PATH);
  expect(onMem?.path).toBe(PRELUDE_PATH);
  expect(preludeVirtualSource().slice(onNs!.span.start, onNs!.span.end)).toBe("Result");
  expect(preludeVirtualSource().slice(onMem!.span.start, onMem!.span.end)).toBe("map");
  // Member def is the Result.map stub, not the unqualified Array `map`.
  const around = preludeVirtualSource().slice(Math.max(0, onMem!.span.start - 80), onMem!.span.end);
  expect(around).toContain("`Result.map`");
});

test("definitionAt on Task.andThen jumps to the namespace member", () => {
  const src = "let f = Task.andThen(Task.of)";
  const onNs = definitionAt(src, pos(src, "Task"), "/t.mochi");
  const onMem = definitionAt(src, pos(src, "andThen"), "/t.mochi");
  expect(onNs?.path).toBe(PRELUDE_PATH);
  expect(onMem?.path).toBe(PRELUDE_PATH);
  expect(preludeDoc("Task")).toContain("Lazy async");
  const around = preludeVirtualSource().slice(Math.max(0, onMem!.span.start - 80), onMem!.span.end);
  expect(around).toContain("`Task.andThen`");
});

test("definitionAt on Array.filter uses the Array namespace", () => {
  const src = "let f = Array.filter(always(true))";
  const def = definitionAt(src, pos(src, "filter"), "/t.mochi");
  expect(def?.path).toBe(PRELUDE_PATH);
  const around = preludeVirtualSource().slice(Math.max(0, def!.span.start - 80), def!.span.end);
  expect(around).toContain("`Array.filter`");
});

test("definitionAt on Option / Some jumps to the virtual type/ctor", () => {
  const src = "let x = Some(1)\nlet y : Option number = x";
  const some = definitionAt(src, pos(src, "Some"), "/t.mochi");
  const opt = definitionAt(src, pos(src, "Option"), "/t.mochi");
  expect(some?.path).toBe(PRELUDE_PATH);
  expect(opt?.path).toBe(PRELUDE_PATH);
  expect(preludeVirtualSource().slice(some!.span.start, some!.span.end)).toBe("Some");
  expect(preludeVirtualSource().slice(opt!.span.start, opt!.span.end)).toBe("Option");
});

test("a shadowed prelude name resolves to the local def", () => {
  const src = "let add = 1\nlet n = add";
  const def = definitionAt(src, pos(src, "add", 1), "/t.mochi");
  expect(def).toEqual({ path: resolve("/t.mochi"), span: { start: 4, end: 7 } });
});

test("prepareRenameAt / renameAt refuse prelude names", () => {
  const src = "let n = add(1, 2)";
  expect(prepareRenameAt(src, pos(src, "add"))).toBeNull();
  expect(renameAt(src, pos(src, "add"), "plus")).toBeNull();
});

test("referencesAt on a prelude use includes the virtual def", () => {
  const src = "let n = add(1, 2)\nlet m = add(3, 4)";
  const refs = referencesAt(src, pos(src, "add"), "/t.mochi");
  expect(refs[0]?.role).toBe("def");
  expect(refs[0]?.location.path).toBe(PRELUDE_PATH);
  expect(refs.filter((r) => r.role === "use")).toHaveLength(2);
});
