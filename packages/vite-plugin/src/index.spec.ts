import { describe, expect, it } from "bun:test";
import type { LanguagePlugin } from "@mochi/compiler/extensions";
import { tCon } from "@mochi/compiler/types";
import { languagePluginsComponent, mochiPlugin } from "@mochi/vite-plugin";
import { ok, ResultAsync } from "@onrails/result";
import type { HmrContext, Plugin, ViteDevServer } from "vite";

/** Vite types hooks as `ObjectHook`; the plugin uses bare functions we call in unit tests. */
type TestPlugin = Plugin & {
  transform: (code: string, id: string) => { code: string; map: null } | null;
  buildStart: () => Promise<void>;
  configureServer: (server: ViteDevServer) => void;
  handleHotUpdate: (ctx: HmrContext) => Promise<void | []>;
};

const testPlugin = (...args: Parameters<typeof mochiPlugin>): TestPlugin =>
  mochiPlugin(...args) as TestPlugin;

const runtimeLanguagePlugin: LanguagePlugin = {
  name: "runtime-test",
  inferCall: {
    refs: ["dynamic"],
    hook: () => ok(tCon("string")),
  },
};

describe("vite-plugin-mochi", () => {
  it("ignores non-mochi files", () => {
    const plugin = testPlugin({ open: true });
    const result = plugin.transform("const x = 1;", "src/main.ts");
    expect(result).toBeNull();
  });

  it("compiles standard .mochi file; only source `export` reaches the emit (ADR 0052)", () => {
    const plugin = testPlugin({ open: true });
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
    const plugin = testPlugin();
    const code =
      "export let Button = (props) => <button className={props.kind}>{props.label}</button>";
    const result = plugin.transform(code, "src/Button.mochi");
    expect(result).not.toBeNull();
    expect(result?.code).toContain('import { h as _h, Fragment as _Fragment } from "preact";');
    expect(result?.code).toContain('h("button", { className: props.kind }, [props.label])');
    expect(result?.code).toContain("export const Button");
  });

  it("supports custom JSX pragma header option", () => {
    const plugin = testPlugin({ jsxPragmaHeader: 'import { h } from "custom-jsx";\n' });
    const code = `let Card = (props) => <div className="card">{props.title}</div>`;
    const result = plugin.transform(code, "src/Card.mochi");
    expect(result).not.toBeNull();
    expect(result?.code).toContain('import { h } from "custom-jsx";');
  });

  it("emits .mochi sibling imports so Vite re-enters the plugin", () => {
    const plugin = testPlugin({ open: true });
    const code = `import { BadgeShell } from "../ui/primitives"
let HeaderBadge = props => <BadgeShell>{props.label}</BadgeShell>`;
    const result = plugin.transform(code, "src/HeaderBadge.mochi");
    expect(result?.code).toMatch(
      /^import \{ h as _h, Fragment as _Fragment \} from "preact";\nconst h = [^\n]+;\nimport \{ BadgeShell \} from "\.\.\/ui\/primitives\.mochi";/,
    );
  });

  it("keeps bare package import specs (ADR 0015)", () => {
    const plugin = testPlugin({ open: true });
    const code = `import { useState } from "@mochi/plugin-preact/hooks"
let x = useState`;
    const result = plugin.transform(code, "src/Comp.mochi");
    expect(result?.code).toContain('import { useState } from "@mochi/plugin-preact/hooks";');
    expect(result?.code).not.toContain("@mochi/plugin-preact/hooks.mochi");
  });

  it("still prepends h when emit text mentions import { h } in a string", () => {
    const plugin = testPlugin();
    // Docs copy once suppressed the pragma: the sniff matched a string body.
    const code = `let Row = props => <p>{"We import { h } from preact."}</p>`;
    const result = plugin.transform(code, "src/Row.mochi");
    expect(result?.code).toMatch(/^import \{ h as _h, Fragment as _Fragment \} from "preact";/);
    expect(result?.code).toContain('h("p"');
  });

  it("does not re-export names already emitted by codegen (curried extern)", () => {
    const plugin = testPlugin();
    // Arity ≥ 2 extern lowers to `const f = _curry(…); export { f }` — a second
    // `export { f }` from the plugin is a Rollup duplicate-export error.
    const code = `export extern useSelect : a -> (b -> c) -> c = "@re-reduced/preact" "useSelect"`;
    const result = plugin.transform(code, "src/host.mochi");
    expect(result?.code).toContain("export { useSelect };");
    expect(result?.code.match(/export \{ useSelect \}/g)?.length).toBe(1);
  });

  it("throws SyntaxError with diagnostic message when Mochi compilation fails", () => {
    const plugin = testPlugin();
    const badCode = "let invalid = ";
    expect(() => plugin.transform(badCode, "src/bad.mochi")).toThrow(/Mochi compilation failed/);
  });

  it("activates runtime plugins before transforming Mochi modules", async () => {
    const plugin = testPlugin({
      open: true,
      runtimePlugins: {
        component: languagePluginsComponent("runtime-test", [runtimeLanguagePlugin]),
      },
    });
    const code = "export let value = dynamic() + 1";

    expect(plugin.transform(code, "src/runtime.mochi")?.code).toContain("export const value");
    await plugin.buildStart();
    await plugin.buildStart();
    expect(() => plugin.transform(code, "src/runtime.mochi")).toThrow(/Mochi compilation failed/);
  });

  it("replaces watched runtime plugins before reloading the browser", async () => {
    const watched = "/project/mochi.plugins.ts";
    const events: string[] = [];
    let reloads = 0;
    const plugin = testPlugin({
      runtimePlugins: {
        component: languagePluginsComponent("runtime-test", [runtimeLanguagePlugin]),
        watch: [watched],
        reload: () => {
          reloads += 1;
          return ResultAsync.ok(languagePluginsComponent("runtime-test", [runtimeLanguagePlugin]));
        },
      },
    });
    const server = {
      watcher: { add: (file: string) => events.push(`watch:${file}`) },
      ws: { send: () => events.push("reload") },
    } as unknown as ViteDevServer;

    plugin.configureServer(server);
    await plugin.buildStart();
    await plugin.handleHotUpdate({ file: watched, server } as HmrContext);

    expect(reloads).toBe(1);
    expect(events).toEqual([`watch:${watched}`, "reload"]);
  });
});
