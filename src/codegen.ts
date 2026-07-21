// Codegen — AST → JavaScript source. Pure (no failure).
// alang owns the type system (HM inference), so emitted JS carries no type
// annotations — the checker runs before codegen and guarantees soundness.
// ts-pattern .exhaustive() forces a case for every Expr kind here: add an AST
// node and forget it → TS compile error in the compiler, not a silent gap.
import { match } from "ts-pattern";
import type {
  CtorField,
  Expr,
  ExternStmt,
  FieldExpr,
  ImportStmt,
  LambdaExpr,
  LamParam,
  ListExpr,
  ListPat,
  LitPat,
  MatchArm,
  MatchExpr,
  Pattern,
  Program,
  Stmt,
  TypeStmt,
} from "./ast";
import { builtinTypeDecls, namespaceRuntime, preludeJsDefs, runtimeDeps } from "./prelude";

// A `Ns.member` access on a bare namespace ref (`List.map`) → the JS identifier
// its runtime is defined under, or null if it isn't a namespace access.
const nsRuntimeId = (e: FieldExpr): string | null =>
  e.target.kind === "ref" ? (namespaceRuntime[e.target.name]?.[e.name] ?? null) : null;

// A constructor's runtime field keys: a labelled field uses its label, an
// unlabelled one its position (`_0`, `_1`). Both the factory (`genType`) and the
// pattern destructure (`genWithArm`) must agree, so patterns consult this
// registry — populated per `codegen` call from the program's `type` decls.
const keysOf = (fields: CtorField[]): string[] => fields.map((f, i) => f.name ?? `_${i}`);
let ctorKeys = new Map<string, string[]>();

// The field keys of a module's EXPORTED ctors — threaded into an importer's
// `codegen` so a pattern on an imported variant destructures the right runtime
// keys (`Some(value: a)` → `{ value }`, not the positional `{ _0 }`).
export const exportedCtorKeys = (prog: Program): Map<string, string[]> => {
  const m = new Map<string, string[]>();
  for (const s of prog.stmts)
    if (s.kind === "type" && s.exported) for (const c of s.ctors) m.set(c.name, keysOf(c.fields));
  return m;
};

// Collapse a curried lambda chain (`x => y => body`, or a mix with multi-param
// lambdas) into one flat parameter list plus the final body. alang types treat
// `(x, y) => e` and `x => y => e` identically (`a -> b -> c`), so this is sound
// — it lets a multi-arg function lower to a single `_curry`-wrapped JS function
// instead of nested closures (CRITIQUE §4.4).
const collapseLambda = (l: LambdaExpr): { params: LamParam[]; body: Expr } => {
  const params = [...l.params];
  let body: Expr = l.body;
  while (body.kind === "lambda") {
    params.push(...body.params);
    body = body.body;
  }
  return { params, body };
};

