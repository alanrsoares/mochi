import { describe, expect, it } from "bun:test";
import { compile } from "@mochi/compiler/compile";
import { lex } from "@mochi/compiler/lexer";
import { parse } from "@mochi/compiler/parser";
import { isErr, unwrapOk } from "@onrails/result";

describe("JSX syntax desugaring (ADR 0007)", () => {
  it("parses basic HTML tag into h(...) call", () => {
    const code = `let el = <div className="card">{"hello"}</div>`;
    const tokens = unwrapOk(lex(code));
    const prog = unwrapOk(parse(tokens));
    expect(prog.stmts.length).toBe(1);
    const stmt = prog.stmts[0]!;
    expect(stmt.kind).toBe("let");
    if (stmt.kind === "let") {
      expect(stmt.name).toBe("el");
      expect(stmt.value.kind).toBe("call");
      if (stmt.value.kind === "call") {
        expect(stmt.value.fn).toEqual({ kind: "ref", name: "h", span: expect.anything() });
        expect(stmt.value.args.length).toBe(3);
        // Sugar provenance (ADR 0011 §5) — set once by the parser, not sniffed later.
        expect(stmt.value.origin).toBe("jsx");
        // Arg 0: tag "div"
        expect(stmt.value.args[0]).toEqual({ kind: "str", value: "div", span: expect.anything() });
        // Arg 1: props record { className: "card" }
        expect(stmt.value.args[1]?.kind).toBe("record");
        // Arg 2: children array ["hello"]
        expect(stmt.value.args[2]?.kind).toBe("arr");
      }
    }
  });

  it("does not mark a hand-written h(...) call with JSX provenance", () => {
    const code = `let el = h("div", { className: "card" }, ["hello"])`;
    const tokens = unwrapOk(lex(code));
    const prog = unwrapOk(parse(tokens));
    const stmt = prog.stmts[0]!;
    if (stmt.kind === "let" && stmt.value.kind === "call") {
      expect(stmt.value.origin).toBeUndefined();
    }
  });

  it("parses self-closing component tag into h(Component, props, []) call", () => {
    const code = `let el = <Card title="Mochi" count={42} disabled />`;
    const tokens = unwrapOk(lex(code));
    const prog = unwrapOk(parse(tokens));
    const stmt = prog.stmts[0]!;
    if (stmt.kind === "let" && stmt.value.kind === "call") {
      // Arg 0: Component reference Card
      expect(stmt.value.args[0]).toEqual({ kind: "ref", name: "Card", span: expect.anything() });
      // Arg 1: props record
      if (stmt.value.args[1]?.kind === "record") {
        const fields = stmt.value.args[1].fields;
        expect(fields.map((f) => f.name)).toEqual(["title", "count", "disabled"]);
        expect(fields[0]?.value).toEqual({ kind: "str", value: "Mochi", span: expect.anything() });
        expect(fields[1]?.value).toEqual({
          kind: "num",
          value: 42,
          raw: "42",
          span: expect.anything(),
        });
        expect(fields[2]?.value).toEqual({ kind: "bool", value: true, span: expect.anything() });
      }
      // Arg 2: empty children
      expect(stmt.value.args[2]).toEqual({ kind: "arr", elements: [], span: expect.anything() });
    }
  });

  it("parses fragment syntax <>...</> into Fragment call", () => {
    const code = `let el = <><span>{"1"}</span><span>{"2"}</span></>`;
    const tokens = unwrapOk(lex(code));
    const prog = unwrapOk(parse(tokens));
    const stmt = prog.stmts[0]!;
    if (stmt.kind === "let" && stmt.value.kind === "call") {
      expect(stmt.value.args[0]).toEqual({
        kind: "str",
        value: "Fragment",
        span: expect.anything(),
      });
      if (stmt.value.args[2]?.kind === "arr") {
        expect(stmt.value.args[2].elements.length).toBe(2);
      }
    }
  });

  it("supports array spreads in children", () => {
    const code = `let el = <ul className="list">{...items}</ul>`;
    const tokens = unwrapOk(lex(code));
    const prog = unwrapOk(parse(tokens));
    const stmt = prog.stmts[0]!;
    if (stmt.kind === "let" && stmt.value.kind === "call" && stmt.value.args[2]?.kind === "arr") {
      const elems = stmt.value.args[2].elements;
      expect(elems[0]).toEqual({
        kind: "spread",
        expr: { kind: "ref", name: "items", span: expect.anything() },
      });
    }
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
    const r = compile(`let btn = <button disbaled />`);
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

    const onclickErr = compile(`let el = <button onclick={() => ()} />`);
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
