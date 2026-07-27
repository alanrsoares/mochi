// Ticket 0013 (part b) — the four cross-module seams the single-file pipeline
// never exposed, added to the bootstrap passes and tested individually before
// compileGraph is built on top:
//   check.mochi     — checkWith(stmts, importedReg), exportedRegistry(stmts)
//   codegen.mochi   — exportedCtorKeys(stmts)
//   infer.mochi     — inferProgramImports(stmts, builtins, namespaces, open, imports, nsImports)
// We build the bootstrap graph to JS and drive the emitted functions in-process.

import { beforeAll, expect, test } from "bun:test";
import { join } from "node:path";
import { ensureInTreeBootstrapBuild } from "./support/bootstrap";

const root = join(import.meta.dir, "..");
const bs = (f: string) => join(root, `bootstrap/${f}`);

type Res<T> = { _tag: "Ok"; value: T } | { _tag: "Err"; error: { message: string } };
type AlOption<T> = { _tag: "None" } | { _tag: "Some"; value: T };
type Stmts = unknown[];
type Scheme = unknown;
type CtorInfo = { owner: string; arity: number };
type Registry = { ctors: Map<string, CtorInfo>; types: Map<string, string[]> };

let lex: (s: string) => Res<unknown>;
let parse: (t: unknown) => Res<Stmts>;
let check: (s: Stmts) => Res<Stmts>;
let checkWith: (s: Stmts, imported: Registry, quals: ReadonlyMap<string, unknown>) => Res<Stmts>;
let exportedRegistry: (s: Stmts) => Registry;
let exportedCtorKeys: (s: Stmts) => Map<string, string[]>;
let inferProgram: (s: Stmts, b: unknown, n: unknown, open: boolean) => Res<Map<string, Scheme>>;
let inferProgramImports: (
  s: Stmts,
  b: unknown,
  n: unknown,
  open: boolean,
  imports: Map<string, Scheme>,
  nsImports: Map<string, Map<string, Scheme>>,
  quals: ReadonlyMap<string, unknown>,
  pluginsOpt: AlOption<unknown[]>,
) => Res<Map<string, Scheme>>;
let builtins: unknown;
let namespaces: unknown;

const unwrap = <T>(r: Res<T>): T => {
  if (r._tag !== "Ok") throw new Error(`expected Ok, got Err: ${r.error.message}`);
  return r.value;
};
const parseAl = (src: string): Stmts => unwrap(parse(unwrap(lex(src))));

beforeAll(async () => {
  ensureInTreeBootstrapBuild();
  ({ lex } = await import(bs("lexer.js")));
  ({ parse } = await import(bs("parser.js")));
  ({ check, checkWith } = await import(bs("check.js")));
  ({ exportedRegistry, exportedCtorKeys } = await import(bs("ctors.js")));
  ({ inferProgram, inferProgramImports } = await import(bs("infer.js")));
  ({ builtins, namespaces } = await import(bs("prelude.gen.mjs")));
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
  expect(checkWith(importer, dep, new Map())._tag).toBe("Ok"); // resolved via imported registry
});

test("checkWith still enforces exhaustiveness against the imported ctor set", () => {
  const dep = exportedRegistry(parseAl("export type Color = Red | Green | Blue\n"));
  const importer = parseAl("let f = c => switch c { | Red => 1 | Green => 2 }\n"); // missing Blue
  const r = checkWith(importer, dep, new Map());
  expect(r._tag).toBe("Err");
  if (r._tag === "Err") expect(r.error.message).toContain("non-exhaustive");
});

// ---- checkWith (qualified type names, C5 slice d) --------------------------
//
// `quals` is the alias → dep-type-scope map the module driver threads in. Both
// diagnostics must read byte-for-byte like src/check.ts's, since the bootstrap
// binary is what ships.

test("checkWith rejects a qualified type whose alias is not a namespace import", () => {
  const importer = parseAl('import { Circle } from "./shapes"\nlet n : E.Shape = 1\n');
  const r = checkWith(importer, { ctors: new Map(), types: new Map() }, new Map());
  expect(r._tag).toBe("Err");
  if (r._tag === "Err")
    expect(r.error.message).toBe(
      "unknown module alias 'E' in type 'E.Shape' — a qualified type name needs a matching 'import * as E from \"…\"'",
    );
});

test("checkWith rejects an alias member the dep does not export", () => {
  const importer = parseAl('import * as D from "./shapes"\nlet n : D.Nope = 1\n');
  const quals = new Map([["D", { types: new Set(["Shape"]) }]]);
  const r = checkWith(importer, { ctors: new Map(), types: new Map() }, quals);
  expect(r._tag).toBe("Err");
  if (r._tag === "Err")
    expect(r.error.message).toBe(
      "module alias 'D' has no exported type 'Nope' — export it from the imported module ('export type Nope = …')",
    );
});

test("checkWith stays silent about qualified names when no graph scope was threaded", () => {
  // Single-file `check` has no `quals`, so an alias absent from the map means
  // "not compiled through a graph" — accuse nothing.
  const importer = parseAl('import * as D from "./shapes"\nlet n : D.Nope = 1\n');
  expect(checkWith(importer, { ctors: new Map(), types: new Map() }, new Map())._tag).toBe("Ok");
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
  expect(
    inferProgramImports(importer, builtins, namespaces, true, imports, new Map(), new Map(), {
      _tag: "None",
    })._tag,
  ).toBe("Err");
});

test("inferProgram is the zero-imports case of inferProgramImports", () => {
  const stmts = parseAl("let g = x => x\n");
  expect(inferProgram(stmts, builtins, namespaces, true)._tag).toBe("Ok");
});
