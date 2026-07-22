// bootstrap/infer.al — Hindley-Milner type inference, in alang. Ports
// src/types.ts + src/unify.ts + src/infer.ts into one file (Slice E, part 2).
// test/bootstrap-infer.spec.ts (once written) diffs alpha-normalized schemes
// against the TS inferrer on every .al file in the repo.
//
// PORTING ORDER (biggest unknown first): (a) types.ts warm-up — Ty/Row shape
// + showType, DONE below. (b) unify.ts — St-threaded resolve/zonk/occurs/
// unify/unifyRows, DONE below. (c) infer.ts — Algorithm W, generalize/
// instantiate, stronglyConnected (Tarjan SCC), NOT YET PORTED.
//
// Locked design decisions (see alang-roadmap memory for full rationale —
// do not re-derive, just implement):
// 1. One standalone file, no cross-file modules until Slice F.
// 2. Subst becomes threaded `St = { tv: Map number Ty, rv: Map number Row,
//    next: number }` — every fresh-var mint AND every unify call returns a
//    new St. Fresh-var minting (types.ts's `Fresh`) is folded into St here,
//    not ported as a separate type.
// 3. Prelude type tables are NOT reimplemented — the differential harness
//    feeds TS preludeEnv/preludeNamespaces in as runtime args.
// 4. SKIP AliasDef/foldAliases + hover's Ctx.record callback (display/
//    tooling only). KEEP semantic alias expansion in typeExprToType (affects
//    what a type unifies against — that's semantics, ported in section c).
// 5. Harness compares per-name scheme STRINGS with alpha-normalized var ids.
// 6. Corpus = TS-check-passing files, open:true + namespaces threaded;
//    strict-mode error cases get their own targeted cases.

import { TyVar, TyCon, TyFn, TyRecord, RowEmpty, RowVar, RowExtend, tCon, tArrow, tRecord, tPrim, tTuple, rVar, rExtend, showType, mkSt, freshVar, freshRowVar, resolve, zonk, occurs, unify, unifyRows } from "./types.al"

// ============================================================
// (c) infer.ts — Algorithm W. AST duplicated again (see bootstrap/check.al's
// header note on why: modules arrive Slice F, differential harness keeps
// every duplicate honest via runtime `_tag` shape).
//
// Name collision vs section (a): the surface syntax `TypeExpr` needs the
// SAME ctor names bootstrap/parser.al actually emits at runtime
// (TyName/TyArrow/TyApp/TyTuple/TyList) — each .al file compiles to an
// independent module with literal baked-in `_tag` strings, so this file's
// pattern matches must agree with parser.al's tags, not just its own
// internal type decl. That leaves no free `TyArrow` for section (a)'s HM
// `Ty` type, so its arrow constructor is `TyFn` here instead.
// ============================================================

import { ENum, EBool, EStr, ERef, ECall, ELambda, ELetIn, ELetBind, EPipe, ETernary, EMatch, ERecord, EField, ETuple, EArr, EList, EMap, EInterp, IPLit, IPExpr, PWild, PBind, PLit, PBool, PStr, PTuple, PRecord, PCtor, PArr, PList, POr, TyName, TyArrow, TyApp, TyTuple, TyList, LPName, LPRecord, LPTuple, SLet, SType, SExtern } from "./ast.al"




// One chunk of a "…${a}…" interpolation (ADR 0023): a literal run, or a
// parsed hole expression.





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
  | ERecord(_, _, sp) => sp
  | EField(_, _, sp) => sp
  | ETuple(_, sp) => sp
  | EArr(_, sp) => sp
  | EList(_, sp) => sp
  | EMap(_, sp) => sp
  | EInterp(_, sp) => sp
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
  | POr(_, sp) => sp
}

// --- inference-time error + context. unify.ts's span-less TypeErr becomes a
// spanned IErr only at the `u()` seam below (mirrors src/infer.ts's `u`) ---

type IErr = { message: string, start: number, end: number }
let typeErr = (msg, sp) => { message: msg, start: sp.start, end: sp.end }


let u = (a, b, st, sp) => switch unify(a, b, st) {
  | Ok(newSt) => Ok(newSt)
  | Err(e) => Err(typeErr(e.message, sp))
}

// --- polymorphic type schemes ---


let mono = t => { vars: [], rvars: [], ty: t }

let tNumber = tPrim("number")
let tBool = tPrim("bool")
let tString = tPrim("string")

// surface `float`/`int`/`string`/`bool` type-expr names -> HM primitive type
// (used by typeExprToType, further down, for extern signatures)
let primType = name => switch name {
  | "float" => tNumber
  | "int" => tNumber
  | "string" => tString
  | "bool" => tBool
  | _ => tPrim(name)
}

// --- free type/row variables, generalization, instantiation ---

type VarSets = { tv: Set number, rv: Set number }
let emptyVarSets = { tv: Set.fromArray([]), rv: Set.fromArray([]) }
let unionVarSets = (a, b) => { tv: Set.union(a.tv, b.tv), rv: Set.union(a.rv, b.rv) }
let diffVarSets = (a, b) => { tv: Set.diff(a.tv, b.tv), rv: Set.diff(a.rv, b.rv) }

let collect = (t, acc) => switch t {
  | TyVar(id) => { tv: Set.add(id, acc.tv), rv: acc.rv }
  | TyCon(_, args) => collectArgs(args, acc)
  | TyFn(fromT, toT) => collect(toT, collect(fromT, acc))
  | TyRecord(row) => collectRow(row, acc)
}
let collectArgs = (args, acc) => switch args {
  | [] => acc
  | [a, ...rest] => collectArgs(rest, collect(a, acc))
}
let collectRow = (row, acc) => switch row {
  | RowVar(id) => { tv: acc.tv, rv: Set.add(id, acc.rv) }
  | RowExtend(_, fieldType, rest) => collectRow(rest, collect(fieldType, acc))
  | RowEmpty => acc
}

let freeInType = t => collect(t, emptyVarSets)

let freeInScheme = sc =>
  let f = freeInType(sc.ty) in
  diffVarSets(f, { tv: Set.fromArray(sc.vars), rv: Set.fromArray(sc.rvars) })

let freeInEnvFrom = (schemes, acc) => switch schemes {
  | [] => acc
  | [sc, ...rest] => freeInEnvFrom(rest, unionVarSets(acc, freeInScheme(sc)))
}
let freeInEnv = env => freeInEnvFrom(Map.values(env), emptyVarSets)

let generalize = (env, t, st) =>
  let zt = zonk(t, st) in
  let free = diffVarSets(freeInType(zt), freeInEnv(env)) in
  { vars: Set.toArray(free.tv), rvars: Set.toArray(free.rv), ty: zt }

let instMapFrom = (vars, acc, st) => switch vars {
  | [] => (acc, st)
  | [v, ...rest] =>
      let (fv, st1) = freshVar(st) in
      instMapFrom(rest, Map.set(v, fv, acc), st1)
}
let instRowMapFrom = (vars, acc, st) => switch vars {
  | [] => (acc, st)
  | [v, ...rest] =>
      let (fr, st1) = freshRowVar(st) in
      instRowMapFrom(rest, Map.set(v, fr, acc), st1)
}

