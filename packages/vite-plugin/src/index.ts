/**
 * Vite plugin for Mochi (.mochi) files.
 * Transforms Mochi source files into executable JavaScript or TypeScript modules
 * with JSX pragma support (defaults to Preact `h`) and ES module exports.
 */

import { compile } from "@mochi/compiler/compile";
import type { LanguagePlugin } from "@mochi/compiler/extensions";
import {
  capability,
  createComponentHost,
  provide,
  type RuntimeComponent,
  resource,
} from "@mochi/runtime-components";
import { isErr, ResultAsync } from "@onrails/result";

/** The capability through which a live host supplies compiler plugins. */
export const languagePluginsCapability =
  capability<readonly LanguagePlugin[]>("mochi.language-plugins");

/** Create the resource-owning runtime component for a static plugin list. */
export const languagePluginsComponent = (
  name: string,
  plugins: readonly LanguagePlugin[],
): RuntimeComponent => ({
  name,
  provides: [languagePluginsCapability],
  activate: () => ResultAsync.ok(resource([provide(languagePluginsCapability, plugins)])),
});

type ViteWatcher = { add: (file: string) => void };
type FullReloadMessage = { readonly type: "full-reload" };
type ViteWebSocket = { send: (payload: FullReloadMessage) => void };
type ViteServer = { readonly watcher: ViteWatcher; readonly ws: ViteWebSocket };

type HotUpdateContext = {
  readonly file: string;
  readonly server: ViteServer;
};

/**
 * A reloadable source of compiler plugins. Reload runs at the Vite boundary;
 * it returns an error value so a broken update leaves the active component in
 * place rather than silently compiling with a half-updated hook list.
 */
export type RuntimePluginSource = {
  readonly component: RuntimeComponent;
  readonly watch?: readonly string[];
  readonly reload?: () => ResultAsync<RuntimeComponent, unknown>;
};

export type MochiPluginOptions = {
  /**
   * JSX pragma import header prepended to modules containing JSX.
   * Default: a Fragment-aware `h` over Preact's — codegen emits `<></>` as
   * `h("Fragment", …)` (jsx plugin vocabulary, ADR 0055), so the host `h`
   * maps that tag to Preact's `Fragment`.
   */
  jsxPragmaHeader?: string;
  /**
   * Inlines Mochi runtime helpers in emitted output.
   * Default: `true`
   */
  runtime?: boolean;
  /**
   * Plugins to run (styled-cva, …). `undefined` → builtins; `[]` → hard
   * opt-out; non-empty → builtins + this list (`resolvePlugins`, ADR 0011).
   */
  plugins?: LanguagePlugin[];
  /**
   * A live runtime owner for the compiler plugin list. The component must
   * provide `languagePluginsCapability`; watched updates replace it only after
   * the new component activates successfully.
   */
  runtimePlugins?: RuntimePluginSource;
};

export function mochiPlugin(options: MochiPluginOptions = {}) {
  const jsxHeader =
    options.jsxPragmaHeader ??
    'import { h as _h, Fragment as _Fragment } from "preact";\n' +
      'const h = (tag, props, children) => _h(tag === "Fragment" ? _Fragment : tag, props, children);\n';
  const runtime = options.runtime ?? true;
  const host = createComponentHost();
  const runtimePlugins =
    options.runtimePlugins ??
    (options.plugins
      ? { component: languagePluginsComponent("mochi-language-plugins", options.plugins) }
      : undefined);
  let plugins = options.plugins;
  let runtimePluginsInstalled = false;

  const installRuntimePlugins = async (component: RuntimeComponent): Promise<void> => {
    if (runtimePluginsInstalled) return;
    const installed = await host.mount(component);
    if (isErr(installed))
      throw new Error(`Mochi runtime plugins failed to activate: ${installed.error.kind}`);
    const active = host.get(languagePluginsCapability);
    if (!active) throw new Error("Mochi runtime plugin component did not provide language plugins");
    plugins = [...active];
    runtimePluginsInstalled = true;
  };

  const replaceRuntimePlugins = async (): Promise<void> => {
    if (!runtimePlugins?.reload) return;
    const replacement = await runtimePlugins.reload();
    if (isErr(replacement)) throw new Error("Mochi runtime plugin reload failed");
    const replaced = await host.replace(runtimePlugins.component.name, replacement.value);
    if (isErr(replaced))
      throw new Error(`Mochi runtime plugin reload failed: ${replaced.error.kind}`);
    const active = host.get(languagePluginsCapability);
    if (!active) throw new Error("Mochi runtime plugin component did not provide language plugins");
    plugins = [...active];
  };

  return {
    name: "vite-plugin-mochi",
    enforce: "pre" as const,

    async buildStart() {
      if (runtimePlugins) await installRuntimePlugins(runtimePlugins.component);
    },

    configureServer(server: ViteServer) {
      for (const file of runtimePlugins?.watch ?? []) server.watcher.add(file);
    },

    async handleHotUpdate(ctx: HotUpdateContext) {
      if (!runtimePlugins?.watch?.includes(ctx.file) || !runtimePlugins.reload) return;
      await replaceRuntimePlugins();
      ctx.server.ws.send({ type: "full-reload" });
      return [];
    },

    transform(code: string, id: string) {
      if (!id.endsWith(".mochi")) {
        return null;
      }

      // Keep sibling imports as `.mochi` so Vite re-enters this plugin
      // (default codegen rewrites to `.js` for the standalone CLI/graph).
      const res = compile(code, { runtime, moduleExt: ".mochi", plugins });
      if (isErr(res)) {
        const errorMessages = res.error.map((d) => `[${d.kind}] ${d.message}`).join("\n");
        throw new SyntaxError(`Mochi compilation failed for ${id}:\n${errorMessages}`);
      }

      // Codegen emits honest ESM: `export` in .mochi source is the only export
      // surface (ADR 0052). No re-export scraping, no synthetic default.
      let transformedCode = res.value;

      // Prepend JSX pragma even when the module already has imports (host kits,
      // sibling .mochi imports). Without this, `import { … }` at the top of the
      // emit skips the header and `h` is an unbound reference at runtime.
      // Match only real import lines (`^…` with /m) — a string literal like
      // `"We import { h } from preact"` must not suppress the pragma.
      if (code.includes("<") && code.includes(">")) {
        const hasH =
          /^import\s*\{[^}]*\bh\b[^}]*\}\s*from/m.test(transformedCode) ||
          transformedCode.startsWith(jsxHeader.trim());
        if (!hasH) transformedCode = `${jsxHeader}${transformedCode}`;
      }

      return {
        code: transformedCode,
        map: null,
      };
    },
  };
}
