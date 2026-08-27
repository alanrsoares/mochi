import { match } from "@onrails/pattern";

const _list = (g) => ({ [Symbol.iterator]: g });
const _curry = (n, f) => function c(...a) {
  if (a.length < n)
    return (...b) => c(...a, ...b);
  if (a.length === n)
    return f(...a);
  return a.slice(n).reduce((g, x) => g(x), f(...a.slice(0, n)));
};
const _recur = (...args) => ({
  _tag: "recur",
  args
});
const _done = (value) => ({ _tag: "done", value });
const Some = (value) => ({ _tag: "Some", value });
const None = { _tag: "None" };
const add = _curry(2, (a, b) => a + b);
const sub = _curry(2, (a, b) => a - b);
const concat = _curry(2, (a, b) => typeof a === "string" ? a + b : Array.isArray(a) ? a.concat(b) : _List_concat(a, b));
const eq = _curry(2, (x, y) => {
  if (x === y)
    return true;
  if (typeof x !== "object" || x === null || typeof y !== "object" || y === null)
    return false;
  const ax = Array.isArray(x);
  if (ax !== Array.isArray(y))
    return false;
  if (ax) {
    if (x.length !== y.length)
      return false;
    for (let i = 0;i < x.length; i++)
      if (!eq(x[i], y[i]))
        return false;
    return true;
  }
  if (x instanceof Map || y instanceof Map) {
    if (!(x instanceof Map) || !(y instanceof Map))
      return false;
    if (x.size !== y.size)
      return false;
    for (const [k, v] of x) {
      if (!y.has(k) || !eq(v, y.get(k)))
        return false;
    }
    return true;
  }
  if (x instanceof Set || y instanceof Set) {
    if (!(x instanceof Set) || !(y instanceof Set))
      return false;
    if (x.size !== y.size)
      return false;
    for (const v of x)
      if (!y.has(v))
        return false;
    return true;
  }
  if (typeof x[Symbol.iterator] === "function" || typeof y[Symbol.iterator] === "function")
    throw new TypeError("eq on List: force it first with List.toArray");
  const kx = Object.keys(x), ky = Object.keys(y);
  if (kx.length !== ky.length)
    return false;
  for (const k of kx)
    if (!eq(x[k], y[k]))
      return false;
  return true;
});
const show = (x) => {
  const t = typeof x;
  if (t === "string")
    return JSON.stringify(x);
  if (t !== "object" || x === null)
    return String(x);
  if (Array.isArray(x))
    return `[${x.map(show).join(", ")}]`;
  if (x instanceof Map)
    return `#{${[...x.entries()].map((e) => `${show(e[0])}: ${show(e[1])}`).join(", ")}}`;
  if (x instanceof Set)
    return `#{${[...x].map(show).join(", ")}}`;
  if (typeof x[Symbol.iterator] === "function")
    return "<List>";
  if (typeof x._tag === "string") {
    const ks = Object.keys(x).filter((k) => k !== "_tag");
    return ks.length === 0 ? x._tag : `${x._tag}(${ks.map((k) => show(x[k])).join(", ")})`;
  }
  const ks = Object.keys(x);
  if (ks.length === 0)
    return String(x);
  return `{ ${ks.map((k) => `${k}: ${show(x[k])}`).join(", ")} }`;
};
const lt = _curry(2, (a, b) => a < b);
const gte = _curry(2, (a, b) => a >= b);
const lte = _curry(2, (a, b) => a <= b);
const not = (b) => !b;
const and = _curry(2, (a, b) => a && b);
const or = _curry(2, (a, b) => a || b);
const length = (xs) => xs.length;
const map = _curry(2, (f, xs) => xs.map((x) => f(x)));
const filter = _curry(2, (f, xs) => xs.filter((x) => f(x)));
const _List_concat = _curry(2, (xs, ys) => _list(function* () {
  yield* xs;
  yield* ys;
}));
const _Set_has = _curry(2, (x, s) => s.has(x));
const _Set_add = _curry(2, (x, s) => new Set(s).add(x));
const _Set_toArray = (s) => [...s];
const _Set_fromArray = (xs) => new Set(xs);
const _Set_union = _curry(2, (a, b) => new Set([...a, ...b]));
const _Map_getOr = _curry(3, (d, k, m) => m.has(k) ? m.get(k) : d);
const _Map_keys = (m) => [...m.keys()];
const _Map_get = _curry(2, (k, m) => m.has(k) ? Some(m.get(k)) : None);
const _Option_contains = _curry(2, (x, o) => o._tag === "Some" && eq(x, o.value));
const _Option_unwrapOr = _curry(2, (d, o) => o._tag === "Some" ? o.value : d);
const _Option_isSome = (o) => o._tag === "Some";
const _Array_head = (xs) => xs.length > 0 ? Some(xs[0]) : None;
const _Array_get = _curry(2, (i, xs) => i >= 0 && i < xs.length ? Some(xs[i]) : None);
const _Array_concat = _curry(2, (xs, ys) => xs.concat(ys));
const _Array_append = _curry(2, (x, xs) => [...xs, x]);
const _Array_prepend = _curry(2, (x, xs) => [x, ...xs]);
const _Str_length = (s) => s.length;
const _Str_concat = _curry(2, (a, b) => a + b);
const _Str_split = _curry(2, (sep, s) => s.split(sep));
const _Str_join = _curry(2, (sep, xs) => xs.join(sep));
const _Str_startsWith = _curry(2, (p, s) => s.startsWith(p));
const _Str_endsWith = _curry(2, (p, s) => s.endsWith(p));
const _Str_slice = _curry(3, (start, end, s) => s.slice(start, end));
const _Str_chars = (s) => [...s];

import * as Ast from "./ast.js";
import { keysOf, ctorKeysFromStmts, seedBuiltinCtorKeys } from "./ctors.js";
const bindRuntime = (monad) => (eq(monad, "Option") ? "_Option_flatMap" : (eq(monad, "Result") ? "_Result_flatMap" : "_Task_andThen"));
const allOfFrom = _curry(3, (f, xs, i) => match(_Array_get(i, xs))
  .with({ _tag: "None" }, () => true)
  .with({ _tag: "Some" }, ({ value: x }) => (f(x) ? allOfFrom(f, xs, add(i, 1)) : false))
  .exhaustive());
const allOf = _curry(2, (f, xs) => allOfFrom(f, xs, 0));
const someOfFrom = _curry(3, (f, xs, i) => match(_Array_get(i, xs))
  .with({ _tag: "None" }, () => false)
  .with({ _tag: "Some" }, ({ value: x }) => (f(x) ? true : someOfFrom(f, xs, add(i, 1))))
  .exhaustive());
const someOf = _curry(2, (f, xs) => someOfFrom(f, xs, 0));
const escChar = (c) => match(c)
  .with("\\", () => "\\\\")
  .with("\"", () => "\\\"")
  .with("\n", () => "\\n")
  .with("\t", () => "\\t")
  .otherwise(() => c);
const jsStringLit = (s) => `"${_Str_join("", map(escChar)(_Str_chars(s)))}"`;
const escTemplateLoop = _curry(3, (chars, i0, acc0) => { let i = i0; let acc = acc0; while (true) { const _step = match(_Array_get(i, chars))
  .with({ _tag: "None" }, () => _done(acc))
  .with({ _tag: "Some", value: "\\" }, () => _recur(add(i, 1), `${acc}\\\\`))
  .with({ _tag: "Some", value: "`" }, () => _recur(add(i, 1), `${acc}\\\``))
  .with((_v) => _v._tag === "Some" && _v.value === "$" && (_Option_contains("{")(_Array_get(add(i, 1), chars))), () => _recur(add(i, 2), `${acc}\\\${`))
  .with({ _tag: "Some" }, ({ value: c }) => _recur(add(i, 1), `${acc}${c}`))
  .exhaustive(); if (_step._tag === "recur") { [i, acc] = _step.args; continue; } return _step.value; } });
const escapeTemplateLiteral = (s) => escTemplateLoop(_Str_chars(s), 0, "");
const keyAt = _curry(3, (ctx, ctor, i) => match(_Map_get(ctor, ctx.keys))
  .with({ _tag: "Some" }, ({ value: ks }) => _Option_unwrapOr(`_${show(i)}`, _Array_get(i, ks)))
  .with({ _tag: "None" }, () => `_${show(i)}`)
  .exhaustive());
