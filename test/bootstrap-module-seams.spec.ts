// Ticket 0013 (part b) — the four cross-module seams the single-file pipeline
// never exposed, added to the bootstrap passes and tested individually before
// compileGraph is built on top:
//   check.al     — checkWith(stmts, importedReg), exportedRegistry(stmts)
//   codegen.al   — exportedCtorKeys(stmts)
//   infer.al     — inferProgramImports(stmts, builtins, namespaces, open, imports)
// We build the bootstrap graph to JS and drive the emitted functions in-process.

import { beforeAll, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const bs = (f: string) => join(root, `bootstrap/${f}`);

type Res<T> = { _tag: "Ok"; value: T } | { _tag: "Err"; error: { message: string } };
type Stmts = unknown[];
type Scheme = unknown;
type CtorInfo = { owner: string; arity: number };
type Registry = { ctors: Map<string, CtorInfo>; types: Map<string, string[]> };

let lex: (s: string) => Res<unknown>;
let parse: (t: unknown) => Res<Stmts>;
let check: (s: Stmts) => Res<Stmts>;
let checkWith: (s: Stmts, imported: Registry) => Res<Stmts>;
let exportedRegistry: (s: Stmts) => Registry;
let exportedCtorKeys: (s: Stmts) => Map<string, string[]>;
let inferProgram: (s: Stmts, b: unknown, n: unknown, open: boolean) => Res<Map<string, Scheme>>;
let inferProgramImports: (
  s: Stmts,
  b: unknown,
  n: unknown,
  open: boolean,
  imports: Map<string, Scheme>,
) => Res<Map<string, Scheme>>;
let builtins: unknown;
let namespaces: unknown;

const unwrap = <T>(r: Res<T>): T => {
  if (r._tag !== "Ok") throw new Error(`expected Ok, got Err: ${r.error.message}`);
  return r.value;
};
const parseAl = (src: string): Stmts => unwrap(parse(unwrap(lex(src))));

beforeAll(async () => {
  execFileSync("bun", ["src/cli.ts", "build", "bootstrap/cli.al"], { cwd: root });
  ({ lex } = await import(bs("lexer.js")));
  ({ parse } = await import(bs("parser.js")));
  ({ check, checkWith, exportedRegistry } = await import(bs("check.js")));
  ({ exportedCtorKeys } = await import(bs("codegen.js")));
  ({ inferProgram, inferProgramImports } = await import(bs("infer.js")));
  ({ builtins, namespaces } = await import(bs("prelude.gen.js")));
});

// ---- exportedRegistry ------------------------------------------------------

test("exportedRegistry publishes only exported variant types, with owner+arity", () => {
  const reg = exportedRegistry(
    parseAl("export type Color = Red | Green | Blue\ntype Secret = A | B\n"),
  );
  expect([...reg.types.keys()]).toEqual(["Color"]); // Secret is not exported
  expect(reg.types.get("Color")).toEqual(["Red", "Green", "Blue"]);
  expect(reg.ctors.get("Red")).toEqual({ owner: "Color", arity: 0 });
  expect(reg.ctors.has("A")).toBe(false); // Secret's ctors excluded
});

// ---- exportedCtorKeys ------------------------------------------------------

test("exportedCtorKeys publishes field keys of exported ctors only", () => {
  const keys = exportedCtorKeys(
    parseAl("export type Box = Box(value: number)\ntype Hidden = H(x: number)\n"),
  );
  expect(keys.get("Box")).toEqual(["value"]);
  expect(keys.has("H")).toBe(false); // Hidden is not exported
});

// ---- checkWith (cross-module exhaustiveness) -------------------------------

test("checkWith accepts a switch over an imported variant that check alone rejects", () => {
  const dep = exportedRegistry(parseAl("export type Color = Red | Green | Blue\n"));
  const importer = parseAl("let f = c => switch c { | Red => 1 | Green => 2 | Blue => 3 }\n");
  expect(check(importer)._tag).toBe("Err"); // unknown ctor without the import
  expect(checkWith(importer, dep)._tag).toBe("Ok"); // resolved via imported registry
});

test("checkWith still enforces exhaustiveness against the imported ctor set", () => {
  const dep = exportedRegistry(parseAl("export type Color = Red | Green | Blue\n"));
  const importer = parseAl("let f = c => switch c { | Red => 1 | Green => 2 }\n"); // missing Blue
  const r = checkWith(importer, dep);
  expect(r._tag).toBe("Err");
  if (r._tag === "Err") expect(r.error.message).toContain("non-exhaustive");
});

// ---- inferProgramImports (cross-module inference) --------------------------

test("inferProgramImports uses an imported scheme; open-world infer alone does not", () => {
  // A dep exporting `f : a -> string`; grab its inferred scheme from the env.
  const depEnv = unwrap(
    inferProgram(parseAl('export let f = x => "hi"\n'), builtins, namespaces, true),
  );
  const imports = new Map<string, Scheme>([["f", depEnv.get("f")]]);

  // `add(f(1), 2)` — with f : _ -> string seeded, f(1) is string and clashes
  // with add's number domain. Open-world (no import) leaves f a fresh var → ok.
  const importer = parseAl("let bad = add(f(1), 2)\n");
  expect(inferProgram(importer, builtins, namespaces, true)._tag).toBe("Ok");
  expect(inferProgramImports(importer, builtins, namespaces, true, imports)._tag).toBe("Err");
});

test("inferProgram is the zero-imports case of inferProgramImports", () => {
  const stmts = parseAl("let g = x => x\n");
  expect(inferProgram(stmts, builtins, namespaces, true)._tag).toBe("Ok");
});
