// bootstrap/check.al — the alang semantic pass, in alang. Ported from
// src/check.ts (the spec); test/bootstrap-check.spec.ts diffs the error (or
// ok) verdict against the TS checker on every .al file in the repo.
//
// Shape notes vs the TS original:
// - AST declared here again (same shape as bootstrap/parser.al) — modules
//   arrive in Slice F; until then the differential suite keeps both honest,
//   and the `_tag` runtime shape makes the two declarations interchangeable.
// - `AlangError | null` returns become `Option CErr`; the mutable
//   `forEachMatch` visitor becomes `checkExpr`, a fold returning the first
//   error in the same post-order (children before the match node itself).
// - Mutable registry `Map`s become threaded immutable `Map` values;
//   `for` loops with early return become tail-recursive index loops.
// - checkSeqExhaustive's TS 3-state (`error | null | undefined`) becomes the
//   `SeqCheck` variant — a union beats null-vs-undefined encoding.

type Span = { start: number, end: number }
type Name = { name: string, span: Span }

// --- AST (mirrors src/ast.ts; `kind` strings become constructors) ---

type LamParam =
  | LPName(name: string)
  | LPRecord(fields: [string])
  | LPTuple(names: [string])

type Field = { name: string, value: Expr }
type MapEntry = { key: Expr, value: Expr }
type MatchArm = { pattern: Pattern, guard: Option Expr, body: Expr }
type PatField = { label: string, pat: Pattern }

type Expr =
  | ENum(value: number, raw: string, span: Span)
  | EBool(value: bool, span: Span)
  | EStr(value: string, span: Span)
  | ERef(name: string, span: Span)
  | ECall(fn: Expr, args: [Expr], span: Span)
  | ELambda(params: [LamParam], body: Expr, span: Span)
  | ELetIn(name: string, nameSpan: Span, value: Expr, body: Expr, span: Span)
  | ELetBind(param: LamParam, paramSpan: Span, value: Expr, body: Expr, span: Span)
  | EPipe(left: Expr, right: Expr, span: Span)
  | ETernary(cond: Expr, thenE: Expr, elseE: Expr, span: Span)
  | EMatch(scrutinee: Expr, arms: [MatchArm], span: Span)
  | ERecord(fields: [Field], span: Span)
  | EField(target: Expr, name: string, span: Span)
  | ETuple(elements: [Expr], span: Span)
  | EArr(elements: [Expr], span: Span)
  | EList(elements: [Expr], span: Span)
  | EMap(entries: [MapEntry], span: Span)

type Pattern =
  | PWild(span: Span)
  | PBind(name: string, span: Span)
  | PLit(value: number, raw: string, span: Span)
  | PBool(value: bool, span: Span)
  | PStr(value: string, span: Span)
  | PTuple(elems: [Pattern], span: Span)
  | PRecord(fields: [PatField], span: Span)
  | PCtor(ctor: string, args: [Pattern], span: Span)
  | PArr(elems: [Pattern], rest: Option Pattern, span: Span)
  | PList(elems: [Pattern], rest: Option Pattern, span: Span)

type TypeExpr =
  | TyName(name: string, span: Span)
  | TyArrow(from: TypeExpr, to: TypeExpr, span: Span)
  | TyApp(ctor: string, args: [TypeExpr], span: Span)
  | TyTuple(elems: [TypeExpr], span: Span)
  | TyList(elem: TypeExpr, span: Span)

type CtorField = { name: Option string, fieldType: TypeExpr }
type Ctor = { name: string, fields: [CtorField] }
type AliasField = { name: string, fieldType: TypeExpr }

type Stmt =
  | SLet(name: string, nameSpan: Span, value: Expr, exported: bool, doc: Option string, span: Span)
  | SType(name: string, params: [string], ctors: [Ctor], alias: Option [AliasField], exported: bool, span: Span)
  | SExtern(name: string, nameSpan: Span, typeExpr: TypeExpr, module: string, imported: string, exported: bool, span: Span)
  | SImport(names: [Name], from: string, span: Span)

// --- errors + registry ---

type CErr = { message: string, start: number, end: number }
type CtorInfo = { owner: string, arity: number }
type Registry = { ctors: Map string CtorInfo, types: Map string [string] }

let checkErr = (message, sp) => { message: message, start: sp.start, end: sp.end }
let cat = parts => Str.join("", parts)

// --- generic loops (early-exit `for` loops from the TS original) ---

let firstSomeFrom = (f, xs, i) => switch Array.get(i, xs) {
  | None => None
  | Some(x) => switch f(x) {
    | Some(e) => Some(e)
    | None => firstSomeFrom(f, xs, add(i, 1))
  }
}
let firstSome = (f, xs) => firstSomeFrom(f, xs, 0)

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