const genExpr = (e: Expr): string =>
  match(e)
    .with({ kind: "num" }, (n) => n.raw)
    .with({ kind: "bool" }, (b) => String(b.value))
    .with({ kind: "str" }, (s) => JSON.stringify(s.value))
    .with({ kind: "ref" }, (r) => r.name)
    .with({ kind: "call" }, (c) => `${genCallee(c.fn)}(${c.args.map(genExpr).join(", ")})`)
    .with({ kind: "lambda" }, (l) => {
      const { params, body } = collapseLambda(l);
      const arrow = `(${params.map(genParam).join(", ")}) => ${genLambdaBody(body)}`;
      // Curried type, flat JS impl: arity ≥ 2 lowers to a `_curry`-wrapped
      // function so any call grouping works (CRITIQUE §4.4). Arity 1 needs none.
      return params.length >= 2 ? `_curry(${params.length}, ${arrow})` : arrow;
    })
    // let x = v in b  →  an IIFE binding x: `((x) => b)(v)`. Non-recursive, so
    // a plain arg-application is enough; nested let-ins chain as curried IIFEs.
    .with(
      { kind: "letin" },
      (l) => `((${l.name}) => ${genLambdaBody(l.body)})(${genExpr(l.value)})`,
    )
    // let? p = v in b  →  the Result bind: `_Result_flatMap((p) => b)(v)`.
    .with(
      { kind: "letbind" },
      (l) =>
        `_Result_flatMap((${genParam(l.param)}) => ${genLambdaBody(l.body)})(${genExpr(l.value)})`,
    )
    // desugar inline: a |> f  →  f(a)
    .with({ kind: "pipe" }, (p) => `${genCallee(p.right)}(${genExpr(p.left)})`)
    // Always parenthesized, so the output nests safely in any JS position.
    .with(
      { kind: "ternary" },
      (t) => `(${genExpr(t.cond)} ? ${genExpr(t.then)} : ${genExpr(t.else)})`,
    )
    .with({ kind: "match" }, genMatch)
    .with({ kind: "record" }, (r) => {
      const fields = r.fields.map((f) => `${f.name}: ${genExpr(f.value)}`);
      const parts = r.spread ? [`...${genExpr(r.spread)}`, ...fields] : fields;
      return parts.length === 0 ? "{}" : `{ ${parts.join(", ")} }`;
    })
    .with({ kind: "field" }, (f) => nsRuntimeId(f) ?? `${genMember(f.target)}.${f.name}`)
    // A tuple erases to a JS array `[a, b]` (like ReScript); the type system
    // keeps it distinct from an `alang` Array, the runtime shares the shape.
    .with({ kind: "tuple" }, (t) => `[${t.elements.map(genExpr).join(", ")}]`)
    .with({ kind: "arr" }, (l) => `[${l.elements.map(genExpr).join(", ")}]`)
    .with({ kind: "list" }, genList)
    .with(
      { kind: "map" },
      (m) =>
        `new Map([${m.entries.map((e) => `[${genExpr(e.key)}, ${genExpr(e.value)}]`).join(", ")}])`,
    )
    .exhaustive();

// A `@{...}` literal → a lazy iterable over its (eagerly-evaluated) elements.
// `_list` wraps a generator factory so the List is re-iterable and lazy.
const genList = (e: ListExpr): string => {
  const yields = e.elements.map((el) => `yield (${genExpr(el)});`).join(" ");
  return `_list(function* () {${yields ? ` ${yields} ` : ""}})`;
};

// A lambda parameter lowers to JS: a name, or native object destructuring.
const genParam = (p: LamParam): string =>
  p.kind === "name"
    ? p.name
    : p.kind === "ptuple"
      ? `[${p.names.join(", ")}]`
      : `{ ${p.fields.join(", ")} }`;

// A lambda in callee position must be parenthesized: `((x) => ...)(arg)`.
const genCallee = (e: Expr): string => (e.kind === "lambda" ? `(${genExpr(e)})` : genExpr(e));

// A record or lambda in member-target position needs parens: `({...}).x`.
const genMember = (e: Expr): string =>
  e.kind === "record" || e.kind === "lambda" ? `(${genExpr(e)})` : genExpr(e);

// A record literal as a concise arrow body must be parenthesized, else JS
// parses `=> { ... }` as a statement block: `=> ({ x: 1 })`.
const genLambdaBody = (e: Expr): string => (e.kind === "record" ? `(${genExpr(e)})` : genExpr(e));

// ---- match → @onrails/pattern chain --------------------------------------
// Emitted `switch` lowers to a match().with().exhaustive() chain. We target
// @onrails/pattern (ts-pattern-shaped, smaller runtime, pairs with
// @onrails/result + @onrails/maybe). Each arm is a single pattern, which is the
// common subset both libraries share.

// A pattern always matches (→ `.otherwise`) when it binds without narrowing: a
// wildcard, a plain name, or a record whose every field just binds.
const isCatchAll = (p: Pattern): boolean =>
  p.kind === "pwild" ||
  p.kind === "pbind" ||
  (p.kind === "precord" && p.fields.every((f) => isCatchAll(f.pat))) ||
  // A tuple always matches when every position does (irrefutable product).
  (p.kind === "ptuple" && p.elems.every(isCatchAll)) ||
  // [...all] / @{...all} — a bare rest with no fixed head matches anything.
  ((p.kind === "parr" || p.kind === "plist") && p.elems.length === 0 && p.rest !== null);

