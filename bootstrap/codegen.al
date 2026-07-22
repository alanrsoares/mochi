// bootstrap/codegen.al — the alang codegen pass, in alang. Ported from
// src/codegen.ts (the spec); test/bootstrap-codegen.spec.ts diffs emitted JS
// against the TS codegen on every .al file in the repo — including this one.
//
// Shape notes vs TS original:
// - AST declared again here (bootstrap/parser.al's shape/tags — same
//   convention as check.al/infer.al): until modules arrive, each bootstrap
//   file's runtime `_tag`s must match by hand, not by import.
// - `ctorKeys` (TS module-level mutable Map) becomes `GCtx = { keys, ns }`,
//   threaded through every generator/pattern-compiler function. `ns` is
//   `namespaceRuntime` (`Ns.member` -> JS identifier).
// - `exprRefs`'s mutable `Set` accumulator becomes an explicit
//   threaded/returned immutable Set.
// - `namespaceRuntime` / `preludeJsDefs` / `runtimeDeps` are NOT
//   reimplemented — the differential-test harness passes the real
//   src/prelude.ts tables in as Map arguments (one prelude, not forked —
//   docs/PATH_TO_BOOTSTRAP.md §6). Only `builtinTypeDecls`' ctor keys
//   (Some/None/Ok/Err — 4 entries) are small/stable enough to hardcode
//   directly, matching infer.al's precedent for `builtinTypeDecls`.
// - TS `for`/`forEach`/`flatMap` loops become tail-recursive `Array.get(i,
//   xs)` cursor loops (matches check.al/infer.al's established idiom).

import { ENum, EBool, EStr, ERef, ECall, ELambda, ELetIn, ELetBind, EPipe, ETernary, EMatch, ERecord, EField, ETuple, EArr, EList, EMap, EInterp, IPLit, IPExpr, PWild, PBind, PLit, PBool, PStr, PTuple, PRecord, PCtor, PArr, PList, POr, LPName, LPRecord, LPTuple, SLet, SType, SExtern, SImport } from "./ast.al"

// One chunk of a "…${a}…" interpolation (ADR 0023): a literal run, or a
// hole expression. TS: an untagged `string | Expr` union — alang has no raw
// unions, so this is a proper variant (mirrors parser.al's own copy).

// --- small generic helpers (duplicated per bootstrap file, same as check.al/infer.al) ---

let cat = parts => Str.join("", parts)

let allOfFrom = (f, xs, i) => switch Array.get(i, xs) {
  | None => true
  | Some(x) => f(x) ? allOfFrom(f, xs, add(i, 1)) : false
}

let allOf = (f, xs) => allOfFrom(f, xs, 0)

let someOfFrom = (f, xs, i) => switch Array.get(i, xs) {
  | None => false
  | Some(x) => f(x) ? true : someOfFrom(f, xs, add(i, 1))
}
let someOf = (f, xs) => someOfFrom(f, xs, 0)

// Encode a decoded alang string VALUE back as a JS string literal. The
// lexer only ever decodes \\ \" \n \t (src/lexer.ts scanString — \r is NOT
// decoded: it falls through to a literal "r"), so no alang string value can
// contain any other escape-worthy character — this is a complete encoder for
// anything this compiler could have produced, and it must byte-match
// `JSON.stringify` on that same restricted alphabet.
let escChar = c => switch c {
  | "\\" => "\\\\"
  | "\"" => "\\\""
  | "\n" => "\\n"
  | "\t" => "\\t"
  | _ => c
}
let jsStringLit = s => "\"${cat(Str.chars(s) |> map(escChar))}\""

// Re-escape a decoded literal chunk for a JS template literal: backslashes
// first (else the escapes we're about to insert double-escape), then the
// two chars that would otherwise reopen JS template syntax.
let escTemplateLoop = (chars, i, acc) => switch Array.get(i, chars) {
  | None => acc
  | Some("\\") => escTemplateLoop(chars, add(i, 1), Str.concat(acc, "\\\\"))
  | Some("`") => escTemplateLoop(chars, add(i, 1), Str.concat(acc, "\\`"))
  | Some("$") when Array.get(add(i, 1), chars) |> Option.contains("{") => escTemplateLoop(
      chars,
      add(i, 2),
      Str.concat(acc, "\\\${")
    )
  | Some(c) => escTemplateLoop(chars, add(i, 1), Str.concat(acc, c))
}
let escapeTemplateLiteral = s => escTemplateLoop(Str.chars(s), 0, "")

// --- ctor field-key registry (GCtx.keys) ---------------------------------

// constructor's runtime field keys: a labelled field uses its label, an
// unlabelled one its position (`_0`, `_1`). Both the factory (`genType`)
// and the pattern destructure (`genWithArm`) agree; patterns consult the
// registry populated per-`codegen`-call from the program's `type` decls.
let keysOfFrom = (fields, i) => switch Array.get(i, fields) {
  | None => []
  | Some(f) => Array.prepend(
      Option.unwrapOr("_${show(i)}", f.name),
      keysOfFrom(fields, add(i, 1))
    )
}
let keysOf = fields => keysOfFrom(fields, 0)

let keyAt = (ctor, i, ctx) => switch Map.get(ctor, ctx.keys) {
  | Some(ks) => Option.unwrapOr("_${show(i)}", Array.get(i, ks))
  | None => "_${show(i)}"
}

// `Ns.member` access on a namespace ref (`List.map`) -> the JS identifier
// its runtime is defined under, None if it isn't namespace access.
let nsRuntimeId = (target, name, ctx) => switch target {
  | ERef(refName, _) => switch Map.get(refName, ctx.ns) {
      | Some(members) => Map.get(name, members)
      | None => None
    }
  | _ => None
}

