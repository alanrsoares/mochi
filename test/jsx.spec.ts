import { describe, expect, it } from "bun:test";
import { codegenTs, compile, emitDts } from "@mochi/compiler";
import { parseProgram } from "@mochi/compiler/syntax";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";

type ParsedLet = { _tag: string; name?: string; value?: unknown };

/** The single `let` a one-statement program parses to, in the bootstrap AST. */
const parseLet = (code: string): ParsedLet => {
  const prog = unwrapOk(parseProgram(code));
  expect(prog.diagnostics).toEqual([]);
  expect(prog.stmts.length).toBe(1);
  return prog.stmts[0] as ParsedLet;
};

describe("JSX syntax desugaring (ADR 0007)", () => {
  it("parses basic HTML tag into h(...) call", () => {
    const stmt = parseLet(`let el = <div className="card">{"hello"}</div>`);
    expect(stmt).toMatchObject({
      _tag: "SLet",
      name: "el",
      value: {
        _tag: "ECall",
        fn: { _tag: "ERef", name: "h" },
        // Sugar provenance (ADR 0011 §5) — set once by the parser, not sniffed later.
        origin: { _tag: "Some", value: "jsx" },
        args: [
          // Arg 0: tag "div"
          { _tag: "EStr", value: "div" },
          // Arg 1: props record { className: "card" }
          {
            _tag: "ERecord",
            fields: [{ name: "className", value: { _tag: "EStr", value: "card" } }],
          },
          // Arg 2: children array ["hello"]
          { _tag: "EArr", elements: [{ _tag: "SEExpr", expr: { _tag: "EStr", value: "hello" } }] },
        ],
      },
    });
  });

  it("does not mark a hand-written h(...) call with JSX provenance", () => {
    const stmt = parseLet(`let el = h("div", { className: "card" }, ["hello"])`);
    expect(stmt).toMatchObject({
      _tag: "SLet",
      value: { _tag: "ECall", origin: { _tag: "None" } },
    });
  });

  it("parses self-closing component tag into h(Component, props, []) call", () => {
    const stmt = parseLet(`let el = <Card title="Mochi" count={42} disabled />`);
    expect(stmt).toMatchObject({
      value: {
        _tag: "ECall",
        args: [
          // Arg 0: Component reference Card
          { _tag: "ERef", name: "Card" },
          // Arg 1: props record
          {
            _tag: "ERecord",
            fields: [
              { name: "title", value: { _tag: "EStr", value: "Mochi" } },
              { name: "count", value: { _tag: "ENum", value: 42, raw: "42" } },
              { name: "disabled", value: { _tag: "EBool", value: true } },
            ],
          },
          // Arg 2: empty children
          { _tag: "EArr", elements: [] },
        ],
      },
    });
  });

  it("parses fragment syntax <>...</> into Fragment call", () => {
    const stmt = parseLet(`let el = <><span>{"1"}</span><span>{"2"}</span></>`);
    expect(stmt).toMatchObject({
      value: {
        _tag: "ECall",
        args: [
          { _tag: "EStr", value: "Fragment" },
          { _tag: "ERecord" },
          { _tag: "EArr", elements: [{ _tag: "SEExpr" }, { _tag: "SEExpr" }] },
        ],
      },
    });
  });

  it("supports array spreads in children", () => {
    const stmt = parseLet(`let el = <ul className="list">{...items}</ul>`);
    expect(stmt).toMatchObject({
      value: {
        _tag: "ECall",
        args: [
          { _tag: "EStr", value: "ul" },
          { _tag: "ERecord" },
          { _tag: "EArr", elements: [{ _tag: "SESpread", expr: { _tag: "ERef", name: "items" } }] },
        ],
      },
    });
  });

  it("compiles and evaluates Mochi code with JSX against custom h builder", () => {
    const src = `
      let Card = (props) => <div className="card">{props.title}</div>
      let vnode = <Card title="Awesome" />
    `;
    const res = unwrapOk(compile(src));
    expect(res).toContain("h(");

    // Evaluate generated JS with a JSX runtime h function
    const hRuntime = `
      function h(tag, props, children) {
        if (typeof tag === 'function') return tag(props, children);
        return { tag, props, children };
      }
    `;
    const fn = new Function(`${hRuntime}\n${res}\nreturn vnode;`);
    const vnode = fn();
    expect(vnode).toEqual({
      tag: "div",
      props: { className: "card" },
      children: ["Awesome"],
    });
  });

  // Props row requires `children` (body reads props.children), but JSX puts
  // kids in h's 3rd arg — inferJsxCall must synthesize the field or unify
  // false-fails with `missing field 'children'` (docs SyntaxPanel regression).
  it("typechecks a component that reads props.children with JSX body kids", () => {
    const src = `
      let Panel = props => <div>{props.children}</div>
      let el = <Panel><span>{"hi"}</span></Panel>
    `;
    const r = compile(src);
    expect(isErr(r)).toBe(false);
  });

  it("still errors when props.children is required but the JSX tag is empty", () => {
    const src = `
      let Panel = props => <div>{props.children}</div>
      let el = <Panel />
    `;
    const r = compile(src);
    expect(isErr(r)).toBe(true);
    if (isErr(r)) {
      expect(r.error.some((d) => d.message.includes("missing field 'children'"))).toBe(true);
    }
  });

  it("checks an inferred component prop row", () => {
    const component = 'let Card = props => <div>{concat(props.title, "!")}</div>';
    const bad = compile(`${component}\nlet el = <Card title={1} />`);
    expect(unwrapErr(bad)).toEqual([
      {
        kind: "type",
        message: "cannot unify number with string",
        span: { start: 67, end: 85 },
      },
    ]);
    expect(isErr(compile(`${component}\nlet el = <Card title="ok" />`))).toBe(false);
  });

  it("types component bindings consistently in TypeScript and declarations", () => {
    const inferred = 'let Card = props => <div className="card">{props.title}</div>';
    const inferredType = "(props: { title: unknown; children?: any; className?: string }) => any";
    expect(unwrapOk(emitDts(inferred))).toContain(`export declare const Card: ${inferredType};`);
    expect(unwrapOk(codegenTs(inferred))).toContain(`const Card: ${inferredType}`);

    const annotated =
      "type Props = { title: string }\nlet Card : Props -> VNode = props => <div>{props.title}</div>";
    expect(unwrapOk(emitDts(annotated))).toContain(
      "export declare const Card: (props: Props) => any;",
    );
    expect(unwrapOk(codegenTs(annotated))).toContain("const Card: (props: Props) => any");
  });
});

