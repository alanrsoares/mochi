import type { BootstrapOptions } from "@mochi/compiler/bootstrap/module";
import { compileBootstrapSyncWith } from "@mochi/compiler/bootstrap/sync";
import { unwrapOk } from "@onrails/result";

export type CompileJsOpts = Partial<Pick<BootstrapOptions, "runtime" | "moduleExt" | "open">> & {
  /** Drop emitted `import …` lines (standalone eval harnesses). */
  stripImports?: boolean;
};

/** Compile source to JS, unwrapping the railway. Defaults to prelude-free open-world lowering (`runtime: false`, `open: true`). */
export const compileJs = (src: string, opts: CompileJsOpts = {}): string => {
  const { stripImports = false, runtime = false, open = true, moduleExt = ".js" } = opts;
  let out = unwrapOk(
    compileBootstrapSyncWith(src, {
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
