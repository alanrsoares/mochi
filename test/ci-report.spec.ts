import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { BOOTSTRAP_CACHE_GLOBS, bootstrapCacheFiles } from "@mochi/test-support/bootstrap";
import {
  formatCiFailure,
  formatCiSummary,
  formatCiTaskLine,
  pushTail,
} from "../scripts/lib/ci-report";
import { REPO_ROOT } from "../scripts/lib/repo";
import { cachedTsEmit, RUNTIME_SENTINEL } from "../scripts/lib/ts-emit-cache";

test("ci failure report keeps workflow commands at column 0", () => {
  const report = formatCiFailure({
    name: "test:full",
    outcome: "failed",
    ms: 1500,
    exit: 1,
    timeoutMs: 5000,
    tail: 40,
    lines: [
      "::group::test/bootstrap-format-file.spec.ts:",
      "(fail) (unnamed)",
      "::error title=error%3A boom::",
      "::endgroup::",
    ],
  });

  expect(report.startsWith("failed test:full exit=1 duration=1.50s\n")).toBe(true);
  expect(report).toContain("::group::test:full\n");
  expect(report).toContain("(fail) (unnamed)\n");
  expect(report).toContain("::error title=error%3A boom::\n");
  expect(report).not.toContain("::group::test/bootstrap-format-file.spec.ts:");
  expect(report).toContain("::error title=test%3Afull::failed in 1.50s (exit 1)\n");
  expect(report.split("\n").some((line) => /^\s+::/.test(line))).toBe(false);
});

test("ci failure report caps the tail and names a timeout", () => {
  const report = formatCiFailure({
    name: "seed:check",
    outcome: "timeout",
    ms: 900_000,
    exit: 137,
    timeoutMs: 900_000,
    tail: 1,
    lines: ["earlier", "last line"],
  });

  expect(report.startsWith("timeout seed:check after=900.00s\n")).toBe(true);
  expect(report).toContain("1 earlier lines omitted\n");
  expect(report).toContain("last line\n");
  expect(report).not.toContain("earlier\n");
  expect(report).toContain("::error title=seed%3Acheck::timed out after 900.00s\n");
});

test("ci failure tail drops group lines before the cap", () => {
  const report = formatCiFailure({
    name: "test:full",
    outcome: "failed",
    ms: 10,
    exit: 1,
    timeoutMs: 5000,
    tail: 1,
    lines: ["::error::root cause", "::endgroup::"],
  });

  expect(report).toContain("::error::root cause\n");
  expect(report).not.toContain("earlier lines omitted");
});

test("ci failure report escapes workflow commands that are not annotations", () => {
  const report = formatCiFailure({
    name: "lint",
    outcome: "failed",
    ms: 10,
    exit: 1,
    timeoutMs: 5000,
    tail: 40,
    lines: ["::stop-commands::token", "::warning title=w::careful", "::notice::ok"],
  });

  expect(report).toContain("\\::stop-commands::token\n");
  expect(report).toContain("::warning title=w::careful\n");
  expect(report).toContain("::notice::ok\n");
});

test("pushTail bounds the buffer and ignores group lines", () => {
  const kept = ["::error::root cause", "::endgroup::"].reduce(
    (buf, line) => pushTail(buf, line, 1),
    { lines: [] as readonly string[], dropped: 0 },
  );
  expect(kept).toEqual({ lines: ["::error::root cause"], dropped: 0 });

  const bounded = ["::endgroup::", "first", "second"].reduce(
    (buf, line) => pushTail(buf, line, 1),
    { lines: [] as readonly string[], dropped: 0 },
  );
  expect(bounded).toEqual({ lines: ["second"], dropped: 1 });
});