const nsRuntimeId = _curry(3, (ctx, target, name) => match(target)
  .with({ _tag: "ERef" }, ({ name: refName }) => match(_Map_get(refName, ctx.ns))
  .with({ _tag: "Some" }, ({ value: members }) => _Map_get(name, members))
  .with({ _tag: "None" }, () => None)
  .exhaustive())
  .otherwise(() => None));
const emptyNsEmit = _curry(2, (target, name) => match(target)
  .with({ _tag: "ERef" }, ({ name: refName }) => (eq(name, "empty") ? (eq(refName, "Set") ? Some("new Set()") : (eq(refName, "Map") ? Some("new Map()") : (eq(refName, "List") ? Some("_list(function* () {})") : None))) : None))
  .otherwise(() => None));
const collapseLambda = _curry(2, (params, body) => match(body)
  .with({ _tag: "ELambda" }, ({ params: params2, body: body2 }) => collapseLambda(_Array_concat(params, params2), body2))
  .otherwise(() => [params, body]));
const genExpr = _curry(2, (ctx, e) => match(e)
  .with({ _tag: "ENum" }, ({ raw }) => raw)
  .with({ _tag: "EUnit" }, () => "undefined")
  .with({ _tag: "EBool" }, ({ value }) => (value ? "true" : "false"))
  .with({ _tag: "EStr" }, ({ value }) => jsStringLit(value))
  .with({ _tag: "ERef" }, ({ name }) => name)
  .with({ _tag: "ECall" }, ({ fn, args }) => `${genCallee(ctx, fn)}(${_Str_join(", ", map((a) => genExpr(ctx, a))(args))})`)
  .with({ _tag: "ELambda" }, ({ params, body }) => (([cparams, cbody]) => { const bound = paramNameSet(cparams, 0, _Set_fromArray([])); const arrow = `(${_Str_join(", ", map(genParam)(cparams))}) => ${genLambdaBodyIn(ctx, cbody, bound)}`; return (gte(length(cparams), 2) ? `_curry(${show(length(cparams))}, ${arrow})` : arrow); })(collapseLambda(params, body)))
  .with({ _tag: "ELetIn" }, ({ name, value, body }) => `((${name}) => ${genLambdaBody(ctx, body)})(${genExpr(ctx, value)})`)
  .with({ _tag: "ELetBind" }, ({ param, monad, value, body }) => ((rt) => `${rt}((${genParam(param)}) => ${genLambdaBody(ctx, body)})(${genExpr(ctx, value)})`)(bindRuntime(monad)))
  .with({ _tag: "EPipe" }, ({ left, right }) => `${genCallee(ctx, right)}(${genExpr(ctx, left)})`)
  .with({ _tag: "EDo" }, ({ exprs }) => genDo(ctx, exprs))
  .with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => `(${genExpr(ctx, cond)} ? ${genExpr(ctx, thenE)} : ${genExpr(ctx, elseE)})`)
  .with({ _tag: "EMatch" }, ({ scrutinee, arms }) => genMatch(ctx, scrutinee, arms))
  .with({ _tag: "ELoop" }, ({ params, body }) => `(() => { ${genLoopBlock(ctx, params, body)} })()`)
  .with({ _tag: "ERecur" }, ({ args }) => `_recur(${_Str_join(", ", map((a) => genExpr(ctx, a))(args))})`)
  .with({ _tag: "ERecord" }, ({ fields, spread }) => ((fieldStrs) => match(spread)
  .with({ _tag: "None" }, () => (eq(length(fields), 0) ? "{}" : `{ ${fieldStrs} }`))
  .with({ _tag: "Some" }, ({ value: s }) => ((spreadStr) => (eq(length(fields), 0) ? `{ ${spreadStr} }` : `{ ${spreadStr}, ${fieldStrs} }`))(`...${genExpr(ctx, s)}`))
  .exhaustive())(_Str_join(", ", map((f) => `${f.name}: ${genExpr(ctx, f.value)}`)(fields))))
  .with({ _tag: "EField" }, ({ target, name }) => match(emptyNsEmit(target, name))
  .with({ _tag: "Some" }, ({ value: js }) => js)
  .with({ _tag: "None" }, () => match(nsRuntimeId(ctx, target, name))
  .with({ _tag: "Some" }, ({ value: rt }) => rt)
  .with({ _tag: "None" }, () => `${genMember(ctx, target)}.${name}`)
  .exhaustive())
  .exhaustive())
  .with({ _tag: "ETuple" }, ({ elements }) => `[${_Str_join(", ", map((el) => genExpr(ctx, el))(elements))}]`)
  .with({ _tag: "EArr" }, ({ elements }) => `[${_Str_join(", ", map((el) => genSeqSlot(ctx, el))(elements))}]`)
  .with({ _tag: "EList" }, ({ elements }) => genList(ctx, elements))
  .with({ _tag: "ESet" }, ({ elements }) => `new Set([${_Str_join(", ", map((el) => genSeqSlot(ctx, el))(elements))}])`)
  .with({ _tag: "EMap" }, ({ entries }) => `new Map([${_Str_join(", ", map((en) => `[${genExpr(ctx, en.key)}, ${genExpr(ctx, en.value)}]`)(entries))}])`)
  .with({ _tag: "EInterp" }, ({ parts }) => ((body) => `\`${body}\``)(_Str_join("", map((p) => match(p)
  .with({ _tag: "IPLit" }, ({ value }) => escapeTemplateLiteral(value))
  .with({ _tag: "IPExpr" }, ({ expr: ex }) => `\${${genExpr(ctx, ex)}}`)
  .exhaustive())(parts))))
  .exhaustive());
const genDo = _curry(2, (ctx, exprs) => `(() => { ${genDoSteps(ctx, exprs)} })()`);
const genDoSteps = _curry(2, (ctx, exprs) => match(exprs)
  .with((_v) => _v.length === 1, ([last]) => `return ${genExpr(ctx, last)};`)
  .with((_v) => _v.length >= 1, ([first, ...rest]) => `${genExpr(ctx, first)}; ${genDoSteps(ctx, rest)}`)
  .with((_v) => _v.length === 0, () => "throw new Error(\"empty do block\");")
  .exhaustive());
const genSeqSlot = _curry(2, (ctx, el) => match(el)
  .with({ _tag: "SEExpr" }, ({ expr: ex }) => genExpr(ctx, ex))
  .with({ _tag: "SESpread" }, ({ expr: ex }) => `...${genExpr(ctx, ex)}`)
  .exhaustive());
const genList = _curry(2, (ctx, elements) => { const yields = _Str_join(" ", map((el) => match(el)
  .with({ _tag: "SEExpr" }, ({ expr: ex }) => `yield (${genExpr(ctx, ex)});`)
  .with({ _tag: "SESpread" }, ({ expr: ex }) => `yield* (${genExpr(ctx, ex)});`)
  .exhaustive())(elements)); return `_list(function* () {${(eq(yields, "") ? "" : ` ${yields} `)}})`; });
const genParam = (p) => match(p)
  .with({ _tag: "LPName" }, ({ name }) => name)
  .with({ _tag: "LPTuple" }, ({ names }) => `[${_Str_join(", ", names)}]`)
  .with({ _tag: "LPRecord" }, ({ fields }) => `{ ${_Str_join(", ", fields)} }`)
  .exhaustive();
const genCallee = _curry(2, (ctx, e) => match(e)
  .with({ _tag: "ELambda" }, () => `(${genExpr(ctx, e)})`)
  .otherwise(() => genExpr(ctx, e)));
const genMember = _curry(2, (ctx, e) => match(e)
  .with({ _tag: "ERecord" }, () => `(${genExpr(ctx, e)})`)
  .with({ _tag: "ELambda" }, () => `(${genExpr(ctx, e)})`)
  .otherwise(() => genExpr(ctx, e)));
const seqElemExpr = (el) => match(el)
  .with({ _tag: "SEExpr" }, ({ expr: e }) => e)
  .with({ _tag: "SESpread" }, ({ expr: e }) => e)
  .exhaustive();
