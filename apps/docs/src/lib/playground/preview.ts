/**
 * Imperative preview host — runs the compiled emit in `new Function` and
 * renders the resulting vnode (if the program binds `let app = …`).
 */
import { match } from "@onrails/pattern";
import { type ComponentChildren, type ComponentType, Fragment, h as preactH, render } from "preact";

/** Fragment-aware `h` — codegen emits `<></>` as `h("Fragment", …)` (ADR 0055). */
const h = (tag: unknown, props: unknown, ...children: unknown[]) =>
  preactH(
    (tag === "Fragment" ? Fragment : tag) as ComponentType,
    props as Record<string, unknown> | null,
    ...(children as ComponentChildren[]),
  );

/** Emit is an ESM module (`import { match }…`); playground runs it in `new Function`. */
export const stripModuleImports = (js: string): string =>
  js.replace(/^import\s+.+;?\s*$/gm, "").trimStart();

export const clearPreview = (el: HTMLElement): void => {
  render(null, el);
};

export const renderPreview = (el: HTMLElement, outputJs: string): void => {
  try {
    const fn = new Function(
      "h",
      "match",
      `${stripModuleImports(outputJs)}; return typeof app !== 'undefined' ? app : null;`,
    );
    const vnode = fn(h, match);
    render(vnode ?? null, el);
    if (!vnode) el.innerText = "Compiled. Bind `let app = …` preview UI.";
  } catch (execErr: unknown) {
    render(null, el);
    el.innerText = `Runtime error: ${execErr instanceof Error ? execErr.message : String(execErr)}`;
  }
};
