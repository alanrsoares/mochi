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

test("do, loop, and recur highlight as keywords", () => {
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

  const spans = api.highlightMochiCode(
    "let count = n => loop (i = 0) { i >= n ? do { i } : recur(i + 1) }",
  );
  const kinds = Object.fromEntries(
    spans
      .filter((span) => ["do", "loop", "recur"].includes(span.text))
      .map((span) => [span.text, span.kind]),
  );
  expect(kinds).toEqual({ do: "keyword", loop: "keyword", recur: "keyword" });
});

test("when highlights as keyword in switch guards and plain/function in calls", () => {
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

  const guardSpans = api.highlightMochiCode("switch x { | n when n > 0 => n | _ => 0 }");
  const whenGuard = guardSpans.find((s) => s.text === "when");
  expect(whenGuard?.kind).toBe("keyword");

  const callSpans = api.highlightMochiCode("when(cond, <Node />)");
  const whenCall = callSpans.find((s) => s.text === "when");
  expect(whenCall?.kind).toBe("plain");

  const importSpans = api.highlightMochiCode('import { when } from "../lib/vnode"');
  const whenImport = importSpans.find((s) => s.text === "when");
  expect(whenImport?.kind).toBe("plain");

  const exportSpans = api.highlightMochiCode("export let when = (c, n) => c ? n : <></>");
  const whenExport = exportSpans.find((s) => s.text === "when");
  expect(whenExport?.kind).toBe("plain");

  const namespaceImportSpans = api.highlightMochiCode('import * as Foo from "./foo"');
  const asSpan = namespaceImportSpans.find((s) => s.text === "as");
  const fromSpan = namespaceImportSpans.find((s) => s.text === "from");
  expect(asSpan?.kind).toBe("keyword");
  expect(fromSpan?.kind).toBe("keyword");
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