// ---- general pattern compiler ----------------------------------------------
// Nested patterns can't lower to matcher objects: @onrails/pattern's matcher
// compares object values shallowly (`!==`), so `{ value: { _tag: "Sm" } }`
// never matches. An arm with nesting instead lowers to the guard form the
// array/tuple arms already use — `.with((_v) => conds, (slot) => body)`.
// `patConds` renders the refutable tests against a path expression; `patSlot`
// renders the JS destructuring target binding the names ("" = a hole, nothing
// binds beneath). Lazy `plist` never reaches either: nested occurrences are
// rejected by check.ts, top-level arms go through `genListMatch`.

// `{ key: sub }` entry, punned when the bound name IS the key.
const keyedSlot = (key: string, sub: string): string => (sub === key ? key : `${key}: ${sub}`);

const patSlot = (p: Pattern): string => {
  switch (p.kind) {
    case "pbind":
      return p.name;
    case "pwild":
    case "plit":
    case "pbool":
    case "pstr":
    case "plist":
      return "";
    case "pctor": {
      const keys = ctorKeys.get(p.ctor);
      const entries = p.args.flatMap((a, i) => {
        const s = patSlot(a);
        return s === "" ? [] : [keyedSlot(keys?.[i] ?? `_${i}`, s)];
      });
      return entries.length ? `{ ${entries.join(", ")} }` : "";
    }
    case "precord": {
      const entries = p.fields.flatMap((f) => {
        const s = patSlot(f.pat);
        return s === "" ? [] : [keyedSlot(f.label, s)];
      });
      return entries.length ? `{ ${entries.join(", ")} }` : "";
    }
    case "ptuple": {
      const slots = p.elems.map(patSlot);
      return slots.some((s) => s !== "") ? `[${slots.join(", ")}]` : "";
    }
    case "parr": {
      const slots = p.elems.map(patSlot);
      if (p.rest?.kind === "pbind") slots.push(`...${p.rest.name}`);
      return slots.some((s) => s !== "") ? `[${slots.join(", ")}]` : "";
    }
    // Alternatives bind identical names at identical positions (checked), so any
    // alt's slot destructures the value for the whole arm.
    case "por":
      return patSlot(p.alts[0]!);
  }
};

const patConds = (p: Pattern, path: string): string[] => {
  switch (p.kind) {
    case "pwild":
    case "pbind":
    case "plist":
      return [];
    case "plit":
    case "pbool":
    case "pstr":
      return [`${path} === ${litValue(p)}`];
    case "pctor": {
      const keys = ctorKeys.get(p.ctor);
      return [
        `${path}._tag === ${JSON.stringify(p.ctor)}`,
        ...p.args.flatMap((a, i) => patConds(a, `${path}.${keys?.[i] ?? `_${i}`}`)),
      ];
    }
    case "precord":
      return p.fields.flatMap((f) => patConds(f.pat, `${path}.${f.label}`));
    case "ptuple":
      // No length guard — tuple arity is guaranteed by the type.
      return p.elems.flatMap((e, i) => patConds(e, `${path}[${i}]`));
    case "parr":
      return [
        `${path}.length ${p.rest ? ">=" : "==="} ${p.elems.length}`,
        ...p.elems.flatMap((e, i) => patConds(e, `${path}[${i}]`)),
      ];
    case "por": {
      // `(condsA) || (condsB) || …` — each alt's own conds &&-joined first.
      const alts = p.alts.map((a) => {
        const c = patConds(a, path);
        return c.length ? c.map((x) => `(${x})`).join(" && ") : "true";
      });
      return [alts.map((a) => `(${a})`).join(" || ")];
    }
  }
};

