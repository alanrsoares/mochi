import { match } from "@onrails/pattern";
import { compileJs } from "./compile.ts";

/** Compile, strip imports, and eval in a `new Function` sandbox. */
export const compileAndEval = (
  src: string,
  returnExpr: string,
  globals: Record<string, unknown> = { match },
): unknown => {
  const js = compileJs(src, { stripImports: true, runtime: true });
  const names = Object.keys(globals);
  return new Function(...names, `${js}\nreturn ${returnExpr};`)(...Object.values(globals));
};
