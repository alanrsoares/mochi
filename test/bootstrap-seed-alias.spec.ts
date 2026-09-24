// The seed's typed graph must retain aliases declared by dependency modules.
// This graph-sized guard runs only in `test:full`, alongside the other bootstrap
// north stars, so the default feedback loop stays fast.
import { expect, test } from "bun:test";
import { BOOTSTRAP_BUILD_HOOK_MS } from "@mochi/test-support/bootstrap";
import { loadCachedTsEmit, RUNTIME_SRC } from "../scripts/lib";

test(
  "bootstrap TS graph retains aliases from dependency scope",
  () => {
    // The same seed emit `bootstrap:self-tsc` and `seed:check` read, so the graph
    // is built once per bootstrap hash rather than once per guard.
    const built = loadCachedTsEmit(RUNTIME_SRC);

    expect(built._tag).toBe("Ok");
    if (built._tag !== "Ok") return;
    const compile = built.value.find((output) => output.path.endsWith("bootstrap/compile.mochi"));
    // compile's error is the named `Stamped` diagnostic (kind, help, suggestions).
    // `IErr` is infer's alias and must stay named, not expand to a structural record.
    expect(compile?.js).toContain("Result<string, Stamped[]>");
    expect(compile?.js).toContain("(e: IErr)");
    expect(compile?.js).not.toContain(
      "Result<string, { message: string; start: number; end: number }>",
    );
    // A cold cache builds the entire typed bootstrap graph — or waits on whichever
    // of the three readers claimed the build — under whatever else the gate runs.
  },
  BOOTSTRAP_BUILD_HOOK_MS,
);
