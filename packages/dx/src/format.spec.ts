import { expect, test } from "bun:test";
import { formatSrc as fmt } from "@mochi/test-support/format";

test("normalizes whitespace in a let binding", () => {
  expect(fmt("let   n=add(1,2)")).toBe("let n = 1 + 2\n");
});

test("canonicalizes the open-world directive as a module header", () => {
  const expected = '"use open"\n\nlet value = browserGlobal\n';
  expect(fmt('"use open"\nlet value = browserGlobal')).toBe(expected);
});

test("a single-param lambda drops its parentheses", () => {
  expect(fmt("let f=(x)=>x")).toBe("let f = x => x\n");
});

test("an annotated single-param lambda keeps its parentheses and the annotation", () => {
  expect(fmt("let f=(x:number)=>x")).toBe("let f = (x: number) => x\n");
});

test("a multi-param lambda keeps its parentheses", () => {
  expect(fmt("let g=(a,b)=>add(a,b)")).toBe("let g = (a, b) => a + b\n");
});

test("labeled params and calls round-trip (ADR 0098 §2)", () => {
  expect(fmt('let f=(~tone:string="rose",~size?:number)=>tone')).toBe(
    'let f = (~tone: string = "rose", ~size?: number) => tone\n',
  );
  expect(fmt('let r=f(~tone="amber")')).toBe('let r = f(~tone="amber")\n');
  expect(fmt("let r=f(~tone)")).toBe("let r = f(~tone)\n");
});

test("lambda paren count is load-bearing (ADR 0083)", () => {
  expect(fmt("let f=(x)=>x")).toBe("let f = x => x\n");
  expect(fmt("let g=(a,b)=>a")).toBe("let g = (a, b) => a\n");
  expect(fmt("let h=((a,b))=>a")).toBe("let h = ((a, b)) => a\n");
});

test("prints a binding type annotation (ADR 0044)", () => {
  expect(fmt("let   n:number=5")).toBe("let n : number = 5\n");
});

test("prints an annotation on a let-in binding (ADR 0044)", () => {
  expect(fmt("let f=x=>let n:number=x in n")).toBe("let f = x => let n : number = x in n\n");
});

test("round-trips the unit literal and the unit pattern (ADR 0054)", () => {
  expect(fmt("let   x=()")).toBe("let x = ()\n");
  expect(fmt("let f=u=>switch u{|()=>1}")).toBe("let f = u => switch u { | () => 1 }\n");
});

test("normalizes an import statement", () => {
  expect(fmt('import {a,b}from"./mod"')).toBe('import { a, b } from "./mod"\n');
});

test("wraps a long named import one name per line", () => {
  const names = [
    "ENum",
    "EBool",
    "EStr",
    "ERef",
    "ECall",
    "ELambda",
    "ELetIn",
    "ELetBind",
    "EPipe",
    "ETernary",
    "EMatch",
    "ERecord",
  ];
  const src = `import {${names.join(",")}}from"./ast.mochi"`;
  expect(fmt(src)).toBe(`import {\n  ${names.join(",\n  ")}\n} from "./ast.mochi"\n`);
});

test("formats a namespace import", () => {
  expect(fmt('import*as Ast from"./ast.mochi"')).toBe('import * as Ast from "./ast.mochi"\n');
});

test("formats a qualified ctor pattern", () => {
  expect(fmt("let f=o=>switch o{|Opt.Some(v)=>v|Opt.None=>0}")).toBe(
    "let f = o => switch o { | Opt.Some(v) => v | Opt.None => 0 }\n",
  );
});

test("keeps the export prefix on a binding", () => {
  expect(fmt("export let x=1")).toBe("export let x = 1\n");
});

test("keeps the export prefix on a variant type", () => {
  expect(fmt("export type T=|A|B")).toBe("export type T =\n  | A\n  | B\n");
});

test("a switch that fits stays on one line", () => {
  expect(fmt("let m=r=>switch r {|Ok(v)=>v|Err(e)=>e}")).toBe(
    "let m = r => switch r { | Ok(v) => v | Err(e) => e }\n",
  );
});