// --- span extractors (TS reads `.span` directly) ---

let exprSpan = e => switch e {
  | ENum(_, _, sp) => sp
  | EBool(_, sp) => sp
  | EStr(_, sp) => sp
  | ERef(_, sp) => sp
  | ECall(_, _, sp) => sp
  | ELambda(_, _, sp) => sp
  | ELetIn(_, _, _, _, sp) => sp
  | ELetBind(_, _, _, _, sp) => sp
  | EPipe(_, _, sp) => sp
  | ETernary(_, _, _, sp) => sp
  | EMatch(_, _, sp) => sp
  | ERecord(_, sp) => sp
  | EField(_, _, sp) => sp
  | ETuple(_, sp) => sp
  | EArr(_, sp) => sp
  | EList(_, sp) => sp
  | EMap(_, sp) => sp
}

let patSpan = p => switch p {
  | PWild(sp) => sp
  | PBind(_, sp) => sp
  | PLit(_, _, sp) => sp
  | PBool(_, sp) => sp
  | PStr(_, sp) => sp
  | PTuple(_, sp) => sp
  | PRecord(_, sp) => sp
  | PCtor(_, _, sp) => sp
  | PArr(_, _, sp) => sp
  | PList(_, _, sp) => sp
}

// --- pattern shape predicates ---

// A pattern is a catch-all when it always matches. A record pattern does so
// only when every field just binds; a bare rest matches any list.
let isCatchAll = p => switch p {
  | PWild(_) => true
  | PBind(_, _) => true
  | PRecord(fields, _) => allOf(f => isCatchAll(f.pat), fields)
  | PTuple(elems, _) => allOf(isCatchAll, elems)
  | PArr(elems, rest, _) => and(eq(Array.length(elems), 0), Option.isSome(rest))
  | PList(elems, rest, _) => and(eq(Array.length(elems), 0), Option.isSome(rest))
  | _ => false
}

let isPList = p => switch p { | PList(_, _, _) => true | _ => false }
let isPCtor = p => switch p { | PCtor(_, _, _) => true | _ => false }
let ctorNameOf = p => switch p { | PCtor(name, _, _) => name | _ => "" }

// eager `[...]` and lazy `@{...}` share one exhaustiveness rule; both carry
// (elems, rest).
let seqElemsRest = p => switch p {
  | PArr(elems, rest, _) => Some((elems, rest))
  | PList(elems, rest, _) => Some((elems, rest))
  | _ => None
}

// --- registry ---

let seedCtors = (cs, i, owner, acc) => switch Array.get(i, cs) {
  | None => acc
  | Some((cn, arity)) => seedCtors(cs, add(i, 1), owner,
      Map.has(cn, acc) ? acc : Map.set(cn, { owner: owner, arity: arity }, acc))
}

// Seed a builtin variant type (Option/Result) unless the program declares its
// own type of that name — user redeclarations win, with no duplicate error.
let seedType = (name, cs, reg) =>
  Map.has(name, reg.types)
    ? reg
    : { ctors: seedCtors(cs, 0, name, reg.ctors),
        types: Map.set(name, cs |> map(((cn, _)) => cn), reg.types) }

let ctorsInto = (ctors, i, owner, sp, acc) => switch Array.get(i, ctors) {
  | None => Ok(acc)
  | Some(c) => Map.has(c.name, acc)
      ? Err(checkErr(cat(["duplicate constructor '", c.name, "'"]), sp))
      : ctorsInto(ctors, add(i, 1), owner, sp,
          Map.set(c.name, { owner: owner, arity: Array.length(c.fields) }, acc))
}

let buildLoop = (stmts, i, reg) => switch Array.get(i, stmts) {
  | None => Ok(reg)
  | Some(SType(name, _, ctors, _, _, sp)) =>
      Map.has(name, reg.types)
        ? Err(checkErr(cat(["duplicate type '", name, "'"]), sp))
        : let? cs = ctorsInto(ctors, 0, name, sp, reg.ctors) in
          buildLoop(stmts, add(i, 1),
            { ctors: cs, types: Map.set(name, ctors |> map(c => c.name), reg.types) })
  | Some(_) => buildLoop(stmts, add(i, 1), reg)
}

