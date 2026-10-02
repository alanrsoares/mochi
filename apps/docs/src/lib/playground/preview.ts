/** Preview host for a vnode, or a lazy Task that settles to a vnode. */
import { match } from "@onrails/pattern";
import { type ComponentChildren, type ComponentType, Fragment, h as preactH, render } from "preact";
import type { Task } from "../task";

const h = (tag: unknown, props: unknown, ...children: unknown[]) =>
  preactH(
    (tag === "Fragment" ? Fragment : tag) as ComponentType,
    props as Record<string, unknown> | null,
    ...(children as ComponentChildren[]),
  );

export const stripModuleImports = (js: string): string =>
  js.replace(/^import\s+.+;?\s*$/gm, "").trimStart();

// A new compile, tab switch, or unmount invalidates any in-flight Task result.
const runs = new WeakMap<HTMLElement, number>();
const invalidate = (el: HTMLElement): number => {
  const next = (runs.get(el) ?? 0) + 1;
  runs.set(el, next);
  return next;
};

export const clearPreview = (el: HTMLElement): void => {
  invalidate(el);
  render(null, el);
  el.textContent = "";
};

type PreviewTask = Task<ComponentChildren, unknown>;

export const renderPreview = (el: HTMLElement, outputJs: string): void => {
  const run = invalidate(el);
  const showError = (error: unknown, label = "Runtime error"): void => {
    if (runs.get(el) !== run) return;
    render(null, el);
    el.textContent = `${label}: ${error instanceof Error ? error.message : String(error)}`;
  };
  const show = (vnode: ComponentChildren): void => {
    if (runs.get(el) !== run) return;
    el.textContent = "";
    render(vnode ?? null, el);
    if (vnode == null) el.textContent = "Compiled. Bind `let app = …` to preview UI.";
  };
  try {
    const fn = new Function(
      "h",
      "match",
      `${stripModuleImports(outputJs)}; return typeof app !== 'undefined' ? app : null;`,
    );
    const app = fn(h, match) as ComponentChildren | PreviewTask;
    if (typeof app === "function") {
      render(null, el);
      el.textContent = "Running Task…";
      void (app as PreviewTask)().then(
        (result) =>
          result._tag === "Ok" ? show(result.value) : showError(result.error, "Task failed"),
        showError,
      );
    } else {
      show(app);
    }
  } catch (error: unknown) {
    showError(error);
  }
};
