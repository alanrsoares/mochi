import { match } from "@onrails/result";
import { compile } from "./compile";
import { formatError } from "./errors";
import { format } from "./format";

const [cmd, ...rest] = process.argv.slice(2);

// `fmt [--write] <file.al>` pretty-prints (or rewrites) a source file.
if (cmd === "fmt") {
  const write = rest[0] === "--write" || rest[0] === "-w";
  const path = write ? rest[1] : rest[0];
  if (!path) {
    console.error("usage: bun src/cli.ts fmt [--write] <file.al>");
    process.exit(1);
  }
  const src = await Bun.file(path).text();
  match(
    format(src),
    async (out) => {
      if (write) await Bun.write(path, out);
      else process.stdout.write(out);
    },
    (e) => {
      console.error(formatError(e, src));
      process.exit(1);
    },
  );
} else {
  // Default: compile a file to JavaScript.
  const path = cmd;
  if (!path) {
    console.error("usage: bun src/cli.ts <file.al>  |  bun src/cli.ts fmt [--write] <file.al>");
    process.exit(1);
  }
  const src = await Bun.file(path).text();
  match(
    compile(src),
    (ts) => process.stdout.write(ts),
    (e) => {
      console.error(formatError(e, src));
      process.exit(1);
    },
  );
}