const hasRecur = (e) => match(e)
  .with({ _tag: "ERecur" }, () => true)
  .with({ _tag: "ELoop" }, () => false)
  .with({ _tag: "ELambda" }, () => false)
  .with({ _tag: "ELetBind" }, () => false)
  .with({ _tag: "EInterp" }, ({ parts }) => someOf((p) => match(p)
  .with({ _tag: "IPExpr" }, ({ expr: x }) => hasRecur(x))
  .with({ _tag: "IPLit" }, () => false)
  .exhaustive(), parts))
  .with({ _tag: "ECall" }, ({ fn, args }) => or(hasRecur(fn), someOf(hasRecur, args)))
  .with({ _tag: "ELetIn" }, ({ value, body }) => or(hasRecur(value), hasRecur(body)))
  .with({ _tag: "EPipe" }, ({ left, right }) => or(hasRecur(left), hasRecur(right)))
  .with({ _tag: "EDo" }, ({ exprs }) => someOf(hasRecur, exprs))
  .with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => or(hasRecur(cond), or(hasRecur(thenE), hasRecur(elseE))))
  .with({ _tag: "EMatch" }, ({ scrutinee, arms }) => or(hasRecur(scrutinee), someOf((a) => or(match(a.guard)
  .with({ _tag: "Some" }, ({ value: g }) => hasRecur(g))
  .with({ _tag: "None" }, () => false)
  .exhaustive(), hasRecur(a.body)), arms)))
  .with({ _tag: "ERecord" }, ({ fields, spread }) => or(match(spread)
  .with({ _tag: "Some" }, ({ value: sp }) => hasRecur(sp))
  .with({ _tag: "None" }, () => false)
  .exhaustive(), someOf((f) => hasRecur(f.value), fields)))
  .with({ _tag: "EField" }, ({ target }) => hasRecur(target))
  .with({ _tag: "ETuple" }, ({ elements }) => someOf(hasRecur, elements))
  .with({ _tag: "EArr" }, ({ elements }) => someOf((el) => hasRecur(seqElemExpr(el)), elements))
  .with({ _tag: "EList" }, ({ elements }) => someOf((el) => hasRecur(seqElemExpr(el)), elements))
  .with({ _tag: "ESet" }, ({ elements }) => someOf((el) => hasRecur(seqElemExpr(el)), elements))
  .with({ _tag: "EMap" }, ({ entries }) => someOf((en) => or(hasRecur(en.key), hasRecur(en.value)), entries))
  .otherwise(() => false);
const loopNeedsStep = (e) => match(e)
  .with({ _tag: "ETernary" }, ({ thenE, elseE }) => or(loopNeedsStep(thenE), loopNeedsStep(elseE)))
  .with({ _tag: "ELetIn" }, ({ body }) => loopNeedsStep(body))
  .with({ _tag: "EDo" }, ({ exprs }) => loopNeedsStep(lastDoExpr(exprs)))
  .with({ _tag: "EMatch" }, () => hasRecur(e))
  .otherwise(() => false);
const lastDoExpr = (exprs) => match(exprs)
  .with((_v) => _v.length === 1, ([last]) => last)
  .with((_v) => _v.length >= 1, ([, ...rest]) => lastDoExpr(rest))
  .with((_v) => _v.length === 0, () => Ast.EUnit({ start: 0, end: 0 }))
  .exhaustive();
const wrapStepTails = _curry(2, (e, sp) => match(e)
  .with({ _tag: "ERecur" }, () => e)
  .with({ _tag: "ETernary" }, ({ cond, thenE, elseE, span: tsp }) => Ast.ETernary(cond, wrapStepTails(thenE, sp), wrapStepTails(elseE, sp), tsp))
  .with({ _tag: "ELetIn" }, ({ name, nameSpan, value, body, span: lsp }) => Ast.ELetIn(name, nameSpan, value, wrapStepTails(body, sp), lsp))
  .with({ _tag: "EDo" }, ({ exprs, span: dsp }) => Ast.EDo(wrapDoStepTail(exprs, sp), dsp))
  .with({ _tag: "EMatch" }, ({ scrutinee, arms, span: msp }) => Ast.EMatch(scrutinee, map((a) => ({ pattern: a.pattern, guard: a.guard, body: wrapStepTails(a.body, sp) }))(arms), msp))
  .otherwise(() => Ast.ECall(Ast.ERef("_done", sp), [e], None, sp)));
const wrapDoStepTail = _curry(2, (exprs, sp) => match(exprs)
  .with((_v) => _v.length === 1, ([last]) => [wrapStepTails(last, sp)])
  .with((_v) => _v.length >= 1, ([first, ...rest]) => [first, ...wrapDoStepTail(rest, sp)])
  .with((_v) => _v.length === 0, () => [])
  .exhaustive());
const loopParamNames = (params) => _Str_join(", ", map((p) => p.name)(params));
const genLoopTail = _curry(3, (ctx, e, params) => match(e)
  .with({ _tag: "ERecur" }, ({ args }) => match([params, args])
  .with((_v) => _v[0].length === 1 && _v[1].length === 1, ([[p], [a]]) => `${p.name} = ${genExpr(ctx, a)}; continue;`)
  .otherwise(() => `[${loopParamNames(params)}] = [${_Str_join(", ", map((a) => genExpr(ctx, a))(args))}]; continue;`))
  .with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => (hasRecur(e) ? `if (${genExpr(ctx, cond)}) { ${genLoopTail(ctx, thenE, params)} } else { ${genLoopTail(ctx, elseE, params)} }` : `return ${genExpr(ctx, e)};`))
  .with({ _tag: "ELetIn" }, ({ name, value, body }) => (hasRecur(e) ? `{ const ${name} = ${genExpr(ctx, value)}; ${genLoopTail(ctx, body, params)} }` : `return ${genExpr(ctx, e)};`))
  .with({ _tag: "EDo" }, ({ exprs }) => (hasRecur(e) ? `{ ${genDoLoopTail(ctx, exprs, params)} }` : `return ${genExpr(ctx, e)};`))
  .with({ _tag: "EMatch" }, ({ span: sp }) => (hasRecur(e) ? ((step) => ((rebind) => `const _step = ${step}; if (_step._tag === ${jsStringLit("recur")}) { ${rebind} continue; } return _step.value;`)(match(params)
  .with((_v) => _v.length === 1, ([p]) => `${p.name} = _step.args[0];`)
  .otherwise(() => `[${loopParamNames(params)}] = _step.args;`)))(genExpr(ctx, wrapStepTails(e, sp))) : `return ${genExpr(ctx, e)};`))
  .otherwise(() => `return ${genExpr(ctx, e)};`));
const genDoLoopTail = _curry(3, (ctx, exprs, params) => match(exprs)
  .with((_v) => _v.length === 1, ([last]) => genLoopTail(ctx, last, params))
  .with((_v) => _v.length >= 1, ([first, ...rest]) => `${genExpr(ctx, first)}; ${genDoLoopTail(ctx, rest, params)}`)
  .with((_v) => _v.length === 0, () => "return undefined;")
  .exhaustive());
const genLoopBlock = _curry(3, (ctx, params, body) => { const decls = _Str_join(" ", map((p) => `let ${p.name} = ${genExpr(ctx, p.init)};`)(params)); return `${decls} while (true) { ${genLoopTail(ctx, body, params)} }`; });
const loopParamFree = _curry(3, (params, i, seen) => match(_Array_get(i, params))
  .with({ _tag: "None" }, () => true)
  .with({ _tag: "Some" }, ({ value: p }) => (_Set_has(p.name, seen) ? false : loopParamFree(params, add(i, 1), seen)))
  .exhaustive());
const genLambdaBody = _curry(2, (ctx, e) => match(e)
  .with({ _tag: "ERecord" }, () => `(${genExpr(ctx, e)})`)
  .otherwise(() => genExpr(ctx, e)));
const paramNames = (p) => match(p)
  .with({ _tag: "LPName" }, ({ name }) => [name])
  .with({ _tag: "LPTuple" }, ({ names }) => names)
  .with({ _tag: "LPRecord" }, ({ fields }) => fields)
  .exhaustive();
const addNames = _curry(3, (names, i, acc) => match(_Array_get(i, names))
  .with({ _tag: "None" }, () => acc)
  .with({ _tag: "Some" }, ({ value: n }) => addNames(names, add(i, 1), _Set_add(n, acc)))
  .exhaustive());
const paramNameSet = _curry(3, (params, i, acc) => match(_Array_get(i, params))
  .with({ _tag: "None" }, () => acc)
  .with({ _tag: "Some" }, ({ value: p }) => paramNameSet(params, add(i, 1), addNames(paramNames(p), 0, acc)))
  .exhaustive());
const letBlockLoop = _curry(4, (ctx, e, seen, decls) => match(e)
  .with({ _tag: "ELetIn" }, ({ name, value, body }) => (or(_Set_has(name, seen), match(value)
  .with({ _tag: "ELambda" }, () => false)
  .otherwise(() => _Set_has(name, exprRefs(ctx, value, _Set_fromArray([]))))) ? [decls, e, seen] : letBlockLoop(ctx, body, _Set_add(name, seen), _Array_append(`const ${name} = ${genExpr(ctx, value)};`, decls))))
  .otherwise(() => [decls, e, seen]));
