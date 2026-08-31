/** Browser-safe façade over the frozen ESM bootstrap compiler. */
import * as seed from "../../../../bootstrap/seed/compile.bundle.mjs";

import type { BootstrapDiagnostic, BootstrapResult } from "./index.ts";

type BrowserSeed = {
  compile: (src: string) => BootstrapResult<string, BootstrapDiagnostic>;
  compileTs: (src: string, runtimeImport: string) => BootstrapResult<string, BootstrapDiagnostic>;
};

const browserSeed = seed as BrowserSeed;

export const compileBootstrapBrowser = (
  src: string,
): BootstrapResult<string, BootstrapDiagnostic> => browserSeed.compile(src);

export const compileTsBootstrapBrowser = (
  src: string,
  runtimeImport: string,
): BootstrapResult<string, BootstrapDiagnostic> => browserSeed.compileTs(src, runtimeImport);
