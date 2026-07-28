// styled-cva class-string reflow (ADR 0057) — the vendor plugin's format hook
// splits over-width class strings in `tw.*` calls into a `++` chain and
// re-fills existing pure-string chains canonically. Cross-package seam
// (plugin hook + @mochi/dx formatter), so it lives in test/.

import { describe, expect, it } from "bun:test";
import { format } from "@mochi/dx/format";
import { styledCvaExtension } from "@mochi/plugin-styled-cva";
import { unwrapOk } from "@onrails/result";

const fmt = (src: string): string => unwrapOk(format(src, { plugins: [styledCvaExtension] }));

const LONG =
  "rounded-full border-2 border-line bg-foam px-3 py-1 font-mono text-2xs text-mute transition-colors hover:border-fur hover:text-ink focus-visible:outline-2 focus-visible:outline-bao focus-visible:outline-offset-2";

describe("styled-cva class-string reflow (ADR 0057)", () => {
  it("splits an over-width base class string into a ++ chain", () => {
    const out = fmt(`let Btn = tw.button("${LONG}")\n`);
    expect(out).toContain('++ " ');
    for (const line of out.split("\n")) expect(line.length).toBeLessThanOrEqual(80);
    // Concatenation of the emitted segments is byte-identical to the source
    // string — every continuation carries its separating space visibly.
    const segs = [...out.matchAll(/"([^"]*)"/g)].map((m) => m[1]!);
    expect(segs.join("")).toBe(LONG);
  });

  it("is a fixed point (re-fills its own output to the same text)", () => {
    const once = fmt(`let Btn = tw.button("${LONG}")\n`);
    expect(fmt(once)).toBe(once);
  });

  it("re-fills a hand-split chain canonically without changing its value", () => {
    // Broken hand-split (missing separator spaces): the reflow re-segments but
    // must NOT invent spaces — the fused class names stay fused.
    const src = `let Btn = tw.button("a-very-long-class-list-head-segment ok" ++ "fused-tail more classes here padding margin border shadow rounded outline focus hover active disabled")\n`;
    const out = fmt(src);
    const segs = [...out.matchAll(/"([^"]*)"/g)].map((m) => m[1]!);
    expect(segs.join("")).toContain("okfused-tail");
  });

  it("leaves short strings, dynamic chains, and non-tw calls alone", () => {
    expect(fmt('let a = tw.div("shrink-0")\n')).toBe('let a = tw.div("shrink-0")\n');
    const dynamic = `let b = tw.div("base " ++ extra)\n`;
    expect(fmt(dynamic)).toBe(dynamic);
    // Non-tw calls keep their string atomic (only the call layout may break).
    expect(fmt(`let c = other("${"x ".repeat(60)}y")\n`)).not.toContain("++");
  });

  it("reflows over-width variant strings inside the cva config record", () => {
    const src = `let Badge = tw.span("base", { variants: { $tone: { rose: "${LONG}" } }, defaultVariants: { $tone: "rose" } })\n`;
    const out = fmt(src);
    const roseBlock = out.slice(out.indexOf("rose:"));
    expect(roseBlock).toContain('++ " ');
    const segs = [...roseBlock.matchAll(/"([^"]*)"/g)].map((m) => m[1]!);
    expect(segs.join("").startsWith(LONG)).toBe(true);
    expect(fmt(out)).toBe(out);
  });

  it("does not reflow without the plugin registered", () => {
    const src = `let Btn = tw.button("${LONG}")\n`;
    expect(unwrapOk(format(src))).not.toContain("++");
  });
});
