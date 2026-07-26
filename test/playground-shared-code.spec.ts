import { describe, expect, test } from "bun:test";
import {
  decodeSharedCode,
  encodeSharedCode,
  isSharedCodeWithinLimits,
} from "../apps/docs/src/lib/shared-code";

describe("playground shared-code", () => {
  test("roundtrips gzip (z:) or raw (b:) payload", async () => {
    const source = `let greet = name => "hi " ++ name\nlet app = greet("mochi")\n`;
    const encoded = await encodeSharedCode(source);
    expect(encoded.startsWith("z:") || encoded.startsWith("b:")).toBe(true);
    const decoded = await decodeSharedCode(encoded);
    expect(decoded).toBe(source);
    expect(isSharedCodeWithinLimits(encoded, decoded)).toBe(true);
  });

  test("decodes legacy encodeURIComponent payloads", async () => {
    const source = "let x = 1\n";
    const legacy = encodeURIComponent(source);
    expect(await decodeSharedCode(legacy)).toBe(source);
  });
});
