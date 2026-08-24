/** Codegen for top-level statements: `type` (ctor factories), `extern`/`import` (ESM), and `let`. */
import { match } from "@onrails/pattern";
import type { ExternStmt, ImportStmt, Stmt, TypeStmt } from "../ast/ast";
import { keysOf } from "../ast/ctors";
import { type GenCtx, genExpr, typeExprArity } from "./codegen-core";

/**
 * A variant decl has no runtime type in JS — it lowers to constructor
 * factories only. Nullary → a tagged value; n-ary → a tagging function. The
 * discriminant key is `_tag`, matching the @onrails ecosystem convention
 * (@onrails/result, @onrails/maybe), so their type guards (isOk/isSome/...)
 * recognize mochi values at the JS boundary.
 */
const genType = (s: TypeStmt, ctx: GenCtx): string =>
  s.ctors
    .map((c) => {
      const tag = JSON.stringify(c.name);
      if (c.fields.length === 0) {
        const ts = ctx.annotateCtor?.(s, c) ?? null;
        // Annotate the nullary const so `_tag` stays the literal (`"Leaf"`), not
        // widened to `string` — else it won't match the variant union.
        return ts
          ? `const ${c.name}: ${ts.retMono} = { _tag: ${tag} };`
          : `const ${c.name} = { _tag: ${tag} };`;
      }
      const keys = keysOf(c.fields);
      const params = keys.join(", ");
      const obj = `({ _tag: ${tag}, ${params} })`;
      const ts = ctx.annotateCtor?.(s, c) ?? null;
      // Single-field: a typed arrow scopes its own generics (`<A>(_0: A): T`).
      if (c.fields.length < 2) {
        if (!ts) return `const ${c.name} = (${params}) => ${obj};`;
        const typed = keys.map((k, i) => `${k}: ${ts.paramTypes[i]}`).join(", ");
        return `const ${c.name} = ${ts.generics}(${typed}): ${ts.ret} => ${obj};`;
      }
      // Multi-field: curried so partial application works (CRITIQUE §4.4). The
      // TS form casts `_curry`'s `any` to the public signature — the impl's
      // params stay `any` (from `_curry`), so no generic-scope gymnastics.
      const impl = `(${params}) => ${obj}`;
      const curried = `_curry(${c.fields.length}, ${impl})`;
      if (!ts) return `const ${c.name} = ${curried};`;
      const sig = `${ts.generics}(${keys.map((k, i) => `${k}: ${ts.paramTypes[i]}`).join(", ")}) => ${ts.ret}`;
      return `const ${c.name} = ${curried} as ${sig};`;
    })
    .join("\n");

/**
 * extern → ESM import. Arity ≥ 2 wraps the host export in `_curry` so flat
 * `(a, b) => …` hosts survive mochi's multi-arg call emit (ADR 0005 / #24).
 * The raw import is aliased to `$name` so the local binding stays the surface name.
 * `imported === "default"` emits a default import (styled-cva / host kits).
 */
