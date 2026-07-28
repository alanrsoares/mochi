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