// ADR 0055 — component prop contracts: a record-alias extern is a checked
// seam; `: a` remains the explicit opt-out.
describe("keyword attribute names (ADR 0077)", () => {
  it("accepts a DOM attribute spelled like a mochi keyword", () => {
    const out = unwrapOk(compile(`let b = <button type="button">{"go"}</button>`));
    expect(out).toContain('type: "button"');
  });

  it("keeps the attribute out of binding position", () => {
    // `type` is a label here, so the surrounding statement still parses as an
    // ordinary `let` — the keyword has not leaked into expression position.
    expect(isErr(compile(`let type = <button type="button" />`))).toBe(true);
  });
});

describe("component prop contracts (ADR 0055)", () => {
  const ICON = `
    type IconProps = { name: string, className: string }
    extern Icon : IconProps -> VNode = "./icon" "Icon"
  `;

  it("checks attrs against a record-alias extern", () => {
    expect(isErr(compile(`${ICON}\nlet el = <Icon name="play" className="s" />`))).toBe(false);

    const missing = compile(`${ICON}\nlet el = <Icon name="play" />`);
    expect(isErr(missing)).toBe(true);
    if (isErr(missing)) {
      expect(missing.error.some((d) => d.message.includes("missing field 'className'"))).toBe(true);
    }

    const extra = compile(`${ICON}\nlet el = <Icon name="play" className="s" size={2} />`);
    expect(isErr(extra)).toBe(true);
  });

  it("`: a` externs still opt out of attr checking", () => {
    const src = `
      extern Icon : a = "./icon" "Icon"
      let el = <Icon anything={1} goes="here" />
    `;
    expect(isErr(compile(src))).toBe(false);
  });

  // The "render nothing" arm: `<></>` unifies as VNode in a ternary and emits
  // `h("Fragment", …)` — the host `h` maps that tag to its Fragment (the
  // vite-plugin's default pragma header and the playground preview both do).
  it("an empty fragment fills the empty ternary arm", () => {
    const src = `let el = eq(1, 2) ? <div>{"busy"}</div> : <></>`;
    const r = compile(src);
    expect(isErr(r)).toBe(false);
    if (!isErr(r)) {
      expect(r.value).toContain('h("Fragment", {}, [])');
    }
  });
});