// Collapse `(x) => (y) => e` (curried lambdas), `(x, y) => e`, or a mix
// into one flat parameter list plus a final body. alang types treat
// `(x, y) => e` and `x => y => e` identically (`a -> b -> c`), so it's
// sound to lower a multi-arg function into a single `_curry`-wrapped JS
// function instead of nested closures (CRITIQUE §4.4).
let collapseLambda = (params, body) => switch body {
  | ELambda(params2, body2, _) => collapseLambda(
      Array.concat(params, params2),
      body2
    )
  | _ => (params, body)
}

// ---- expressions -----------------------------------------------------------

let genExpr = (e, ctx) => switch e {
  | ENum(_, raw, _) => raw
  | EBool(value, _) => value ? "true" : "false"
  | EStr(value, _) => jsStringLit(value)
  | ERef(name, _) => name
  | ECall(fn, args, _) => "${genCallee(fn, ctx)}(${Str.join(", ", args |> map(a => genExpr(a, ctx)))})"
  | ELambda(params, body, _) => let (cparams, cbody) = collapseLambda(
      params,
      body
    ) in
    let arrow = "(${Str.join(", ", cparams |> map(genParam))}) => ${genLambdaBody(cbody, ctx)}" in
    // Curried type, JS impl: arity >= 2 lowers to a `_curry`-wrapped
    // function so any call grouping works (CRITIQUE §4.4). Arity 1 needs none.
    gte(Array.length(cparams), 2)
      ? "_curry(${show(Array.length(cparams))}, ${arrow})"
      : arrow
  | ELetIn(name, _, value, body, _) =>
    // let x = v in b -> an IIFE binding x: `((x) => b)(v)`. Non-recursive, so
    // plain arg-application is enough; nested let-ins chain as curried IIFEs.
    "((${name}) => ${genLambdaBody(body, ctx)})(${genExpr(value, ctx)})"
  | ELetBind(param, _, value, body, _) =>
    // let? p = v in b -> the Result bind: `_Result_flatMap((p) => b)(v)`.
    "_Result_flatMap((${genParam(param)}) => ${genLambdaBody(body, ctx)})(${genExpr(value, ctx)})"
  | EPipe(left, right, _) =>
    // desugar inline: a |> f  ->  f(a)
    "${genCallee(right, ctx)}(${genExpr(left, ctx)})"
  | ETernary(cond, thenE, elseE, _) => "(${genExpr(cond, ctx)} ? ${genExpr(thenE, ctx)} : ${genExpr(elseE, ctx)})"
  | EMatch(scrutinee, arms, _) => genMatch(scrutinee, arms, ctx)
  | ERecord(fields, spread, _) =>
    // `{ ...base, f: v }` (ADR 0021) -> native JS object spread; `parts.length
    // === 0` (bare `{}`) is only possible with no spread and no fields.
    let fieldStrs = Str.join(
      ", ",
      fields |> map(f => "${f.name}: ${genExpr(f.value, ctx)}")
    ) in
    switch spread {
      | None => eq(Array.length(fields), 0) ? "{}" : "{ ${fieldStrs} }"
      | Some(s) => let spreadStr = "...${genExpr(s, ctx)}" in
        eq(Array.length(fields), 0)
          ? "{ ${spreadStr} }"
          : "{ ${spreadStr}, ${fieldStrs} }"
    }
  | EField(target, name, _) => switch nsRuntimeId(target, name, ctx) {
      | Some(rt) => rt
      | None => "${genMember(target, ctx)}.${name}"
    }
  | ETuple(elements, _) =>
    // A tuple erases to a JS array `[a, b]` (like ReScript); the type system
    // keeps it distinct from an alang Array, the runtime shares the shape.
    "[${Str.join(", ", elements |> map(el => genExpr(el, ctx)))}]"
  | EArr(elements, _) => "[${Str.join(", ", elements |> map(el => genExpr(el, ctx)))}]"
  | EList(elements, _) => genList(elements, ctx)
  | EMap(entries, _) => "new Map([${Str.join(", ", entries |> map(en => "[${genExpr(en.key, ctx)}, ${genExpr(en.value, ctx)}]"))}])"
  | EInterp(parts, _) =>
    // "…${x}…" (ADR 0023) → a native JS template literal — emitted JS reads
    // exactly like the source.
    cat(
      [
        "`",
        cat(
          parts
            |> map(p => switch p {
              | IPLit(value) => escapeTemplateLiteral(value)
              | IPExpr(ex) => cat(["\${", genExpr(ex, ctx), "}"])
            })
        ),
        "`"
      ]
    )
}

// A `@{...}` literal -> a lazy iterable over its (eagerly-evaluated)
// elements. `_list` wraps a generator factory so the List is re-iterable and lazy.
let genList = (elements, ctx) =>
  let yields = Str.join(
    " ",
    elements |> map(el => "yield (${genExpr(el, ctx)});")
  ) in
  "_list(function* () {${eq(yields, "") ? "" : " ${yields} "}})"

// A lambda parameter lowers to JS: a name, or native object destructuring.
let genParam = p => switch p {
  | LPName(name) => name
  | LPTuple(names) => "[${Str.join(", ", names)}]"
  | LPRecord(fields) => "{ ${Str.join(", ", fields)} }"
}

// A lambda in callee position must be parenthesized: `((x) => ...)(arg)`.
let genCallee = (e, ctx) => switch e {
  | ELambda(_, _, _) => "(${genExpr(e, ctx)})"
  | _ => genExpr(e, ctx)
}

// A record or lambda in member-target position needs parens: `({...}).x`.
let genMember = (e, ctx) => switch e {
  | ERecord(_, _, _) => "(${genExpr(e, ctx)})"
  | ELambda(_, _, _) => "(${genExpr(e, ctx)})"
  | _ => genExpr(e, ctx)
}