// The handler parameter for a catch-all pattern: bind the name, destructure a
// record's/tuple's binds, or ignore the value.
const catchAllParam = (p: Pattern): string => {
  // `[...all]` / `@{...all}` binds the whole collection to the rest name — NOT
  // a destructure: `[...all]` would copy the array and force a lazy List.
  if (p.kind === "parr" || p.kind === "plist")
    return p.rest?.kind === "pbind" ? `(${p.rest.name})` : "()";
  const slot = patSlot(p);
  return slot === "" ? "()" : `(${slot})`;
};

// A switch is a "lazy-List match" when it has a narrowing `@{}`/`@{h,...t}` arm
// (a lone `@{...all}` is a catch-all, not narrowing). check.ts guarantees such a
// switch is exactly the empty + single-head-cons pair, so it lowers directly.
const isListMatch = (m: MatchExpr): boolean =>
  m.arms.some((a) => a.pattern.kind === "plist" && !isCatchAll(a.pattern));

// A lazy tail/rest: replay the still-buffered elements from index `from`, then
// drain whatever's left in the iterator. `_list` makes it re-iterable + lazy.
const listTail = (from: number): string =>
  `_list(function* () { for (let _i = ${from}; _i < _b.length; _i++) yield _b[_i]; ` +
  `if (!_done) { let _s; while (!(_s = _it.next()).done) yield _s.value; } })`;

// One narrowing lazy-List arm → an `if (cond) return call;`. A fixed arm `@{a,
// b}` must see n+1 pulls to prove length exactly n; a cons arm `@{h, ...t}`
// needs n pulls (length ≥ n) and binds its tail to a lazy List over the rest.
// Element sub-patterns guard/bind via the general compiler against the buffer
// (`_b[i]` is already pulled, so nested tests force nothing extra).
const genListArm = (p: ListPat, body: Expr): string => {
  const n = p.elems.length;
  const guards = p.elems.flatMap((ep, i) => patConds(ep, `_b[${i}]`));
  const cond = [p.rest ? `_pull(${n})` : `!_pull(${n + 1}) && _b.length === ${n}`, ...guards].join(
    " && ",
  );
  const params: string[] = [];
  const args: string[] = [];
  p.elems.forEach((ep, i) => {
    const slot = patSlot(ep);
    if (slot !== "") {
      params.push(slot);
      args.push(`_b[${i}]`);
    }
  });
  if (p.rest?.kind === "pbind") {
    params.push(p.rest.name);
    args.push(listTail(n));
  }
  return `  if (${cond}) return ((${params.join(", ")}) => ${genLambdaBody(body)})(${args.join(", ")});`;
};

// A lazy-List switch → an IIFE that pulls just enough elements to decide each
// arm, buffering them so later arms can re-examine a prefix without re-forcing
// it. Bounded pulls only — a pull-sequence is never fully forced, so this can't
// use @onrails/pattern (not length-indexable). check.ts proved totality.
const genListMatch = (m: MatchExpr): string => {
  const arms: string[] = [];
  let fallback = `(() => { throw new Error("non-exhaustive lazy-list switch"); })()`;
  for (const a of m.arms) {
    if (a.pattern.kind === "plist" && !isCatchAll(a.pattern)) {
      arms.push(genListArm(a.pattern, a.body));
    } else if (isCatchAll(a.pattern)) {
      // `@{...all}` / `_` / bind matches any list; a named rest binds a lazy
      // List over the whole thing (leftover buffer + iterator). Terminal arm.
      const rest =
        a.pattern.kind === "plist" && a.pattern.rest?.kind === "pbind" ? a.pattern.rest.name : null;
      fallback = rest ? `((${rest}) => ${genLambdaBody(a.body)})(${listTail(0)})` : genExpr(a.body);
      break;
    }
  }
  return (
    `((_it) => { const _b = []; let _done = false; ` +
    `const _pull = (_n) => { while (_b.length < _n && !_done) { const _s = _it.next(); ` +
    `if (_s.done) _done = true; else _b.push(_s.value); } return _b.length >= _n; };\n` +
    `${arms.join("\n")}\n  return ${fallback};\n` +
    `})(${genExpr(m.scrutinee)}[Symbol.iterator]())`
  );
};

