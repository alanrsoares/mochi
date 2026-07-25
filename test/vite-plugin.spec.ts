import { describe, expect, it } from "bun:test";
import { mochiPlugin } from "../src/vite-plugin";

describe("vite-plugin-mochi", () => {
  it("ignores non-mochi files", () => {
    const plugin = mochiPlugin();
    const result = plugin.transform("const x = 1;", "src/main.ts");
    expect(result).toBeNull();
  });

  it("compiles standard .mochi file to JS module with exports", () => {
    const plugin = mochiPlugin();
    const result = plugin.transform("let double = (x) => x * 2", "src/math.mochi");
    expect(result).not.toBeNull();
    expect(result?.code).toContain("const double = ");
    expect(result?.code).toContain("double");
    expect(result?.code).toContain("export default double;");
  });

  it("prepends JSX pragma header for files containing JSX elements", () => {
    const plugin = mochiPlugin();
    const code = `let Button = (props) => <button className={props.kind}>{props.label}</button>`;
    const result = plugin.transform(code, "src/Button.mochi");
    expect(result).not.toBeNull();
    expect(result?.code).toContain('import { h } from "preact";');
    expect(result?.code).toContain('h("button", { className: props.kind }, [props.label])');
    expect(result?.code).toContain("export { Button };");
  });

  it("supports custom JSX pragma header option", () => {
    const plugin = mochiPlugin({ jsxPragmaHeader: 'import { h } from "custom-jsx";\n' });
    const code = `let Card = (props) => <div className="card">{props.title}</div>`;
    const result = plugin.transform(code, "src/Card.mochi");
    expect(result).not.toBeNull();
    expect(result?.code).toContain('import { h } from "custom-jsx";');
  });

  it("throws SyntaxError with diagnostic message when Mochi compilation fails", () => {
    const plugin = mochiPlugin();
    const badCode = `let invalid = `;
    expect(() => plugin.transform(badCode, "src/bad.mochi")).toThrow(/Mochi compilation failed/);
  });
});