// A record literal as a concise arrow body must be parenthesized, else JS
// parses `=> { ... }` as a statement block: `=> ({ x: 1 })`.
let genLambdaBody = (e, ctx) => switch e {
  | ERecord(_, _, _) => "(${genExpr(e, ctx)})"
  | _ => genExpr(e, ctx)
}

// ---- match -> @onrails/pattern chain ---------------------------------------
// We target @onrails/pattern (ts-pattern-shaped, smaller runtime, pairs with
// @onrails/result + @onrails/maybe). Each arm lowers to a single `.with(...)`.

// A pattern always matches (-> `.otherwise`) when it binds without narrowing:
// wildcard, plain name, or a record whose every field just binds.
let isCatchAll = p => switch p {
  | PWild(_) => true
  | PBind(_, _) => true
  | PRecord(fields, _) => allOf(f => isCatchAll(f.pat), fields)
  | PTuple(elems, _) =>
    // a tuple always matches — position does the work (irrefutable product).
    allOf(isCatchAll, elems)
  | PArr(elems, rest, _) =>
    // [...all] / @{...all} — a bare rest with no fixed head matches anything.
    and(eq(Array.length(elems), 0), Option.isSome(rest))
  | PList(elems, rest, _) => and(
      eq(Array.length(elems), 0),
      Option.isSome(rest)
    )
  | _ => false
}

let isPList = p => switch p { | PList(_, _, _) => true | _ => false }

// ---- general pattern compiler ----------------------------------------------
// Nested patterns can't lower to matcher objects: @onrails/pattern's matcher
// compares object values shallowly (`!==`), so `{ value: { _tag: "Sm" } }`
// never matches. A nesting arm instead lowers to the guard form — the same
// one array/tuple arms already use — `.with((_v) => conds, (slot) => body)`.
// `patConds` renders the refutable tests against a path expression; `patSlot`
// renders the JS destructuring target that binds names ("" = a hole, nothing
// binds beneath). Lazy `plist` never reaches either: nested occurrences are
// rejected by check.ts, top-level arms go through `genListMatch`.

// `{ key: sub }` entry, punned when the bound name IS the key.
let keyedSlot = (key, sub) => eq(sub, key) ? key : "${key}: ${sub}"

let pctorEntries = (ctor, args, i, ctx) => switch Array.get(i, args) {
  | None => []
  | Some(a) => let s = patSlot(a, ctx) in
    let restEntries = pctorEntries(ctor, args, add(i, 1), ctx) in
    eq(s, "")
      ? restEntries
      : Array.prepend(keyedSlot(keyAt(ctor, i, ctx), s), restEntries)
}

let precordEntries = (fields, i, ctx) => switch Array.get(i, fields) {
  | None => []
  | Some(f) => let s = patSlot(f.pat, ctx) in
    let restEntries = precordEntries(fields, add(i, 1), ctx) in
    eq(s, "") ? restEntries : Array.prepend(keyedSlot(f.label, s), restEntries)
}

let patSlot = (p, ctx) => switch p {
  | PBind(name, _) => name
  | PWild(_) => ""
  | PLit(_, _, _) => ""
  | PBool(_, _) => ""
  | PStr(_, _) => ""
  | PList(_, _, _) => ""
  | PCtor(ctor, args, _) => let entries = pctorEntries(ctor, args, 0, ctx) in
    eq(Array.length(entries), 0) ? "" : "{ ${Str.join(", ", entries)} }"
  | PRecord(fields, _) => let entries = precordEntries(fields, 0, ctx) in
    eq(Array.length(entries), 0) ? "" : "{ ${Str.join(", ", entries)} }"
  | PTuple(elems, _) => let slots = elems |> map(el => patSlot(el, ctx)) in
    someOf(s => not(eq(s, "")), slots) ? "[${Str.join(", ", slots)}]" : ""
  | PArr(elems, rest, _) => let slots = elems |> map(el => patSlot(el, ctx)) in
    let slots2 = switch rest {
      | Some(PBind(name, _)) => Array.append("...${name}", slots)
      | _ => slots
    } in
    someOf(s => not(eq(s, "")), slots2) ? "[${Str.join(", ", slots2)}]" : ""
  | POr(alts, _) =>
    // The first alt's destructure serves the whole arm — every alt binds the
    // same names at the same positions (enforced by check.al).
    switch Array.head(alts) {
      | Some(first) => patSlot(first, ctx)
      | None => ""
    }
}

let pctorConds = (ctor, args, i, path, ctx) => switch Array.get(i, args) {
  | None => []
  | Some(a) => Array.concat(
      patConds(a, "${path}.${keyAt(ctor, i, ctx)}", ctx),
      pctorConds(ctor, args, add(i, 1), path, ctx)
    )
}
let precordConds = (fields, i, path, ctx) => switch Array.get(i, fields) {
  | None => []
  | Some(f) => Array.concat(
      patConds(f.pat, "${path}.${f.label}", ctx),
      precordConds(fields, add(i, 1), path, ctx)
    )
}
let ptupleConds = (elems, i, path, ctx) => switch Array.get(i, elems) {
  | None => []
  | Some(el) => Array.concat(
      patConds(el, "${path}[${show(i)}]", ctx),
      ptupleConds(elems, add(i, 1), path, ctx)
    )
}
let parrConds = (elems, i, path, ctx) => switch Array.get(i, elems) {
  | None => []
  | Some(el) => Array.concat(
      patConds(el, "${path}[${show(i)}]", ctx),
      parrConds(elems, add(i, 1), path, ctx)
    )
}