let buildRegistry = stmts =>
  let? reg = buildLoop(stmts, 0, { ctors: #{}, types: #{} }) in
  Ok(seedType("Result", [("Ok", 1), ("Err", 1)],
     seedType("Option", [("Some", 1), ("None", 0)], reg)))

// --- pattern validation (nested ctors exist with the right arity; lazy-List
// patterns cannot nest — matching pulls from the sequence) ---

let checkPattern = (p, reg, top) => switch p {
  | PCtor(ctor, args, sp) => switch Map.get(ctor, reg.ctors) {
      | None => Some(checkErr(cat(["unknown constructor '", ctor, "'"]), sp))
      | Some(info) =>
          eq(Array.length(args), info.arity)
            ? firstSome(a => checkPattern(a, reg, false), args)
            : Some(checkErr(cat(["constructor '", ctor, "' expects ", show(info.arity),
                " arg(s), got ", show(Array.length(args))]), sp))
    }
  | PRecord(fields, _) => firstSome(f => checkPattern(f.pat, reg, false), fields)
  | PTuple(elems, _) => firstSome(el => checkPattern(el, reg, false), elems)
  | PArr(elems, rest, _) =>
      firstSome(el => checkPattern(el, reg, false), elems)
      |> Option.orElse(switch rest {
        | Some(r) => checkPattern(r, reg, false)
        | None => None })
  | PList(elems, rest, sp) =>
      top
        ? firstSome(el => checkPattern(el, reg, false), elems)
          |> Option.orElse(switch rest {
            | Some(r) => checkPattern(r, reg, false)
            | None => None })
        : Some(checkErr("lazy-List pattern cannot nest inside another pattern (matching pulls from the sequence)", sp))
  | _ => None
}

// --- match exhaustiveness ---

// A guarded arm never counts toward exhaustiveness — the guard can be false.
let armUnguardedCatchAll = a => and(isCatchAll(a.pattern), Option.isNone(a.guard))

// Guards vs lazy Lists: a guarded arm still pulls from the sequence to test
// its pattern, and the buffering codegen has no guard slot — reject.
let guardErrs = (arms, listSwitch) => firstSome(a => switch a.guard {
  | None => None
  | Some(g) => or(isPList(a.pattern), listSwitch)
      ? Some(checkErr("`when` guards are unsupported in a lazy-List switch (matching pulls from the sequence)", exprSpan(g)))
      : None
}, arms)

// An arm after an unguarded catch-all can never match — reject rather than
// let codegen silently reorder it.
let firstCatchIdx = (arms, i) => switch Array.get(i, arms) {
  | None => None
  | Some(a) => armUnguardedCatchAll(a) ? Some(i) : firstCatchIdx(arms, add(i, 1))
}
let unreachableAfterCatch = arms => switch firstCatchIdx(arms, 0) {
  | None => None
  | Some(i) => switch Array.get(add(i, 1), arms) {
    | None => None
    | Some(a) => Some(checkErr("unreachable arm: a catch-all arm above it matches first", patSpan(a.pattern)))
  }
}

// TS returns `error | null | undefined` here; a variant says it straight.
type SeqCheck =
  | SeqNotSeq
  | SeqTotal
  | SeqFail(e: CErr)

// A list switch is total iff it covers `[]` and single-head cons `[x, ...xs]`
// (length 0 and length ≥ 1); fixed-length arms don't prove totality.
let checkSeqExhaustive = (arms, mSpan) =>
  let seqs = arms
    |> filter(a => and(Option.isNone(a.guard), Option.isSome(seqElemsRest(a.pattern))))
    |> map(a => a.pattern) in
  eq(Array.length(seqs), 0)
    ? SeqNotSeq
    : let hasEmpty = someOf(p => switch seqElemsRest(p) {
        | Some((elems, rest)) => and(eq(Array.length(elems), 0), Option.isNone(rest))
        | None => false }, seqs) in
      let hasCons = someOf(p => switch seqElemsRest(p) {
        | Some((elems, rest)) => and(eq(Array.length(elems), 1), Option.isSome(rest))
        | None => false }, seqs) in
      and(hasEmpty, hasCons)
        ? SeqTotal
        : SeqFail(checkErr("non-exhaustive list switch: cover `[]` and `[x, ...xs]` (or add `_`)", mSpan))

let isPBoolOf = (v, p) => switch p { | PBool(b, _) => eq(b, v) | _ => false }

// No constructor arms → literal/wildcard/bool switch. A catch-all makes it
// total; so does covering both boolean cases (bool is a closed two-case type).
let checkNonCtor = (arms, mSpan, hasCatchAll) =>
  hasCatchAll
    ? None
    : let hasTrue = someOf(a => and(isPBoolOf(true, a.pattern), Option.isNone(a.guard)), arms) in
      let hasFalse = someOf(a => and(isPBoolOf(false, a.pattern), Option.isNone(a.guard)), arms) in
      and(hasTrue, hasFalse)
        ? None
        : switch checkSeqExhaustive(arms, mSpan) {
          | SeqTotal => None
          | SeqFail(e) => Some(e)
          | SeqNotSeq => Some(checkErr("non-exhaustive switch: add a `_` catch-all arm", mSpan))
        }

// Constructor arms: known ctor, right arity, one owning type. An arm covers
// its ctor only when every argument is irrefutable — a narrowing arm
// (`Sm(Sm(n))`, `Sm(0)`) matches a strict subset and must not count.
let ctorLoop = (arms, i, reg, owner, covered) => switch Array.get(i, arms) {
  | None => Ok((owner, covered))
  | Some(a) => switch a.pattern {
    | PCtor(ctor, args, sp) => switch Map.get(ctor, reg.ctors) {
      | None => Err(checkErr(cat(["unknown constructor '", ctor, "'"]), sp))
      | Some(info) =>
          not(eq(Array.length(args), info.arity))
            ? Err(checkErr(cat(["constructor '", ctor, "' expects ", show(info.arity),
                " arg(s), got ", show(Array.length(args))]), sp))
            : switch owner {
              | Some(own) when not(eq(own, info.owner)) =>
                  Err(checkErr(cat(["switch mixes variants of '", own, "' and '", info.owner, "'"]), sp))
              | _ =>
                  let covered2 = and(allOf(isCatchAll, args), Option.isNone(a.guard))
                    ? Set.add(ctor, covered)
                    : covered in
                  ctorLoop(arms, add(i, 1), reg, Some(info.owner), covered2)
            }
    }
    | _ => ctorLoop(arms, add(i, 1), reg, owner, covered)
  }
}

let checkCtorArms = (ctorArms, mSpan, reg, hasCatchAll) =>
  switch ctorLoop(ctorArms, 0, reg, None, Set.fromArray([])) {
  | Err(e) => Some(e)
  | Ok((ownerOpt, covered)) =>
      hasCatchAll
        ? None
        : let own = Option.unwrapOr("", ownerOpt) in
          let required = Map.getOr([], own, reg.types) in
          let missing = required |> filter(c => not(Set.has(c, covered))) in
          eq(Array.length(missing), 0)
            ? None
            : // A narrowing arm on a missing ctor means the user matched it
              // partially — point at the fix rather than just naming the gap.
              let seen = Set.fromArray(ctorArms |> map(a => ctorNameOf(a.pattern))) in
              let narrowed = missing |> filter(c => Set.has(c, seen)) in
              let hint = switch Array.head(narrowed) {
                | Some(first) => cat([" (arm(s) on ", Str.join(", ", narrowed),
                    " narrow — add ", first, "(_) or a '_' catch-all)"])
                | None => "" } in
              Some(checkErr(cat(["non-exhaustive switch on '", own, "': missing ",
                  Str.join(", ", missing), hint]), mSpan))
  }

let checkMatch = (arms, mSpan, reg) =>
  switch firstSome(a => checkPattern(a.pattern, reg, true), arms) {
  | Some(e) => Some(e)
  | None =>
      let listSwitch = someOf(a => and(isPList(a.pattern), not(isCatchAll(a.pattern))), arms) in
      switch guardErrs(arms, listSwitch) {
      | Some(e) => Some(e)
      | None => switch unreachableAfterCatch(arms) {
        | Some(e) => Some(e)
        | None =>
            let hasCatchAll = someOf(armUnguardedCatchAll, arms) in
            let ctorArms = arms |> filter(a => isPCtor(a.pattern)) in
            eq(Array.length(ctorArms), 0)
              ? checkNonCtor(arms, mSpan, hasCatchAll)
              : checkCtorArms(ctorArms, mSpan, reg, hasCatchAll)
      } }
  }

// --- expression walk: first error, post-order (children before the match
// node itself) — mirrors TS forEachMatch + `found ??=` exactly ---

let checkExpr = (e, reg) => switch e {
  | ENum(_, _, _) => None
  | EBool(_, _) => None
  | EStr(_, _) => None
  | ERef(_, _) => None
  | ECall(fn, args, _) =>
      checkExpr(fn, reg) |> Option.orElse(firstSome(a => checkExpr(a, reg), args))
  | ELambda(_, body, _) => checkExpr(body, reg)
  | ELetIn(_, _, value, body, _) =>
      checkExpr(value, reg) |> Option.orElse(checkExpr(body, reg))
  | ELetBind(_, _, value, body, _) =>
      checkExpr(value, reg) |> Option.orElse(checkExpr(body, reg))
  | EPipe(left, right, _) =>
      checkExpr(left, reg) |> Option.orElse(checkExpr(right, reg))
  | ETernary(cond, thenE, elseE, _) =>
      checkExpr(cond, reg)
      |> Option.orElse(checkExpr(thenE, reg))
      |> Option.orElse(checkExpr(elseE, reg))
  | EMatch(scrutinee, arms, sp) =>
      checkExpr(scrutinee, reg)
      |> Option.orElse(firstSome(a =>
          (switch a.guard { | Some(g) => checkExpr(g, reg) | None => None })
          |> Option.orElse(checkExpr(a.body, reg)), arms))
      |> Option.orElse(checkMatch(arms, sp, reg))
  | ERecord(fields, _) => firstSome(f => checkExpr(f.value, reg), fields)
  | EField(target, _, _) => checkExpr(target, reg)
  | ETuple(elements, _) => firstSome(el => checkExpr(el, reg), elements)
  | EArr(elements, _) => firstSome(el => checkExpr(el, reg), elements)
  | EList(elements, _) => firstSome(el => checkExpr(el, reg), elements)
  | EMap(entries, _) => firstSome(en =>
      checkExpr(en.key, reg) |> Option.orElse(checkExpr(en.value, reg)), entries)
}

// --- reserved names + stray ctor-field type vars ---

// Collection namespaces are built-in; binding one would shadow `List.map` and
// desync codegen. Option/Result type redeclarations stay legal (builtin
// variant contract: user redeclarations win).
let reservedNames = ["Array", "List", "Set", "Map", "Option", "Result", "Str"]
let redeclarableTypes = ["Option", "Result"]

let reservedErr = (name, sp) =>
  checkErr(cat(["'", name, "' is a reserved collection namespace and cannot be bound"]), sp)

let checkReservedNames = stmts => firstSome(s => switch s {
  | SType(name, _, _, _, _, sp) =>
      Array.contains(name, redeclarableTypes)
        ? None
        : (Array.contains(name, reservedNames) ? Some(reservedErr(name, sp)) : None)
  | SLet(name, _, _, _, _, sp) =>
      Array.contains(name, reservedNames) ? Some(reservedErr(name, sp)) : None
  | SExtern(name, _, _, _, _, _, sp) =>
      Array.contains(name, reservedNames) ? Some(reservedErr(name, sp)) : None
  | SImport(names, _, _) => firstSome(n =>
      Array.contains(n.name, reservedNames)
        ? Some(checkErr(cat(["'", n.name, "' is a reserved collection namespace and cannot be imported"]), n.span))
        : None, names)
}, stmts)

let ctorPrims = ["number", "int", "float", "string", "bool"]

let isUpperStart = s => switch Str.codeAt(0, s) {
  | Some(c) => and(gte(c, 65), lte(c, 90))
  | None => false
}

// A lowercase leaf that is neither a declared param nor a primitive is a
// stray type variable (would be existential) — report (name, span).
let strayTypeVar = (te, params) => switch te {
  | TyName(name, sp) =>
      or(isUpperStart(name), or(Array.contains(name, ctorPrims), Array.contains(name, params)))
        ? None
        : Some((name, sp))
  | TyArrow(from, to, _) =>
      strayTypeVar(from, params) |> Option.orElse(strayTypeVar(to, params))
  | TyApp(_, args, _) => firstSome(a => strayTypeVar(a, params), args)
  | TyTuple(elems, _) => firstSome(el => strayTypeVar(el, params), elems)
  | TyList(elem, _) => strayTypeVar(elem, params)
}

let checkCtorFieldVars = stmts => firstSome(s => switch s {
  | SType(name, params, ctors, _, _, _) =>
      firstSome(c => firstSome(f => switch strayTypeVar(f.fieldType, params) {
        | Some((vn, vsp)) => Some(checkErr(cat(["unknown type parameter '", vn,
            "' in constructor '", c.name, "' — declare it: type ", name, " ",
            Str.join(" ", Array.append(vn, params)), " = ..."]), vsp))
        | None => None
      }, c.fields), ctors)
  | _ => None
}, stmts)

// --- entry point ---

export let check = stmts => switch checkReservedNames(stmts) {
  | Some(e) => Err(e)
  | None => switch checkCtorFieldVars(stmts) {
    | Some(e) => Err(e)
    | None =>
        let? reg = buildRegistry(stmts) in
        switch firstSome(s => switch s {
          | SLet(_, _, value, _, _, _) => checkExpr(value, reg)
          | _ => None
        }, stmts) {
          | Some(e) => Err(e)
          | None => Ok(stmts)
        }
  }
}