const genLambdaBodyIn = _curry(3, (ctx, e, bound) => (([decls, rest, seen]) => (eq(length(decls), 0) ? match(e)
  .with({ _tag: "ELoop" }, ({ params, body }) => (loopParamFree(params, 0, bound) ? `{ ${genLoopBlock(ctx, params, body)} }` : genLambdaBody(ctx, e)))
  .otherwise(() => genLambdaBody(ctx, e)) : ((block) => match(rest)
  .with({ _tag: "ELoop" }, ({ params, body }) => (loopParamFree(params, 0, seen) ? `{ ${block} ${genLoopBlock(ctx, params, body)} }` : `{ ${block} return ${genExpr(ctx, rest)}; }`))
  .otherwise(() => `{ ${block} return ${genExpr(ctx, rest)}; }`))(_Str_join(" ", decls))))(letBlockLoop(ctx, e, bound, [])));
const isCatchAll = (p) => match(p)
  .with({ _tag: "PAs" }, ({ pat }) => isCatchAll(pat))
  .with({ _tag: "PWild" }, () => true)
  .with({ _tag: "PUnit" }, () => true)
  .with({ _tag: "PBind" }, () => true)
  .with({ _tag: "PRecord" }, ({ fields }) => allOf((f) => isCatchAll(f.pat), fields))
  .with({ _tag: "PTuple" }, ({ elems }) => allOf(isCatchAll, elems))
  .with({ _tag: "PArr" }, ({ elems, rest }) => and(eq(length(elems), 0), _Option_isSome(rest)))
  .with({ _tag: "PList" }, ({ elems, rest }) => and(eq(length(elems), 0), _Option_isSome(rest)))
  .otherwise(() => false);
const isPList = (p) => match(p)
  .with({ _tag: "PList" }, () => true)
  .otherwise(() => false);
const keyedSlot = _curry(2, (key, sub) => (eq(sub, key) ? key : `${key}: ${sub}`));
const pctorEntries = _curry(4, (ctx, ctor, args, i) => match(_Array_get(i, args))
  .with({ _tag: "None" }, () => [])
  .with({ _tag: "Some" }, ({ value: a }) => ((s) => ((restEntries) => (eq(s, "") ? restEntries : _Array_prepend(keyedSlot(keyAt(ctx, ctor, i), s), restEntries)))(pctorEntries(ctx, ctor, args, add(i, 1))))(patSlot(ctx, a)))
  .exhaustive());
const precordEntries = _curry(3, (ctx, fields, i) => match(_Array_get(i, fields))
  .with({ _tag: "None" }, () => [])
  .with({ _tag: "Some" }, ({ value: f }) => ((s) => ((restEntries) => (eq(s, "") ? restEntries : _Array_prepend(keyedSlot(f.label, s), restEntries)))(precordEntries(ctx, fields, add(i, 1))))(patSlot(ctx, f.pat)))
  .exhaustive());
const patSlot = _curry(2, (ctx, p) => match(p)
  .with({ _tag: "PAs" }, ({ pat, name }) => ((inner) => (eq(inner, "") ? name : `${inner}, ${name}`))(patSlot(ctx, pat)))
  .with({ _tag: "PBind" }, ({ name }) => name)
  .with({ _tag: "PWild" }, () => "")
  .with({ _tag: "PUnit" }, () => "")
  .with({ _tag: "PLit" }, () => "")
  .with({ _tag: "PBool" }, () => "")
  .with({ _tag: "PStr" }, () => "")
  .with({ _tag: "PList" }, () => "")
  .with({ _tag: "PCtor" }, ({ ctor, args }) => ((entries) => (eq(length(entries), 0) ? "" : `{ ${_Str_join(", ", entries)} }`))(pctorEntries(ctx, ctor, args, 0)))
  .with({ _tag: "PRecord" }, ({ fields }) => ((entries) => (eq(length(entries), 0) ? "" : `{ ${_Str_join(", ", entries)} }`))(precordEntries(ctx, fields, 0)))
  .with({ _tag: "PTuple" }, ({ elems }) => ((slots) => (someOf((s) => not(eq(s, "")), slots) ? `[${_Str_join(", ", slots)}]` : ""))(map((el) => patSlot(ctx, el))(elems)))
  .with({ _tag: "PArr" }, ({ elems, rest }) => ((slots) => ((slots2) => (someOf((s) => not(eq(s, "")), slots2) ? `[${_Str_join(", ", slots2)}]` : ""))(match(rest)
  .with((_v) => _v._tag === "Some" && _v.value._tag === "PBind", ({ value: { name } }) => _Array_append(`...${name}`, slots))
  .otherwise(() => slots)))(map((el) => patSlot(ctx, el))(elems)))
  .with({ _tag: "POr" }, ({ alts }) => match(_Array_head(alts))
  .with({ _tag: "Some" }, ({ value: first }) => patSlot(ctx, first))
  .with({ _tag: "None" }, () => "")
  .exhaustive())
  .exhaustive());
const pctorConds = _curry(5, (ctx, ctor, args, i, path) => match(_Array_get(i, args))
  .with({ _tag: "None" }, () => [])
  .with({ _tag: "Some" }, ({ value: a }) => _Array_concat(patConds(ctx, a, `${path}.${keyAt(ctx, ctor, i)}`), pctorConds(ctx, ctor, args, add(i, 1), path)))
  .exhaustive());
const precordConds = _curry(4, (ctx, fields, i, path) => match(_Array_get(i, fields))
  .with({ _tag: "None" }, () => [])
  .with({ _tag: "Some" }, ({ value: f }) => _Array_concat(patConds(ctx, f.pat, `${path}.${f.label}`), precordConds(ctx, fields, add(i, 1), path)))
  .exhaustive());
const ptupleConds = _curry(4, (ctx, elems, i, path) => match(_Array_get(i, elems))
  .with({ _tag: "None" }, () => [])
  .with({ _tag: "Some" }, ({ value: el }) => _Array_concat(patConds(ctx, el, `${path}[${show(i)}]`), ptupleConds(ctx, elems, add(i, 1), path)))
  .exhaustive());
const parrConds = _curry(4, (ctx, elems, i, path) => match(_Array_get(i, elems))
  .with({ _tag: "None" }, () => [])
  .with({ _tag: "Some" }, ({ value: el }) => _Array_concat(patConds(ctx, el, `${path}[${show(i)}]`), parrConds(ctx, elems, add(i, 1), path)))
  .exhaustive());
const patConds = _curry(3, (ctx, p, path) => match(p)
  .with({ _tag: "PAs" }, ({ pat }) => patConds(ctx, pat, path))
  .with({ _tag: "PWild" }, () => [])
  .with({ _tag: "PUnit" }, () => [])
  .with({ _tag: "PBind" }, () => [])
  .with({ _tag: "PList" }, () => [])
  .with({ _tag: "PLit" }, () => [`${path} === ${litValue(p)}`])
  .with({ _tag: "PBool" }, () => [`${path} === ${litValue(p)}`])
  .with({ _tag: "PStr" }, () => [`${path} === ${litValue(p)}`])
  .with({ _tag: "PCtor" }, ({ ctor, args }) => _Array_prepend(`${path}._tag === ${jsStringLit(ctor)}`, pctorConds(ctx, ctor, args, 0, path)))
  .with({ _tag: "PRecord" }, ({ fields }) => precordConds(ctx, fields, 0, path))
  .with({ _tag: "PTuple" }, ({ elems }) => ptupleConds(ctx, elems, 0, path))
  .with({ _tag: "PArr" }, ({ elems, rest }) => _Array_prepend(`${path}.length ${(_Option_isSome(rest) ? ">=" : "===")} ${show(length(elems))}`, parrConds(ctx, elems, 0, path)))
  .with({ _tag: "POr" }, ({ alts }) => ((altCond) => [_Str_join(" || ", map((alt) => `(${altCond(alt)})`)(alts))])((alt) => { const conds = patConds(ctx, alt, path); return (eq(length(conds), 0) ? "true" : _Str_join(" && ", map((c) => `(${c})`)(conds))); }))
  .exhaustive());