let patConds = (p, path, ctx) => switch p {
  | PWild(_) => []
  | PBind(_, _) => []
  | PList(_, _, _) => []
  | PLit(_, _, _) => ["${path} === ${litValue(p)}"]
  | PBool(_, _) => ["${path} === ${litValue(p)}"]
  | PStr(_, _) => ["${path} === ${litValue(p)}"]
  | PCtor(ctor, args, _) => Array.prepend(
      "${path}._tag === ${jsStringLit(ctor)}",
      pctorConds(ctor, args, 0, path, ctx)
    )
  | PRecord(fields, _) => precordConds(fields, 0, path, ctx)
  | PTuple(elems, _) =>
    // No length guard — tuple arity is guaranteed by the type.
    ptupleConds(elems, 0, path, ctx)
  | PArr(elems, rest, _) => Array.prepend(
      "${path}.length ${Option.isSome(rest) ? ">=" : "==="} ${show(Array.length(elems))}",
      parrConds(elems, 0, path, ctx)
    )
  | POr(alts, _) =>
    // Each alt's own conds &&-join into one guard; the alts ||-join into one.
    let altCond = alt =>
      let conds = patConds(alt, path, ctx) in
      eq(Array.length(conds), 0)
        ? "true"
        : Str.join(" && ", conds |> map(c => "(${c})")) in
    [Str.join(" || ", alts |> map(alt => "(${altCond(alt)})"))]
}

// The handler parameter for a catch-all pattern: bind the name, destructure a
// record's/tuple's binds, or ignore the value.
let catchAllParam = (p, ctx) => switch p {
  | PArr(_, rest, _) =>
    // `[...all]` / `@{...all}` binds the whole collection to the rest name —
    // NOT a destructure: `[...all]` would copy the array and force a lazy List.
    switch rest { | Some(PBind(name, _)) => "(${name})" | _ => "()" }
  | PList(_, rest, _) => switch rest {
      | Some(PBind(name, _)) => "(${name})"
      | _ => "()"
    }
  | _ => let slot = patSlot(p, ctx) in eq(slot, "") ? "()" : "(${slot})"
}

// A switch is a "lazy-List match" when it has a narrowing `@{}`/`@{h,...t}`
// arm (a lone `@{...all}` is a catch-all, not narrowing). check.ts guarantees
// such a switch is exactly the empty + single-head-cons pair, so it lowers directly.
let isListMatch = arms =>
  someOf(a => and(isPList(a.pattern), not(isCatchAll(a.pattern))), arms)

// A lazy tail/rest: replay the still-buffered elements from index `from`,
// then drain whatever's left in the iterator. `_list` makes it re-iterable + lazy.
let listTail = from =>
  cat(
    [
      "_list(function* () { for (let _i = ",
      show(from),
      "; _i < _b.length; _i++) yield _b[_i]; ",
      "if (!_done) { let _s; while (!(_s = _it.next()).done) yield _s.value; } })"
    ]
  )

let listArmGuards = (elems, i, ctx) => switch Array.get(i, elems) {
  | None => []
  | Some(el) => Array.concat(
      patConds(el, "_b[${show(i)}]", ctx),
      listArmGuards(elems, add(i, 1), ctx)
    )
}
let listArmBinds = (elems, i, ctx) => switch Array.get(i, elems) {
  | None => ([], [])
  | Some(el) => let (restParams, restArgs) = listArmBinds(
      elems,
      add(i, 1),
      ctx
    ) in
    let slot = patSlot(el, ctx) in
    eq(slot, "")
      ? (restParams, restArgs)
      : (
        Array.prepend(slot, restParams),
        Array.prepend("_b[${show(i)}]", restArgs)
      )
}

// One narrowing lazy-List arm -> an `if (cond) return call;`. A fixed arm
// `@{a, b}` must see n+1 pulls to prove length exactly n; a cons arm
// `@{h, ...t}` needs n pulls (length >= n) and binds its tail to a lazy List
// over the rest. Element sub-patterns guard/bind via the general compiler
// against the buffer (`_b[i]` is already pulled, nested tests force nothing extra).
let genListArm = (p, body, ctx) => switch p {
  | PList(elems, rest, _) => let n = Array.length(elems) in
    let guards = listArmGuards(elems, 0, ctx) in
    let head = Option.isSome(rest)
      ? "_pull(${show(n)})"
      : "!_pull(${show(add(n, 1))}) && _b.length === ${show(n)}" in
    let cond = Str.join(" && ", Array.prepend(head, guards)) in
    let (params0, args0) = listArmBinds(elems, 0, ctx) in
    let (params, args) = switch rest {
      | Some(PBind(name, _)) => (
          Array.append(name, params0),
          Array.append(listTail(n), args0)
        )
      | _ => (params0, args0)
    } in
    "  if (${cond}) return ((${Str.join(", ", params)}) => ${genLambdaBody(body, ctx)})(${Str.join(", ", args)});"
  | _ => ""
}

let listMatchLoop = (arms, i, ctx) => switch Array.get(i, arms) {
  | None => (
      [],
      "(() => { throw new Error(\"non-exhaustive lazy-list switch\"); })()"
    )
  | Some(a) => and(isPList(a.pattern), not(isCatchAll(a.pattern)))
      ? let (restLines, fallback) = listMatchLoop(arms, add(i, 1), ctx) in
      (Array.prepend(genListArm(a.pattern, a.body, ctx), restLines), fallback)
      : isCatchAll(a.pattern)
        ? let restName = switch a.pattern {
          | PList(_, Some(PBind(name, _)), _) => Some(name)
          | _ => None
        } in
        let fallback = switch restName {
          | Some(name) => "((${name}) => ${genLambdaBody(a.body, ctx)})(${listTail(0)})"
          | None => genExpr(a.body, ctx)
        } in
        ([], fallback)
        : listMatchLoop(arms, add(i, 1), ctx)
}

