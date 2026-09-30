import type { BootstrapTypeAt } from "@mochi/compiler/bootstrap";
import { type BootstrapPlugin, defaultBootstrapOptions } from "@mochi/compiler/bootstrap/options";
import { inferTypesBootstrapSyncWith } from "@mochi/compiler/bootstrap/sync";
import { type AliasInfo, foldAliases, showType, type Ty } from "@mochi/compiler/bootstrap/types";

export type TypeOfOpts = { open?: boolean; plugins?: readonly BootstrapPlugin[] };

/** Every recorded type in `src`, from the self-hosted core. Throws on a diagnostic. */
export const typesOf = (src: string, opts: TypeOfOpts = {}): BootstrapTypeAt[] => {
  const r = inferTypesBootstrapSyncWith(src, {
    ...defaultBootstrapOptions,
    open: opts.open ?? true,
    plugins: opts.plugins,
  });
  if (r._tag === "Err") throw new Error(`typesOf: ${r.error.map((d) => d.message).join("; ")}`);
  return r.value.types;
};

/**
 * The type the self-hosted core gives the last `let` binding `name`, as hover
 * prints it (`'t12 -> Result<'t12, 't13>`). Open-world by default, like the
 * specs it replaces; a constructor's type is read through `let x = Ctor`.
 */
export const typeOf = (src: string, name: string, opts: TypeOfOpts = {}): string => {
  const hit = typesOf(src, opts).findLast(
    (t) => t.sym._tag === "Some" && t.sym.value.kind === "let" && t.sym.value.name === name,
  );
  if (hit === undefined) throw new Error(`typeOf: no let binding '${name}'`);
  return hit.display;
};

/**
 * The generalized scheme the self-hosted core binds `name` to in its final env,
 * alias-folded and printed. Unlike `typeOf` (hover's display, which widens
 * literals), this keeps an annotated singleton: `let m : "hi" = "hi"` → `"hi"`.
 */
export const schemeOf = (src: string, name: string, opts: TypeOfOpts = {}): string => {
  const r = inferTypesBootstrapSyncWith(src, {
    ...defaultBootstrapOptions,
    open: opts.open ?? true,
    plugins: opts.plugins,
  });
  if (r._tag === "Err") throw new Error(`schemeOf: ${r.error.map((d) => d.message).join("; ")}`);
  const scheme = r.value.env.get(name) as { ty: Ty } | undefined;
  if (scheme === undefined) throw new Error(`schemeOf: no binding '${name}'`);
  return showType(foldAliases(scheme.ty, r.value.aliases as Map<string, AliasInfo>));
};