test("a switch that overflows 80 columns breaks one arm per line", () => {
  expect(
    fmt(
      'let describe=n=>switch n {|None=>"nothing to report here at all"|Some(x)=>"got a useful value here"}',
    ),
  ).toBe(
    'let describe = n => switch n {\n  | None => "nothing to report here at all"\n  | Some(x) => "got a useful value here"\n}\n',
  );
});

test("a parametric type prints angle-bracket params and one ctor per line", () => {
  expect(fmt("type Result a e = | Ok(a) | Err(e)")).toBe(
    "type Result<a, e> =\n  | Ok(a)\n  | Err(e)\n",
  );
});

test("formats a string-literal union type (ADR 0081)", () => {
  expect(fmt(`type Tone="rose"|"amber"`)).toBe('type Tone = "rose" | "amber"\n');
  expect(fmt(`let t:"rose"|"amber"="rose"`)).toBe('let t : "rose" | "amber" = "rose"\n');
});

test("record destructuring is re-folded from its desugared form", () => {
  expect(fmt("let {x,y}=p")).toBe("let { x, y } = p\n");
});

test("record field puns collapse to shorthand (ADR 0068)", () => {
  expect(fmt("let x=1\nlet r={x:x}")).toBe("let x = 1\nlet r = { x }\n");
  expect(fmt("let x=1\nlet r={x}")).toBe("let x = 1\nlet r = { x }\n");
  expect(fmt("let x=1\nlet y=2\nlet r={x:x,y:1}")).toBe(
    "let x = 1\nlet y = 2\nlet r = { x, y: 1 }\n",
  );
  expect(fmt("let x=1\nlet r={...base,x}")).toBe("let x = 1\nlet r = { ...base, x }\n");
});

test("a record field that does not pun stays explicit", () => {
  expect(fmt("let r={x:1}")).toBe("let r = { x: 1 }\n");
  expect(fmt("let x=1\nlet y=2\nlet r={x:y}")).toBe("let x = 1\nlet y = 2\nlet r = { x: y }\n");
});

test("formatting is idempotent", () => {
  const once = fmt("let   m=r=>switch r {|Ok(v)=>Ok(v)|Err(e)=>Err(e)}\nlet {a,b}=rec");
  expect(fmt(once)).toBe(once);
});

test("preserves JSX surface syntax instead of printing its desugared call", () => {
  const src = 'let el=<div className="card">{"hello"}</div>';
  const expected = 'let el = <div className="card">{"hello"}</div>\n';
  expect(fmt(src)).toBe(expected);
  expect(fmt(expected)).toBe(expected);
});

test("does not rewrite an explicit h call as JSX", () => {
  expect(fmt('let el=h("div",{className:"card"},["hello"])')).toBe(
    'let el = h("div", { className: "card" }, ["hello"])\n',
  );
});

test("a pipe chain that overflows breaks one stage per line", () => {
  expect(
    fmt("let r = source |> transform(config) |> validate(rules) |> persist(database) |> report"),
  ).toBe(
    "let r = source\n  |> transform(config)\n  |> validate(rules)\n  |> persist(database)\n  |> report\n",
  );
});

test("a pipe that fits stays inline", () => {
  expect(fmt("let r = a |> b |> c")).toBe("let r = a |> b |> c\n");
});

test("breaks a two-segment pipe when a segment is itself multi-line", () => {
  const src =
    "let build = path => readFile(path) |> Result.flatMap(src => compile(src) |> Result.mapErr(e => formatError(path, src, e)) |> Result.flatMap(js => writeFile(outPath(path), js)))";
  const out = [
    "let build = path =>",
    "  readFile(path)",
    "    |> Result.flatMap(src =>",
    "      compile(src)",
    "        |> Result.mapErr(e => formatError(path, src, e))",
    "        |> Result.flatMap(js => writeFile(outPath(path), js)))",
    "",
  ].join("\n");
  expect(fmt(src)).toBe(out);
  expect(fmt(out)).toBe(out);
});