// A lazy-List switch -> an IIFE that pulls just enough elements to decide
// each arm, buffering them so later arms can re-examine a prefix without
// re-forcing the iterator — @onrails/pattern isn't length-indexable.
// check.ts proved totality.
let genListMatch = (scrutinee, arms, ctx) =>
  let (armLines, fallback) = listMatchLoop(arms, 0, ctx) in
  cat(
    [
      "((_it) => { const _b = []; let _done = false; ",
      "const _pull = (_n) => { while (_b.length < _n && !_done) { const _s = _it.next(); ",
      "if (_s.done) _done = true; else _b.push(_s.value); } return _b.length >= _n; };\n",
      Str.join("\n", armLines),
      "\n  return ",
      fallback,
      ";\n})(",
      genExpr(scrutinee, ctx),
      "[Symbol.iterator]())"
    ]
  )

let matchArmsLoop = (arms, i, ctx) => switch Array.get(i, arms) {
  | None => ([], None)
  | Some(a) => let (restLines, restCatch) = matchArmsLoop(
      arms,
      add(i, 1),
      ctx
    ) in
    switch a.guard {
      | Some(g) => (
          Array.prepend(
            "  ${genGuardArm(a.pattern, a.body, Some(g), ctx)}",
            restLines
          ),
          restCatch
        )
      | None => isCatchAll(a.pattern)
          ? (restLines, Some((a.pattern, a.body)))
          : (
            Array.prepend("  ${genWithArm(a.pattern, a.body, ctx)}", restLines),
            restCatch
          )
    }
}

let genMatch = (scrutinee, arms, ctx) =>
  isListMatch(arms)
    ? genListMatch(scrutinee, arms, ctx)
    : let (armLines, catchAll) = matchArmsLoop(arms, 0, ctx) in
    let tail = switch catchAll {
      | Some((p, body)) => "  .otherwise(${catchAllParam(p, ctx)} => ${genLambdaBody(body, ctx)})"
      | None => "  .exhaustive()"
    } in
    Str.join(
      "\n",
      Array.concat(
        Array.prepend("match(${genExpr(scrutinee, ctx)})", armLines),
        [tail]
      )
    )

let litValue = p => switch p {
  | PStr(v, _) => jsStringLit(v)
  | PLit(_, raw, _) => raw
  | PBool(v, _) => v ? "true" : "false"
  | _ => ""
}

// General arm: predicate + destructuring handler, built by the pattern
// compiler. Handles arbitrary nesting (`Sm(Sm(n))`, `Ok((a, b))`, ctors
// inside tuples/arrays) and `when` guards. A guard runs after the
// structural tests (&&-short-circuit); the pattern's binds are rebound
// from `_v` by the same destructuring slot handler uses.
let genGuardArm = (p, body, guardOpt, ctx) =>
  let conds0 = patConds(p, "_v", ctx) in
  let slot = patSlot(p, ctx) in
  let conds = switch guardOpt {
    | Some(g) => Array.append(
        eq(slot, "")
          ? "(${genExpr(g, ctx)})"
          : "((${slot}) => ${genExpr(g, ctx)})(_v)",
        conds0
      )
    | None => conds0
  } in
  let test = eq(Array.length(conds), 0) ? "true" : Str.join(" && ", conds) in
  ".with((_v) => ${test}, ${eq(slot, "") ? "()" : "(${slot})"} => ${genLambdaBody(body, ctx)})"

// Sub-pattern flat matcher-object form can express: bind, wildcard, or a
// primitive literal (the matcher compares values with `!==`, so only
// primitives are meaningful there). Anything deeper routes to guard form.
let isFlatSub = p => switch p {
  | PBind(_, _) => true
  | PWild(_) => true
  | PLit(_, _, _) => true
  | PBool(_, _) => true
  | PStr(_, _) => true
  | _ => false
}

let recordLits = (fields, i) => switch Array.get(i, fields) {
  | None => []
  | Some(f) => let rest = recordLits(fields, add(i, 1)) in
    switch f.pat {
      | PLit(_, _, _) => Array.prepend("${f.label}: ${litValue(f.pat)}", rest)
      | PBool(_, _) => Array.prepend("${f.label}: ${litValue(f.pat)}", rest)
      | PStr(_, _) => Array.prepend("${f.label}: ${litValue(f.pat)}", rest)
      | _ => rest
    }
}

let ctorArgParts = (ctor, args, i, ctx) => switch Array.get(i, args) {
  | None => ([], [])
  | Some(a) => let (restBinds, restLits) = ctorArgParts(
      ctor,
      args,
      add(i, 1),
      ctx
    ) in
    let key = keyAt(ctor, i, ctx) in
    switch a {
      | PBind(name, _) => (
          Array.prepend(keyedSlot(key, name), restBinds),
          restLits
        )
      | PLit(_, _, _) => (
          restBinds,
          Array.prepend("${key}: ${litValue(a)}", restLits)
        )
      | PBool(_, _) => (
          restBinds,
          Array.prepend("${key}: ${litValue(a)}", restLits)
        )
      | PStr(_, _) => (
          restBinds,
          Array.prepend("${key}: ${litValue(a)}", restLits)
        )
      | _ => (restBinds, restLits)
    }
}

