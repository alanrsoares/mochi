import { describe, expect, it } from "bun:test";
import { mochiPlugin } from "@mochi/vite-plugin";

describe("vite-plugin-mochi", () => {
  it("ignores non-mochi files", () => {
    const plugin = mochiPlugin();
    const result = plugin.transform("const x = 1;", "src/main.ts");
    expect(result).toBeNull();
  });

  it("compiles standard .mochi file; only source `export` reaches the emit (ADR 0052)", () => {
    const plugin = mochiPlugin();
    const result = plugin.transform(
      "let hidden = 1\nexport let double = (x) => x * 2",
      "src/math.mochi",
    );
    expect(result).not.toBeNull();
    expect(result?.code).toContain("export const double = ");
    expect(result?.code).not.toContain("export const hidden");
    expect(result?.code).not.toContain("export default");
    expect(result?.code).not.toMatch(/export \{/);
  });

  it("prepends JSX pragma header for files containing JSX elements", () => {
    const plugin = mochiPlugin();
    const code = `export let Button = (props) => <button className={props.kind}>{props.label}</button>`;
    const result = plugin.transform(code, "src/Button.mochi");
    expect(result).not.toBeNull();
    expect(result?.code).toContain('import { h as _h, Fragment as _Fragment } from "preact";');
    expect(result?.code).toContain('h("button", { className: props.kind }, [props.label])');
    expect(result?.code).toContain("export const Button");
  });

  it("supports custom JSX pragma header option", () => {
    const plugin = mochiPlugin({ jsxPragmaHeader: 'import { h } from "custom-jsx";\n' });
    const code = `let Card = (props) => <div className="card">{props.title}</div>`;
    const result = plugin.transform(code, "src/Card.mochi");
    expect(result).not.toBeNull();
    expect(result?.code).toContain('import { h } from "custom-jsx";');
  });

  it("emits .mochi sibling imports so Vite re-enters the plugin", () => {
    const plugin = mochiPlugin();
    const code = `import { BadgeShell } from "../ui/primitives"
let HeaderBadge = props => <BadgeShell>{props.label}</BadgeShell>`;
    const result = plugin.transform(code, "src/HeaderBadge.mochi");
    expect(result?.code).toMatch(
      /^import \{ h as _h, Fragment as _Fragment \} from "preact";\nconst h = [^\n]+;\nimport \{ BadgeShell \} from "\.\.\/ui\/primitives\.mochi";/,
    );
  });

  it("keeps bare package import specs (ADR 0015)", () => {
    const plugin = mochiPlugin();
    const code = `import { useState } from "@mochi/plugin-preact/hooks"
let x = useState`;
    const result = plugin.transform(code, "src/Comp.mochi");
    expect(result?.code).toContain('import { useState } from "@mochi/plugin-preact/hooks";');
    expect(result?.code).not.toContain("@mochi/plugin-preact/hooks.mochi");
  });

  it("still prepends h when emit text mentions import { h } in a string", () => {
    const plugin = mochiPlugin();
    // Docs copy once suppressed the pragma: the sniff matched a string body.
    const code = `let Row = props => <p>{"We import { h } from preact."}</p>`;
    const result = plugin.transform(code, "src/Row.mochi");
    expect(result?.code).toMatch(/^import \{ h as _h, Fragment as _Fragment \} from "preact";/);
    expect(result?.code).toContain('h("p"');
  });

  it("does not re-export names already emitted by codegen (curried extern)", () => {
    const plugin = mochiPlugin();
    // Arity ≥ 2 extern lowers to `const f = _curry(…); export { f }` — a second
    // `export { f }` from the plugin is a Rollup duplicate-export error.
    const code = `export extern useSelect : a -> (b -> c) -> c = "@re-reduced/preact" "useSelect"`;
    const result = plugin.transform(code, "src/host.mochi");
    expect(result?.code).toContain("export { useSelect };");
    expect(result?.code.match(/export \{ useSelect \}/g)?.length).toBe(1);
  });

  it("throws SyntaxError with diagnostic message when Mochi compilation fails", () => {
    const plugin = mochiPlugin();
    const badCode = `let invalid = `;
    expect(() => plugin.transform(badCode, "src/bad.mochi")).toThrow(/Mochi compilation failed/);
  });
});
