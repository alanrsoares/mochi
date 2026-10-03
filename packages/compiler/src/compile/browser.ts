/** Browser-safe aliases over the same ESM seed adapter used by the compiler. */
export {
  compileSync as compileBrowser,
  compileTsSync as compileTsBrowser,
  inferTypesSync as inferTypesBrowser,
} from "./sync.ts";
