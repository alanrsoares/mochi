// The seed's typed graph must retain aliases declared by dependency modules.
// This graph-sized guard runs only in `test:full`, alongside the other bootstrap
// north stars, so the default feedback loop stays fast.
import { expect, test } from "bun:test";
import { join } from "node:path";
import { loadBootstrapCore } from "@mochi/compiler/bootstrap";
import { repoRoot } from "@mochi/test-support";

test("bootstrap TS graph retains aliases from dependency scope", async () => {
  const root = repoRoot(import.meta.url);
  const bootstrap = await loadBootstrapCore();
  const built = bootstrap.buildModulesTs(
    join(root, "bootstrap", "cli.mochi"),
    join(root, "packages", "compiler", "src", "prelude", "runtime"),
  );

  expect(built._tag).toBe("Ok");
  if (built._tag !== "Ok") return;
  const compile = built.value.find((output) => output.path.endsWith("bootstrap/compile.mochi"));
  expect(compile?.js).toContain("Result<string, PErr[]>");
  expect(compile?.js).not.toContain(
    "Result<string, { message: string; start: number; end: number }>",
  );
  // This builds the entire typed bootstrap graph. `test:full` runs serially so it
  // does not starve its short property tests under CI contention; allow one minute
  // for the graph build itself rather than treating scheduler delay as a failure.
}, 60_000);
