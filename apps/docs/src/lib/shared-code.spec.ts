import { describe, expect, test } from "bun:test";
import { compile } from "@mochi/compiler/compile";
import { readRepo } from "@mochi/test-support";
import { match } from "@onrails/pattern";
import { isErr, unwrapOk } from "@onrails/result";
import { decodeSharedCode, encodeSharedCode, isSharedCodeWithinLimits } from "./shared-code";

const read = (p: string): string => readRepo(import.meta.url, p);

describe("playground shared-code Task (ADR 0006)", () => {
  test("roundtrips gzip (z:) or raw (b:) payload", async () => {
    const source = `let greet = name => "hi " ++ name\nlet app = greet("mochi")\n`;
    const encoded = await encodeSharedCode(source)();
    expect(encoded._tag).toBe("Ok");
    if (encoded._tag !== "Ok") return;
    expect(encoded.value.startsWith("z:") || encoded.value.startsWith("b:")).toBe(true);
    const decoded = await decodeSharedCode(encoded.value)();
    expect(decoded).toEqual({ _tag: "Ok", value: source });
    expect(isSharedCodeWithinLimits(encoded.value, source)).toBe(true);
  });

  test("decodes legacy encodeURIComponent payloads", async () => {
    const source = "let x = 1\n";
    const legacy = encodeURIComponent(source);
    expect(await decodeSharedCode(legacy)()).toEqual({ _tag: "Ok", value: source });
  });

  test("shared-code.mochi roundTrip settles Ok", async () => {
    const src = read("apps/docs/src/lib/shared-code.mochi");
    expect(isErr(compile(src))).toBe(false);
    const js = unwrapOk(compile(src))
      .replace(/^import .*$/gm, "")
      .replace(/^export /gm, "");
    const api = new Function(
      "match",
      "encodeShared",
      "decodeShared",
      `${js}\nreturn { runRoundTrip };`,
    )(match, encodeSharedCode, decodeSharedCode) as {
      runRoundTrip: (s: string) => Promise<{ _tag: string; value?: string }>;
    };
    const source = "let n = 1\n";
    const result = await api.runRoundTrip(source);
    expect(result).toEqual({ _tag: "Ok", value: source });
  });
});
