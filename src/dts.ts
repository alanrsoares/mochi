// Emit a TypeScript declaration (.d.ts) for a compiled alang module, so the
// emitted JS can be consumed from TypeScript with full types. Top-level `let`s
// become `export declare const`s; `type` decls become exported tagged-union
// types matching the `{ _tag, _0, ... }` runtime; `extern`s are imports, not
// our declarations, so they are omitted.
//
// The declared type of a binding follows the EMITTED JS, not just the HM type:
// a multi-param lambda `(a, b) => …` compiles to a 2-arg JS function, so its
// declaration is `(a: A, b: B) => R` — we peel arrows by the lambda's arity,
// recursing into curried bodies (`f => r => …` stays `(f: F) => (r: R) => …`).
import { flatMap, isErr, map, ok, pipe, type Result } from "@onrails/result";
import type { Ctor, Expr, Stmt } from "./ast";
import { check } from "./check";
import type { AlangError } from "./errors";
import { inferProgramTypes, type Scheme } from "./infer";
import { lex } from "./lexer";
import { parse } from "./parser";
import { builtinTypeDecls, preludeEnv, preludeNamespaces } from "./prelude";
import type { Row, Type } from "./types";

// Collect every type-constructor name appearing in a type (for detecting which
// builtin variant decls an emitted module must include).
const consIn = (t: Type, acc: Set<string>): void => {
  if (t.kind === "con") {
    acc.add(t.name);
    for (const a of t.args) consIn(a, acc);
  } else if (t.kind === "arrow") {
    consIn(t.from, acc);
    consIn(t.to, acc);
  } else if (t.kind === "record") {
    let row = t.row;
    while (row.kind === "extend") {
      consIn(row.type, acc);
      row = row.rest;
    }
  }
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const PRIM_TS: Record<string, string> = { number: "number", string: "string", bool: "boolean" };

// HM type → TS type. `names` maps quantified var ids to generic letters; any
// other var renders as `unknown` (it escaped generalization at this position).
const tsOf = (t: Type, names: Map<number, string>): string => {
  switch (t.kind) {
    case "var":
      return names.get(t.id) ?? "unknown";
    case "con": {
      const prim = PRIM_TS[t.name];
      if (prim) return prim;
      if (t.name === "Array" && t.args.length === 1) return `${tsOf(t.args[0]!, names)}[]`;
      if (t.name === "List" && t.args.length === 1) return `Iterable<${tsOf(t.args[0]!, names)}>`;
      return t.args.length === 0
        ? t.name
        : `${t.name}<${t.args.map((a) => tsOf(a, names)).join(", ")}>`;
    }
    case "arrow":
      return `(x: ${tsOf(t.from, names)}) => ${tsOf(t.to, names)}`;
    case "record":
      return tsRow(t.row, names);
  }
};

const tsRow = (row: Row, names: Map<number, string>): string => {
  const fields: string[] = [];
  let cur = row;
  while (cur.kind === "extend") {
    fields.push(`${cur.label}: ${tsOf(cur.type, names)}`);
    cur = cur.rest;
  }
  return fields.length === 0 ? "{}" : `{ ${fields.join("; ")} }`;
};

// Arity-aware function type: peel one arrow per lambda parameter, then recurse
// into the body (which may itself be a lambda for curried definitions).
const declType = (t: Type, value: Expr, names: Map<number, string>): string => {
  if (value.kind !== "lambda") return tsOf(t, names);
  const params: string[] = [];
  let cur = t;
  value.params.forEach((p, i) => {
    if (cur.kind !== "arrow") return;
    const name = p.kind === "name" ? p.name : `_${i}`;
    params.push(`${name}: ${tsOf(cur.from, names)}`);
    cur = cur.to;
  });
  return `(${params.join(", ")}) => ${declType(cur, value.body, names)}`;
};

// Assign generic letters to a scheme's quantified type vars.
const genericNames = (sc: Scheme): Map<number, string> =>
  new Map(sc.vars.map((id, i) => [id, LETTERS[i] ?? `T${i}`]));

const letDecl = (name: string, sc: Scheme, value: Expr): string => {
  const names = genericNames(sc);
  const generics = [...names.values()];
  // Generics can only be introduced on a function type; a polymorphic non-
  // function binding has nowhere to bind them, so those vars fall back to
  // `unknown` (empty names map).
  if (value.kind === "lambda") {
    const head = generics.length ? `<${generics.join(", ")}>` : "";
    return `export declare const ${name}: ${head}${declType(sc.type, value, names)};`;
  }
  return `export declare const ${name}: ${tsOf(sc.type, new Map())};`;
};

// A `type` decl → an exported tagged union matching the runtime shape.
const typeDecl = (name: string, params: string[], ctors: Ctor[]): string => {
  const gmap = new Map(params.map((p, i) => [p, LETTERS[i] ?? `T${i}`]));
  const argTs = (a: string): string =>
    gmap.get(a) ?? PRIM_TS[a] ?? (a === "float" || a === "int" ? "number" : a);
  const variant = (c: Ctor): string => {
    const fields = c.fields.map((fld, i) => `${fld.name ?? `_${i}`}: ${argTs(fld.type)}`);
    return `{ _tag: "${c.name}"${fields.length ? `; ${fields.join("; ")}` : ""} }`;
  };
  const head = params.length ? `${name}<${params.map((p) => gmap.get(p)).join(", ")}>` : name;
  return `export type ${head} =\n${ctors.map((c) => `  | ${variant(c)}`).join("\n")};`;
};

const declOf = (s: Stmt, schemeOf: (n: string) => Scheme | undefined): string | null => {
  if (s.kind === "import") return null; // re-exports live in the sibling module
  if (s.kind === "type") return typeDecl(s.name, s.params, s.ctors);
  if (s.kind === "extern") return null; // imported, not declared here
  const sc = schemeOf(s.name);
  return sc && !s.name.startsWith("$") ? letDecl(s.name, sc, s.value) : null;
};

export const emitDts = (src: string): Result<string, AlangError> => {
  const r = pipe(
    lex(src),
    flatMap(parse),
    flatMap(check),
    flatMap((prog) =>
      map(
        inferProgramTypes(prog, preludeEnv, { open: true, namespaces: preludeNamespaces }),
        (res) => ({
          prog,
          env: res.env,
        }),
      ),
    ),
  );
  if (isErr(r)) return r;
  const { prog, env } = r.value;
  const lines = prog.stmts
    .map((s) => declOf(s, (n) => env.get(n)))
    .filter((l): l is string => l !== null);
  // A builtin variant used in an exported binding's type (e.g. `Option<number>`
  // from `Map.get`) needs its type decl emitted too, unless the program declares
  // its own. Prepend so the reference resolves.
  const declared = new Set(prog.stmts.flatMap((s) => (s.kind === "type" ? [s.name] : [])));
  const referenced = new Set<string>();
  for (const s of prog.stmts) {
    if (s.kind !== "let" || s.name.startsWith("$")) continue;
    const sc = env.get(s.name);
    if (sc) consIn(sc.type, referenced);
  }
  const builtins = builtinTypeDecls
    .filter((bt) => referenced.has(bt.name) && !declared.has(bt.name))
    .map((bt) => typeDecl(bt.name, bt.params, bt.ctors));
  return ok(`${[...builtins, ...lines].join("\n")}\n`);
};