let instSub = (t, tmap, rmap) => switch t {
  | TyVar(id) => Map.getOr(t, id, tmap)
  | TyCon(name, args) => tCon(name, args |> map(a => instSub(a, tmap, rmap)))
  | TyFn(fromT, toT) => tArrow(instSub(fromT, tmap, rmap), instSub(toT, tmap, rmap))
  | TyRecord(row) => tRecord(instSubRow(row, tmap, rmap))
}
let instSubRow = (row, tmap, rmap) => switch row {
  | RowVar(id) => Map.getOr(row, id, rmap)
  | RowExtend(label, fieldType, rest) => rExtend(label, instSub(fieldType, tmap, rmap), instSubRow(rest, tmap, rmap))
  | RowEmpty => row
}

let instantiate = (sc, st) =>
  let (tmap, st1) = instMapFrom(sc.vars, #{}, st) in
  let (rmap, st2) = instRowMapFrom(sc.rvars, #{}, st1) in
  (instSub(sc.ty, tmap, rmap), st2)

// --- lambda-param binding. TS mutates `env` in place and returns just the
// param's `Type`; here each binder threads (env, st) and returns them back
// alongside the type it produced ---

let bindParamNamesFrom = (names, env, st) => switch names {
  | [] => ([], env, st)
  | [n, ...rest] =>
      let (t, st1) = freshVar(st) in
      let (restTs, env2, st2) = bindParamNamesFrom(rest, Map.set(n, mono(t), env), st1) in
      (Array.prepend(t, restTs), env2, st2)
}

let bindParamFieldsFrom = (fields, env, row, st) => switch fields {
  | [] => (row, env, st)
  | [f, ...rest] =>
      let (ft, st1) = freshVar(st) in
      bindParamFieldsFrom(rest, Map.set(f, mono(ft), env), rExtend(f, ft, row), st1)
}

let bindParam = (p, env, st) => switch p {
  | LPName(name) =>
      let (t, st1) = freshVar(st) in
      (t, Map.set(name, mono(t), env), st1)
  | LPTuple(names) =>
      let (elems, env1, st1) = bindParamNamesFrom(names, env, st) in
      (tTuple(elems), env1, st1)
  | LPRecord(fields) =>
      let (rowBase, st1) = freshRowVar(st) in
      let (row, env1, st2) = bindParamFieldsFrom(fields, env, rowBase, st1) in
      (tRecord(row), env1, st2)
}

let bindParamsFrom = (params, env, st) => switch params {
  | [] => ([], env, st)
  | [p, ...rest] =>
      let (t, env1, st1) = bindParam(p, env, st) in
      let (restTs, env2, st2) = bindParamsFrom(rest, env1, st1) in
      (Array.prepend(t, restTs), env2, st2)
}

// ============================================================
// inferExpr — Algorithm W over Expr. Every helper threads and returns
// `st: St` alongside its result (env only changes locally, on the ctx
// passed to a sub-inference call — never mutated in place).
// ============================================================

let arrowChain = (paramTypes, resultT) => switch paramTypes {
  | [] => resultT
  | [p, ...rest] => tArrow(p, arrowChain(rest, resultT))
}

let ctxWithEnv = (ctx, env) => { env: env, open: ctx.open, ns: ctx.ns }

let inferCallArgs = (fnT, args, ctx, st) => switch args {
  | [] => Ok((fnT, st))
  | [arg, ...rest] =>
      let? (argT, st1) = inferExpr(arg, ctx, st) in
      let (resultT, st2) = freshVar(st1) in
      let? st3 = u(fnT, tArrow(argT, resultT), st2, exprSpan(arg)) in
      inferCallArgs(resultT, rest, ctx, st3)
}

let inferTernary = (cond, thenE, elseE, ctx, st) =>
  let? (condT, st1) = inferExpr(cond, ctx, st) in
  let? st2 = u(condT, tBool, st1, exprSpan(cond)) in
  let? (thenT, st3) = inferExpr(thenE, ctx, st2) in
  let? (elseT, st4) = inferExpr(elseE, ctx, st3) in
  let? st5 = u(thenT, elseT, st4, exprSpan(elseE)) in
  Ok((thenT, st5))

// `x let? p = value; body` desugars to a Result-bind: value must be
// `Result okT errT`, param binds okT, body must itself be `Result resT errT`.
let inferLetBind = (param, paramSpan, value, body, ctx, st) =>
  let? (valT, st1) = inferExpr(value, ctx, st) in
  let (okT, st2) = freshVar(st1) in
  let (errT, st3) = freshVar(st2) in
  let? st4 = u(valT, tCon("Result", [okT, errT]), st3, exprSpan(value)) in
  let (paramT, bodyEnv, st5) = bindParam(param, ctx.env, st4) in
  let? st6 = u(paramT, okT, st5, paramSpan) in
  let? (bodyT, st7) = inferExpr(body, ctxWithEnv(ctx, bodyEnv), st6) in
  let (resT, st8) = freshVar(st7) in
  let? st9 = u(bodyT, tCon("Result", [resT, errT]), st8, exprSpan(body)) in
  Ok((tCon("Result", [resT, errT]), st9))

let inferRecordRow = (fields, ctx, st) => switch fields {
  | [] => Ok((RowEmpty, st))
  | [f, ...rest] =>
      // Field VALUES infer last-to-first (matching src/infer.ts's reverse
      // loop) so side effects on shared open rows via field access land in
      // the same order — row DISPLAY order still follows declaration order.
      let? (restRow, st1) = inferRecordRow(rest, ctx, st) in
      let? (ft, st2) = inferExpr(f.value, ctx, st1) in
      Ok((rExtend(f.name, ft, restRow), st2))
}

// Rebuild a closed row (ending `RowEmpty`) onto a different tail — reuses the
// (label, fieldType) pairs a record literal already inferred rather than
// re-inferring field values a second time. Used by the update-typing case
// below to turn the literal's closed row into the open `req` row a `...base`
// must unify against (ADR 0021).
let rWithTail = (row, tail) => switch row {
  | RowEmpty => tail
  | RowVar(id) => rVar(id)
  | RowExtend(label, fieldType, rest) => rExtend(label, fieldType, rWithTail(rest, tail))
}

// duck-typed record field access: target's type unifies against an open row
// with `name` in it, unless target is a bare namespace ref (`List.map`) —
// then it's a qualified lookup into ctx.ns, not row inference.
let inferFieldAccess = (target, name, sp, ctx, st) =>
  let? (targetT, st1) = inferExpr(target, ctx, st) in
  let (fieldT, st2) = freshVar(st1) in
  let (restRow, st3) = freshRowVar(st2) in
  let? st4 = u(targetT, tRecord(rExtend(name, fieldT, restRow)), st3, sp) in
  Ok((fieldT, st4))

let inferNsField = (tname, name, sp, ctx, st) => switch Map.get(name, Map.getOr(#{}, tname, ctx.ns)) {
  | Some(sc) => let (t, st1) = instantiate(sc, st) in Ok((t, st1))
  | None => Err(typeErr("'${tname}' has no member '${name}'", sp))
}

// Every hole of a "…${x}…" unifies with `string` (ADR 0023) — no implicit
// `show`. Literal chunks carry no type information to infer.
let inferInterpParts = (parts, ctx, st) => switch parts {
  | [] => Ok(st)
  | [IPLit(_), ...rest] => inferInterpParts(rest, ctx, st)
  | [IPExpr(ex), ...rest] =>
      let? (t, st1) = inferExpr(ex, ctx, st) in
      let? st2 = u(t, tString, st1, exprSpan(ex)) in
      inferInterpParts(rest, ctx, st2)
}

let inferTupleElems = (elements, ctx, st) => switch elements {
  | [] => Ok(([], st))
  | [el, ...rest] =>
      let? (t, st1) = inferExpr(el, ctx, st) in
      let? (restTs, st2) = inferTupleElems(rest, ctx, st1) in
      Ok((Array.prepend(t, restTs), st2))
}

let inferSeqExprElems = (elem, elements, ctx, st) => switch elements {
  | [] => Ok(st)
  | [el, ...rest] =>
      let? (et, st1) = inferExpr(el, ctx, st) in
      let? st2 = u(elem, et, st1, exprSpan(el)) in
      inferSeqExprElems(elem, rest, ctx, st2)
}
let inferSeqExpr = (con, elements, ctx, st) =>
  let (elem, st1) = freshVar(st) in
  let? st2 = inferSeqExprElems(elem, elements, ctx, st1) in
  Ok((tCon(con, [elem]), st2))

let inferMapEntries = (k, v, entries, ctx, st) => switch entries {
  | [] => Ok(st)
  | [ent, ...rest] =>
      let? (kt, st1) = inferExpr(ent.key, ctx, st) in
      let? st2 = u(k, kt, st1, exprSpan(ent.key)) in
      let? (vt, st3) = inferExpr(ent.value, ctx, st2) in
      let? st4 = u(v, vt, st3, exprSpan(ent.value)) in
      inferMapEntries(k, v, rest, ctx, st4)
}
let inferMapExpr = (entries, ctx, st) =>
  let (k, st1) = freshVar(st) in
  let (v, st2) = freshVar(st1) in
  let? st3 = inferMapEntries(k, v, entries, ctx, st2) in
  Ok((tCon("Map", [k, v]), st3))

let mergeBindingMapsFrom = (keys, src, dest) => switch keys {
  | [] => dest
  | [k, ...rest] => switch Map.get(k, src) {
      | Some(v) => mergeBindingMapsFrom(rest, src, Map.set(k, v, dest))
      | None => mergeBindingMapsFrom(rest, src, dest)
    }
}
// later (rightmost/innermost) binding wins on a name collision, matching
// TS's mutable `bindings.set` overwrite order
let mergeBindingMaps = (dest, src) => mergeBindingMapsFrom(Map.keys(src), src, dest)

let mergeEnvBindingsFrom = (keys, bindings, env) => switch keys {
  | [] => env
  | [k, ...rest] => switch Map.get(k, bindings) {
      | Some(t) => mergeEnvBindingsFrom(rest, bindings, Map.set(k, mono(t), env))
      | None => mergeEnvBindingsFrom(rest, bindings, env)
    }
}
let mergeEnvBindings = (bindings, env) => mergeEnvBindingsFrom(Map.keys(bindings), bindings, env)

let inferArms = (scrutT, resultT, arms, ctx, st) => switch arms {
  | [] => Ok(st)
  | [arm, ...rest] =>
      let? (patT, bindings, st1) = inferPat(arm.pattern, ctx, st) in
      let? st2 = u(scrutT, patT, st1, patSpan(arm.pattern)) in
      let armCtx = ctxWithEnv(ctx, mergeEnvBindings(bindings, ctx.env)) in
      let? st3 = switch arm.guard {
        | None => Ok(st2)
        | Some(g) =>
            let? (guardT, stg) = inferExpr(g, armCtx, st2) in
            u(tBool, guardT, stg, exprSpan(g))
      } in
      let? (bodyT, st4) = inferExpr(arm.body, armCtx, st3) in
      let? st5 = u(resultT, bodyT, st4, exprSpan(arm.body)) in
      inferArms(scrutT, resultT, rest, ctx, st5)
}
let inferMatch = (scrutinee, arms, ctx, st) =>
  let? (scrutT, st1) = inferExpr(scrutinee, ctx, st) in
  let (resultT, st2) = freshVar(st1) in
  let? st3 = inferArms(scrutT, resultT, arms, ctx, st2) in
  Ok((resultT, st3))

let inferExpr = (e, ctx, st) => switch e {
  | ENum(_, _, _) => Ok((tNumber, st))
  | EBool(_, _) => Ok((tBool, st))
  | EStr(_, _) => Ok((tString, st))
  | ERef(name, sp) => switch Map.get(name, ctx.env) {
      | Some(sc) => let (t, st1) = instantiate(sc, st) in Ok((t, st1))
      | None => ctx.open
          ? let (t, st1) = freshVar(st) in Ok((t, st1))
          : Err(typeErr("unbound variable '${name}'", sp))
    }
  | ELambda(params, body, _) =>
      let (paramTypes, bodyEnv, st1) = bindParamsFrom(params, ctx.env, st) in
      let? (bodyT, st2) = inferExpr(body, ctxWithEnv(ctx, bodyEnv), st1) in
      Ok((arrowChain(paramTypes, bodyT), st2))
  | ELetIn(name, _, value, body, _) =>
      let? (valT, st1) = inferExpr(value, ctx, st) in
      let sc = generalize(ctx.env, valT, st1) in
      inferExpr(body, ctxWithEnv(ctx, Map.set(name, sc, ctx.env)), st1)
  | ELetBind(param, paramSpan, value, body, _) => inferLetBind(param, paramSpan, value, body, ctx, st)
  | ECall(fn, args, _) =>
      let? (fnT, st1) = inferExpr(fn, ctx, st) in
      inferCallArgs(fnT, args, ctx, st1)
  | EPipe(left, right, sp) => inferExpr(ECall(right, [left], sp), ctx, st)
  | ETernary(cond, thenE, elseE, _) => inferTernary(cond, thenE, elseE, ctx, st)
  | ERecord(fields, spread, sp) => switch spread {
      | None =>
          let? (row, st1) = inferRecordRow(fields, ctx, st) in
          Ok((tRecord(row), st1))
      // Update (`{ ...base, f: v }`): the base must already carry each listed
      // field at its value's type (extra base fields flow through the fresh
      // tail). Result type = base type — fields are replaced in-kind, so a
      // wrong-typed value or a field absent from a closed base fails to unify.
      | Some(spreadExpr) =>
          let? (row, st1) = inferRecordRow(fields, ctx, st) in
          let? (baseT, st2) = inferExpr(spreadExpr, ctx, st1) in
          let (tailVar, st3) = freshRowVar(st2) in
          let? st4 = u(baseT, tRecord(rWithTail(row, tailVar)), st3, sp) in
          Ok((baseT, st4))
    }
  | EField(target, name, sp) => switch target {
      | ERef(tname, _) => and(Map.has(tname, ctx.ns), not(Map.has(tname, ctx.env)))
          ? inferNsField(tname, name, sp, ctx, st)
          : inferFieldAccess(target, name, sp, ctx, st)
      | _ => inferFieldAccess(target, name, sp, ctx, st)
    }
  | ETuple(elements, _) =>
      let? (elems, st1) = inferTupleElems(elements, ctx, st) in
      Ok((tTuple(elems), st1))
  | EArr(elements, _) => inferSeqExpr("Array", elements, ctx, st)
  | EList(elements, _) => inferSeqExpr("List", elements, ctx, st)
  | EMap(entries, _) => inferMapExpr(entries, ctx, st)
  | EMatch(scrutinee, arms, _) => inferMatch(scrutinee, arms, ctx, st)
  | EInterp(parts, _) => let? st1 = inferInterpParts(parts, ctx, st) in Ok((tString, st1))
}

// ============================================================
// inferPat — Algorithm W over Pattern. Every case returns
// (Ty, Map string Ty, St): the pattern's type, the names it binds
// (monomorphic — never generalized, matching a match-arm's scope), and
// the threaded state.
// ============================================================

let inferPatRecordFrom = (fields, ctx, row, bindings, st) => switch fields {
  | [] => Ok((row, bindings, st))
  | [f, ...rest] =>
      let? (subT, subBindings, st1) = inferPat(f.pat, ctx, st) in
      inferPatRecordFrom(rest, ctx, rExtend(f.label, subT, row), mergeBindingMaps(bindings, subBindings), st1)
}
let inferPatRecord = (fields, ctx, st) =>
  let (rowBase, st1) = freshRowVar(st) in
  let? (row, bindings, st2) = inferPatRecordFrom(fields, ctx, rowBase, #{}, st1) in
  Ok((tRecord(row), bindings, st2))

// peel one arrow off the constructor's (instantiated) scheme per arg,
// resolving through `st` since instantiate may have left it behind a TyVar
let inferPatCtorArgs = (ctor, curT, args, ctx, st, bindings, sp) => switch args {
  | [] => Ok((curT, bindings, st))
  | [argPat, ...rest] => switch resolve(curT, st) {
      | TyFn(fromT, toT) =>
          let? (subT, subBindings, st1) = inferPat(argPat, ctx, st) in
          let? st2 = u(fromT, subT, st1, patSpan(argPat)) in
          inferPatCtorArgs(ctor, toT, rest, ctx, st2, mergeBindingMaps(bindings, subBindings), sp)
      | _ => Err(typeErr("constructor '${ctor}' applied to too many arguments", sp))
    }
}

let inferPatTupleFrom = (elems, ctx, st) => switch elems {
  | [] => Ok(([], #{}, st))
  | [ep, ...rest] =>
      let? (t, bindings, st1) = inferPat(ep, ctx, st) in
      let? (restTs, restBindings, st2) = inferPatTupleFrom(rest, ctx, st1) in
      Ok((Array.prepend(t, restTs), mergeBindingMaps(restBindings, bindings), st2))
}
let inferPatTuple = (elems, ctx, st) =>
  let? (elemTs, bindings, st1) = inferPatTupleFrom(elems, ctx, st) in
  Ok((tTuple(elemTs), bindings, st1))

let inferSeqPatElems = (elem, elems, ctx, st) => switch elems {
  | [] => Ok((#{}, st))
  | [ep, ...rest] =>
      let? (subT, subBindings, st1) = inferPat(ep, ctx, st) in
      let? st2 = u(elem, subT, st1, patSpan(ep)) in
      let? (restBindings, st3) = inferSeqPatElems(elem, rest, ctx, st2) in
      Ok((mergeBindingMaps(restBindings, subBindings), st3))
}
let inferSeqPat = (con, elems, restPat, ctx, st) =>
  let (elem, st1) = freshVar(st) in
  let seqT = tCon(con, [elem]) in
  let? (bindings, st2) = inferSeqPatElems(elem, elems, ctx, st1) in
  switch restPat {
    | None => Ok((seqT, bindings, st2))
    | Some(r) =>
        let? (subT, subBindings, st3) = inferPat(r, ctx, st2) in
        let? st4 = u(subT, seqT, st3, patSpan(r)) in
        Ok((seqT, mergeBindingMaps(bindings, subBindings), st4))
  }

let inferPat = (p, ctx, st) => switch p {
  | PWild(_) => let (t, st1) = freshVar(st) in Ok((t, #{}, st1))
  | PLit(_, _, _) => Ok((tNumber, #{}, st))
  | PBool(_, _) => Ok((tBool, #{}, st))
  | PStr(_, _) => Ok((tString, #{}, st))
  | PBind(name, _) => let (t, st1) = freshVar(st) in Ok((t, Map.set(name, t, #{}), st1))
  | PRecord(fields, _) => inferPatRecord(fields, ctx, st)
  | PCtor(ctor, args, sp) => switch Map.get(ctor, ctx.env) {
      | None => Err(typeErr("unknown constructor '${ctor}'", sp))
      | Some(sc) =>
          let (curT, st1) = instantiate(sc, st) in
          inferPatCtorArgs(ctor, curT, args, ctx, st1, #{}, sp)
    }
  | PTuple(elems, _) => inferPatTuple(elems, ctx, st)
  | PArr(elems, rest, _) => inferSeqPat("Array", elems, rest, ctx, st)
  | PList(elems, rest, _) => inferSeqPat("List", elems, rest, ctx, st)
  | POr(alts, sp) => inferOrPat(alts, sp, ctx, st)
}

// Every alternative of `A | B | …` describes the same scrutinee, so their
// types unify; and (guaranteed by check.al) they bind the same names, whose
// types unify too. The arm's binder env is the FIRST alt's (unified) —
// mirrors src/infer.ts's inferOrPat exactly.
let unifyOrPatBinding = (name, altBindings, bindings, st, sp) => switch Map.get(name, bindings) {
  | None => Ok(st)
  | Some(prevT) => switch Map.get(name, altBindings) {
      | None => Ok(st)
      | Some(ty) => u(prevT, ty, st, sp)
    }
}
let unifyOrPatBindings = (names, altBindings, bindings, st, sp) => switch names {
  | [] => Ok(st)
  | [name, ...rest] =>
      let? st1 = unifyOrPatBinding(name, altBindings, bindings, st, sp) in
      unifyOrPatBindings(rest, altBindings, bindings, st1, sp)
}
let inferOrPatAlts = (alts, i, t, bindings, ctx, st) => switch Array.get(i, alts) {
  | None => Ok(st)
  | Some(alt) =>
      let? (altT, altBindings, st1) = inferPat(alt, ctx, st) in
      let? st2 = u(t, altT, st1, patSpan(alt)) in
      let? st3 = unifyOrPatBindings(Map.keys(altBindings), altBindings, bindings, st2, patSpan(alt)) in
      inferOrPatAlts(alts, add(i, 1), t, bindings, ctx, st3)
}
let inferOrPat = (alts, sp, ctx, st) => switch alts {
  | [] => Err(typeErr("or-pattern needs at least one alternative", sp))
  | [first, ...rest] =>
      let? (t, bindings, st1) = inferPat(first, ctx, st) in
      let? st2 = inferOrPatAlts(rest, 0, t, bindings, ctx, st1) in
      Ok((t, bindings, st2))
}

// ============================================================
// Program-level type machinery: surface `TypeExpr` (extern signatures, ctor
// fields) -> HM `Ty`, transparent record aliases, and variant-ctor schemes.
// Never fails — no Result plumbing, just threaded (vars/st) tuples.
// ============================================================

let ctorPrims = ["number", "int", "float", "string", "bool"]

let isUpperStart = s => switch Str.codeAt(0, s) {
  | Some(c) => and(gte(c, 65), lte(c, 90))
  | None => false
}

type AliasInfo = { params: [string], fields: [AliasField] }

let typeExprListToType = (tes, vars, st, aliases, expanding) => switch tes {
  | [] => ([], vars, st)
  | [te, ...rest] =>
      let (t, vars1, st1) = typeExprToType(te, vars, st, aliases, expanding) in
      let (restTs, vars2, st2) = typeExprListToType(rest, vars1, st1, aliases, expanding) in
      (Array.prepend(t, restTs), vars2, st2)
}

let typeExprName = (name, vars, st, aliases, expanding) =>
  Array.contains(name, ctorPrims)
    ? (primType(name), vars, st)
    : switch Map.get(name, aliases) {
        | Some(info) =>
            let (t, st1) = aliasRow(name, info, [], st, aliases, expanding) in
            (t, vars, st1)
        | None => isUpperStart(name)
            ? (tPrim(name), vars, st)
            : switch Map.get(name, vars) {
                | Some(v) => (v, vars, st)
                | None =>
                    let (v, st1) = freshVar(st) in
                    (v, Map.set(name, v, vars), st1)
              }
      }

// surface type-expr -> HM type. Prim names map to their type; Uppercase names
// are nullary constructors (unless a transparent alias expands them);
// lowercase names are type variables, shared by name within one signature
// via the threaded `vars` cache.
let typeExprToType = (te, vars, st, aliases, expanding) => switch te {
  | TyArrow(fromTe, toTe, _) =>
      let (fromT, vars1, st1) = typeExprToType(fromTe, vars, st, aliases, expanding) in
      let (toT, vars2, st2) = typeExprToType(toTe, vars1, st1, aliases, expanding) in
      (tArrow(fromT, toT), vars2, st2)
  | TyApp(ctor, argTes, _) =>
      let (args, vars1, st1) = typeExprListToType(argTes, vars, st, aliases, expanding) in
      switch Map.get(ctor, aliases) {
        | Some(info) =>
            let (t, st2) = aliasRow(ctor, info, args, st1, aliases, expanding) in
            (t, vars1, st2)
        | None => (tCon(ctor, args), vars1, st1)
      }
  | TyTuple(elemTes, _) =>
      let (elems, vars1, st1) = typeExprListToType(elemTes, vars, st, aliases, expanding) in
      (tTuple(elems), vars1, st1)
  | TyList(elemTe, _) =>
      let (elemT, vars1, st1) = typeExprToType(elemTe, vars, st, aliases, expanding) in
      (tCon("Array", [elemT]), vars1, st1)
  | TyName(name, _) => typeExprName(name, vars, st, aliases, expanding)
}

let aliasLocalVarsFrom = (params, args, st) => switch params {
  | [] => (#{}, st)
  | [p, ...restParams] => switch args {
      | [a, ...restArgs] =>
          let (restMap, st1) = aliasLocalVarsFrom(restParams, restArgs, st) in
          (Map.set(p, a, restMap), st1)
      | [] =>
          let (v, st1) = freshVar(st) in
          let (restMap, st2) = aliasLocalVarsFrom(restParams, [], st1) in
          (Map.set(p, v, restMap), st2)
    }
}

let aliasFieldsFrom = (fields, vars, st, aliases, expanding) => switch fields {
  | [] => (RowEmpty, st)
  | [fld, ...rest] =>
      let (ft, vars1, st1) = typeExprToType(fld.fieldType, vars, st, aliases, expanding) in
      let (restRow, st2) = aliasFieldsFrom(rest, vars1, st1, aliases, expanding) in
      (rExtend(fld.name, ft, restRow), st2)
}

// Expand a record alias to its structural row. `args` binds its type params
// positionally; params past `args.length` become fresh generic vars.
// `expanding` breaks reference cycles (`type T = { self: T }`) by falling
// back to the bare nominal `con(name, args)` — finite, though that field
// then unifies nominally.
let aliasRow = (name, info, args, st, aliases, expanding) =>
  Set.has(name, expanding)
    ? (tCon(name, args), st)
    : let (local, st1) = aliasLocalVarsFrom(info.params, args, st) in
      let next = Set.add(name, expanding) in
      let (row, st2) = aliasFieldsFrom(info.fields, local, st1, aliases, next) in
      (tRecord(row), st2)

let pvarsFrom = (params, st) => switch params {
  | [] => (#{}, [], st)
  | [p, ...rest] =>
      let (v, st1) = freshVar(st) in
      let (restMap, restVars, st2) = pvarsFrom(rest, st1) in
      (Map.set(p, v, restMap), Array.prepend(v, restVars), st2)
}

let ctorFieldsArrowFrom = (fields, pvars, st, aliases, result) => switch fields {
  | [] => (result, st)
  | [fld, ...rest] =>
      let (ft, _, st1) = typeExprToType(fld.fieldType, pvars, st, aliases, Set.fromArray([])) in
      let (restT, st2) = ctorFieldsArrowFrom(rest, pvars, st1, aliases, result) in
      (tArrow(ft, restT), st2)
}

// A variant's constructors become curried functions into that variant type,
// polymorphic over the type's parameters. `type Result a e = | Ok(a) | Err(e)`
// gives `Ok : forall a e. a -> Result a e` — a ctor scheme is closed by
// construction (quantifies every var the fields introduced), nothing leaks
// from env.
let ctorScheme = (typeName, params, c, st, aliases) =>
  let (pvars, pvarTypes, st1) = pvarsFrom(params, st) in
  let result = tCon(typeName, pvarTypes) in
  let (ty, st2) = ctorFieldsArrowFrom(c.fields, pvars, st1, aliases, result) in
  let sets = collect(ty, emptyVarSets) in
  ({ vars: Set.toArray(sets.tv), rvars: Set.toArray(sets.rv), ty: ty }, st2)

// ============================================================
// Top-level `let` dependency graph: which names a pattern binds (excluded
// from an arm body's free references), and which names an expression
// references free (minus its own locally-bound names) — the edges of the
// graph that groups mutually-recursive top-level `let`s for Slice-order
// inference, below.
// ============================================================

let patternBindsOpt = rest => switch rest {
  | Some(r) => patternBinds(r)
  | None => []
}
let patternBinds = p => switch p {
  | PBind(name, _) => [name]
  | PRecord(fields, _) => fields |> Array.flatMap(f => patternBinds(f.pat))
  | PCtor(_, args, _) => args |> Array.flatMap(patternBinds)
  | PTuple(elems, _) => elems |> Array.flatMap(patternBinds)
  | PArr(elems, rest, _) => Array.concat(elems |> Array.flatMap(patternBinds), patternBindsOpt(rest))
  | PList(elems, rest, _) => Array.concat(elems |> Array.flatMap(patternBinds), patternBindsOpt(rest))
  | POr(alts, _) => switch Array.head(alts) {
      | Some(first) => patternBinds(first)
      | None => []
    }
  | _ => []
}

let addAllFrom = (names, set) => switch names {
  | [] => set
  | [n, ...rest] => addAllFrom(rest, Set.add(n, set))
}

let paramBound = (p, bound) => switch p {
  | LPName(name) => Set.add(name, bound)
  | LPTuple(names) => addAllFrom(names, bound)
  | LPRecord(fields) => addAllFrom(fields, bound)
}
let lambdaBound = (params, bound) => switch params {
  | [] => bound
  | [p, ...rest] => lambdaBound(rest, paramBound(p, bound))
}

let freeRefsList = (es, bound, acc) => switch es {
  | [] => acc
  | [e, ...rest] => freeRefsList(rest, bound, freeRefs(e, bound, acc))
}
let freeRefsFields = (fields, bound, acc) => switch fields {
  | [] => acc
  | [f, ...rest] => freeRefsFields(rest, bound, freeRefs(f.value, bound, acc))
}
let freeRefsEntries = (entries, bound, acc) => switch entries {
  | [] => acc
  | [ent, ...rest] => freeRefsEntries(rest, bound, freeRefs(ent.value, bound, freeRefs(ent.key, bound, acc)))
}
let freeRefsInterpParts = (parts, bound, acc) => switch parts {
  | [] => acc
  | [IPLit(_), ...rest] => freeRefsInterpParts(rest, bound, acc)
  | [IPExpr(ex), ...rest] => freeRefsInterpParts(rest, bound, freeRefs(ex, bound, acc))
}
let freeRefsArms = (arms, bound, acc) => switch arms {
  | [] => acc
  | [arm, ...rest] =>
      let armBound = addAllFrom(patternBinds(arm.pattern), bound) in
      let acc1 = switch arm.guard {
        | Some(g) => freeRefs(g, armBound, acc)
        | None => acc
      } in
      freeRefsArms(rest, bound, freeRefs(arm.body, armBound, acc1))
}

// Collect the free variable references in an expression, minus the locally
// bound ones (lambda params, pattern binds). `bound`/`acc` are threaded
// (not mutated) — TS's in-place `Set` mutation becomes explicit pass-through.
let freeRefs = (e, bound, acc) => switch e {
  | ENum(_, _, _) => acc
  | EBool(_, _) => acc
  | EStr(_, _) => acc
  | ERef(name, _) => Set.has(name, bound) ? acc : Set.add(name, acc)
  | ECall(fn, args, _) => freeRefsList(args, bound, freeRefs(fn, bound, acc))
  | ELambda(params, body, _) => freeRefs(body, lambdaBound(params, bound), acc)
  | ELetIn(name, _, value, body, _) =>
      let acc1 = freeRefs(value, bound, acc) in
      freeRefs(body, Set.add(name, bound), acc1)
  | ELetBind(param, _, value, body, _) =>
      let acc1 = freeRefs(value, bound, acc) in
      freeRefs(body, paramBound(param, bound), acc1)
  | EPipe(left, right, _) => freeRefs(right, bound, freeRefs(left, bound, acc))
  | ETernary(cond, thenE, elseE, _) => freeRefs(elseE, bound, freeRefs(thenE, bound, freeRefs(cond, bound, acc)))
  | EMatch(scrutinee, arms, _) => freeRefsArms(arms, bound, freeRefs(scrutinee, bound, acc))
  | ERecord(fields, spread, _) =>
      freeRefsFields(fields, bound, switch spread { | Some(s) => freeRefs(s, bound, acc) | None => acc })
  | EField(target, _, _) => freeRefs(target, bound, acc)
  | ETuple(elements, _) => freeRefsList(elements, bound, acc)
  | EArr(elements, _) => freeRefsList(elements, bound, acc)
  | EList(elements, _) => freeRefsList(elements, bound, acc)
  | EMap(entries, _) => freeRefsEntries(entries, bound, acc)
  | EInterp(parts, _) => freeRefsInterpParts(parts, bound, acc)
}

// ============================================================
// Tarjan's SCC over the `let` dependency graph. Returns strongly-connected
// components (mutually recursive groups) in DEPENDENCY-FIRST order — the
// order to generalize them, since a group's dependencies are already
// generalized by the time it's inferred. Tarjan naturally emits SCCs in
// reverse-topological order, which is that order.
//
// TS mutates `index`/`low`/`onStack` arrays and a `stack` in place; here all
// four (plus the running `counter` and the `sccs` accumulated so far) live
// in one threaded `TSt` record, returned from `connect`/`visitNeighbors`
// and passed to the next call.
// ============================================================

type TSt = { index: Map number number, low: Map number number, onStack: Set number, stack: [number], counter: number, sccs: [[number]] }

let hasIndex = (v, st) => Map.has(v, st.index)
let indexOfV = (v, st) => Map.getOr(-1, v, st.index)
let lowOfV = (v, st) => Map.getOr(-1, v, st.low)

let neighborsOf = (v, adj) => switch Array.get(v, adj) {
  | Some(ws) => ws
  | None => []
}

let indexOfFrom = (v, xs, i) => switch Array.get(i, xs) {
  | None => -1
  | Some(x) => eq(x, v) ? i : indexOfFrom(v, xs, add(i, 1))
}

let visitNeighbors = (v, ws, adj, st) => switch ws {
  | [] => st
  | [w, ...rest] => hasIndex(w, st)
      ? Set.has(w, st.onStack)
          ? visitNeighbors(v, rest, adj, { ...st, low: Map.set(v, min(lowOfV(v, st), indexOfV(w, st)), st.low) })
          : visitNeighbors(v, rest, adj, st)
      : let st1 = connect(w, adj, st) in
        visitNeighbors(v, rest, adj, { ...st1, low: Map.set(v, min(lowOfV(v, st1), lowOfV(w, st1)), st1.low) })
}

let connect = (v, adj, st) =>
  let st1 = { ...st,
              index: Map.set(v, st.counter, st.index),
              low: Map.set(v, st.counter, st.low),
              onStack: Set.add(v, st.onStack),
              stack: Array.append(v, st.stack),
              counter: add(st.counter, 1) } in
  let st2 = visitNeighbors(v, neighborsOf(v, adj), adj, st1) in
  eq(lowOfV(v, st2), indexOfV(v, st2))
    ? let start = indexOfFrom(v, st2.stack, 0) in
      let comp = Array.drop(start, st2.stack) in
      { ...st2,
        onStack: Set.diff(st2.onStack, Set.fromArray(comp)),
        stack: Array.take(start, st2.stack),
        sccs: Array.append(comp, st2.sccs) }
    : st2

let connectAllFrom = (i, n, adj, st) =>
  gte(i, n) ? st : connectAllFrom(add(i, 1), n, adj, hasIndex(i, st) ? st : connect(i, adj, st))

let stronglyConnected = adj =>
  let n = Array.length(adj) in
  let initSt = { index: #{}, low: #{}, onStack: Set.fromArray([]), stack: [], counter: 0, sccs: [] } in
  connectAllFrom(0, n, adj, initSt).sccs

// ============================================================
// inferProgram — the shared inference core (TS's `run`). Builtins/namespaces
// arrive pre-built (`Map string Ty` / `Map string (Map string Ty)`) — the
// differential harness converts TS's `preludeEnv`/`preludeNamespaces` into
// these shapes rather than this file reimplementing the prelude tables
// (locked decision 3). Dropped vs TS: hover recording (`record`/`TypeAt`),
// `imports` (cross-module env seeding — Slice F), and `AliasDef` display
// templates (decision 4) — this file only needs an alias's structural
// row for typeExprToType, never its display-fold form.
// ============================================================

// Builtin variant ctors (Option/Result) — the transparent bit prelude.ts
// hands the checker as data; hardcoded here since this file cannot yet
// import prelude.ts's table (Slice F). `builtinTypeDecls[].ctors[].fields`
// use bare TypeExpr, not the checked/authoritative HM type, so ctorScheme
// (same as for a user type) is what turns them into schemes.
let builtinSpan = { start: 0, end: 0 }
let builtinTypeDecls = [
  { name: "Option", params: ["a"],
    ctors: [ { name: "Some", fields: [{ name: Some("value"), fieldType: TyName("a", builtinSpan) }] },
             { name: "None", fields: [] } ] },
  { name: "Result", params: ["a", "e"],
    ctors: [ { name: "Ok", fields: [{ name: Some("value"), fieldType: TyName("a", builtinSpan) }] },
             { name: "Err", fields: [{ name: Some("error"), fieldType: TyName("e", builtinSpan) }] } ] }
]

let seedBuiltinsFrom = (keys, builtins, env, st) => switch keys {
  | [] => env
  | [n, ...rest] => switch Map.get(n, builtins) {
      | Some(t) => seedBuiltinsFrom(rest, builtins, Map.set(n, generalize(env, t, st), env), st)
      | None => seedBuiltinsFrom(rest, builtins, env, st)
    }
}
// Builtins are generalized, not monomorphic: a prelude type carrying type
// vars (`map : (a -> b) -> [a] -> [b]`) becomes a scheme that instantiates
// fresh at each use site. Monomorphic builtins (`add : number -> ...`) have
// no free vars, so generalizing them is a no-op.
let seedBuiltins = (builtins, env, st) => seedBuiltinsFrom(Map.keys(builtins), builtins, env, st)

let seedNsMembersFrom = (keys, members, env, st, acc) => switch keys {
  | [] => acc
  | [m, ...rest] => switch Map.get(m, members) {
      | Some(t) => seedNsMembersFrom(rest, members, env, st, Map.set(m, generalize(env, t, st), acc))
      | None => seedNsMembersFrom(rest, members, env, st, acc)
    }
}
let seedNsFrom = (nsNames, namespaces, env, st, acc) => switch nsNames {
  | [] => acc
  | [nsName, ...rest] => switch Map.get(nsName, namespaces) {
      | Some(members) => seedNsFrom(rest, namespaces, env, st, Map.set(nsName, seedNsMembersFrom(Map.keys(members), members, env, st, #{}), acc))
      | None => seedNsFrom(rest, namespaces, env, st, acc)
    }
}
// qualified-namespace members (`List.map`, ...): generalize each like a
// builtin, so a use site instantiates it fresh. Resolved in the `EField`
// case (`inferNsField`, above) against the env as it stood right after
// builtins were seeded — matching TS's `run`.
let seedNs = (namespaces, env, st) => seedNsFrom(Map.keys(namespaces), namespaces, env, st, #{})

let aliasMapFrom = (stmts, acc) => switch stmts {
  | [] => acc
  | [s, ...rest] => switch s {
      | SType(name, params, _, Some(fields), _, _) => aliasMapFrom(rest, Map.set(name, { params: params, fields: fields }, acc))
      | _ => aliasMapFrom(rest, acc)
    }
}

let registerCtorsFrom = (ctors, typeName, params, aliasMap, env, st) => switch ctors {
  | [] => (env, st)
  | [c, ...rest] =>
      let (sc, st1) = ctorScheme(typeName, params, c, st, aliasMap) in
      registerCtorsFrom(rest, typeName, params, aliasMap, Map.set(c.name, sc, env), st1)
}
// constructors first, so `let`s (in any order after their type) can use them
let registerUserCtorsFrom = (stmts, aliasMap, env, st) => switch stmts {
  | [] => (env, st)
  | [s, ...rest] => switch s {
      | SType(name, params, ctors, _, _, _) =>
          let (env1, st1) = registerCtorsFrom(ctors, name, params, aliasMap, env, st) in
          registerUserCtorsFrom(rest, aliasMap, env1, st1)
      | _ => registerUserCtorsFrom(rest, aliasMap, env, st)
    }
}

let registerBuiltinCtorGroup = (ctors, typeName, params, aliasMap, env, st) => switch ctors {
  | [] => (env, st)
  | [c, ...rest] => Map.has(c.name, env)
      ? registerBuiltinCtorGroup(rest, typeName, params, aliasMap, env, st)
      : let (sc, st1) = ctorScheme(typeName, params, c, st, aliasMap) in
        registerBuiltinCtorGroup(rest, typeName, params, aliasMap, Map.set(c.name, sc, env), st1)
}
// unless the program already declared its own type of that name — a user
// redeclaration wins, so `Map.get : ... -> Option v` and a hand-written
// Some/None still type-check against whichever one is in scope.
let registerBuiltinCtorsFrom = (decls, aliasMap, env, st) => switch decls {
  | [] => (env, st)
  | [d, ...rest] =>
      let (env1, st1) = registerBuiltinCtorGroup(d.ctors, d.name, d.params, aliasMap, env, st) in
      registerBuiltinCtorsFrom(rest, aliasMap, env1, st1)
}

// externs next — their declared type is authoritative; generalize so a
// polymorphic signature (e.g. `a -> a`) instantiates fresh at each use site.
let registerExternsFrom = (stmts, aliasMap, env, st) => switch stmts {
  | [] => (env, st)
  | [s, ...rest] => switch s {
      | SExtern(name, _, typeExpr, _, _, _, _) =>
          let (t, _, st1) = typeExprToType(typeExpr, #{}, st, aliasMap, Set.fromArray([])) in
          registerExternsFrom(rest, aliasMap, Map.set(name, generalize(env, t, st1), env), st1)
      | _ => registerExternsFrom(rest, aliasMap, env, st)
    }
}

let letsOfFrom = stmts => switch stmts {
  | [] => []
  | [s, ...rest] => switch s {
      | SLet(_, _, _, _, _, _) => Array.prepend(s, letsOfFrom(rest))
      | _ => letsOfFrom(rest)
    }
}

let idxOfFrom = (lets, i, acc) => switch Array.get(i, lets) {
  | None => acc
  | Some(SLet(name, _, _, _, _, _)) => idxOfFrom(lets, add(i, 1), Map.set(name, i, acc))
  | Some(_) => idxOfFrom(lets, add(i, 1), acc)
}
let idxOfMap = lets => idxOfFrom(lets, 0, #{})

let depsOf = (letStmt, idxOf) => switch letStmt {
  | SLet(_, _, value, _, _, _) =>
      Set.toArray(freeRefs(value, Set.fromArray([]), Set.fromArray([])))
        |> Array.flatMap(r => switch Map.get(r, idxOf) {
            | Some(j) => [j]
            | None => []
          })
  | _ => []
}
let adjOf = (lets, idxOf) => lets |> map(s => depsOf(s, idxOf))

let groupOfFrom = (idxs, lets) => switch idxs {
  | [] => []
  | [i, ...rest] => switch Array.get(i, lets) {
      | Some(s) => Array.prepend(s, groupOfFrom(rest, lets))
      | None => groupOfFrom(rest, lets)
    }
}

// Pre-bind every member of a mutually-recursive group (monomorphic) BEFORE
// inferring any body, so mutual references resolve to these bindings —
// recursion is soundly typed.
let preBindGroupFrom = (group, env, st) => switch group {
  | [] => (env, st)
  | [s, ...rest] => switch s {
      | SLet(name, _, _, _, _, _) =>
          let (v, st1) = freshVar(st) in
          preBindGroupFrom(rest, Map.set(name, mono(v), env), st1)
      | _ => preBindGroupFrom(rest, env, st)
    }
}

let inferGroupFrom = (group, ctx, st) => switch group {
  | [] => Ok((#{}, st))
  | [s, ...rest] => switch s {
      | SLet(name, _, value, _, _, span) =>
          let? (t, st1) = inferExpr(value, ctx, st) in
          switch Map.get(name, ctx.env) {
            | Some(selfSc) =>
                let? st2 = u(selfSc.ty, t, st1, span) in
                let? (restTypes, st3) = inferGroupFrom(rest, ctx, st2) in
                Ok((Map.set(name, t, restTypes), st3))
            | None => Err(typeErr("internal: missing self-binding for '${name}'", span))
          }
      | _ => inferGroupFrom(rest, ctx, st)
    }
}

let dropGroupFrom = (group, env) => switch group {
  | [] => env
  | [s, ...rest] => switch s {
      | SLet(name, _, _, _, _, _) => dropGroupFrom(rest, Map.delete(name, env))
      | _ => dropGroupFrom(rest, env)
    }
}
// generalize against the OUTER env — drop the mono self-bindings first, else
// the group's own type vars look env-bound and stay ungeneralized.
// Monomorphic recursion within the group, polymorphic use afterwards.
let generalizeGroupFrom = (group, bodyTypes, env, st) => switch group {
  | [] => env
  | [s, ...rest] => switch s {
      | SLet(name, _, _, _, _, _) => switch Map.get(name, bodyTypes) {
          | Some(t) => generalizeGroupFrom(rest, bodyTypes, Map.set(name, generalize(env, t, st), env), st)
          | None => generalizeGroupFrom(rest, bodyTypes, env, st)
        }
      | _ => generalizeGroupFrom(rest, bodyTypes, env, st)
    }
}

// `let`s, grouped into mutually-recursive components (SCCs of the reference
// graph) and inferred group-by-group in dependency-first order.
let processGroupsFrom = (sccs, lets, ctx, st) => switch sccs {
  | [] => Ok(ctx)
  | [comp, ...restSccs] =>
      let group = groupOfFrom(comp, lets) in
      let (preEnv, st1) = preBindGroupFrom(group, ctx.env, st) in
      let preCtx = ctxWithEnv(ctx, preEnv) in
      let? (bodyTypes, st2) = inferGroupFrom(group, preCtx, st1) in
      let finalEnv = generalizeGroupFrom(group, bodyTypes, dropGroupFrom(group, preEnv), st2) in
      processGroupsFrom(restSccs, lets, ctxWithEnv(ctx, finalEnv), st2)
}

// Seed each import's already-generalized scheme into the env, so a reference to
// an imported name types with its real (possibly polymorphic) scheme instead of
// an open-world fresh var. A module's own `let` (inferred later, in the SCCs)
// shadows an import of the same name.
let seedImportsFrom = (keys, imports, env) => switch keys {
  | [] => env
  | [k, ...rest] => switch Map.get(k, imports) {
    | Some(sc) => seedImportsFrom(rest, imports, Map.set(k, sc, env))
    | None => seedImportsFrom(rest, imports, env)
  }
}

// inferProgram threaded with `imports` (a Map of name -> Scheme published by dep
// modules). Mirrors src/infer.ts's `inferProgramTypes({ imports })`; returns the
// final env so the module driver can extract this module's export schemes.
export let inferProgramImports = (stmts, builtins, namespaces, openMode, imports) =>
  let st0 = mkSt(1000) in
  let env0 = seedBuiltins(builtins, #{}, st0) in
  let ns0 = seedNs(namespaces, env0, st0) in
  let aliasMap = aliasMapFrom(stmts, #{}) in
  let (env1, st1) = registerUserCtorsFrom(stmts, aliasMap, env0, st0) in
  let (env2, st2) = registerBuiltinCtorsFrom(builtinTypeDecls, aliasMap, env1, st1) in
  let (env3, st3) = registerExternsFrom(stmts, aliasMap, env2, st2) in
  let env4 = seedImportsFrom(Map.keys(imports), imports, env3) in
  let lets = letsOfFrom(stmts) in
  let idxOf = idxOfMap(lets) in
  let sccs = stronglyConnected(adjOf(lets, idxOf)) in
  switch processGroupsFrom(sccs, lets, { env: env4, open: openMode, ns: ns0 }, st3) {
    | Ok(finalCtx) => Ok(finalCtx.env)
    | Err(e) => Err(e)
  }

export let inferProgram = (stmts, builtins, namespaces, openMode) =>
  inferProgramImports(stmts, builtins, namespaces, openMode, #{})

// The schemes a module PUBLISHES: exported let/extern bindings and the ctors of
// exported types, pulled from the final inference env by name. Mirrors
// src/module.ts's `exportsOf`; feeds an importer's `imports` for
// inferProgramImports. Names absent from the env (should not happen post-infer)
// are skipped.
let takeScheme = (name, env, acc) => switch Map.get(name, env) {
  | Some(sc) => Map.set(name, sc, acc)
  | None => acc
}
let exportCtorsInto = (ctors, i, env, acc) => switch Array.get(i, ctors) {
  | None => acc
  | Some(c) => exportCtorsInto(ctors, add(i, 1), env, takeScheme(c.name, env, acc))
}
let exportedSchemesFrom = (stmts, i, env, acc) => switch Array.get(i, stmts) {
  | None => acc
  | Some(SLet(name, _, _, true, _, _)) =>
      exportedSchemesFrom(stmts, add(i, 1), env, takeScheme(name, env, acc))
  | Some(SExtern(name, _, _, _, _, true, _)) =>
      exportedSchemesFrom(stmts, add(i, 1), env, takeScheme(name, env, acc))
  | Some(SType(_, _, ctors, _, true, _)) =>
      exportedSchemesFrom(stmts, add(i, 1), env, exportCtorsInto(ctors, 0, env, acc))
  | Some(_) => exportedSchemesFrom(stmts, add(i, 1), env, acc)
}
export let exportedSchemes = (stmts, env) => exportedSchemesFrom(stmts, 0, env, #{})
