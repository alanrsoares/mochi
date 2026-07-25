import { expect, test } from "bun:test";
import { styledCvaExtension } from "@mochi/plugin-styled-cva";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { codegenTs } from "../src/codegen-ts";
import { compile, toTypedProgram } from "../src/compile";
import { moduleDiagnostics } from "../src/diagnostics";
import { emitDts } from "../src/dts";
import { DEFAULT_PLUGINS, type LanguagePlugin, resolvePlugins } from "../src/extensions";
import { format } from "../src/format";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";
import { preludeNamespaces } from "../src/prelude";

const builtin: LanguagePlugin = { name: "builtin" };
const vendorA: LanguagePlugin = { name: "vendor-a" };
const vendorB: LanguagePlugin = { name: "vendor-b" };

// Slice 26 (ADR 0011 decision 3): `resolvePlugins` is the single source of
// truth every entry point uses to turn a caller's `plugins` option into the
// plugins a pass actually runs. Exercised against an explicit `builtins` list
// so the three cases are provable before `jsxPlugin` (#27) makes
// `DEFAULT_PLUGINS` non-empty.
test("plugins omitted (undefined) resolves to the builtin list", () => {
  expect(resolvePlugins(undefined, [builtin])).toEqual([builtin]);
});

test("plugins: [] is the hard opt-out — no plugins at all, not even builtins", () => {
  expect(resolvePlugins([], [builtin])).toEqual([]);
});

test("an explicit non-empty list gets builtins prepended, not replaced", () => {
  expect(resolvePlugins([vendorA, vendorB], [builtin])).toEqual([builtin, vendorA, vendorB]);
});

test("undefined and [] resolve differently, given the same builtins", () => {
  const omitted = resolvePlugins(undefined, [builtin]);
  const empty = resolvePlugins([], [builtin]);
  expect(omitted).toEqual([builtin]);
  expect(empty).toEqual([]);
  expect(omitted).not.toEqual(empty);
});

test("default builtins param is DEFAULT_PLUGINS", () => {
  expect(resolvePlugins(undefined)).toEqual(DEFAULT_PLUGINS);
  expect(resolvePlugins([])).toEqual([]);
});

// Slices 27–28 (ADR 0011 decision 2): ALL of JSX — parse, infer, format,
// binding-type — lives in the builtin `jsxPlugin`, not in `parser.ts` /
// `infer.ts` / `format.ts` / `dts.ts`. Each guard below pairs the default (no
// configuration → JSX works) with the empty-list opt-out. Since #28 the opt-out
// removes the *syntax*, so every downstream surface reports the same plain parse
// Diagnostic — which is the strongest form of "the knowledge really moved".
const jsxNamed = DEFAULT_PLUGINS.filter((p) => p.name === "jsx");
const COMPONENT = 'let Card = props => <div className="card">{props.title}</div>';
/** Same, but `concat` pins `title` to `string` — so a bad attr is a type error, not just an open row. */
const STRICT_COMPONENT = 'let Card = props => <div>{concat(props.title, "!")}</div>';

test("jsxPlugin is a registered builtin carrying the parse/infer/format/dts hooks", () => {
  expect(jsxNamed.length).toBe(1);
  const jsx = jsxNamed[0]!;
  expect(jsx.parse).toBeDefined();
  expect(jsx.inferCall).toBeDefined();
  expect(jsx.format).toBeDefined();
  expect(jsx.bindingType).toBeDefined();
});

// Slice 28: the parse hook. `<…>` is no longer core syntax — with no plugins the
// leading `<` is simply an unexpected token, and with builtins it desugars to a
// provenance-tagged `h(...)` exactly as core's `parseJsx` used to.
test("JSX syntax comes from the builtin plugin's parse hook", () => {
  const toks = unwrapOk(lex("let el = <div />"));
  const stmt = unwrapOk(parse(toks)).stmts[0]!;
  expect(stmt.kind === "let" && stmt.value.kind === "call" && stmt.value.origin).toBe("jsx");

  const optedOut = parse(toks, { plugins: [] });
  expect(isErr(optedOut)).toBe(true);
  expect(unwrapErr(optedOut).kind).toBe("parse");
  expect(unwrapErr(optedOut).message).toBe("unexpected token lt");
});

test("opting out of all plugins leaves the core grammar untouched", () => {
  const core = "let x = 1 + 2 * 3\nlet y = switch x { | 0 => 1 | _ => 2 }\n";
  expect(unwrapOk(format(core, { plugins: [] }))).toBe(unwrapOk(format(core)));
});

