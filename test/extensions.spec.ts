import { expect, test } from "bun:test";
import { codegenTs } from "@mochi/compiler/codegen-ts";
import { compile, toTypedProgram } from "@mochi/compiler/compile";
import { emitDts } from "@mochi/compiler/dts";
import {
  DEFAULT_PLUGINS,
  type LanguagePlugin,
  pluginClashes,
  resolvePlugins,
} from "@mochi/compiler/extensions";
import { lex } from "@mochi/compiler/lexer";
import { parse } from "@mochi/compiler/parser";
import { preludeNamespaces } from "@mochi/compiler/prelude";
import { moduleDiagnostics } from "@mochi/dx/diagnostics";
import { format } from "@mochi/dx/format";
import { styledCvaExtension } from "@mochi/plugin-styled-cva";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";

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

// ADR 0049: a caller plugin named like a builtin replaces it in place —
// same slot in the run order — instead of running after a builtin that
// would have claimed its syntax first.
test("a caller plugin shadows the same-named builtin in place", () => {
  const myBuiltin: LanguagePlugin = { name: "builtin" };
  expect(resolvePlugins([myBuiltin, vendorA], [builtin])).toEqual([myBuiltin, vendorA]);
  expect(resolvePlugins([myBuiltin, vendorA], [builtin])[0]).toBe(myBuiltin);
});

test("a hook-less stub disables one builtin, keeping the rest", () => {
  const other: LanguagePlugin = { name: "other-builtin" };
  const stub: LanguagePlugin = { name: "builtin" };
  expect(resolvePlugins([stub, vendorA], [builtin, other])).toEqual([stub, other, vendorA]);
});

test("shadowing DEFAULT_PLUGINS' jsx drops the builtin jsx hooks", () => {
  const noJsx: LanguagePlugin = { name: "jsx" };
  const resolved = resolvePlugins([noJsx, vendorA]);
  expect(resolved.filter((p) => p.name === "jsx")).toEqual([noJsx]);
  expect(resolved).toContain(vendorA);
});