let genWithArm = (p, body, ctx) => switch p {
  | PArr(_, _, _) =>
    // Array/tuple/or arms always take guard form (not matcher-object-able).
    genGuardArm(p, body, None, ctx)
  | PTuple(_, _) => genGuardArm(p, body, None, ctx)
  | POr(_, _) => genGuardArm(p, body, None, ctx)
  | PLit(_, _, _) => ".with(${litValue(p)}, () => ${genLambdaBody(body, ctx)})"
  | PBool(_, _) => ".with(${litValue(p)}, () => ${genLambdaBody(body, ctx)})"
  | PStr(_, _) => ".with(${litValue(p)}, () => ${genLambdaBody(body, ctx)})"
  | PRecord(fields, _) => allOf(f => isFlatSub(f.pat), fields)
      ? let lits = recordLits(fields, 0) in
      let slot = patSlot(p, ctx) in
      ".with({ ${Str.join(", ", lits)} }, ${eq(slot, "") ? "()" : "(${slot})"} => ${genLambdaBody(body, ctx)})"
      : genGuardArm(p, body, None, ctx)
  | PCtor(ctor, args, _) =>
    // pctor flat fast path keeps readable matcher-object form.
    allOf(isFlatSub, args)
      ? let (binds, litFields) = ctorArgParts(ctor, args, 0, ctx) in
      let patObj = Str.join(
        ", ",
        Array.prepend("_tag: ${jsStringLit(ctor)}", litFields)
      ) in
      let param = eq(Array.length(binds), 0)
        ? "()"
        : "({ ${Str.join(", ", binds)} })" in
      ".with({ ${patObj} }, ${param} => ${genLambdaBody(body, ctx)})"
      : genGuardArm(p, body, None, ctx)
  | _ => genGuardArm(p, body, None, ctx)
}

// ---- statements -------------------------------------------------------------

// A variant decl has no runtime type in JS — it lowers to constructor
// factories only. Nullary -> a tagged value; n-ary -> a tagging function.
// The discriminant key is `_tag`, matching the @onrails ecosystem
// convention (@onrails/result, @onrails/maybe), so type guards (isOk/isSome/…)
// recognize alang values at the JS boundary.
let genCtor = c =>
  let tag = jsStringLit(c.name) in
  eq(Array.length(c.fields), 0)
    ? "const ${c.name} = { _tag: ${tag} };"
    : let params = Str.join(", ", keysOf(c.fields)) in
    let impl = "(${params}) => ({ _tag: ${tag}, ${params} })" in
    gte(Array.length(c.fields), 2)
      ? "const ${c.name} = _curry(${show(Array.length(c.fields))}, ${impl});"
      : "const ${c.name} = ${impl};"

let genType = s => switch s {
  | SType(_, _, ctors, _, _, _) => Str.join("\n", ctors |> map(genCtor))
  | _ => ""
}

let genExtern = s => switch s {
  | SExtern(name, _, _, modName, imported, _, _) => let spec = eq(
      imported,
      name
    )
      ? name
      : "${imported} as ${name}" in
    "import { ${spec} } from ${jsStringLit(modName)};"
  | _ => ""
}

let stripAlExt = s =>
  Str.endsWith(".al", s) ? Str.slice(0, sub(Str.length(s), 3), s) : s

// import { a, b } from "./mod"  ->  compiled sibling `./mod.js`. Source paths
// name an `.al` module (with or without extension); output targets `.js`.
let genImport = s => switch s {
  | SImport(names, from, _) => let nameList = Str.join(
      ", ",
      names |> map(n => n.name)
    ) in
    let path = "${stripAlExt(from)}.js" in
    "import { ${nameList} } from ${jsStringLit(path)};"
  | _ => ""
}

let exportLine = l => "export ${l}"

let genStmt = (s, ctx) => switch s {
  | SImport(_, _, _) => genImport(s)
  | SType(_, _, _, _, exported, _) => let decls = genType(s) in
    eq(decls, "")
      ? "" // record alias: pure type, no runtime
      : exported
        ? Str.join("\n", Str.split("\n", decls) |> map(exportLine))
        : decls
  | SExtern(name, _, _, _, _, exported, _) =>
    // An extern is itself an import; re-export the local binding when exported.
    exported ? "${genExtern(s)}\nexport { ${name} };" : genExtern(s)
  | SLet(name, _, value, exported, _, _) => let doExport = and(
      exported,
      not(Str.startsWith("$", name))
    ) in // never export destructure temps
    "${doExport ? "export " : ""}const ${name} = ${genExpr(value, ctx)};"
}

// Need `@onrails/pattern` import? Only if a match lowers to a `match()`
// chain. A lazy-List switch lowers to a plain IIFE instead, so a program that
// only ever destructures Lists imports nothing.
let usesMatchLibArm = a =>
  or(
    switch a.guard { | Some(g) => usesMatchLib(g) | None => false },
    usesMatchLib(a.body)
  )

let usesMatchLib = e => switch e {
  | ENum(_, _, _) => false
  | EBool(_, _) => false
  | EStr(_, _) => false
  | ERef(_, _) => false
  | ECall(fn, args, _) => or(usesMatchLib(fn), someOf(usesMatchLib, args))
  | ELambda(_, body, _) => usesMatchLib(body)
  | ELetIn(_, _, value, body, _) => or(usesMatchLib(value), usesMatchLib(body))
  | ELetBind(_, _, value, body, _) => or(
      usesMatchLib(value),
      usesMatchLib(body)
    )
  | EPipe(left, right, _) => or(usesMatchLib(left), usesMatchLib(right))
  | ETernary(cond, thenE, elseE, _) => or(
      usesMatchLib(cond),
      or(usesMatchLib(thenE), usesMatchLib(elseE))
    )
  | EMatch(scrutinee, arms, _) => or(
      not(isListMatch(arms)),
      or(usesMatchLib(scrutinee), someOf(usesMatchLibArm, arms))
    )
  | ERecord(fields, spread, _) => or(
      switch spread { | Some(s) => usesMatchLib(s) | None => false },
      someOf(f => usesMatchLib(f.value), fields)
    )
  | EField(target, _, _) => usesMatchLib(target)
  | ETuple(elements, _) => someOf(usesMatchLib, elements)
  | EArr(elements, _) => someOf(usesMatchLib, elements)
  | EList(elements, _) => someOf(usesMatchLib, elements)
  | EMap(entries, _) => someOf(
      en => or(usesMatchLib(en.key), usesMatchLib(en.value)),
      entries
    )
  | EInterp(parts, _) => someOf(
      p => switch p { | IPLit(_) => false | IPExpr(ex) => usesMatchLib(ex) },
      parts
    )
}