const catchAllParam = _curry(2, (ctx, p) => match(p)
  .with({ _tag: "PArr" }, ({ rest }) => match(rest)
  .with((_v) => _v._tag === "Some" && _v.value._tag === "PBind", ({ value: { name } }) => `(${name})`)
  .otherwise(() => "()"))
  .with({ _tag: "PList" }, ({ rest }) => match(rest)
  .with((_v) => _v._tag === "Some" && _v.value._tag === "PBind", ({ value: { name } }) => `(${name})`)
  .otherwise(() => "()"))
  .otherwise(() => ((slot) => (eq(slot, "") ? "()" : `(${slot})`))(patSlot(ctx, p))));
const isListMatch = (arms) => someOf((a) => and(isPList(a.pattern), not(isCatchAll(a.pattern))), arms);
const listTail = (from) => concat(concat(concat("_list(function* () { for (let _i = ", show(from)), "; _i < _b.length; _i++) yield _b[_i]; "), "if (!_done) { let _s; while (!(_s = _it.next()).done) yield _s.value; } })");
const listArmGuards = _curry(3, (ctx, elems, i) => match(_Array_get(i, elems))
  .with({ _tag: "None" }, () => [])
  .with({ _tag: "Some" }, ({ value: el }) => _Array_concat(patConds(ctx, el, `_b[${show(i)}]`), listArmGuards(ctx, elems, add(i, 1))))
  .exhaustive());
const listArmBinds = _curry(3, (ctx, elems, i) => match(_Array_get(i, elems))
  .with({ _tag: "None" }, () => [[], []])
  .with({ _tag: "Some" }, ({ value: el }) => (([restParams, restArgs]) => { const slot = patSlot(ctx, el); return (eq(slot, "") ? [restParams, restArgs] : [_Array_prepend(slot, restParams), _Array_prepend(`_b[${show(i)}]`, restArgs)]); })(listArmBinds(ctx, elems, add(i, 1))))
  .exhaustive());
const genListArm = _curry(3, (ctx, p, body) => match(p)
  .with({ _tag: "PList" }, ({ elems, rest }) => ((n) => ((guards) => ((head) => ((cond) => (([params0, args0]) => (([params, args]) => `  if (${cond}) return ((${_Str_join(", ", params)}) => ${genLambdaBody(ctx, body)})(${_Str_join(", ", args)});`)(match(rest)
  .with((_v) => _v._tag === "Some" && _v.value._tag === "PBind", ({ value: { name } }) => [_Array_append(name, params0), _Array_append(listTail(n), args0)])
  .otherwise(() => [params0, args0])))(listArmBinds(ctx, elems, 0)))(_Str_join(" && ", _Array_prepend(head, guards))))((_Option_isSome(rest) ? `_pull(${show(n)})` : `!_pull(${show(add(n, 1))}) && _b.length === ${show(n)}`)))(listArmGuards(ctx, elems, 0)))(length(elems)))
  .otherwise(() => ""));
const listMatchLoop = _curry(3, (ctx, arms, i) => match(_Array_get(i, arms))
  .with({ _tag: "None" }, () => [[], "(() => { throw new Error(\"non-exhaustive lazy-list switch\"); })()"])
  .with({ _tag: "Some" }, ({ value: a }) => (and(isPList(a.pattern), not(isCatchAll(a.pattern))) ? (([restLines, fallback]) => [_Array_prepend(genListArm(ctx, a.pattern, a.body), restLines), fallback])(listMatchLoop(ctx, arms, add(i, 1))) : (isCatchAll(a.pattern) ? ((restName) => ((fallback) => [[], fallback])(match(restName)
  .with({ _tag: "Some" }, ({ value: name }) => `((${name}) => ${genLambdaBody(ctx, a.body)})(${listTail(0)})`)
  .with({ _tag: "None" }, () => genExpr(ctx, a.body))
  .exhaustive()))(match(a.pattern)
  .with((_v) => _v._tag === "PList" && _v.rest._tag === "Some" && _v.rest.value._tag === "PBind", ({ rest: { value: { name } } }) => Some(name))
  .otherwise(() => None)) : listMatchLoop(ctx, arms, add(i, 1)))))
  .exhaustive());
const genListMatch = _curry(3, (ctx, scrutinee, arms) => (([armLines, fallback]) => concat(concat(concat(concat(concat(concat(concat(concat("((_it) => { const _b = []; let _done = false; ", "const _pull = (_n) => { while (_b.length < _n && !_done) { const _s = _it.next(); "), "if (_s.done) _done = true; else _b.push(_s.value); } return _b.length >= _n; };\n"), _Str_join("\n", armLines)), "\n  return "), fallback), ";\n})("), genExpr(ctx, scrutinee)), "[Symbol.iterator]())"))(listMatchLoop(ctx, arms, 0)));
const matchArmsLoop = _curry(3, (ctx, arms, i) => match(_Array_get(i, arms))
  .with({ _tag: "None" }, () => [[], None])
  .with({ _tag: "Some" }, ({ value: a }) => (([restLines, restCatch]) => match(a.guard)
  .with({ _tag: "Some" }, ({ value: g }) => [_Array_prepend(`  ${genGuardArm(ctx, a.pattern, a.body, Some(g))}`, restLines), restCatch])
  .with({ _tag: "None" }, () => (isCatchAll(a.pattern) ? [restLines, Some([a.pattern, a.body])] : [_Array_prepend(`  ${genWithArm(ctx, a.pattern, a.body)}`, restLines), restCatch]))
  .exhaustive())(matchArmsLoop(ctx, arms, add(i, 1))))
  .exhaustive());
const genMatch = _curry(3, (ctx, scrutinee, arms) => (isListMatch(arms) ? genListMatch(ctx, scrutinee, arms) : (([armLines, catchAll]) => { const tail = match(catchAll)
  .with((_v) => _v._tag === "Some", ({ value: [p, body] }) => `  .otherwise(${catchAllParam(ctx, p)} => ${genLambdaBody(ctx, body)})`)
  .with({ _tag: "None" }, () => "  .exhaustive()")
  .exhaustive(); return _Str_join("\n", _Array_concat(_Array_prepend(`match(${genExpr(ctx, scrutinee)})`, armLines), [tail])); })(matchArmsLoop(ctx, arms, 0))));
const litValue = (p) => match(p)
  .with({ _tag: "PStr" }, ({ value: v }) => jsStringLit(v))
  .with({ _tag: "PLit" }, ({ raw }) => raw)
  .with({ _tag: "PBool" }, ({ value: v }) => (v ? "true" : "false"))
  .otherwise(() => "");
const genGuardArm = _curry(4, (ctx, p, body, guardOpt) => { const conds0 = patConds(ctx, p, "_v"); const slot = match(p)
  .with({ _tag: "PAs" }, ({ pat }) => patSlot(ctx, pat))
  .otherwise(() => patSlot(ctx, p)); const conds = match(guardOpt)
  .with({ _tag: "Some" }, ({ value: g }) => match(p)
  .with({ _tag: "PAs" }, ({ name }) => _Array_append((eq(slot, "") ? `((${name}) => ${genExpr(ctx, g)})(_v)` : `((${name}) => ((${slot}) => ${genExpr(ctx, g)})(${name}))(_v)`), conds0))
  .otherwise(() => _Array_append((eq(slot, "") ? `(${genExpr(ctx, g)})` : `((${slot}) => ${genExpr(ctx, g)})(_v)`), conds0)))
  .with({ _tag: "None" }, () => conds0)
  .exhaustive(); const test = (eq(length(conds), 0) ? "true" : _Str_join(" && ", conds)); return match(p)
  .with({ _tag: "PAs" }, ({ name }) => `.with((_v) => ${test}, (${name}) => ${(eq(slot, "") ? genLambdaBody(ctx, body) : `((${slot}) => ${genLambdaBody(ctx, body)})(${name})`)})`)
  .otherwise(() => `.with((_v) => ${test}, ${(eq(slot, "") ? "()" : `(${slot})`)} => ${genLambdaBody(ctx, body)})`); });
const isFlatSub = (p) => match(p)
  .with({ _tag: "PAs" }, () => false)
  .with({ _tag: "PBind" }, () => true)
  .with({ _tag: "PWild" }, () => true)
  .with({ _tag: "PLit" }, () => true)
  .with({ _tag: "PBool" }, () => true)
  .with({ _tag: "PStr" }, () => true)
  .otherwise(() => false);
