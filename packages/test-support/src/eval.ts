import { match } from "@onrails/pattern";
import { compileJs } from "./compile.ts";

/**
 * A private function only ever called saturated emits just its raw twin `f$`
 * (ADR 0149 follow-up). Tests reach top-level bindings by name, so restore the
 * public `f` for any twin whose wrapper was dropped.
 */
const withPublicBindings = (js: string): string => {
  const twins = [...js.matchAll(/^const (\w+)\$ = /gm)].map((m) => m[1] as string);
  const missing = twins.filter(
    (n) => !new RegExp(`^(?:export )?const ${n}(?:[:\\s=])`, "m").test(js),
  );
  return missing.map((n) => `const ${n} = _curry(${n}$.length, ${n}$);`).join("\n");
};

/** Compile, strip imports, and eval in a `new Function` sandbox. */
export const compileAndEval = (
  src: string,
  returnExpr: string,
  globals: Record<string, unknown> = { match },
): unknown => {
  const js = compileJs(src, { stripImports: true, runtime: true });
  const names = Object.keys(globals);
  return new Function(...names, `${js}\n${withPublicBindings(js)}\nreturn ${returnExpr};`)(
    ...Object.values(globals),
  );
};