test("JSX prop checking comes from the builtin plugin, not core infer", () => {
  const opts = { open: true, namespaces: preludeNamespaces };
  const bad = `${STRICT_COMPONENT}\nlet el = <Card title={1} />`;
  const good = `${STRICT_COMPONENT}\nlet el = <Card title="ok" />`;
  // Default (builtins): the component's prop row rejects `title: number`.
  expect(isErr(toTypedProgram(bad, opts))).toBe(true);
  expect(isErr(toTypedProgram(good, opts))).toBe(false);
  // Hard opt-out: since #28 the source doesn't even parse, so nothing reaches infer.
  expect(unwrapErr(toTypedProgram(good, { ...opts, plugins: [] }))[0]!.kind).toBe("parse");
});

test("the formatter's `<tag>` re-fold comes from the builtin plugin", () => {
  const src = 'let el = <div className="card">{"hi"}</div>\n';
  expect(unwrapOk(format(src))).toBe(src);
  // The re-fold keys off parse provenance, not the callee name: a hand-written
  // `h(...)` keeps printing as the plain call it is, with the plugin registered.
  const handWritten = 'let el = h("div", { className: "card" }, ["hi"])\n';
  expect(unwrapOk(format(handWritten))).toBe(handWritten);
  // Opt out and there is nothing left to re-fold — the sugar no longer parses.
  expect(unwrapErr(format(src, { plugins: [] })).kind).toBe("parse");
});

test("component binding types come from the builtin plugin, in BOTH backends", () => {
  // `bindingTsType` is shared: the `.d.ts` writer and the TS backend must agree.
  expect(unwrapOk(emitDts(COMPONENT))).toContain("export declare const Card: (props:");
  expect(unwrapOk(codegenTs(COMPONENT))).toContain("const Card: (props:");
  // Opt out and there is no component binding to type — the source is not a
  // program any more, which is the whole point of the non-UI mode.
  expect(unwrapErr(emitDts(COMPONENT, { plugins: [] }))[0]!.kind).toBe("parse");
});

// Slice 29 (ADR 0011 §3): headline end-to-end proof that `plugins: []` is a
// real, systemic non-UI opt-out — not a spot-check of one hook, but the
// public `compile`/`moduleDiagnostics` surfaces a project actually calls.
const JSX_SRC = 'let el = <div className="card">{"hi"}</div>\n';

test("compile(): default (plugins omitted) compiles JSX to the same h(...) JS as before it became a plugin", () => {
  const out = unwrapOk(compile(JSX_SRC));
  expect(out).toContain('h("div", { className: "card" }, ["hi"])');
});

test("compile(): empty plugin list turns JSX into a parse Diagnostic — not a crash, not silence", () => {
  const r = compile(JSX_SRC, { plugins: [] });
  expect(isErr(r)).toBe(true);
  const [diag] = unwrapErr(r);
  expect(diag!.kind).toBe("parse");
  expect(diag!.message).toBe("unexpected token lt");
});

test("moduleDiagnostics(): default (plugins omitted) parses JSX with no diagnostics", async () => {
  const noDeps = async (): Promise<string> => {
    throw new Error("single-file test — no imports to read");
  };
  const diags = await moduleDiagnostics("/virtual/main.mochi", JSX_SRC, noDeps);
  expect(diags).toEqual([]);
});

test("moduleDiagnostics(): empty plugin list surfaces the same parse diagnostic for JSX, not a crash", async () => {
  const noDeps = async (): Promise<string> => {
    throw new Error("single-file test — no imports to read");
  };
  const diags = await moduleDiagnostics("/virtual/main.mochi", JSX_SRC, noDeps, { plugins: [] });
  expect(diags.length).toBe(1);
  expect(diags[0]!.message).toBe("parse: unexpected token lt");
});

test("compile(): an explicit vendor-only plugin list still gets JSX (builtins prepended, not replaced)", () => {
  const src = `
export extern tw : a = "@styled-cva/react" "default"
export let Btn = tw.button("x", { variants: { $tone: { a: "1", b: "2" } } })
export let el = <Btn $tone="a" />
`;
  // `styledCvaExtension` alone doesn't know JSX syntax — if this compiles, the
  // `<Btn …/>` came from `jsxPlugin`, prepended by `resolvePlugins` (ADR 0011).
  const r = compile(src, { plugins: [styledCvaExtension] });
  expect(isErr(r)).toBe(false);
  expect(unwrapOk(r)).toContain("h(");
});