const recordLits = _curry(2, (fields, i) => match(_Array_get(i, fields))
  .with({ _tag: "None" }, () => [])
  .with({ _tag: "Some" }, ({ value: f }) => ((rest) => match(f.pat)
  .with({ _tag: "PLit" }, () => _Array_prepend(`${f.label}: ${litValue(f.pat)}`, rest))
  .with({ _tag: "PBool" }, () => _Array_prepend(`${f.label}: ${litValue(f.pat)}`, rest))
  .with({ _tag: "PStr" }, () => _Array_prepend(`${f.label}: ${litValue(f.pat)}`, rest))
  .otherwise(() => rest))(recordLits(fields, add(i, 1))))
  .exhaustive());
const ctorArgParts = _curry(4, (ctx, ctor, args, i) => match(_Array_get(i, args))
  .with({ _tag: "None" }, () => [[], []])
  .with({ _tag: "Some" }, ({ value: a }) => (([restBinds, restLits]) => { const key = keyAt(ctx, ctor, i); return match(a)
  .with({ _tag: "PBind" }, ({ name }) => [_Array_prepend(keyedSlot(key, name), restBinds), restLits])
  .with({ _tag: "PLit" }, () => [restBinds, _Array_prepend(`${key}: ${litValue(a)}`, restLits)])
  .with({ _tag: "PBool" }, () => [restBinds, _Array_prepend(`${key}: ${litValue(a)}`, restLits)])
  .with({ _tag: "PStr" }, () => [restBinds, _Array_prepend(`${key}: ${litValue(a)}`, restLits)])
  .otherwise(() => [restBinds, restLits]); })(ctorArgParts(ctx, ctor, args, add(i, 1))))
  .exhaustive());
const genWithArm = _curry(3, (ctx, p, body) => match(p)
  .with({ _tag: "PAs" }, () => genGuardArm(ctx, p, body, None))
  .with({ _tag: "PArr" }, () => genGuardArm(ctx, p, body, None))
  .with({ _tag: "PTuple" }, () => genGuardArm(ctx, p, body, None))
  .with({ _tag: "POr" }, () => genGuardArm(ctx, p, body, None))
  .with({ _tag: "PLit" }, () => `.with(${litValue(p)}, () => ${genLambdaBody(ctx, body)})`)
  .with({ _tag: "PBool" }, () => `.with(${litValue(p)}, () => ${genLambdaBody(ctx, body)})`)
  .with({ _tag: "PStr" }, () => `.with(${litValue(p)}, () => ${genLambdaBody(ctx, body)})`)
  .with({ _tag: "PRecord" }, ({ fields }) => (allOf((f) => isFlatSub(f.pat), fields) ? ((lits) => ((slot) => `.with({ ${_Str_join(", ", lits)} }, ${(eq(slot, "") ? "()" : `(${slot})`)} => ${genLambdaBody(ctx, body)})`)(patSlot(ctx, p)))(recordLits(fields, 0)) : genGuardArm(ctx, p, body, None)))
  .with({ _tag: "PCtor" }, ({ ctor, args }) => (allOf(isFlatSub, args) ? (([binds, litFields]) => { const patObj = _Str_join(", ", _Array_prepend(`_tag: ${jsStringLit(ctor)}`, litFields)); const param = (eq(length(binds), 0) ? "()" : `({ ${_Str_join(", ", binds)} })`); return `.with({ ${patObj} }, ${param} => ${genLambdaBody(ctx, body)})`; })(ctorArgParts(ctx, ctor, args, 0)) : genGuardArm(ctx, p, body, None)))
  .otherwise(() => genGuardArm(ctx, p, body, None)));
const genCtor = (c) => { const tag = jsStringLit(c.name); return (eq(length(c.fields), 0) ? `const ${c.name} = { _tag: ${tag} };` : ((params) => ((impl) => (gte(length(c.fields), 2) ? `const ${c.name} = _curry(${show(length(c.fields))}, ${impl});` : `const ${c.name} = ${impl};`))(`(${params}) => ({ _tag: ${tag}, ${params} })`))(_Str_join(", ", keysOf(c.fields)))); };
const genType = (s) => match(s)
  .with({ _tag: "SType" }, ({ ctors }) => _Str_join("\n", map(genCtor)(ctors)))
  .otherwise(() => "");
const typeExprArity = (te) => match(te)
  .with({ _tag: "TyArrow" }, ({ to }) => add(1, typeExprArity(to)))
  .otherwise(() => 0);
const externArgs = (n) => { let i = 0; let acc = ""; while (true) { if (gte(i, n)) { return acc; } else { [i, acc] = [add(i, 1), (eq(acc, "") ? `$a${show(i)}` : `${acc}, $a${show(i)}`)]; continue; } } };
const externApplied = (n) => { let i = 0; let acc = ""; while (true) { if (gte(i, n)) { return acc; } else { [i, acc] = [add(i, 1), `${acc}($a${show(i)})`]; continue; } } };
const genExtern = (s) => match(s)
  .with({ _tag: "SExtern" }, ({ name, typeExpr, module: modName, imported, curried }) => (_Str_startsWith("mochi:global:", modName) ? ((target) => ((base) => `const ${name} = ${(eq(imported, "") ? base : `${base}[${jsStringLit(imported)}]`)};`)(`globalThis[${jsStringLit(target)}]`))(_Str_slice(13, _Str_length(modName), modName)) : (_Str_startsWith("mochi:get:", modName) ? ((target) => `const ${name} = ($receiver) => $receiver[${jsStringLit(target)}];`)(_Str_slice(10, _Str_length(modName), modName)) : (_Str_startsWith("mochi:set:", modName) ? ((target) => `const ${name} = _curry(2, ($receiver, $value) => ($receiver[${jsStringLit(target)}] = $value));`)(_Str_slice(10, _Str_length(modName), modName)) : (_Str_startsWith("mochi:new:", modName) ? ((target) => ((arity) => ((args) => (not(eq(imported, "")) ? ((raw) => ((importLine) => ((ctor) => (eq(arity, 0) ? `${importLine}
const ${name} = () => ${ctor};` : `${importLine}
const ${name} = _curry(${show(arity)}, (${args}) => ${ctor});`))(`new ${raw}(${args})`))(`import { ${imported} as ${raw} } from ${jsStringLit(target)};`))(_Str_concat("$", name)) : (eq(arity, 0) ? `const ${name} = () => new globalThis[${jsStringLit(target)}]();` : `const ${name} = _curry(${show(arity)}, (${args}) => new globalThis[${jsStringLit(target)}](${args}));`)))(externArgs(arity)))(typeExprArity(typeExpr)))(_Str_slice(10, _Str_length(modName), modName)) : (_Str_startsWith("mochi:send:", modName) ? ((target) => ((arity) => ((args) => ((fn) => (lt(arity, 2) ? `const ${name} = ${fn};` : `const ${name} = _curry(${show(arity)}, ${fn});`))((eq(args, "") ? `($receiver) => $receiver[${jsStringLit(target)}]()` : `($receiver, ${args}) => $receiver[${jsStringLit(target)}](${args})`)))(externArgs(sub(arity, 1))))(typeExprArity(typeExpr)))(_Str_slice(11, _Str_length(modName), modName)) : (eq(imported, "default") ? `import ${name} from ${jsStringLit(modName)};` : ((arity) => (lte(arity, 1) ? ((spec) => `import { ${spec} } from ${jsStringLit(modName)};`)((eq(imported, name) ? name : `${imported} as ${name}`)) : ((raw) => ((flat) => `import { ${imported} as ${raw} } from ${jsStringLit(modName)};
const ${name} = _curry(${show(arity)}, ${flat});`)((curried ? `(${externArgs(arity)}) => ${raw}${externApplied(arity)}` : raw)))(_Str_concat("$", name))))(typeExprArity(typeExpr)))))))))
  .otherwise(() => "");
const stripAlExt = (s) => (_Str_endsWith(".mochi", s) ? _Str_slice(0, sub(_Str_length(s), 6), s) : s);
const rewriteImportPath = (from) => { const bare = stripAlExt(from); return (or(_Str_startsWith("./", bare), _Str_startsWith("../", bare)) ? `${bare}.js` : bare); };
const genImport = (s) => match(s)
  .with({ _tag: "SImport" }, ({ names, from }) => ((nameList) => ((path) => `import { ${nameList} } from ${jsStringLit(path)};`)(rewriteImportPath(from)))(_Str_join(", ", map((n) => n.name)(names))))
  .with({ _tag: "SImportNs" }, ({ alias, from }) => ((path) => `import * as ${alias.name} from ${jsStringLit(path)};`)(rewriteImportPath(from)))
  .otherwise(() => "");