test("trailing-lambda after a broken table hugs ) onto the callback", () => {
  const src = [
    'testEach("stronglyConnected", [',
    '  { label: "empty", adj: [], want: [] },',
    '  { label: "one node", adj: [[]], want: [[0]] }',
    "], row => row.adj |> stronglyConnected |> assertEq(row.want))",
  ].join("\n");
  expect(fmt(src)).toBe(`${src}\n`);
  expect(fmt(`${src}\n`)).toBe(`${src}\n`);
});

test("curried apply does not glue )( onto an expression-body lambda", () => {
  const src =
    "let _ws = useEffect(() => connectWs(store.actions.setLeaders, store.actions.setConnected))(hookDeps0())";
  const out = [
    "let _ws = useEffect(() =>",
    "  connectWs(store.actions.setLeaders, store.actions.setConnected)",
    ")(hookDeps0())",
    "",
  ].join("\n");
  expect(fmt(src)).toBe(out);
  expect(fmt(out)).toBe(out);
});

test("trailing-lambda do hugs ) onto the closing brace", () => {
  const src =
    "let _draw = useEffect(() => let _ = watchEat(particles, eatWatch, board) in let _ = paintBoard(canvasRef, board, particles) in startParticleLoop(canvasRef, particles, boardRef))";
  const out = [
    "let _draw = useEffect(() => {",
    "  watchEat(particles, eatWatch, board);",
    "  paintBoard(canvasRef, board, particles);",
    "  startParticleLoop(canvasRef, particles, boardRef)",
    "})",
    "",
  ].join("\n");
  expect(fmt(src)).toBe(out);
  expect(fmt(out)).toBe(out);
});

test("a do-block under a let-in chain reaches its fixpoint in one pass", () => {
  // `let _ = … in` is sequencing, so it prints as `do { … }` — not as a
  // `let … in`, and so it does NOT get the chain rule's flat alignment. Pass one
  // used to emit it flat and pass two indented it, which meant `fmt:check` could
  // fail on a file `fmt` had just written.
  const src = "let f = () => let n = c(r()) in let _ = s(n) in t(n)";
  const out = [
    "let f = () =>",
    "  let n = c(r()) in",
    "    do {",
    "      s(n);",
    "      t(n)",
    "    }",
    "",
  ].join("\n");
  expect(fmt(src)).toBe(out);
  expect(fmt(out)).toBe(out);
});

test("curried apply hugs a multiline trailing-lambda block callee", () => {
  const src =
    "let _draw = useEffect(() => let _ = watchEat(particles, eatWatch, board) in let _ = paintBoard(canvasRef, board, particles) in startParticleLoop(canvasRef, particles, boardRef))(hookDeps2(props.snake, props.food))";
  const out = [
    "let _draw = useEffect(() => {",
    "  watchEat(particles, eatWatch, board);",
    "  paintBoard(canvasRef, board, particles);",
    "  startParticleLoop(canvasRef, particles, boardRef)",
    "})(hookDeps2(props.snake, props.food))",
    "",
  ].join("\n");
  expect(fmt(src)).toBe(out);
  expect(fmt(out)).toBe(out);
});

test("trailing-lambda switch hugs ) onto the closing brace", () => {
  const src =
    'let describe = id => planLine(id) |> Task.recover(e => switch e {|NotFound(missing)=>Task.of("user missing has no plan so we fall back to the demo one")|Offline(why)=>Task.fail(Offline(why))})';
  const out = [
    "let describe = id =>",
    "  planLine(id)",
    "    |> Task.recover(e => switch e {",
    "      | NotFound(missing) => Task.of(",
    '          "user missing has no plan so we fall back to the demo one"',
    "        )",
    "      | Offline(why) => Task.fail(Offline(why))",
    "    })",
    "",
  ].join("\n");
  expect(fmt(src)).toBe(out);
  expect(fmt(out)).toBe(out);
});

test("trailing-lambda loop hugs ) onto the closing brace", () => {
  const src =
    "let go = xs => each(xs, x => loop (acc = 0) { switch x { | None => acc | Some(n) => recur(acc + n) } })";
  const out = [
    "let go = xs =>",
    "  each(xs, x =>",
    "    loop (acc = 0) { switch x { | None => acc | Some(n) => recur(acc + n) } })",
    "",
  ].join("\n");
  expect(fmt(src)).toBe(out);
  expect(fmt(out)).toBe(out);
});

