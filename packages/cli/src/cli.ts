/**
 * Host CLI — composes `@mochi/compiler` (compile / build / dts / ts),
 * `@mochi/dx` (`fmt`), and `@mochi/codemod` (`codemod`). Not part of the
 * bootstrap mirror (ADR 0048).
 */

import {
  expandMochiGlobs,
  loadTransform,
  printProjectErrors,
  transformProject,
} from "@mochi/codemod";
import { type BootstrapDiagnostic, loadBootstrapCore } from "@mochi/compiler/bootstrap";
import { codegenTs } from "@mochi/compiler/codegen-ts";
import { compile } from "@mochi/compiler/compile";
import { type Diagnostic, formatError } from "@mochi/compiler/errors";
import { buildModules, buildModulesTs, emitDtsForFile } from "@mochi/compiler/module";
import { format } from "@mochi/dx/format";
import { match } from "@onrails/pattern";
import { isErr } from "@onrails/result";

const USAGE =
  "usage: mochi [--open] [--no-docs] <file.mochi>  |  mochi fmt [--write] <file.mochi>  |  mochi codemod <transform.ts> [--write|--check] [--strict] <globs…>  |  mochi build [--emit=ts] [--open] [--no-docs] <entry.mochi>  |  mochi dts [--open] [--no-docs] <file.mochi>  |  mochi ts [--open] [--no-docs] <file.mochi>";

const [cmd, ...rest] = process.argv.slice(2);

function printDiags(es: Diagnostic | Diagnostic[], src?: string): void {
  const list = Array.isArray(es) ? es : [es];
  for (let i = 0; i < list.length; i++) {
    if (i > 0) console.error("");
    console.error(formatError(list[i]!, src));
  }
}

function requireArg(path: string | undefined, usage: string): string {
  if (!path) {
    console.error(usage);
    process.exit(1);
  }
  return path;
}

function die(es: Diagnostic | Diagnostic[], src?: string): never {
  printDiags(es, src);
  process.exit(1);
}

/** The self-hosted graph's compact diagnostic, rendered by its host-equivalent format. */
function dieBootstrap(path: string, src: string, error: BootstrapDiagnostic): never {
  const before = src.slice(0, error.start);
  const line = before.split("\n").length;
  const col = error.start - before.lastIndexOf("\n");
  console.error(`${path}:${line}:${col}: ${error.message}`);
  process.exit(1);
}

await match(cmd)
  .with("codemod", async () => {
    const write = rest.includes("--write") || rest.includes("-w");
    const check = rest.includes("--check");
    const strict = rest.includes("--strict");
    const positional = rest.filter((a) => !a.startsWith("-"));
    const transformFile = positional[0];
    const globs = positional.slice(1);
    if (!transformFile || globs.length === 0) {
      console.error(
        `usage: mochi codemod <transform.ts> [--write|--check] [--strict] <globs…>\n${USAGE}`,
      );
      process.exit(1);
    }
    const transform = await loadTransform(transformFile);
    const paths = expandMochiGlobs(globs);
    const report = transformProject(paths, transform, { write, check, strict });
    printProjectErrors(report);
    if (report.errors.length) process.exit(1);
    if (check && report.changed.length) {
      console.error(`codemod would change:\n${report.changed.map((p) => `  ${p}`).join("\n")}`);
      process.exit(1);
    }
    for (const p of report.changed) {
      console.error(`  ${p}`);
    }
  })
  .with("fmt", async () => {
    const write = rest[0] === "--write" || rest[0] === "-w";
    const path = requireArg(
      write ? rest[1] : rest[0],
      `usage: mochi fmt [--write] <file.mochi>\n${USAGE}`,
    );
    const src = await Bun.file(path).text();
    const r = format(src);
    if (isErr(r)) die(r.error, src);
    if (write) await Bun.write(path, r.value);
    else process.stdout.write(r.value);
  })
  .with("dts", async () => {
    const open = rest.includes("--open");
    const docs = !rest.includes("--no-docs");
    const path = requireArg(
      rest.find((a) => !a.startsWith("-")),
      `usage: mochi dts [--open] [--no-docs] <file.mochi>\n${USAGE}`,
    );
    const src = await Bun.file(path).text();
    const r = await emitDtsForFile(path, src, (p) => Bun.file(p).text(), { open, docs });
    if (isErr(r)) die(r.error, src);
    process.stdout.write(r.value);
  })
  .with("ts", async () => {
    const open = rest.includes("--open");
    const docs = !rest.includes("--no-docs");
    const path = requireArg(
      rest.find((a) => !a.startsWith("-")),
      `usage: mochi ts [--open] [--no-docs] <file.mochi>\n${USAGE}`,
    );
    const src = await Bun.file(path).text();
    const r = codegenTs(src, { open, docs });
    if (isErr(r)) die(r.error, src);
    process.stdout.write(r.value);
  })
  .with("build", async () => {
    const emitTs = rest.includes("--emit=ts");
    const open = rest.includes("--open");
    const docs = !rest.includes("--no-docs");
    const entry = requireArg(
      rest.find((a) => !a.startsWith("-")),
      `usage: mochi build [--emit=ts] [--open] [--no-docs] <entry.mochi>\n${USAGE}`,
    );
    const outputs =
      !open && docs
        ? await (async () => {
            const bootstrap = await loadBootstrapCore();
            const result = emitTs
              ? bootstrap.buildModulesTs(entry, "@mochi/runtime")
              : bootstrap.buildModules(entry);
            if (result._tag === "Err") {
              const src = await Bun.file(entry).text();
              dieBootstrap(entry, src, result.error);
            }
            return result.value;
          })()
        : await (async () => {
            const read = (p: string): Promise<string> => Bun.file(p).text();
            const result = await (emitTs
              ? buildModulesTs(entry, read, { open, docs })
              : buildModules(entry, read, { open, docs }));
            if (isErr(result)) die(result.error);
            return result.value;
          })();
    const ext = emitTs ? ".ts" : ".js";
    for (const { path, js } of outputs) {
      const typedExt = js.startsWith("/** @jsx h */") ? ".tsx" : ext;
      const out = path.endsWith(".ts") ? path : path.replace(/\.mochi$/, typedExt);
      await Bun.write(out, js);
      console.error(`  ${out}`);
    }
  })
  .otherwise(async (path) => {
    const open = rest.includes("--open") || path === "--open";
    const docs = !rest.includes("--no-docs") && path !== "--no-docs";
    const file = requireArg(
      path?.startsWith("-") ? rest.find((a) => !a.startsWith("-")) : path,
      USAGE,
    );
    const src = await Bun.file(file).text();
    if (!open && docs) {
      const result = (await loadBootstrapCore()).compile(src);
      if (result._tag === "Err") dieBootstrap(file, src, result.error);
      process.stdout.write(result.value);
      return;
    }
    const r = compile(src, { open, docs });
    if (isErr(r)) die(r.error, src);
    process.stdout.write(r.value);
  });
