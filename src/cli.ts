import { match } from "@onrails/result";
import { compile } from "./compile";
import { formatError } from "./errors";

const path = process.argv[2];
if (!path) {
  console.error("usage: bun src/cli.ts <file.al>");
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
