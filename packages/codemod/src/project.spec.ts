import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { transformProject } from "./project.ts";
import { mapProgramExprs } from "./walk.ts";

test("transformProject --check reports drift without writing", () => {
  const dir = mkdtempSync(join(import.meta.dir, ".codemod-"));
  try {
    const path = join(dir, "a.mochi");
    writeFileSync(path, "let x = 1\nlet y = x\n");
    const report = transformProject(
      [path],
      (prog) =>
        mapProgramExprs(prog, (e) =>
          e.kind === "ref" && e.name === "x" ? { ...e, name: "n" } : e,
        ),
      { check: true },
    );
    expect(report.changed).toEqual([path]);
    expect(readFileSync(path, "utf8")).toBe("let x = 1\nlet y = x\n");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