test("broken pipe chain is idempotent", () => {
  const once = fmt(
    "let r = source |> transform(config) |> validate(rules) |> persist(database) |> report",
  );
  expect(fmt(once)).toBe(once);
});

test("keeps parens around a nested pipe operand (associativity)", () => {
  expect(fmt("let r = a |> (b |> c)")).toBe("let r = a |> (b |> c)\n");
});

test("keeps parens around a lambda pipe operand (else it fails to reparse)", () => {
  const out = fmt("let r = a |> (x => x) |> g");
  expect(out).toBe("let r = a |> (x => x) |> g\n");
  expect(fmt(out)).toBe(out);
});

test("collapses a run of blank lines between statements to a single blank", () => {
  expect(fmt("let a = 1\n\n\n\nlet b = 2")).toBe("let a = 1\n\nlet b = 2\n");
});

test("preserves a single blank line and keeps adjacent statements adjacent", () => {
  expect(fmt("let a = 1\nlet b = 2\n\nlet c = 3")).toBe("let a = 1\nlet b = 2\n\nlet c = 3\n");
});

test("blank-line normalization is idempotent", () => {
  const once = fmt("let a = 1\n\n\nlet b = 2\nlet c = 3");
  expect(fmt(once)).toBe(once);
});

test("negative and float literals survive the formatter verbatim", () => {
  expect(fmt("let pi=3.0\nlet n= -42")).toBe("let pi = 3.0\nlet n = -42\n");
});

test("preserves leading comments, doc comments, and the blank between blocks", () => {
  const src = "// header one\n// header two\n\n/// doc for f\nlet f = x => x\n";
  expect(fmt(src)).toBe(src);
});

test("keeps an intra-expression comment on its own line above the body", () => {
  const src = "let g = y =>\n  // choose\n  switch y { | A => 1 | B => 2 }\n";
  expect(fmt(src)).toBe(src);
});

test("comment preservation is idempotent", () => {
  const once = fmt(
    "// top\nlet a = 1\n\nlet b = y =>\n  // note\n  switch y { | A => 1 | B => 2 }",
  );
  expect(fmt(once)).toBe(once);
});

test("keeps a trailing comment inline after the code it follows", () => {
  const src = "let x = 1 // the answer\nlet y = 2\n";
  expect(fmt(src)).toBe(src);
});

test("a trailing comment does not force a short construct to break", () => {
  const src = "let r = { a: 1, b: 2 } // rec\n";
  expect(fmt(src)).toBe(src);
});

test("a `//` inside a string is not mistaken for a trailing comment", () => {
  const src = 'let u = "http://x.com" // real\n';
  expect(fmt(src)).toBe(src);
});

test("a comment trailing a bare marker degrades to a leading comment", () => {
  // `: // note` has no node on its line to trail, so it attaches as a leading
  // comment of the else branch rather than being dropped.
  const once = fmt("let f = c ? a :\n  // note\n  b\n");
  expect(once).toContain("// note");
  expect(fmt(once)).toBe(once); // idempotent
});

test("trailing comments round-trip and stay idempotent", () => {
  const src = "let x = foo(1) // call\nlet t = c ? a : b // tern\n";
  expect(fmt(src)).toBe(src);
});

test("a comment between constructors stays above the ctor it documents", () => {
  const src = "type T =\n  | A\n  // doc for B\n  | B\n  | C\n";
  expect(fmt(src)).toBe(src); // in place, not migrated to the next statement
});

test("a comment between constructors survives a following statement", () => {
  const src = "type T =\n  | A\n  // note\n  | B\n\nlet x = 1\n";
  const once = fmt(src);
  expect(once).toContain("  // note\n  | B");
  expect(fmt(once)).toBe(once); // idempotent
});

test("a trailing comment on a constructor prints inline after it", () => {
  const src = "type T =\n  | A // first\n  | B\n";
  expect(fmt(src)).toBe(src);
});

