/**
 * Vite plugin for Mochi (.mochi) files.
 * Transforms Mochi source files into executable JavaScript or TypeScript modules
 * with JSX pragma support (defaults to Preact `h`) and ES module exports.
 */
import { isErr } from "@onrails/result";
import { compile } from "./compile";
import type { HostExtension } from "./extensions";

export type MochiPluginOptions = {
  /**
   * JSX pragma import header prepended to modules containing JSX.
   * Default: `import { h } from "preact";`
   */
  jsxPragmaHeader?: string;
  /**
   * Custom JSX pragma function name used in code desugaring.
   * Default: `"h"`
   */
  jsxPragmaName?: string;
  /**
   * Inlines Mochi runtime helpers in emitted output.
   * Default: `true`
   */
  runtime?: boolean;
  /**
   * Host kits (styled-cva, …). Universal JSX stays in core — only non-core
   * kits register here (ADR 0010).
   */
  extensions?: HostExtension[];
};

export function mochiPlugin(options: MochiPluginOptions = {}) {
  const jsxHeader = options.jsxPragmaHeader ?? 'import { h } from "preact";\n';
  const runtime = options.runtime ?? true;
  const extensions = options.extensions;

  return {
    name: "vite-plugin-mochi",
    enforce: "pre" as const,

    transform(code: string, id: string) {
      if (!id.endsWith(".mochi")) {
        return null;
      }

      // Keep sibling imports as `.mochi` so Vite re-enters this plugin
      // (default codegen rewrites to `.js` for the standalone CLI/graph).
      const res = compile(code, { runtime, moduleExt: ".mochi", extensions });
      if (isErr(res)) {
        const errorMessages = res.error.map((d) => `[${d.kind}] ${d.message}`).join("\n");
        throw new SyntaxError(`Mochi compilation failed for ${id}:\n${errorMessages}`);
      }

      let transformedCode = res.value;

      // Extract top-level let/const declarations for ES module exports
      const constMatches = Array.from(transformedCode.matchAll(/^const ([A-Za-z0-9_$]+)\s*=/gm));
      const exportedNames = constMatches
        .map((m) => m[1]!)
        .filter((name) => !name.startsWith("_") && !name.startsWith("$"));

      if (exportedNames.length > 0) {
        transformedCode += `\nexport { ${exportedNames.join(", ")} };\n`;
        const lastExport = exportedNames[exportedNames.length - 1];
        transformedCode += `export default ${lastExport};\n`;
      }

      // Prepend JSX pragma even when the module already has imports (host kits,
      // sibling .mochi imports). Without this, `import { … }` at the top of the
      // emit skips the header and `h` is an unbound reference at runtime.
      if (code.includes("<") && code.includes(">")) {
        const hasH =
          /import\s*\{[^}]*\bh\b[^}]*\}\s*from/.test(transformedCode) ||
          transformedCode.includes(jsxHeader.trim());
        if (!hasH) transformedCode = `${jsxHeader}${transformedCode}`;
      }

      return {
        code: transformedCode,
        map: null,
      };
    },
  };
}
