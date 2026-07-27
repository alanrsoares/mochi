import { pathToFileURL } from "node:url";
import type { CodemodTransform } from "./transform.ts";

/** Load a user transform module (`export default` or named `transform`). */
export const loadTransform = async (path: string): Promise<CodemodTransform> => {
  const mod = (await import(pathToFileURL(path).href)) as {
    default?: CodemodTransform;
    transform?: CodemodTransform;
  };
  const fn = mod.default ?? mod.transform;
  if (typeof fn !== "function") {
    throw new Error(`${path} must export default or named \`transform\``);
  }
  return fn;
};
