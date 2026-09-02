/**
 * Vite plugin for Mochi (.mochi) files.
 * Transforms Mochi source files into executable JavaScript or TypeScript modules
 * with JSX pragma support (defaults to Preact `h`) and ES module exports.
 */

import { resolve } from "node:path";
import { buildModulesBootstrapWith } from "@mochi/compiler/bootstrap/module";
import { compileBootstrapSync } from "@mochi/compiler/bootstrap/sync";
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
import type { Plugin, ViteDevServer } from "vite";

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
  /** Permit host globals across transformed files; prefer per-file `"use open"`. */
  open?: boolean;
  /**
   * A live runtime owner for the compiler plugin list. The component must
   * provide `languagePluginsCapability`; watched updates replace it only after
   * the new component activates successfully.
   */
  runtimePlugins?: RuntimePluginSource;
};

export function mochiPlugin(options: MochiPluginOptions = {}): Plugin {
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

    configureServer(server: ViteDevServer) {
      for (const file of runtimePlugins?.watch ?? []) server.watcher.add(file);
    },

    async handleHotUpdate(ctx) {
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
      let transformedCode: string;
      if (plugins === undefined && options.open === undefined && runtime === true) {
        if (/^\s*import\b/m.test(code)) {
          const graph = buildModulesBootstrapWith(id, {
            open: false,
            docs: true,
            moduleExt: ".mochi",
            strictEntry: false,
          });
          if (graph._tag === "Err")
            throw new SyntaxError(
              `Mochi compilation failed for ${id}:\n[type] ${graph.error.message}`,
            );
          const output = graph.value.find((module) => resolve(module.path) === resolve(id));
          if (!output) throw new SyntaxError(`Mochi compilation omitted ${id}`);
          transformedCode = output.js;
        } else {
          const res = compileBootstrapSync(code);
          if (res._tag === "Err")
            throw new SyntaxError(
              `Mochi compilation failed for ${id}:\n[type] ${res.error.message}`,
            );
          transformedCode = res.value;
        }
      } else {
        const res = compile(code, { runtime, moduleExt: ".mochi", plugins, open: options.open });
        if (isErr(res)) {
          const errorMessages = res.error.map((d) => `[${d.kind}] ${d.message}`).join("\n");
          throw new SyntaxError(`Mochi compilation failed for ${id}:\n${errorMessages}`);
        }
        transformedCode = res.value;
      }

      // Codegen emits honest ESM: `export` in .mochi source is the only export
      // surface (ADR 0052). No re-export scraping, no synthetic default.

      // Prepend JSX pragma even when the module already has imports (host kits,
      // sibling .mochi imports). Without this, `import { … }` at the top of the
      // emit skips the header and `h` is an unbound reference at runtime.
      // Match only real import lines (`^…` with /m) — a string literal like
      // `"We import { h } from preact"` must not suppress the pragma.
      // Inspect the generated call rather than source punctuation: extern
      // generics (`extern id<T>`) also contain angle brackets, but they are
      // not JSX and must not pull Preact into a platform binding module.
      if (/\bh\(/.test(transformedCode)) {
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