const genMatch = (m: MatchExpr): string => {
  if (isListMatch(m)) return genListMatch(m);
  const parts = [`match(${genExpr(m.scrutinee)})`];
  let catchAll: MatchArm | undefined;
  for (const arm of m.arms) {
    // A guarded arm narrows regardless of its pattern (the guard can be
    // false), so it always takes the guard form — even `_ when g`.
    if (arm.guard) {
      parts.push(`  ${genGuardArm(arm.pattern, arm.body, arm.guard)}`);
      continue;
    }
    if (isCatchAll(arm.pattern)) {
      catchAll ??= arm;
      continue;
    }
    parts.push(`  ${genWithArm(arm.pattern as NarrowingPattern, arm.body)}`);
  }
  if (catchAll) {
    parts.push(
      `  .otherwise(${catchAllParam(catchAll.pattern)} => ${genLambdaBody(catchAll.body)})`,
    );
  } else {
    parts.push("  .exhaustive()");
  }
  return parts.join("\n");
};

// A literal pattern rendered as a JS value for the matcher object / `.with`.
const litValue = (p: LitPat): string =>
  p.kind === "pstr" ? JSON.stringify(p.value) : p.kind === "plit" ? p.raw : String(p.value);

// Patterns that narrow (everything a catch-all is not) — routed to `.with(...)`.
type NarrowingPattern = Extract<
  Pattern,
  { kind: "pctor" | "plit" | "pbool" | "pstr" | "precord" | "parr" | "ptuple" | "por" }
>;

// A sub-pattern the flat matcher-object form can express: a bind, wildcard, or
// primitive literal (the matcher compares values with `!==`, so only
// primitives are meaningful there). Anything deeper routes to the guard form.
const isFlatSub = (p: Pattern): boolean =>
  p.kind === "pbind" ||
  p.kind === "pwild" ||
  p.kind === "plit" ||
  p.kind === "pbool" ||
  p.kind === "pstr";

// The general arm: predicate + destructuring handler, built by the pattern
// compiler. Handles arbitrary nesting (`Sm(Sm(n))`, `Ok((a, b))`, ctors inside
// tuples/arrays) and `when` guards. A guard runs after the structural tests
// (&&-short-circuit), with the pattern's binds rebound from `_v` by the same
// destructuring slot the handler uses.
const genGuardArm = (p: Pattern, body: Expr, guard?: Expr): string => {
  const conds = patConds(p, "_v");
  const slot = patSlot(p);
  if (guard)
    conds.push(slot === "" ? `(${genExpr(guard)})` : `((${slot}) => ${genExpr(guard)})(_v)`);
  const test = conds.length ? conds.join(" && ") : "true";
  return `.with((_v) => ${test}, ${slot === "" ? "()" : `(${slot})`} => ${genLambdaBody(body)})`;
};