describe("intrinsic HTML element prop validation (ADR 0096)", () => {
  it("validates standard HTML attributes and literal types", () => {
    const src = `
      let btn = <button type="submit" disabled={false} className="primary" onClick={() => ()}>{"Submit"}</button>
      let inp = <input type="text" placeholder="Enter name" value="Mochi" disabled />
      let link = <a href="https://example.com" target="_blank">{"Home"}</a>
    `;
    expect(isErr(compile(src))).toBe(false);
  });

  it("rejects unknown attributes on intrinsic tags with did-you-mean suggestion", () => {
    const r = compile("let btn = <button disbaled />");
    expect(isErr(r)).toBe(true);
    if (isErr(r)) {
      expect(
        r.error.some((d) =>
          d.message.includes(
            "Property 'disbaled' does not exist on '<button>'. Did you mean 'disabled'?",
          ),
        ),
      ).toBe(true);
    }
  });

  it("warns on common React/JSX attribute mistakes", () => {
    const classErr = compile(`let el = <div class="container" />`);
    expect(isErr(classErr)).toBe(true);
    if (isErr(classErr)) {
      expect(
        classErr.error.some((d) => d.message.includes("use 'className' instead of 'class'")),
      ).toBe(true);
    }

    const forErr = compile(`let el = <label for="username" />`);
    expect(isErr(forErr)).toBe(true);
    if (isErr(forErr)) {
      expect(forErr.error.some((d) => d.message.includes("use 'htmlFor' instead of 'for'"))).toBe(
        true,
      );
    }

    const onclickErr = compile("let el = <button onclick={() => ()} />");
    expect(isErr(onclickErr)).toBe(true);
    if (isErr(onclickErr)) {
      expect(
        onclickErr.error.some((d) => d.message.includes("use 'onClick' instead of 'onclick'")),
      ).toBe(true);
    }
  });

  it("rejects invalid literal union values on intrinsic attributes", () => {
    const r = compile(`let btn = <button type="invalid" />`);
    expect(isErr(r)).toBe(true);
  });

  it("rejects invalid types on intrinsic attributes", () => {
    const r = compile(`let btn = <button disabled="notABool" />`);
    expect(isErr(r)).toBe(true);
  });

  it("rejects non-function values for event handlers", () => {
    const r = compile(`let btn = <button onClick="notAFunction" />`);
    expect(isErr(r)).toBe(true);
    if (isErr(r)) {
      expect(
        r.error.some((d) => d.message.includes("Expected function for event handler 'onClick'")),
      ).toBe(true);
    }
  });

  it("permits data-* and aria-* open attributes", () => {
    const src = `let el = <div data-testid="card-1" data-count={5} aria-hidden={true} />`;
    expect(isErr(compile(src))).toBe(false);
  });

  it("accepts the standard HTML elements", () => {
    // The schema is a closed allowlist: a standard tag missing from it is a hard
    // "Unknown JSX element" error, so the list being complete is behavior.
    const tags = "dl dt dd hgroup search menu legend ruby rp rt datalist output fieldset area";
    for (const tag of tags.split(" ")) expect(isErr(compile(`let el = <${tag} />`))).toBe(false);
  });

  it("glues a hyphenated attr name only while the tokens abut", () => {
    // `data-testid` lexes as label/minus/label. Without an adjacency check a
    // stray spaced hyphen would silently become part of the name.
    expect(isErr(compile(`let el = <div id - x="1" />`))).toBe(true);
  });
});
