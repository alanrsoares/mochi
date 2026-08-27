const _curry = (n, f) => function c(...a) {
  if (a.length < n)
    return (...b) => c(...a, ...b);
  if (a.length === n)
    return f(...a);
  return a.slice(n).reduce((g, x) => g(x), f(...a.slice(0, n)));
};
const Ok = (value) => ({ _tag: "Ok", value });
const _Result_flatMap = _curry(2, (f, r) => r._tag === "Ok" ? f(r.value) : r);

import { lex } from "./lexer.js";
import { parse } from "./parser.js";
import { check } from "./check.js";
import { inferProgram } from "./infer.js";
import { codegen } from "./codegen.js";
import { builtins } from "./prelude.gen.mjs";
import { namespaces } from "./prelude.gen.mjs";
import { namespaceRuntime } from "./prelude.gen.mjs";
import { preludeJsDefs } from "./prelude.gen.mjs";
import { runtimeDeps } from "./prelude.gen.mjs";
const typecheck = (prog) => _Result_flatMap(($env) => Ok(prog))(inferProgram(prog, builtins, namespaces, false));
const pipeline = ($x) => _Result_flatMap(typecheck)((($x) => _Result_flatMap(check)((($x) => _Result_flatMap(parse)(lex($x)))($x)))($x));
export const compile = (src) => _Result_flatMap((prog) => Ok(codegen(prog, new Map([]), true, namespaceRuntime, preludeJsDefs, runtimeDeps)))(pipeline(src));