const genWithArm = (p: NarrowingPattern, body: Expr): string => {
  // Array/tuple/or arms always take the guard form (not matcher-object-able).
  if (p.kind === "parr" || p.kind === "ptuple" || p.kind === "por") return genGuardArm(p, body);

  if (p.kind === "plit" || p.kind === "pbool" || p.kind === "pstr")
    return `.with(${litValue(p)}, () => ${genLambdaBody(body)})`;

  if (p.kind === "precord") {
    if (!p.fields.every((f) => isFlatSub(f.pat))) return genGuardArm(p, body);
    // Flat fast path: literal fields form the matcher object (at least one —
    // else it's a catch-all); binding fields destructure in the handler.
    const lits = p.fields.flatMap((f) =>
      f.pat.kind === "plit" || f.pat.kind === "pbool" || f.pat.kind === "pstr"
        ? [`${f.label}: ${litValue(f.pat)}`]
        : [],
    );
    const slot = patSlot(p);
    return `.with({ ${lits.join(", ")} }, ${slot === "" ? "()" : `(${slot})`} => ${genLambdaBody(body)})`;
  }

  // pctor — flat fast path keeps the readable matcher-object form.
  if (!p.args.every(isFlatSub)) return genGuardArm(p, body);
  const binds: string[] = []; // "value: r" (or "_0: r" positionally)
  const litFields: string[] = []; // "value: 5" — narrows further
  const keys = ctorKeys.get(p.ctor);
  p.args.forEach((a, i) => {
    const key = keys?.[i] ?? `_${i}`;
    if (a.kind === "pbind") binds.push(keyedSlot(key, a.name));
    else if (a.kind === "plit" || a.kind === "pbool" || a.kind === "pstr")
      litFields.push(`${key}: ${litValue(a)}`);
    // pwild → don't bind
  });
  const patObj = [`_tag: ${JSON.stringify(p.ctor)}`, ...litFields].join(", ");
  const param = binds.length ? `({ ${binds.join(", ")} })` : "()";
  return `.with({ ${patObj} }, ${param} => ${genLambdaBody(body)})`;
};

// ---- statements -----------------------------------------------------------

// A variant decl has no runtime type in JS — it lowers to constructor
// factories only. Nullary → a tagged value; n-ary → a tagging function. The
// discriminant key is `_tag`, matching the @onrails ecosystem convention
// (@onrails/result, @onrails/maybe), so their type guards (isOk/isSome/...)
// recognize alang values at the JS boundary.
const genType = (s: TypeStmt): string =>
  s.ctors
    .map((c) => {
      const tag = JSON.stringify(c.name);
      if (c.fields.length === 0) return `const ${c.name} = { _tag: ${tag} };`;
      const params = keysOf(c.fields).join(", ");
      const impl = `(${params}) => ({ _tag: ${tag}, ${params} })`;
      // Constructors are curried too (`a -> b -> Pair`); wrap multi-field ones
      // so partial application works (CRITIQUE §4.4). Single-field needs none.
      return c.fields.length >= 2
        ? `const ${c.name} = _curry(${c.fields.length}, ${impl});`
        : `const ${c.name} = ${impl};`;
    })
    .join("\n");

// extern → an ESM import binding the external export to the alang name.
const genExtern = (s: ExternStmt): string => {
  const spec = s.imported === s.name ? s.name : `${s.imported} as ${s.name}`;
  return `import { ${spec} } from ${JSON.stringify(s.module)};`;
};

// import { a, b } from "./mod"  → the compiled sibling `./mod.js`. Source paths
// name the `.al` module (with or without extension); output targets `.js`.
const genImport = (s: ImportStmt): string => {
  const names = s.names.map((n) => n.name).join(", ");
  const path = `${s.from.replace(/\.al$/, "")}.js`;
  return `import { ${names} } from ${JSON.stringify(path)};`;
};

const genStmt = (s: Stmt): string => {
  if (s.kind === "import") return genImport(s);
  if (s.kind === "type") {
    const decls = genType(s);
    if (decls === "") return ""; // record alias: pure type, no runtime
    return s.exported
      ? decls
          .split("\n")
          .map((l) => `export ${l}`)
          .join("\n")
      : decls;
  }
  if (s.kind === "extern") {
    // An extern is itself an import; re-export the local binding when exported.
    return s.exported ? `${genExtern(s)}\nexport { ${s.name} };` : genExtern(s);
  }
  const doExport = s.exported && !s.name.startsWith("$"); // never export destructure temps
  return `${doExport ? "export " : ""}const ${s.name} = ${genExpr(s.value)};`;
};

