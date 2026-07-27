/**
 * Vite plugin for Mochi (.mochi) files.
 * Transforms Mochi source files into executable JavaScript or TypeScript modules
 * with JSX pragma support (defaults to Preact `h`) and ES module exports.
 */

import { isErr } from "@onrails/result";
import { compile } from "../../compiler/src/compile/compile";
import type { LanguagePlugin } from "../../compiler/src/extensions/extensions";

export type MochiPluginOptions = {
  /**
   * JSX pragma import header prepended to modules containing JSX.
   * Default: `import { h } from "preact";`
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
};

export function mochiPlugin(options: MochiPluginOptions = {}) {
  const jsxHeader = options.jsxPragmaHeader ?? 'import { h } from "preact";\n';
  const runtime = options.runtime ?? true;
  const plugins = options.plugins;

  return {
    name: "vite-plugin-mochi",
    enforce: "pre" as const,

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

      let transformedCode = res.value;

      // Names already emitted as `export { … }` (e.g. arity≥2 externs lower to
      // `const f = _curry(…); export { f }`) must not be re-exported — Rollup
      // treats a second `export { f }` as a duplicate.
      const alreadyExported = new Set(
        [...transformedCode.matchAll(/\bexport\s*\{([^}]+)\}/g)].flatMap((m) =>
          m[1]!.split(",").map((part) => {
            const bits = part.trim().split(/\s+as\s+/);
            return (bits[bits.length - 1] ?? "").trim();
          }),
        ),
      );

      // Extract top-level let/const declarations for ES module exports
      const constMatches = Array.from(transformedCode.matchAll(/^const ([A-Za-z0-9_$]+)\s*=/gm));
      const exportedNames = constMatches
        .map((m) => m[1]!)
        .filter(
          (name) => !name.startsWith("_") && !name.startsWith("$") && !alreadyExported.has(name),
        );

      if (exportedNames.length > 0) {
        transformedCode += `\nexport { ${exportedNames.join(", ")} };\n`;
        const lastExport = exportedNames[exportedNames.length - 1];
        transformedCode += `export default ${lastExport};\n`;
      }

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
