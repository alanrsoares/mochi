import type { BootstrapTypeAt } from "@mochi/compiler/bootstrap";
import { type BootstrapPlugin, defaultBootstrapOptions } from "@mochi/compiler/bootstrap/options";
import { inferTypesBootstrapSyncWith } from "@mochi/compiler/bootstrap/sync";

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