// A name referenced anywhere in an expression. Coarse — counts locally
// shadowed uses too, but only ever consulted against prelude names, never
// worth shadowing, so the over-count is harmless.
let exprRefsListFrom = (xs, i, ctx, acc) => switch Array.get(i, xs) {
  | None => acc
  | Some(x) => exprRefsListFrom(xs, add(i, 1), ctx, exprRefs(x, ctx, acc))
}
let exprRefsInterpPartsFrom = (parts, i, ctx, acc) => switch Array.get(i, parts) {
  | None => acc
  | Some(p) => exprRefsInterpPartsFrom(
      parts,
      add(i, 1),
      ctx,
      switch p { | IPLit(_) => acc | IPExpr(ex) => exprRefs(ex, ctx, acc) }
    )
}
let exprRefsArmsFrom = (arms, i, ctx, acc) => switch Array.get(i, arms) {
  | None => acc
  | Some(a) => let acc1 = switch a.guard {
      | Some(g) => exprRefs(g, ctx, acc)
      | None => acc
    } in
    exprRefsArmsFrom(arms, add(i, 1), ctx, exprRefs(a.body, ctx, acc1))
}
let exprRefsFieldsFrom = (fields, i, ctx, acc) => switch Array.get(i, fields) {
  | None => acc
  | Some(f) => exprRefsFieldsFrom(
      fields,
      add(i, 1),
      ctx,
      exprRefs(f.value, ctx, acc)
    )
}
let exprRefsEntriesFrom = (entries, i, ctx, acc) => switch Array.get(i, entries) {
  | None => acc
  | Some(en) => exprRefsEntriesFrom(
      entries,
      add(i, 1),
      ctx,
      exprRefs(en.value, ctx, exprRefs(en.key, ctx, acc))
    )
}

let exprRefs = (e, ctx, acc) => switch e {
  | ENum(_, _, _) => acc
  | EBool(_, _) => acc
  | EStr(_, _) => acc
  | ERef(name, _) => Set.add(name, acc)
  | ECall(fn, args, _) => exprRefsListFrom(args, 0, ctx, exprRefs(fn, ctx, acc))
  | ELambda(params, body, _) => let (cparams, cbody) = collapseLambda(
      params,
      body
    ) in
    let acc2 = gte(Array.length(cparams), 2)
      ? Set.add("_curry", acc)
      : acc in // arity >= 2 lowers `_curry(...)`
    exprRefs(cbody, ctx, acc2)
  | ELetIn(_, _, value, body, _) => exprRefs(
      body,
      ctx,
      exprRefs(value, ctx, acc)
    )
  | ELetBind(_, _, value, body, _) => exprRefs(
      body,
      ctx,
      exprRefs(value, ctx, Set.add("_Result_flatMap", acc))
    )
  | EPipe(left, right, _) => exprRefs(right, ctx, exprRefs(left, ctx, acc))
  | ETernary(cond, thenE, elseE, _) => exprRefs(
      elseE,
      ctx,
      exprRefs(thenE, ctx, exprRefs(cond, ctx, acc))
    )
  | EMatch(scrutinee, arms, _) => let acc1 = exprRefs(scrutinee, ctx, acc) in
    let acc2 = someOf(
      a => switch a.pattern {
        | PList(_, Some(PBind(_, _)), _) => true
        | _ => false
      },
      arms
    )
      ? Set.add("_list", acc1)
      : acc1 in
    exprRefsArmsFrom(arms, 0, ctx, acc2)
  | ERecord(fields, spread, _) => exprRefsFieldsFrom(
      fields,
      0,
      ctx,
      switch spread { | Some(s) => exprRefs(s, ctx, acc) | None => acc }
    )
  | EField(target, name, _) => switch nsRuntimeId(target, name, ctx) {
      | Some(rt) => Set.add(
          rt,
          acc
        ) // its runtime deps get pulled in by preludePreamble's closure
      | None => exprRefs(target, ctx, acc)
    }
  | ETuple(elements, _) => exprRefsListFrom(elements, 0, ctx, acc)
  | EArr(elements, _) => exprRefsListFrom(elements, 0, ctx, acc)
  | EList(elements, _) => exprRefsListFrom(
      elements,
      0,
      ctx,
      Set.add("_list", acc)
    ) // `@{...}` literal calls List core runtime
  | EMap(entries, _) => exprRefsEntriesFrom(entries, 0, ctx, acc)
  | EInterp(parts, _) => exprRefsInterpPartsFrom(parts, 0, ctx, acc)
}

// Names a module binds at top scope — anything here would shadow a
// prelude builtin, so its runtime def must NOT be inlined (else a duplicate
// `const` is a JS SyntaxError, e.g. a user `let hypot = …`).
let boundNamesFrom = (stmts, i, acc) => switch Array.get(i, stmts) {
  | None => acc
  | Some(s) => boundNamesFrom(
      stmts,
      add(i, 1),
      switch s {
        | SLet(name, _, _, _, _, _) => Set.add(name, acc)
        | SExtern(name, _, _, _, _, _, _) => Set.add(name, acc)
        | SType(_, _, ctors, _, _, _) => Set.union(
            acc,
            Set.fromArray(ctors |> map(c => c.name))
          )
        | SImport(names, _, _) => Set.union(
            acc,
            Set.fromArray(names |> map(n => n.name))
          )
      }
    )
}
let boundNames = stmts => boundNamesFrom(stmts, 0, Set.fromArray([]))