// Does the program need the `@onrails/pattern` import? Only if it has a match
// that lowers to a `match()` chain. A lazy-List switch lowers to a plain IIFE
// instead, so a program that only ever destructures Lists imports nothing.
const usesMatchLib = (e: Expr): boolean =>
  match(e)
    .with({ kind: "num" }, { kind: "bool" }, { kind: "str" }, { kind: "ref" }, () => false)
    .with({ kind: "call" }, (c) => usesMatchLib(c.fn) || c.args.some(usesMatchLib))
    .with({ kind: "lambda" }, (l) => usesMatchLib(l.body))
    .with({ kind: "letin" }, (l) => usesMatchLib(l.value) || usesMatchLib(l.body))
    .with({ kind: "letbind" }, (l) => usesMatchLib(l.value) || usesMatchLib(l.body))
    .with({ kind: "pipe" }, (p) => usesMatchLib(p.left) || usesMatchLib(p.right))
    .with(
      { kind: "ternary" },
      (t) => usesMatchLib(t.cond) || usesMatchLib(t.then) || usesMatchLib(t.else),
    )
    .with(
      { kind: "match" },
      (m) =>
        !isListMatch(m) ||
        usesMatchLib(m.scrutinee) ||
        m.arms.some(
          (a) => (a.guard !== undefined && usesMatchLib(a.guard)) || usesMatchLib(a.body),
        ),
    )
    .with(
      { kind: "record" },
      (r) =>
        (r.spread ? usesMatchLib(r.spread) : false) || r.fields.some((f) => usesMatchLib(f.value)),
    )
    .with({ kind: "field" }, (f) => usesMatchLib(f.target))
    .with({ kind: "tuple" }, (t) => t.elements.some(usesMatchLib))
    .with({ kind: "arr" }, (l) => l.elements.some(usesMatchLib))
    .with({ kind: "list" }, (l) => l.elements.some(usesMatchLib))
    .with({ kind: "map" }, (m) =>
      m.entries.some((e) => usesMatchLib(e.key) || usesMatchLib(e.value)),
    )
    .exhaustive();

// Every name referenced anywhere in an expression. Coarse — it counts locally
// shadowed uses too — but only ever consulted for prelude names, which are never
// worth shadowing, so the over-count is harmless.
const exprRefs = (e: Expr, acc: Set<string>): void => {
  match(e)
    .with({ kind: "num" }, { kind: "bool" }, { kind: "str" }, () => {})
    .with({ kind: "ref" }, (r) => acc.add(r.name))
    .with({ kind: "call" }, (c) => {
      exprRefs(c.fn, acc);
      for (const a of c.args) exprRefs(a, acc);
    })
    .with({ kind: "lambda" }, (l) => {
      const { params, body } = collapseLambda(l);
      if (params.length >= 2) acc.add("_curry"); // arity ≥ 2 lowers to `_curry(...)`
      exprRefs(body, acc);
    })
    .with({ kind: "letin" }, (l) => {
      exprRefs(l.value, acc);
      exprRefs(l.body, acc);
    })
    .with({ kind: "letbind" }, (l) => {
      acc.add("_Result_flatMap"); // the bind lowers onto the prelude runtime
      exprRefs(l.value, acc);
      exprRefs(l.body, acc);
    })
    .with({ kind: "pipe" }, (p) => {
      exprRefs(p.left, acc);
      exprRefs(p.right, acc);
    })
    .with({ kind: "ternary" }, (t) => {
      exprRefs(t.cond, acc);
      exprRefs(t.then, acc);
      exprRefs(t.else, acc);
    })
    .with({ kind: "match" }, (m) => {
      exprRefs(m.scrutinee, acc);
      // A lazy-List arm that binds a tail/rest builds a `_list(...)` at runtime.
      if (m.arms.some((a) => a.pattern.kind === "plist" && a.pattern.rest?.kind === "pbind"))
        acc.add("_list");
      for (const arm of m.arms) {
        if (arm.guard) exprRefs(arm.guard, acc);
        exprRefs(arm.body, acc);
      }
    })
    .with({ kind: "record" }, (r) => {
      if (r.spread) exprRefs(r.spread, acc);
      for (const f of r.fields) exprRefs(f.value, acc);
    })
    .with({ kind: "field" }, (f) => {
      const rt = nsRuntimeId(f); // `List.map` → `_List_map`, not a field access
      if (rt) {
        acc.add(rt); // its runtime deps are pulled in by preludePreamble's closure
        return;
      }
      exprRefs(f.target, acc);
    })
    .with({ kind: "tuple" }, (t) => {
      for (const el of t.elements) exprRefs(el, acc);
    })
    .with({ kind: "arr" }, (l) => {
      for (const el of l.elements) exprRefs(el, acc);
    })
    .with({ kind: "list" }, (l) => {
      acc.add("_list"); // a `@{...}` literal calls the List core at runtime
      for (const el of l.elements) exprRefs(el, acc);
    })
    .with({ kind: "map" }, (m) => {
      for (const e of m.entries) {
        exprRefs(e.key, acc);
        exprRefs(e.value, acc);
      }
    })
    .exhaustive();
};

