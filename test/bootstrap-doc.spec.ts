// Slice — the self-hosted Wadler layout engine. bootstrap/doc.mochi is compiled
// by the TS compiler, evaluated, and asked to render the same documents as
// src/doc/doc.ts. The engine has no imports, so it evaluates standalone; each
// document is built once, polymorphically, and instantiated at both IRs.
import { expect, test } from "bun:test";
import * as D from "@mochi/compiler/doc";
import { compileJs, readRepo } from "@mochi/test-support";
import { match } from "@onrails/pattern";

/** The combinator surface a document needs, at whichever `Doc` type. */
type DocApi<T> = {
  txt: (s: string) => T;
  verbatim: (s: string) => T;
  cat: (parts: T[]) => T;
  indent: (d: T) => T;
  group: (d: T) => T;
  join: (sep: T, parts: T[]) => T;
  line: T;
  softline: T;
  hardline: T;
  breakParent: T;
  lineSuffix: (d: T) => T;
};

type AlDoc = { readonly _tag: string };
type AlApi = DocApi<AlDoc> & {
  render: (d: AlDoc, width: number) => string;
  flat: (d: AlDoc) => string;
};

const names = [
  "txt",
  "verbatim",
  "cat",
  "indent",
  "group",
  "join",
  "line",
  "softline",
  "hardline",
  "breakParent",
  "lineSuffix",
  "render",
  "flat",
];
const source = compileJs(readRepo(import.meta.url, "bootstrap/doc.mochi"), {
  runtime: true,
  stripImports: true,
}).replace(/^export /gm, "");
const al = new Function("match", `"use strict";\n${source}\nreturn { ${names.join(", ")} };`)(
  match,
) as AlApi;

const tsApi: DocApi<D.Doc> = D;

/** One document, buildable against either IR. */
type Build = <T>(api: DocApi<T>) => T;

const items = <T>(api: DocApi<T>, n: number): T[] =>
  Array.from({ length: n }, (_, i) => api.txt(`item${i}`));

const commaLine = <T>(api: DocApi<T>): T => api.cat([api.txt(","), api.line]);

const docs: Record<string, Build> = {
  "flat text": (a) => a.txt("hello"),
  "a group that fits stays flat": (a) =>
    a.group(
      a.cat([a.txt("f("), a.softline, a.join(commaLine(a), items(a, 2)), a.softline, a.txt(")")]),
    ),
  "a group that overflows breaks": (a) =>
    a.group(
      a.cat([
        a.txt("longFunctionName("),
        a.indent(a.cat([a.softline, a.join(commaLine(a), items(a, 8))])),
        a.softline,
        a.txt(")"),
      ]),
    ),
  "a hardline forces every enclosing group": (a) =>
    a.group(a.cat([a.txt("a"), a.hardline, a.txt("b")])),
  "breakParent breaks without emitting a newline": (a) =>
    a.group(a.cat([a.txt("a"), a.breakParent, a.line, a.txt("b")])),
  "nested indentation compounds": (a) =>
    a.group(
      a.cat([
        a.txt("{"),
        a.indent(a.cat([a.hardline, a.txt("x"), a.indent(a.cat([a.hardline, a.txt("y")]))])),
        a.hardline,
        a.txt("}"),
      ]),
    ),
  "verbatim is passed through and forces a break": (a) =>
    a.group(a.cat([a.txt("before "), a.verbatim("raw\n  bytes"), a.line, a.txt("after")])),
  "verbatim tracks the column of its last line": (a) =>
    a.group(a.cat([a.verbatim("a\nbb"), a.line, a.txt("tail")])),
  "softline is nothing when flat": (a) => a.group(a.cat([a.txt("a"), a.softline, a.txt("b")])),
  "an empty join": (a) => a.join(a.line, []),
};

for (const [name, build] of Object.entries(docs)) {
  for (const width of [80, 20, 8]) {
    test(`doc parity at ${width}: ${name}`, () => {
      expect(al.render(build(al), width)).toBe(D.render(build(tsApi), width));
    });
  }
  test(`doc parity flat: ${name}`, () => {
    expect(al.flat(build(al))).toBe(D.flat(build(tsApi)));
  });
}

// A trailing comment defers past the separator the enclosing list adds. Both
// renderers must replay it in the same place, or one of them emits `x // c,`
// — the comma swallowed by the comment — and that output does not parse.
const suffixDoc: Build = (api) =>
  api.cat([
    api.txt("f("),
    api.indent(
      api.cat([
        api.hardline,
        api.txt("x"),
        api.lineSuffix(api.txt(" // why")),
        api.txt(","),
        api.hardline,
        api.txt("y"),
      ]),
    ),
    api.hardline,
    api.txt(")"),
  ]);

test("lineSuffix defers to just before the next newline in both renderers", () => {
  expect(al.render(suffixDoc(al), 80)).toBe("f(\n  x, // why\n  y\n)");
  expect(D.render(suffixDoc(tsApi), 80)).toBe(al.render(suffixDoc(al), 80));
});

test("a lineSuffix pending at the end is still emitted", () => {
  const trailing: Build = (api) => api.cat([api.txt("x"), api.lineSuffix(api.txt(" // end"))]);
  expect(al.render(trailing(al), 80)).toBe("x // end");
  expect(D.render(trailing(tsApi), 80)).toBe(al.render(trailing(al), 80));
});
