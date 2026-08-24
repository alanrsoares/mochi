import { expect, test } from "bun:test";
import { compile } from "@mochi/compiler/compile";
import { lex } from "@mochi/compiler/lexer";
import { readRepo } from "@mochi/test-support";
import { match } from "@onrails/pattern";
import { unwrapOk } from "@onrails/result";

test("generic angle brackets highlight as punctuation, not JSX", () => {
  const source = readRepo(import.meta.url, "apps/docs/src/lib/highlight.mochi");
  const js = unwrapOk(compile(source))
    .replace(/^import .*$/gm, "")
    .replace(/^export /gm, "");
  const api = new Function("match", "lex", "$hoverAt", `${js}\nreturn { highlightMochiCode };`)(
    match,
    lex,
    () => null,
  ) as {
    highlightMochiCode: (code: string) => { text: string; kind: string }[];
  };

  const spans = api.highlightMochiCode("type Result<T, E> = | Ok(T) | Err(E)");
  expect(
    spans.filter((span) => span.text === "<" || span.text === ">").map((span) => span.kind),
  ).toEqual(["punctuation", "punctuation"]);
});

test("highlights a stack-sized token stream iteratively", () => {
  const source = readRepo(import.meta.url, "apps/docs/src/lib/highlight.mochi");
  const js = unwrapOk(compile(source))
    .replace(/^import .*$/gm, "")
    .replace(/^export /gm, "");
  const api = new Function("match", "lex", "$hoverAt", `${js}\nreturn { highlightMochiCode };`)(
    match,
    lex,
    () => null,
  ) as {
    highlightMochiCode: (code: string) => { text: string; kind: string }[];
  };

  const spans = api.highlightMochiCode(Array(12_000).fill("value").join(" "));
  expect(spans.filter((span) => span.text === "value")).toHaveLength(12_000);
});
