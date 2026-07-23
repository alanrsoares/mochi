// String interpolation (ADR 0023): "...${expr}..." — holes unify with
// `string`, codegen is a native JS template literal, safely re-escaped.
import { expect, test } from "bun:test";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";

const js = (src: string) => unwrapOk(compile(src, { runtime: false }));

test("hole-free string still lowers to a plain JS string (zero churn)", () => {
  expect(js('let s = "hello"')).toBe('const s = "hello";\n');
});

test("a hole unifies with string; a non-string hole is a type error", () => {
  // biome-ignore lint/suspicious/noTemplateCurlyInString: mochi source, not a JS template
  const r = compile('let flag = true\nlet bad = "x is ${flag}"', { runtime: false });
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r).kind).toBe("type");
});

test("interpolation lowers to a template literal", () => {
  // biome-ignore lint/suspicious/noTemplateCurlyInString: mochi source, not a JS template
  const src = 'let x = "1"\nlet s = "x is ${x}"';
  // biome-ignore lint/suspicious/noTemplateCurlyInString: expected emitted JS source, not an interpolated template
  const expected = 'const x = "1";\nconst s = `x is ${x}`;\n';
  expect(js(src)).toBe(expected);
});

test("nested interpolation", () => {
  // biome-ignore lint/suspicious/noTemplateCurlyInString: mochi source, not a JS template
  const src = 'let n = "1"\nlet s = "outer ${"inner ${n}"}"';
  // biome-ignore lint/suspicious/noTemplateCurlyInString: expected emitted JS source, not an interpolated template
  const expected = 'const n = "1";\nconst s = `outer ${`inner ${n}`}`;\n';
  expect(js(src)).toBe(expected);
});

test("escaping round-trips through compile-and-eval: backtick, dollar-brace, backslash", () => {
  // Source holds, in order: a literal backtick (no escape needed — mochi
  // strings are "…", not `…`), `\${` (the escape for a literal `$` before
  // `{`, decoding to the literal text "${c}"), and `\\` (a literal backslash)
  // — all ahead of a real `${n}` hole.
  // biome-ignore lint/suspicious/noTemplateCurlyInString: mochi source, not a JS template
  const src = 'let n = "1"\nlet s = "a `b \\${c} d\\\\e ${n}"';
  const out = new Function(`${js(src)}\nreturn s;`)() as string;
  // biome-ignore lint/suspicious/noTemplateCurlyInString: expected decoded string value, not a JS template
  const expected = "a `b ${c} d\\e 1";
  expect(out).toBe(expected);
});
