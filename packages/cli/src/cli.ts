/**
 * Host CLI — composes `@mochi/compiler` (compile / build / dts / ts) and
 * `@mochi/dx` (`fmt`). Not part of the bootstrap mirror (ADR 0048).
 */
import { codegenTs } from "@mochi/compiler/codegen-ts";
import { compile } from "@mochi/compiler/compile";
import { emitDts } from "@mochi/compiler/dts";
import { type Diagnostic, formatError } from "@mochi/compiler/errors";
import { buildModules, buildModulesTs } from "@mochi/compiler/module";
import { format } from "@mochi/dx/format";
import { match } from "@onrails/pattern";
import { isErr } from "@onrails/result";

const USAGE =
  "usage: mochi <file.mochi>  |  mochi fmt [--write] <file.mochi>  |  mochi build [--emit=ts] <entry.mochi>  |  mochi dts <file.mochi>  |  mochi ts <file.mochi>";

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

await match(cmd)
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
    const path = requireArg(rest[0], `usage: mochi dts <file.mochi>\n${USAGE}`);
    const src = await Bun.file(path).text();
    const r = emitDts(src);
    if (isErr(r)) die(r.error, src);
    process.stdout.write(r.value);
  })
  .with("ts", async () => {
    const path = requireArg(rest[0], `usage: mochi ts <file.mochi>\n${USAGE}`);
    const src = await Bun.file(path).text();
    const r = codegenTs(src);
    if (isErr(r)) die(r.error, src);
    process.stdout.write(r.value);
  })
  .with("build", async () => {
    const emitTs = rest.includes("--emit=ts");
    const entry = requireArg(
      rest.find((a) => !a.startsWith("-")),
      `usage: mochi build [--emit=ts] <entry.mochi>\n${USAGE}`,
    );
    const read = (p: string): Promise<string> => Bun.file(p).text();
    const result = await (emitTs ? buildModulesTs(entry, read) : buildModules(entry, read));
    if (isErr(result)) die(result.error);
    const ext = emitTs ? ".ts" : ".js";
    for (const { path, js } of result.value) {
      const out = path.endsWith(".ts") ? path : path.replace(/\.mochi$/, ext);
      await Bun.write(out, js);
      console.error(`  ${out}`);
    }
  })
  .otherwise(async (path) => {
    const file = requireArg(path, USAGE);
    const src = await Bun.file(file).text();
    const r = compile(src);
    if (isErr(r)) die(r.error, src);
    process.stdout.write(r.value);
  });
