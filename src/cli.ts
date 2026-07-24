import { match } from "@onrails/pattern";
import { isErr } from "@onrails/result";
import { codegenTs } from "./codegen-ts";
import { compile } from "./compile";
import { emitDts } from "./dts";
import { type Diagnostic, formatError } from "./errors";
import { format } from "./format";
import { buildModules, buildModulesTs } from "./module";

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
    // `fmt [--write] <file.mochi>` pretty-prints (or rewrites) a source file.
    const write = rest[0] === "--write" || rest[0] === "-w";
    const path = requireArg(
      write ? rest[1] : rest[0],
      "usage: bun src/cli.ts fmt [--write] <file.mochi>",
    );
    const src = await Bun.file(path).text();
    const r = format(src);
    if (isErr(r)) die(r.error, src);
    if (write) await Bun.write(path, r.value);
    else process.stdout.write(r.value);
  })
  .with("dts", async () => {
    // `dts <file.mochi>` prints a TypeScript declaration for the module.
    const path = requireArg(rest[0], "usage: bun src/cli.ts dts <file.mochi>");
    const src = await Bun.file(path).text();
    const r = emitDts(src);
    if (isErr(r)) die(r.error, src);
    process.stdout.write(r.value);
  })
  .with("ts", async () => {
    // `ts <file.mochi>` compiles a file to a typed TypeScript module (ADR 0026).
    const path = requireArg(rest[0], "usage: bun src/cli.ts ts <file.mochi>");
    const src = await Bun.file(path).text();
    const r = codegenTs(src);
    if (isErr(r)) die(r.error, src);
    process.stdout.write(r.value);
  })
  .with("build", async () => {
    // `build [--emit=ts] <entry.mochi>` compiles a module graph, writing a `.js`
    // (default) or typed `.ts` (--emit=ts, ADR 0026) beside each `.mochi`.
    const emitTs = rest.includes("--emit=ts");
    const entry = requireArg(
      rest.find((a) => !a.startsWith("-")),
      "usage: bun src/cli.ts build [--emit=ts] <entry.mochi>",
    );
    const read = (p: string): Promise<string> => Bun.file(p).text();
    const result = await (emitTs ? buildModulesTs(entry, read) : buildModules(entry, read));
    if (isErr(result)) die(result.error);
    const ext = emitTs ? ".ts" : ".js";
    for (const { path, js } of result.value) {
      // Extern `.d.ts` outputs (TS backend) already carry their extension.
      const out = path.endsWith(".ts") ? path : path.replace(/\.mochi$/, ext);
      await Bun.write(out, js);
      console.error(`  ${out}`);
    }
  })
  .otherwise(async (path) => {
    // Default: compile a file to JavaScript.
    const file = requireArg(
      path,
      "usage: bun src/cli.ts <file.mochi>  |  bun src/cli.ts fmt [--write] <file.mochi>",
    );
    const src = await Bun.file(file).text();
    const r = compile(src);
    if (isErr(r)) die(r.error, src);
    process.stdout.write(r.value);
  });
