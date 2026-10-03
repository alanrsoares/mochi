import { compileSyncWith } from "@mochi/compiler/compile/sync";
import type { CompilerOptions } from "@mochi/compiler/module";
import { unwrapOk } from "@onrails/result";

export type CompileJsOpts = Partial<Pick<CompilerOptions, "runtime" | "moduleExt" | "open">> & {
  /** Drop emitted `import …` lines (standalone eval harnesses). */
  stripImports?: boolean;
};

/** Compile source to JS, unwrapping the railway. Defaults to prelude-free open-world lowering (`runtime: false`, `open: true`). */
export const compileJs = (src: string, opts: CompileJsOpts = {}): string => {
  const { stripImports = false, runtime = false, open = true, moduleExt = ".js" } = opts;
  let out = unwrapOk(
    compileSyncWith(src, {
      open,
      runtime,
      docs: true,
      moduleExt,
      strictEntry: false,
    }),
  );
  if (stripImports) out = out.replace(/^import .*$/gm, "");
  return out;
};
