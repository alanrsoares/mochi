/**
 * Imperative preview host — runs the compiled emit in `new Function` and
 * renders the resulting vnode (if the program binds `let app = …`).
 */
import { match } from "@onrails/pattern";
import { h, render } from "preact";

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