test("a trailing comment on a `let … in` value keeps `in` before the comment", () => {
  // Regression: the `in` keyword must not land on the commented-out line, or
  // the output no longer parses. Terminal body indents under `in`.
  const src = "let f = x =>\n  let y = g(x) in // note\n    h(y)\n";
  const once = fmt(src);
  expect(once).toBe(src);
  expect(fmt(once)).toBe(once); // idempotent — and re-parses
});

test("let-in chains stay flat; the terminal body indents under `in`", () => {
  // Forces a break so the chain isn't one line; the last `in` payload must
  // also overflow so it drops under the bind instead of hugging `in`.
  const src =
    "let f = x => let alpha = computeAlphaValue(x) in let beta = computeBetaValue(alpha) in combineAlphaAndBetaResultsTogether(alpha, beta)";
  expect(fmt(src)).toBe(
    "let f = x =>\n  let alpha = computeAlphaValue(x) in\n  let beta = computeBetaValue(alpha) in\n    combineAlphaAndBetaResultsTogether(alpha, beta)\n",
  );
});

test("a destructuring bind does not staircase the chain it sits in", () => {
  // A destructuring `let (a, b) = …` reaches the formatter as the IIFE the
  // parser desugared it to, so the chain rule has to recognise it by shape
  // rather than by `kind` — otherwise every destructure adds an indent step.
  const src =
    "let f = x => let (alphaOne, alphaTwo) = computeAlphaPair(x) in let (betaOne, betaTwo) = computeBetaPair(alphaOne) in combineEveryResultTogether(alphaTwo, betaOne, betaTwo)";
  expect(fmt(src)).toBe(
    "let f = x =>\n  let (alphaOne, alphaTwo) = computeAlphaPair(x) in\n  let (betaOne, betaTwo) = computeBetaPair(alphaOne) in\n    combineEveryResultTogether(alphaTwo, betaOne, betaTwo)\n",
  );
});

test("a let-in ternary branch indents its terminal body under the bind", () => {
  const src =
    "let f = veryLongConditionNameHere ? let veryLongBindingName = computeSomethingExpensive(x) in processTheResult(veryLongBindingName) : fallbackValueHere";
  expect(fmt(src)).toBe(
    "let f = veryLongConditionNameHere\n  ? let veryLongBindingName = computeSomethingExpensive(x) in\n    processTheResult(veryLongBindingName)\n  : fallbackValueHere\n",
  );
});

test("cascading ternaries flatten instead of staircasing", () => {
  const src =
    "let f = firstVeryLongConditionCheck(x) ? resultAlpha : secondVeryLongConditionCheck(x) ? resultBeta : thirdVeryLongConditionCheck(x) ? resultGamma : resultDelta";
  expect(fmt(src)).toBe(
    "let f = firstVeryLongConditionCheck(x)\n  ? resultAlpha\n  : secondVeryLongConditionCheck(x)\n  ? resultBeta\n  : thirdVeryLongConditionCheck(x)\n  ? resultGamma\n  : resultDelta\n",
  );
});

test("short ++ chains stay inline", () => {
  expect(fmt('let a = "hi" ++ " " ++ "there"')).toBe('let a = "hi" ++ " " ++ "there"\n');
});

test("fast pipe binds tighter than ++ so fmt drops redundant pipe parens (ADR 0073)", () => {
  expect(fmt('let s = "hi" ++ ctx->gen(1)')).toBe('let s = "hi" ++ ctx->gen(1)\n');
  expect(fmt('let s = "hi" ++ (ctx->gen(1))')).toBe('let s = "hi" ++ ctx->gen(1)\n');
  expect(fmt('let s = ("hi" ++ ctx)->gen(1)')).toBe('let s = ("hi" ++ ctx)->gen(1)\n');
  expect(fmt("let r = 1 + 2 |> f")).toBe("let r = 1 + 2 |> f\n");
});