test("a hook-less jsx stub removes JSX syntax end-to-end (parse fails)", () => {
  const src = 'let el = <div>{"hi"}</div>';
  const parsed = parse(unwrapOk(lex(src)), { plugins: [{ name: "jsx" }, vendorA] });
  expect(isErr(parsed)).toBe(true);
  expect(unwrapErr(parsed)[0]!.kind).toBe("parse");
  // …while the same source with only vendor plugins still parses (builtin jsx kept).
  expect(isErr(parse(unwrapOk(lex(src)), { plugins: [vendorA] }))).toBe(false);
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
  expect(unwrapErr(optedOut)[0]!.kind).toBe("parse");
  expect(unwrapErr(optedOut)[0]!.message).toBe("unexpected token lt");
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
  // Since C9 slice d, `format` runs on `parseRecovering`: the unparsable `<div…`
  // becomes an error-node span and is passed through verbatim, so the (byte-
  // identical) source still formats rather than erroring.
  expect(unwrapOk(format(src, { plugins: [] }))).toBe(src);
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

// Claim declarations + clash detection: hooks now register with declarative
// ownership (`parse.tokens`, `inferCall.refs` / `.memberTargets`), and
// `pluginClashes` reports overlaps in a **resolved** list. ADR 0049 name
// shadowing resolves in `resolvePlugins` first, so shadowing a builtin is
// legal replacement — never a clash.
const nullHook = () => null;

test("pluginClashes: duplicate plugin name produces a diagnostic naming the clash", () => {
  const a: LanguagePlugin = { name: "dup" };
  const b: LanguagePlugin = { name: "dup" };
  const diags = pluginClashes([a, b]);
  expect(diags.length).toBe(1);
  expect(diags[0]!.kind).toBe("check");
  expect(diags[0]!.message).toBe("plugin clash: 'dup' and 'dup' both claim plugin name 'dup'");
});

test("pluginClashes: duplicate parse token claim names both plugins", () => {
  const a: LanguagePlugin = { name: "alpha", parse: { tokens: ["lt"], hook: nullHook } };
  const b: LanguagePlugin = { name: "beta", parse: { tokens: ["lt", "at"], hook: nullHook } };
  const diags = pluginClashes([a, b]);
  expect(diags.length).toBe(1);
  expect(diags[0]!.kind).toBe("check");
  expect(diags[0]!.message).toBe("plugin clash: 'alpha' and 'beta' both claim parse token 'lt'");
});

test("pluginClashes: duplicate inferCall ref claim names both plugins", () => {
  const a: LanguagePlugin = { name: "alpha", inferCall: { refs: ["useState"], hook: nullHook } };
  const b: LanguagePlugin = {
    name: "beta",
    inferCall: { refs: ["useState", "useOther"], hook: nullHook },
  };
  const diags = pluginClashes([a, b]);
  expect(diags.length).toBe(1);
  expect(diags[0]!.message).toBe(
    "plugin clash: 'alpha' and 'beta' both claim inferCall ref 'useState'",
  );
});

test("pluginClashes: duplicate inferCall memberTarget claim names both plugins", () => {
  const a: LanguagePlugin = { name: "alpha", inferCall: { memberTargets: ["tw"], hook: nullHook } };
  const b: LanguagePlugin = { name: "beta", inferCall: { memberTargets: ["tw"], hook: nullHook } };
  const diags = pluginClashes([a, b]);
  expect(diags.length).toBe(1);
  expect(diags[0]!.message).toBe(
    "plugin clash: 'alpha' and 'beta' both claim inferCall member target 'tw'",
  );
});

test("pluginClashes: shadowing a builtin is replacement, not a clash (post-resolvePlugins)", () => {
  // A caller "jsx" claiming the same token as the builtin it shadows: after
  // resolution only one "jsx" (with one `lt` claim) remains — zero clashes.
  const myJsx: LanguagePlugin = { name: "jsx", parse: { tokens: ["lt"], hook: nullHook } };
  const resolved = resolvePlugins([myJsx, vendorA]);
  expect(resolved.filter((p) => p.name === "jsx")).toEqual([myJsx]);
  expect(pluginClashes(resolved)).toEqual([]);
});

test("pluginClashes: disjoint claims produce no diagnostics", () => {
  // `at` / `dot` rather than `lt`: `resolvePlugins` prepends the builtin
  // jsxPlugin, whose own claim on `lt` must stay unchallenged here.
  const a: LanguagePlugin = {
    name: "alpha",
    parse: { tokens: ["at"], hook: nullHook },
    inferCall: { refs: ["useState"], memberTargets: ["tw"], hook: nullHook },
  };
  const b: LanguagePlugin = {
    name: "beta",
    parse: { tokens: ["dot"], hook: nullHook },
    inferCall: { refs: ["defineContainer"], memberTargets: ["sx"], hook: nullHook },
  };
  expect(pluginClashes([a, b])).toEqual([]);
  expect(pluginClashes(resolvePlugins([a, b]))).toEqual([]);
});

test("pluginClashes: the shipped default + vendor plugin set is clash-free", () => {
  const resolved = resolvePlugins([styledCvaExtension]);
  expect(pluginClashes(resolved)).toEqual([]);
});

// ADR 0050: the choke point. `pluginClashes` used to be a pure function
// nothing called — these two prove a clashing plugin list is rejected as an
// ordinary Diagnostic through the two public surfaces every pipeline funnels
// through: `parse` (CLI compile, Vite, dx format/hover/complete) and
// `moduleDiagnostics` (the editor's diagnostics surface).
test("parse(): a clashing plugin list fails with a diagnostic whose message contains 'clash'", () => {
  const a: LanguagePlugin = { name: "alpha", inferCall: { refs: ["useThing"], hook: nullHook } };
  const b: LanguagePlugin = { name: "beta", inferCall: { refs: ["useThing"], hook: nullHook } };
  const parsed = parse(unwrapOk(lex("let x = 1")), { plugins: [a, b] });
  expect(isErr(parsed)).toBe(true);
  const diags = unwrapErr(parsed);
  expect(diags[0]!.message).toContain("clash");
});

test("moduleDiagnostics(): a clashing plugin list surfaces the clash diagnostic for editor display", async () => {
  const a: LanguagePlugin = { name: "alpha", parse: { tokens: ["at"], hook: nullHook } };
  const b: LanguagePlugin = { name: "beta", parse: { tokens: ["at"], hook: nullHook } };
  const noDeps = async (): Promise<string> => {
    throw new Error("single-file test — no imports to read");
  };
  const diags = await moduleDiagnostics("/virtual/main.mochi", "let x = 1", noDeps, {
    plugins: [a, b],
  });
  expect(diags.length).toBeGreaterThan(0);
  expect(diags[0]!.message).toContain("clash");
});

// Claim-table dispatch (the follow-up slice to the claim declarations above):
// a hook is now physically unreachable outside its declared claims — the seam
// consults only the claimant matching the callee/token, plus every claim-less
// hook (jsx), in original registration order.

test("inferCall dispatch: a refs-claimed hook is consulted for its callee only", () => {
  const seen: string[] = [];
  const spy: LanguagePlugin = {
    name: "spy-refs",
    inferCall: {
      refs: ["foo"],
      hook: (e) => {
        seen.push(e.fn.kind === "ref" ? e.fn.name : "?");
        return null;
      },
    },
  };
  const r = toTypedProgram("let a = foo(1)\nlet b = bar(1)", { open: true, plugins: [spy] });
  expect(isErr(r)).toBe(false);
  expect(seen).toEqual(["foo"]);
});

test("inferCall dispatch: a memberTargets-claimed hook is consulted for its target only", () => {
  const seen: string[] = [];
  const spy: LanguagePlugin = {
    name: "spy-members",
    inferCall: {
      memberTargets: ["tw"],
      hook: (e) => {
        seen.push(e.fn.kind === "field" && e.fn.target.kind === "ref" ? e.fn.target.name : "?");
        return null;
      },
    },
  };
  const r = toTypedProgram('let a = tw.div("x")\nlet b = other.div("x")', {
    open: true,
    plugins: [spy],
  });
  expect(isErr(r)).toBe(false);
  expect(seen).toEqual(["tw"]);
});

test("parse dispatch: a token-claimed hook fires at its token and only there; jsx keeps `lt`", () => {
  let consulted = 0;
  const starPlugin: LanguagePlugin = {
    name: "star-atom",
    parse: {
      tokens: ["star"],
      hook: (api) => {
        consulted += 1;
        const tk = api.next();
        return { kind: "num", value: 42, raw: "42", span: tk.span };
      },
    },
  };
  // `*` cannot lead an atom in core — with the claim it parses via the plugin.
  const starred = unwrapOk(parse(unwrapOk(lex("let x = *")), { plugins: [starPlugin] }));
  const star = starred.stmts[0]!;
  expect(star.kind === "let" && star.value.kind === "num" && star.value.value).toBe(42);
  expect(consulted).toBe(1);
  // A source full of other atoms never consults the claimed hook…
  consulted = 0;
  const plain = 'let a = 1\nlet b = <div />\nlet c = { d: "e" }';
  const parsed = unwrapOk(parse(unwrapOk(lex(plain)), { plugins: [starPlugin] }));
  expect(consulted).toBe(0);
  // …and jsx (claiming `lt`) still parsed alongside it.
  const jsx = parsed.stmts[1]!;
  expect(jsx.kind === "let" && jsx.value.kind === "call" && jsx.value.origin).toBe("jsx");
});