test("ci summary annotates failures and stays plain when green", () => {
  expect(
    formatCiSummary({
      total: 2,
      passed: 2,
      failed: [],
      timedOut: [],
      cancelled: 0,
      elapsed: "3.00s",
    }),
  ).toBe("2 tasks: 2 passed (3.00s)\n");

  const red = formatCiSummary({
    total: 3,
    passed: 1,
    failed: ["test:full"],
    timedOut: ["seed:check"],
    cancelled: 1,
    elapsed: "10.00s",
  });
  expect(red).toContain(
    "3 tasks: 1 passed, 1 failed, 1 timed out, 1 cancelled (10.00s) — test:full, seed:check\n",
  );
  expect(red.endsWith(`${red.split("\n")[0]}\n::error::${red.split("\n")[0]}\n`)).toBe(true);
});

test("ci task lines are stable tokens", () => {
  expect(formatCiTaskLine("lint", "running")).toBe("running lint\n");
  expect(formatCiTaskLine("lint", "passed", 50)).toBe("passed lint duration=50ms\n");
  expect(formatCiTaskLine("lint", "cancelled")).toBe("cancelled lint\n");
});

test("ci workflow cache key lists the bootstrap graph inputs", () => {
  const yml = readFileSync(join(REPO_ROOT, ".github/workflows/ci.yml"), "utf8");
  for (const pattern of BOOTSTRAP_CACHE_GLOBS) expect(yml).toContain(pattern);
  const files = bootstrapCacheFiles();
  expect(files.some((file) => file.endsWith(".mochi"))).toBe(true);
  expect(files.some((file) => file.startsWith("bootstrap/seed/"))).toBe(true);
});

test("ts emit cache compiles once and rewrites the runtime import", () => {
  const root = mkdtempSync(join(tmpdir(), "mochi-ts-emit-test-"));
  const modPath = join(root, "mod.mochi");
  let calls = 0;
  const build = (runtime: string) => {
    calls += 1;
    return {
      _tag: "Ok" as const,
      value: [{ path: modPath, js: `import { x } from "${runtime}";\n` }],
    };
  };
  const cache = { root: join(root, "cache"), key: "abc", build };

  try {
    const first = cachedTsEmit("@mochi/compiler/runtime", cache);
    const second = cachedTsEmit(join(root, "runtime.ts"), cache);
    expect(calls).toBe(1);
    expect(first._tag).toBe("Ok");
    expect(second._tag).toBe("Ok");
    if (first._tag !== "Ok" || second._tag !== "Ok") return;
    expect(first.value[0]?.js).toBe('import { x } from "@mochi/compiler/runtime";\n');
    expect(second.value[0]?.js).toBe(`import { x } from "${join(root, "runtime.ts")}";\n`);
    expect(resolve(first.value[0]?.path ?? "")).toBe(resolve(modPath));
    expect(first.value[0]?.js).not.toContain(RUNTIME_SENTINEL);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("ts emit cache steals a claim whose holder is dead", () => {
  const root = mkdtempSync(join(tmpdir(), "mochi-ts-emit-dead-"));
  const cacheRoot = join(root, "cache");
  mkdirSync(cacheRoot);
  writeFileSync(join(cacheRoot, "abc.building"), "2147483646");
  let calls = 0;
  const build = () => {
    calls += 1;
    return {
      _tag: "Ok" as const,
      value: [{ path: join(root, "mod.mochi"), js: "export const x = 1;\n" }],
    };
  };

  const started = Date.now();
  try {
    const result = cachedTsEmit("runtime", { root: cacheRoot, key: "abc", build });
    expect(Date.now() - started).toBeLessThan(5_000);
    expect(result._tag).toBe("Ok");
    expect(calls).toBe(1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("ts emit cache does not store a failed compile", () => {
  const root = mkdtempSync(join(tmpdir(), "mochi-ts-emit-err-"));
  let calls = 0;
  const build = () => {
    calls += 1;
    return {
      _tag: "Err" as const,
      error: [{ message: "nope", start: 0, end: 0 }],
    };
  };
  const cache = { root: join(root, "cache"), key: "abc", build };

  try {
    expect(cachedTsEmit("runtime", cache)._tag).toBe("Err");
    expect(cachedTsEmit("runtime", cache)._tag).toBe("Err");
    expect(calls).toBe(2);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
