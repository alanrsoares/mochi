// ADRs 0131/0143: authored compiler passes are Mochi. Component directories also
// hold host façades, so enforce the boundary by source ownership, not folder name.
import { expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { repoRoot } from "@mochi/test-support";

const root = repoRoot(import.meta.url);
const compilerSrc = resolve(root, "packages/compiler/src");
const exportsMap = JSON.parse(readFileSync(resolve(compilerSrc, "../package.json"), "utf8"))
  .exports as Record<string, string>;

const authoredPass = (path: string): boolean =>
  path.endsWith(".ts") && existsSync(path.replace(/\.ts$/, ".mochi"));

const retired = [
  "extensions/extensions.ts",
  "extensions/plugin-kit.ts",
  "extensions/plugins/jsx.ts",
];

test("compiler passes have no hand-authored TypeScript twins", () => {
  const twins = [...new Bun.Glob("**/*.ts").scanSync({ cwd: compilerSrc })].filter((file) =>
    authoredPass(resolve(compilerSrc, file)),
  );
  expect(twins).toEqual([]);
  expect(retired.filter((file) => existsSync(resolve(compilerSrc, file)))).toEqual([]);
});

test("compiler exports point to host façades without migration subpaths", () => {
  expect(Object.keys(exportsMap).filter((key) => key.startsWith("./bootstrap"))).toEqual([]);
  expect(
    Object.values(exportsMap).filter((path) => authoredPass(resolve(compilerSrc, "..", path))),
  ).toEqual([]);
  expect(
    Object.values(exportsMap).every((path) => existsSync(resolve(compilerSrc, "..", path))),
  ).toBe(true);
});

const SPECIFIER = /(?:from|import)\s*\(?\s*(["'])([^"']+)\1/g;

test.each(["packages", "scripts", "test", "apps", "examples"])(
  "%s imports no hand-authored TypeScript pass",
  (dir) => {
    const hits = [...new Bun.Glob("**/*.{ts,tsx,mts,mochi}").scanSync({ cwd: resolve(root, dir) })]
      .filter(
        (file) =>
          !file
            .split("/")
            .some((part) => ["node_modules", "dist", ".cache", ".output"].includes(part)),
      )
      .flatMap((file) => {
        const absolute = resolve(root, dir, file);
        return [...readFileSync(absolute, "utf8").matchAll(SPECIFIER)]
          .map((match) => match[2]!)
          .filter((spec) => {
            if (!spec.startsWith(".")) return false;
            const target = resolve(dirname(absolute), spec);
            const ts = target.endsWith(".ts") ? target : `${target}.ts`;
            return ts.startsWith(`${compilerSrc}/`) && authoredPass(ts);
          })
          .map((spec) => `${dir}/${file}: ${spec}`);
      });
    expect(hits).toEqual([]);
  },
);