const genExtern = (s: ExternStmt): string => {
  const convention = /^mochi:(global|send|get|set|new):(.*)$/.exec(s.module);
  if (convention) {
    const [, kind, target] = convention;
    const global = `globalThis[${JSON.stringify(target)}]`;
    if (kind === "global")
      return `const ${s.name} = ${s.imported ? `${global}[${JSON.stringify(s.imported)}]` : global};`;
    if (kind === "get")
      return `const ${s.name} = ($receiver) => $receiver[${JSON.stringify(target)}];`;
    if (kind === "set")
      return `const ${s.name} = _curry(2, ($receiver, $value) => ($receiver[${JSON.stringify(target)}] = $value));`;
    if (kind === "new") {
      const arity = typeExprArity(s.typeExpr);
      const args = Array.from({ length: arity }, (_, i) => `$a${i}`).join(", ");
      if (s.imported) {
        const raw = `$${s.name}`;
        const importLine = `import { ${s.imported} as ${raw} } from ${JSON.stringify(target)};`;
        const ctor = `new ${raw}(${args})`;
        return arity === 0
          ? `${importLine}\nconst ${s.name} = () => ${ctor};`
          : `${importLine}\nconst ${s.name} = _curry(${arity}, (${args}) => ${ctor});`;
      }
      return arity === 0
        ? `const ${s.name} = () => new ${global}();`
        : `const ${s.name} = _curry(${arity}, (${args}) => new ${global}(${args}));`;
    }
    const arity = typeExprArity(s.typeExpr);
    const args = Array.from({ length: Math.max(0, arity - 1) }, (_, i) => `$a${i}`).join(", ");
    const fn = `($receiver${args ? `, ${args}` : ""}) => $receiver[${JSON.stringify(target)}](${args})`;
    return arity < 2 ? `const ${s.name} = ${fn};` : `const ${s.name} = _curry(${arity}, ${fn});`;
  }
  if (s.imported === "default") {
    return `import ${s.name} from ${JSON.stringify(s.module)};`;
  }
  const arity = typeExprArity(s.typeExpr);
  // A `curried` host is already `a => b => c` (ADR 0064), so the flat impl mochi
  // curries must apply it one argument at a time. Below arity 2 the two host
  // shapes coincide and the plain import is already right.
  if (arity < 2) {
    const spec = s.imported === s.name ? s.name : `${s.imported} as ${s.name}`;
    return `import { ${spec} } from ${JSON.stringify(s.module)};`;
  }
  const raw = `$${s.name}`;
  const importLine = `import { ${s.imported} as ${raw} } from ${JSON.stringify(s.module)};`;
  const args = Array.from({ length: arity }, (_, i) => `$a${i}`);
  const flat = s.curried
    ? `(${args.join(", ")}) => ${raw}${args.map((a) => `(${a})`).join("")}`
    : raw;
  const wrapLine = `const ${s.name} = _curry(${arity}, ${flat});`;
  return `${importLine}\n${wrapLine}`;
};

/**
 * import { a, b } from "./mod"  → the compiled sibling `./mod.js` (or `.mochi`
 * under Vite). Bare package specs (`@mochi/plugin-preact/hooks`) keep their
 * name — appending `moduleExt` would break package `exports` (ADR 0015).
 * import * as Alias from "./mod" → ESM namespace import (ADR 0002).
 */
const rewriteImportPath = (from: string, moduleExt: string): string => {
  const bare = from.replace(/\.mochi$/, "");
  return !(bare.startsWith("./") || bare.startsWith("../")) ? bare : `${bare}${moduleExt}`;
};

const genImport = (s: ImportStmt, ctx: GenCtx): string => {
  const path = rewriteImportPath(s.from, ctx.moduleExt);
  if (s.alias) return `import * as ${s.alias.name} from ${JSON.stringify(path)};`;
  const names = s.names.map((n) => n.name).join(", ");
  return `import { ${names} } from ${JSON.stringify(path)};`;
};

export const genStmt = (s: Stmt, ctx: GenCtx): string =>
  match(s)
    // Unreachable by construction: the railway stops on parse diagnostics, so a
    // Program that reaches codegen has no error nodes (ADR 0045 decision 6). This is
    // the codegen invariant — emitting a placeholder for unrepresentable source would
    // hand the user silently-wrong output instead of a loud bug report.
    .with({ kind: "error" }, (s) => {
      throw new Error(`codegen invariant: error node reached codegen at ${s.span.start}`);
    })
    .with({ kind: "import" }, (s) => genImport(s, ctx))
    .with({ kind: "type" }, (s) => {
      const decls = genType(s, ctx);
      if (decls === "") return "";
      return s.exported
        ? decls
            .split("\n")
            .map((l) => `export ${l}`)
            .join("\n")
        : decls;
    })
    .with({ kind: "extern" }, (s) =>
      s.exported ? `${genExtern(s)}\nexport { ${s.name} };` : genExtern(s),
    )
    .with({ kind: "let" }, (s) => {
      const doExport = s.exported && !s.name.startsWith("$"); // never export destructure temps
      const ann = ctx.annotateLet?.(s.name, s.value) ?? ""; // TS backend annotates; JS leaves bare
      return `${doExport ? "export " : ""}const ${s.name}${ann} = ${genExpr(s.value, ctx)};`;
    })
    .exhaustive();