let refsForStmt = (s, ctx) => switch s {
  | SLet(_, _, value, _, _, _) => exprRefs(value, ctx, Set.fromArray([]))
  | SType(_, _, ctors, _, _, _) =>
    // A multi-field constructor lowers to `_curry(...)` in genType (which
    // exprRefs never walks), so seed the dep here.
    someOf(c => gte(Array.length(c.fields), 2), ctors)
      ? Set.add("_curry", Set.fromArray([]))
      : Set.fromArray([])
  | _ => Set.fromArray([])
}
let collectRefsFrom = (stmts, i, ctx, acc) => switch Array.get(i, stmts) {
  | None => acc
  | Some(s) => collectRefsFrom(
      stmts,
      add(i, 1),
      ctx,
      Set.union(acc, refsForStmt(s, ctx))
    )
}

// Transitively pull in each referenced def's runtime deps (`range` -> `_list`,
// `_Map_get` -> Some/None, …). A forward cursor over a push-only worklist
// drains the growing frontier without an in-place `.pop()`.
let addDepsFrom = (deps, j, refs, queue) => switch Array.get(j, deps) {
  | None => (refs, queue)
  | Some(d) => Set.has(d, refs)
      ? addDepsFrom(deps, add(j, 1), refs, queue)
      : addDepsFrom(deps, add(j, 1), Set.add(d, refs), Array.append(d, queue))
}
let closeRefsFrom = (queue, i, refs, runtimeDeps) => switch Array.get(i, queue) {
  | None => refs
  | Some(r) => let deps = Option.unwrapOr([], Map.get(r, runtimeDeps)) in
    let (refs2, queue2) = addDepsFrom(deps, 0, refs, queue) in
    closeRefsFrom(queue2, add(i, 1), refs2, runtimeDeps)
}

// The prelude runtime a program needs inlined: every builtin it references
// and does not itself define, emitted in prelude declaration order for determinism.
let preludePreamble = (stmts, ctx, jsDefs, runtimeDeps) =>
  let refs0 = collectRefsFrom(stmts, 0, ctx, Set.fromArray([])) in
  let refs = closeRefsFrom(Set.toArray(refs0), 0, refs0, runtimeDeps) in
  let bound = boundNames(stmts) in
  let names = Map.keys(jsDefs) in
  let defs = names
    |> filter(n => and(Set.has(n, refs), not(Set.has(n, bound))))
    |> map(n => Map.getOr("", n, jsDefs)) in
  eq(Array.length(defs), 0) ? "" : "${Str.join("\n", defs)}\n\n"

// ---- top-level entry --------------------------------------------------------

let seedCtorsFrom = (ctors, i, m) => switch Array.get(i, ctors) {
  | None => m
  | Some(c) => seedCtorsFrom(
      ctors,
      add(i, 1),
      Map.set(c.name, keysOf(c.fields), m)
    )
}
let seedCtorsFromStmts = (stmts, i, m) => switch Array.get(i, stmts) {
  | None => m
  | Some(s) => seedCtorsFromStmts(
      stmts,
      add(i, 1),
      switch s {
        | SType(_, _, ctors, _, _, _) => seedCtorsFrom(ctors, 0, m)
        | _ => m
      }
    )
}

// Seed builtin variant ctor keys (Some/Ok/…) unless the program declares its own.
let seedBuiltinCtorKeys = m =>
  let m1 = Map.has("Some", m) ? m : Map.set("Some", ["value"], m) in
  let m2 = Map.has("None", m1) ? m1 : Map.set("None", [], m1) in
  let m3 = Map.has("Ok", m2) ? m2 : Map.set("Ok", ["value"], m2) in
  Map.has("Err", m3) ? m3 : Map.set("Err", ["error"], m3)

// Field keys of a module's EXPORTED ctors — threaded into an importer's
// `codegen` (2nd arg) so a pattern on an imported variant destructures the
// right runtime keys (`Some(value)` → `{ value }`, not positional `{ _0 }`).
// Mirrors src/codegen.ts's `exportedCtorKeys`.
let exportedCtorKeysFrom = (stmts, i, m) => switch Array.get(i, stmts) {
  | None => m
  | Some(s) => exportedCtorKeysFrom(
      stmts,
      add(i, 1),
      switch s {
        | SType(_, _, ctors, _, true, _) => seedCtorsFrom(ctors, 0, m)
        | _ => m
      }
    )
}
export let exportedCtorKeys = stmts => exportedCtorKeysFrom(stmts, 0, #{})

let genStmtAllFrom = (stmts, i, ctx) => switch Array.get(i, stmts) {
  | None => []
  | Some(s) => Array.prepend(
      genStmt(s, ctx),
      genStmtAllFrom(stmts, add(i, 1), ctx)
    )
}

// `useRuntime`: inline the prelude builtins the program uses, so the emitted
// module runs standalone. `ns`/`jsDefs`/`runtimeDeps` are the TS prelude's
// `namespaceRuntime`/`preludeJsDefs`/`runtimeDeps` tables, converted to
// alang Maps — the same tables the TS codegen consults, not a fork of them.
export let codegen = (stmts, imported, useRuntime, ns, jsDefs, runtimeDeps) =>
  let keys0 = seedCtorsFromStmts(stmts, 0, imported) in
  let keys = seedBuiltinCtorKeys(keys0) in
  let ctx = { keys: keys, ns: ns } in
  let needsMatch = someOf(
    s => switch s {
      | SLet(_, _, value, _, _, _) => usesMatchLib(value)
      | _ => false
    },
    stmts
  ) in
  let header = needsMatch
    ? "import { match } from \"@onrails/pattern\";\n\n"
    : "" in
  let preamble = useRuntime
    ? preludePreamble(stmts, ctx, jsDefs, runtimeDeps)
    : "" in
  let body = Str.join("\n", genStmtAllFrom(stmts, 0, ctx)) in
  "${header}${preamble}${body}\n"