test("does not flatten a fast pipe into a following |> chain (ADR 0069)", () => {
  expect(fmt("let r = val->fn(param2, param3) |> fn2(param1)")).toBe(
    "let r = val->fn(param2, param3) |> fn2(param1)\n",
  );
  expect(fmt("let r = ctx->inferExpr(e, st) |> Result.flatMap(f)")).toBe(
    "let r = ctx->inferExpr(e, st) |> Result.flatMap(f)\n",
  );
  const src =
    "let r = ctx->inferExpr(aVeryLongExpressionNameHere, st) |> Result.flatMap(((t, st1)) => continueWith(t, st1))";
  const out = [
    "let r = ctx->inferExpr(aVeryLongExpressionNameHere, st)",
    "  |> Result.flatMap(((t, st1)) => continueWith(t, st1))",
    "",
  ].join("\n");
  expect(fmt(src)).toBe(out);
  expect(fmt(out)).toBe(out);
});

test("long ++ chains break one fragment per line", () => {
  const src =
    'let a = "((_it) => { const _b = []; let _done = false; " ++ "const _pull = (_n) => { while (_b.length < _n && !_done) { const _s = _it.next(); " ++ "if (_s.done) _done = true; else _b.push(_s.value); } return _b.length >= _n; };"';
  expect(fmt(src)).toBe(
    'let a = "((_it) => { const _b = []; let _done = false; "\n  ++ "const _pull = (_n) => { while (_b.length < _n && !_done) { const _s = _it.next(); "\n  ++ "if (_s.done) _done = true; else _b.push(_s.value); } return _b.length >= _n; };"\n',
  );
});

test("composition operator >> refolds correctly when formatted", () => {
  expect(fmt("let f = a >> b")).toBe("let f = a >> b\n");
});

test("operator sections refold and stay idempotent", () => {
  expect(fmt("let a = (+ 1)\nlet b = (2 *)")).toBe("let a = (+ 1)\nlet b = (2 *)\n");
  expect(fmt("let a = (+ 1)")).toBe("let a = (+ 1)\n");
});

test("composition chain breaks and indents stages under head when overflowing", () => {
  const src =
    "let pipeline = lex\n  >> Result.flatMap(parse)\n  >> Result.flatMap(check)\n  >> Result.flatMap(typecheck)\n";
  expect(fmt(src)).toBe(src);
});

// ADR 0056 — loop/recur layout: inline when it fits, switch-style brace body
// when it breaks; both are fixed points.
test("short loops stay inline", () => {
  const src = "let count = n => loop (i = 0) { i >= n ? i : recur(i + 1) }\n";
  expect(fmt(src)).toBe(src);
});

test("long loop bodies break inside the braces", () => {
  const src =
    "let sum = xs => loop (accumulated = 0, index = 0) { switch Array.get(index, xs) { | None => accumulated | Some(x) => recur(accumulated + x, index + 1) } }\n";
  const out = fmt(src);
  expect(out).toContain("loop (accumulated = 0, index = 0) {\n");
  expect(fmt(out)).toBe(out);
});

test("a short record type alias stays on one line", () => {
  expect(fmt("type P={x:number,y:number}")).toBe("type P = { x: number, y: number }\n");
});

test("a wide record type alias breaks one field per line", () => {
  // A record alias is laid out with the same `braced` group as a record
  // literal — a flat string could not break, leaving 400-char declarations.
  const src =
    "type GenOpts={annotateLet:Option<string>,annotateCtor:Option<string>,annotateParams:Option<string>,annotateEmpty:Option<string>,flattenPipe:bool,moduleExt:string}";
  const out = fmt(src);
  expect(out.split("\n").every((l) => l.length <= 80)).toBe(true);
  expect(out).toBe(
    [
      "type GenOpts = {",
      "  annotateLet: Option<string>,",
      "  annotateCtor: Option<string>,",
      "  annotateParams: Option<string>,",
      "  annotateEmpty: Option<string>,",
      "  flattenPipe: bool,",
      "  moduleExt: string",
      "}",
      "",
    ].join("\n"),
  );
});

test("an empty record type alias keeps the flat form", () => {
  expect(fmt("type Empty={}")).toBe("type Empty = {}\n");
});
