import { expect, test } from "bun:test";
import type { BootstrapDiagnostic, BootstrapResult } from "@mochi/compiler/bootstrap";
import { lex, parse } from "@mochi/compiler/bootstrap/syntax";
import { hoverAt } from "@mochi/dx/hover";

type Front<A> = BootstrapResult<A, BootstrapDiagnostic>;

const src = `/// A successful or failed computation.
export type Result<A, E> = | Ok(A) | Err(E)`;

test("a doc comment attaches to an exported type declaration", () => {
  const tokens = lex(src) as Front<unknown>;
  expect(tokens._tag).toBe("Ok");
  if (tokens._tag !== "Ok") return;
  const program = parse(tokens.value) as Front<unknown[]>;
  expect(program._tag).toBe("Ok");
  if (program._tag !== "Ok") return;
  expect(program.value[0]).toMatchObject({
    _tag: "SType",
    doc: { _tag: "Some", value: "A successful or failed computation." },
  });
});

test("type declaration hover includes its doc comment", () => {
  expect(hoverAt(src, src.indexOf("Result"))).toEqual({
    code: "type Result<A, E> = Ok(A) | Err(E)",
    doc: "A successful or failed computation.",
  });
});