const exportLine = (l) => `export ${l}`;
const genStmt = _curry(2, (ctx, s) => match(s)
  .with({ _tag: "SError" }, ({ span: sp }) => `throw new Error("codegen invariant: error node reached codegen at ${show(sp.start)}");`)
  .with({ _tag: "SImport" }, () => genImport(s))
  .with({ _tag: "SImportNs" }, () => genImport(s))
  .with({ _tag: "SType" }, ({ exported }) => ((decls) => (eq(decls, "") ? "" : (exported ? _Str_join("\n", map(exportLine)(_Str_split("\n", decls))) : decls)))(genType(s)))
  .with({ _tag: "SExtern" }, ({ name, exported }) => (exported ? `${genExtern(s)}
export { ${name} };` : genExtern(s)))
  .with({ _tag: "SLet" }, ({ name, value, exported }) => ((doExport) => `${(doExport ? "export " : "")}const ${name} = ${genExpr(ctx, value)};`)(and(exported, not(_Str_startsWith("$", name)))))
  .with({ _tag: "SExpr" }, ({ value }) => `${genExpr(ctx, value)};`)
  .exhaustive());
const usesMatchLibArm = (a) => or(match(a.guard)
  .with({ _tag: "Some" }, ({ value: g }) => usesMatchLib(g))
  .with({ _tag: "None" }, () => false)
  .exhaustive(), usesMatchLib(a.body));
const usesMatchLib = (e) => match(e)
  .with({ _tag: "ENum" }, () => false)
  .with({ _tag: "EUnit" }, () => false)
  .with({ _tag: "EBool" }, () => false)
  .with({ _tag: "EStr" }, () => false)
  .with({ _tag: "ERef" }, () => false)
  .with({ _tag: "ECall" }, ({ fn, args }) => or(usesMatchLib(fn), someOf(usesMatchLib, args)))
  .with({ _tag: "ELambda" }, ({ body }) => usesMatchLib(body))
  .with({ _tag: "ELetIn" }, ({ value, body }) => or(usesMatchLib(value), usesMatchLib(body)))
  .with({ _tag: "ELetBind" }, ({ value, body }) => or(usesMatchLib(value), usesMatchLib(body)))
  .with({ _tag: "EPipe" }, ({ left, right }) => or(usesMatchLib(left), usesMatchLib(right)))
  .with({ _tag: "EDo" }, ({ exprs }) => someOf(usesMatchLib, exprs))
  .with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => or(usesMatchLib(cond), or(usesMatchLib(thenE), usesMatchLib(elseE))))
  .with({ _tag: "EMatch" }, ({ scrutinee, arms }) => or(not(isListMatch(arms)), or(usesMatchLib(scrutinee), someOf(usesMatchLibArm, arms))))
  .with({ _tag: "ELoop" }, ({ params, body }) => or(someOf((p) => usesMatchLib(p.init), params), usesMatchLib(body)))
  .with({ _tag: "ERecur" }, ({ args }) => someOf(usesMatchLib, args))
  .with({ _tag: "ERecord" }, ({ fields, spread }) => or(match(spread)
  .with({ _tag: "Some" }, ({ value: s }) => usesMatchLib(s))
  .with({ _tag: "None" }, () => false)
  .exhaustive(), someOf((f) => usesMatchLib(f.value), fields)))
  .with({ _tag: "EField" }, ({ target }) => usesMatchLib(target))
  .with({ _tag: "ETuple" }, ({ elements }) => someOf(usesMatchLib, elements))
  .with({ _tag: "EArr" }, ({ elements }) => someOf((el) => usesMatchLib(match(el)
  .with({ _tag: "SEExpr" }, ({ expr: e }) => e)
  .with({ _tag: "SESpread" }, ({ expr: e }) => e)
  .exhaustive()), elements))
  .with({ _tag: "EList" }, ({ elements }) => someOf((el) => usesMatchLib(match(el)
  .with({ _tag: "SEExpr" }, ({ expr: e }) => e)
  .with({ _tag: "SESpread" }, ({ expr: e }) => e)
  .exhaustive()), elements))
  .with({ _tag: "ESet" }, ({ elements }) => someOf((el) => usesMatchLib(match(el)
  .with({ _tag: "SEExpr" }, ({ expr: e }) => e)
  .with({ _tag: "SESpread" }, ({ expr: e }) => e)
  .exhaustive()), elements))
  .with({ _tag: "EMap" }, ({ entries }) => someOf((en) => or(usesMatchLib(en.key), usesMatchLib(en.value)), entries))
  .with({ _tag: "EInterp" }, ({ parts }) => someOf((p) => match(p)
  .with({ _tag: "IPLit" }, () => false)
  .with({ _tag: "IPExpr" }, ({ expr: ex }) => usesMatchLib(ex))
  .exhaustive(), parts))
  .exhaustive();
const loopInitRefsFrom = _curry(4, (ctx, params, i, acc) => match(_Array_get(i, params))
  .with({ _tag: "None" }, () => acc)
  .with({ _tag: "Some" }, ({ value: p }) => loopInitRefsFrom(ctx, params, add(i, 1), exprRefs(ctx, p.init, acc)))
  .exhaustive());
const exprRefsListFrom = _curry(4, (ctx, xs, i, acc) => match(_Array_get(i, xs))
  .with({ _tag: "None" }, () => acc)
  .with({ _tag: "Some" }, ({ value: x }) => exprRefsListFrom(ctx, xs, add(i, 1), exprRefs(ctx, x, acc)))
  .exhaustive());
const exprRefsInterpPartsFrom = _curry(4, (ctx, parts, i, acc) => match(_Array_get(i, parts))
  .with({ _tag: "None" }, () => acc)
  .with({ _tag: "Some" }, ({ value: p }) => exprRefsInterpPartsFrom(ctx, parts, add(i, 1), match(p)
  .with({ _tag: "IPLit" }, () => acc)
  .with({ _tag: "IPExpr" }, ({ expr: ex }) => exprRefs(ctx, ex, acc))
  .exhaustive()))
  .exhaustive());
const exprRefsArmsFrom = _curry(4, (ctx, arms, i, acc) => match(_Array_get(i, arms))
  .with({ _tag: "None" }, () => acc)
  .with({ _tag: "Some" }, ({ value: a }) => ((acc1) => exprRefsArmsFrom(ctx, arms, add(i, 1), exprRefs(ctx, a.body, acc1)))(match(a.guard)
  .with({ _tag: "Some" }, ({ value: g }) => exprRefs(ctx, g, acc))
  .with({ _tag: "None" }, () => acc)
  .exhaustive()))
  .exhaustive());
const exprRefsFieldsFrom = _curry(4, (ctx, fields, i, acc) => match(_Array_get(i, fields))
  .with({ _tag: "None" }, () => acc)
  .with({ _tag: "Some" }, ({ value: f }) => exprRefsFieldsFrom(ctx, fields, add(i, 1), exprRefs(ctx, f.value, acc)))
  .exhaustive());
const exprRefsEntriesFrom = _curry(4, (ctx, entries, i, acc) => match(_Array_get(i, entries))
  .with({ _tag: "None" }, () => acc)
  .with({ _tag: "Some" }, ({ value: en }) => exprRefsEntriesFrom(ctx, entries, add(i, 1), exprRefs(ctx, en.value, exprRefs(ctx, en.key, acc))))
  .exhaustive());
