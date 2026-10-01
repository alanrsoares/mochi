/** Browser-safe aliases over the same ESM seed adapter used by the compiler. */
export {
  compileBootstrapSync as compileBootstrapBrowser,
  compileTsBootstrapSync as compileTsBootstrapBrowser,
  inferTypesBootstrapSync as inferTypesBootstrapBrowser,
} from "./sync.ts";
