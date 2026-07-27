import { type CompileOptions, compile } from "@mochi/compiler/compile";
import { unwrapOk } from "@onrails/result";

export type CompileJsOpts = Pick<CompileOptions, "runtime" | "plugins" | "moduleExt"> & {
  /** Drop emitted `import …` lines (standalone eval harnesses). */
  stripImports?: boolean;
};

/** Compile source to JS, unwrapping the railway. Defaults to prelude-free (`runtime: false`). */
export const compileJs = (src: string, opts: CompileJsOpts = {}): string => {
  const { stripImports = false, runtime = false, ...rest } = opts;
  let out = unwrapOk(compile(src, { runtime, ...rest }));
  if (stripImports) out = out.replace(/^import .*$/gm, "");
  return out;
};