const exprRefs = _curry(3, (ctx, e, acc) => match(e)
  .with({ _tag: "ENum" }, () => acc)
  .with({ _tag: "EUnit" }, () => acc)
  .with({ _tag: "EBool" }, () => acc)
  .with({ _tag: "EStr" }, () => acc)
  .with({ _tag: "ERef" }, ({ name }) => _Set_add(name, acc))
  .with({ _tag: "ECall" }, ({ fn, args }) => exprRefsListFrom(ctx, args, 0, exprRefs(ctx, fn, acc)))
  .with({ _tag: "ELambda" }, ({ params, body }) => (([cparams, cbody]) => { const acc2 = (gte(length(cparams), 2) ? _Set_add("_curry", acc) : acc); return exprRefs(ctx, cbody, acc2); })(collapseLambda(params, body)))
  .with({ _tag: "ELetIn" }, ({ value, body }) => exprRefs(ctx, body, exprRefs(ctx, value, acc)))
  .with({ _tag: "ELetBind" }, ({ monad, value, body }) => exprRefs(ctx, body, exprRefs(ctx, value, _Set_add(bindRuntime(monad), acc))))
  .with({ _tag: "EPipe" }, ({ left, right }) => exprRefs(ctx, right, exprRefs(ctx, left, acc)))
  .with({ _tag: "EDo" }, ({ exprs }) => exprRefsListFrom(ctx, exprs, 0, acc))
  .with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => exprRefs(ctx, elseE, exprRefs(ctx, thenE, exprRefs(ctx, cond, acc))))
  .with({ _tag: "EMatch" }, ({ scrutinee, arms }) => ((acc1) => ((acc2) => exprRefsArmsFrom(ctx, arms, 0, acc2))((someOf((a) => match(a.pattern)
  .with((_v) => _v._tag === "PList" && _v.rest._tag === "Some" && _v.rest.value._tag === "PBind", () => true)
  .otherwise(() => false), arms) ? _Set_add("_list", acc1) : acc1)))(exprRefs(ctx, scrutinee, acc)))
  .with({ _tag: "ERecord" }, ({ fields, spread }) => exprRefsFieldsFrom(ctx, fields, 0, match(spread)
  .with({ _tag: "Some" }, ({ value: s }) => exprRefs(ctx, s, acc))
  .with({ _tag: "None" }, () => acc)
  .exhaustive()))
  .with({ _tag: "EField" }, ({ target, name }) => match(emptyNsEmit(target, name))
  .with({ _tag: "Some" }, () => match(target)
  .with({ _tag: "ERef", name: "List" }, () => _Set_add("_list", acc))
  .otherwise(() => acc))
  .with({ _tag: "None" }, () => match(nsRuntimeId(ctx, target, name))
  .with({ _tag: "Some" }, ({ value: rt }) => _Set_add(rt, acc))
  .with({ _tag: "None" }, () => exprRefs(ctx, target, acc))
  .exhaustive())
  .exhaustive())
  .with({ _tag: "ELoop" }, ({ params, body }) => ((acc1) => ((acc2) => exprRefs(ctx, body, acc2))(loopInitRefsFrom(ctx, params, 0, acc1)))((loopNeedsStep(body) ? _Set_add("_recur", _Set_add("_done", acc)) : acc)))
  .with({ _tag: "ERecur" }, ({ args }) => exprRefsListFrom(ctx, args, 0, acc))
  .with({ _tag: "ETuple" }, ({ elements }) => exprRefsListFrom(ctx, elements, 0, acc))
  .with({ _tag: "EArr" }, ({ elements }) => exprRefsListFrom(ctx, map((el) => match(el)
  .with({ _tag: "SEExpr" }, ({ expr: e }) => e)
  .with({ _tag: "SESpread" }, ({ expr: e }) => e)
  .exhaustive())(elements), 0, acc))
  .with({ _tag: "EList" }, ({ elements }) => exprRefsListFrom(ctx, map((el) => match(el)
  .with({ _tag: "SEExpr" }, ({ expr: e }) => e)
  .with({ _tag: "SESpread" }, ({ expr: e }) => e)
  .exhaustive())(elements), 0, _Set_add("_list", acc)))
  .with({ _tag: "ESet" }, ({ elements }) => exprRefsListFrom(ctx, map((el) => match(el)
  .with({ _tag: "SEExpr" }, ({ expr: e }) => e)
  .with({ _tag: "SESpread" }, ({ expr: e }) => e)
  .exhaustive())(elements), 0, acc))
  .with({ _tag: "EMap" }, ({ entries }) => exprRefsEntriesFrom(ctx, entries, 0, acc))
  .with({ _tag: "EInterp" }, ({ parts }) => exprRefsInterpPartsFrom(ctx, parts, 0, acc))
  .exhaustive());
const boundNamesFrom = _curry(3, (stmts, i, acc) => match(_Array_get(i, stmts))
  .with({ _tag: "None" }, () => acc)
  .with({ _tag: "Some" }, ({ value: s }) => boundNamesFrom(stmts, add(i, 1), match(s)
  .with({ _tag: "SLet" }, ({ name }) => _Set_add(name, acc))
  .with({ _tag: "SExtern" }, ({ name }) => _Set_add(name, acc))
  .with({ _tag: "SType" }, ({ ctors }) => _Set_union(acc, _Set_fromArray(map((c) => c.name)(ctors))))
  .with({ _tag: "SImport" }, ({ names }) => _Set_union(acc, _Set_fromArray(map((n) => n.name)(names))))
  .with({ _tag: "SImportNs" }, ({ alias }) => _Set_add(alias.name, acc))
  .with({ _tag: "SError" }, () => acc)
  .with({ _tag: "SExpr" }, () => acc)
  .exhaustive()))
  .exhaustive());
const boundNames = (stmts) => boundNamesFrom(stmts, 0, _Set_fromArray([]));
const refsForStmt = _curry(2, (ctx, s) => match(s)
  .with({ _tag: "SLet" }, ({ value }) => exprRefs(ctx, value, _Set_fromArray([])))
  .with({ _tag: "SExpr" }, ({ value }) => exprRefs(ctx, value, _Set_fromArray([])))
  .with({ _tag: "SType" }, ({ ctors }) => (someOf((c) => gte(length(c.fields), 2), ctors) ? _Set_add("_curry", _Set_fromArray([])) : _Set_fromArray([])))
  .with({ _tag: "SExtern" }, ({ typeExpr }) => (gte(typeExprArity(typeExpr), 2) ? _Set_add("_curry", _Set_fromArray([])) : _Set_fromArray([])))
  .otherwise(() => _Set_fromArray([])));
const collectRefsFrom = _curry(4, (ctx, stmts, i, acc) => match(_Array_get(i, stmts))
  .with({ _tag: "None" }, () => acc)
  .with({ _tag: "Some" }, ({ value: s }) => collectRefsFrom(ctx, stmts, add(i, 1), _Set_union(acc, refsForStmt(ctx, s))))
  .exhaustive());
const addDepsFrom = _curry(4, (deps, j, refs, queue) => match(_Array_get(j, deps))
  .with({ _tag: "None" }, () => [refs, queue])
  .with({ _tag: "Some" }, ({ value: d }) => (_Set_has(d, refs) ? addDepsFrom(deps, add(j, 1), refs, queue) : addDepsFrom(deps, add(j, 1), _Set_add(d, refs), _Array_append(d, queue))))
  .exhaustive());
const closeRefsFrom = _curry(4, (queue, i, refs, runtimeDeps) => match(_Array_get(i, queue))
  .with({ _tag: "None" }, () => refs)
  .with({ _tag: "Some" }, ({ value: r }) => ((deps) => (([refs2, queue2]) => closeRefsFrom(queue2, add(i, 1), refs2, runtimeDeps))(addDepsFrom(deps, 0, refs, queue)))(_Option_unwrapOr([], _Map_get(r, runtimeDeps))))
  .exhaustive());
const preludePreamble = _curry(4, (ctx, stmts, jsDefs, runtimeDeps) => { const refs0 = collectRefsFrom(ctx, stmts, 0, _Set_fromArray([])); const refs = closeRefsFrom(_Set_toArray(refs0), 0, refs0, runtimeDeps); const bound = boundNames(stmts); const names = _Map_keys(jsDefs); const defs = map((n) => _Map_getOr("", n, jsDefs))(filter((n) => and(_Set_has(n, refs), not(_Set_has(n, bound))))(names)); return (eq(length(defs), 0) ? "" : `${_Str_join("\n", defs)}

`); });
const genStmtAllFrom = _curry(3, (ctx, stmts, i) => match(_Array_get(i, stmts))
  .with({ _tag: "None" }, () => [])
  .with({ _tag: "Some" }, ({ value: s }) => _Array_prepend(genStmt(ctx, s), genStmtAllFrom(ctx, stmts, add(i, 1))))
  .exhaustive());
export const codegen = _curry(6, (stmts, imported, useRuntime, ns, jsDefs, runtimeDeps) => { const keys0 = ctorKeysFromStmts(stmts, imported); const keys = seedBuiltinCtorKeys(stmts, keys0); const ctx = { keys: keys, ns: ns }; const needsMatch = someOf((s) => match(s)
  .with({ _tag: "SLet" }, ({ value }) => usesMatchLib(value))
  .with({ _tag: "SExpr" }, ({ value }) => usesMatchLib(value))
  .otherwise(() => false), stmts); const header = (needsMatch ? "import { match } from \"@onrails/pattern\";\n\n" : ""); const preamble = (useRuntime ? preludePreamble(ctx, stmts, jsDefs, runtimeDeps) : ""); const body = _Str_join("\n", genStmtAllFrom(ctx, stmts, 0)); return `${header}${preamble}${body}
`; });