// The names a program binds at module scope — anything that would shadow a
// prelude builtin, so its runtime def must NOT be inlined (else a duplicate
// `const` and a JS SyntaxError, e.g. a user `let hypot = …`).
const boundNames = (prog: Program): Set<string> => {
  const bound = new Set<string>();
  for (const s of prog.stmts) {
    if (s.kind === "let" || s.kind === "extern") bound.add(s.name);
    else if (s.kind === "type") for (const c of s.ctors) bound.add(c.name);
    else if (s.kind === "import") for (const n of s.names) bound.add(n.name);
  }
  return bound;
};

// The prelude runtime a program needs inlined: every builtin it references and
// does not itself define, emitted in prelude declaration order for determinism.
const preludePreamble = (prog: Program): string => {
  const refs = new Set<string>();
  for (const s of prog.stmts) {
    if (s.kind === "let") exprRefs(s.value, refs);
    // A multi-field constructor lowers to `_curry(...)` in genType (which
    // exprRefs never walks), so seed the dep here.
    else if (s.kind === "type" && s.ctors.some((c) => c.fields.length >= 2)) refs.add("_curry");
  }
  // Transitively pull in each referenced def's runtime deps (`range` → `_list`,
  // `_Map_get` → Some/None, …). A forward cursor over a push-only worklist
  // drains the growing frontier without an in-place `.pop()`.
  const queue = [...refs];
  for (let i = 0; i < queue.length; i++) {
    const r = queue[i]!;
    for (const d of runtimeDeps[r] ?? [])
      if (!refs.has(d)) {
        refs.add(d);
        queue.push(d);
      }
  }
  const bound = boundNames(prog);
  const defs = Object.entries(preludeJsDefs)
    .filter(([name]) => refs.has(name) && !bound.has(name))
    .map(([, def]) => def);
  return defs.length ? `${defs.join("\n")}\n\n` : "";
};

// `runtime`: inline the prelude builtins the program uses, so the emitted module
// runs standalone. Off by default — callers that supply their own prelude (tests
// via `new Function(preludeJs, …)`) keep prelude-free output.
export type CodegenOptions = { runtime?: boolean };

export const codegen = (
  prog: Program,
  imported?: Map<string, string[]>,
  opts: CodegenOptions = {},
): string => {
  ctorKeys = new Map(imported ?? []);
  for (const s of prog.stmts)
    if (s.kind === "type") for (const c of s.ctors) ctorKeys.set(c.name, keysOf(c.fields));
  // Seed builtin variant ctor keys (Some/Ok/…) unless the program declares its own.
  for (const bt of builtinTypeDecls)
    for (const c of bt.ctors) if (!ctorKeys.has(c.name)) ctorKeys.set(c.name, keysOf(c.fields));
  const needsMatch = prog.stmts.some((s) => s.kind === "let" && usesMatchLib(s.value));
  const header = needsMatch ? `import { match } from "@onrails/pattern";\n\n` : "";
  const preamble = opts.runtime ? preludePreamble(prog) : "";
  const body = prog.stmts.map(genStmt).join("\n");
  return `${header}${preamble}${body}\n`;
};
