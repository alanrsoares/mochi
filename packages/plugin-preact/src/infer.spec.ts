import { expect, test } from "bun:test";
import { toTypedProgram } from "@mochi/compiler/compile";
import { showScheme } from "@mochi/compiler/infer";
import { preludeNamespaces } from "@mochi/compiler/prelude";
import { isErr, unwrapOk } from "@onrails/result";
import { preactExtension } from "./index";

const plugins = [preactExtension];

const HOOKS = `
export extern useState : a -> (a, a -> b) = "preact/hooks" "useState"
export extern useRef : a -> b = "preact/hooks" "useRef"
export extern useEffect : (() -> c) -> d -> e = "preact/hooks" "useEffect"
export extern useCallback : a -> b -> a = "preact/hooks" "useCallback"
export extern useMemo : (() -> a) -> b -> a = "preact/hooks" "useMemo"
`;

test("useState ties setter to state (value form)", () => {
  const src = `${HOOKS}
let test = _ =>
  let (n, setN) = useState(0) in
  let _ = setN(1) in n
`;
  const r = toTypedProgram(src, { open: true, namespaces: preludeNamespaces, plugins });
  expect(isErr(r)).toBe(false);
});

test("useState rejects wrong setter arg type", () => {
  const src = `${HOOKS}
let test = _ =>
  let (n, setN) = useState(0) in
  let _ = setN("oops") in n
`;
  const r = toTypedProgram(src, { open: true, namespaces: preludeNamespaces, plugins });
  expect(isErr(r)).toBe(true);
});

test("useState allows functional updater", () => {
  const src = `${HOOKS}
let test = _ =>
  let (n, setN) = useState(0) in
  let _ = setN(x => x + 1) in n
`;
  const r = toTypedProgram(src, { open: true, namespaces: preludeNamespaces, plugins });
  expect(isErr(r)).toBe(false);
});

test("useRef pins current to initial type", () => {
  const src = `${HOOKS}
let test = _ =>
  let r = useRef(0) in
  r.current
`;
  const r = toTypedProgram(src, { open: true, namespaces: preludeNamespaces, plugins });
  expect(isErr(r)).toBe(false);
  const sc = unwrapOk(r).res.env.get("test")!;
  const shown = showScheme(sc, unwrapOk(r).res.aliases);
  expect(shown).toContain("number");
});

test("useRef rejects mismatched current read context", () => {
  const src = `${HOOKS}
let test = _ =>
  let r = useRef(0) in
  eq(r.current, "x")
`;
  const r = toTypedProgram(src, { open: true, namespaces: preludeNamespaces, plugins });
  expect(isErr(r)).toBe(true);
});

test("without preactExtension, useRef current type is not pinned", () => {
  const src = `${HOOKS}
let test = _ =>
  let r = useRef(0) in
  eq(r.current, "x")
`;
  const withPlugin = toTypedProgram(src, {
    open: true,
    namespaces: preludeNamespaces,
    plugins,
  });
  const withoutPlugin = toTypedProgram(src, {
    open: true,
    namespaces: preludeNamespaces,
    plugins: [],
  });
  expect(isErr(withPlugin)).toBe(true);
  expect(isErr(withoutPlugin)).toBe(false);
});

test("useMemo result matches thunk return", () => {
  const src = `${HOOKS}
let test = _ =>
  let v = useMemo(() => 42, []) in
  v
`;
  const r = toTypedProgram(src, { open: true, namespaces: preludeNamespaces, plugins });
  expect(isErr(r)).toBe(false);
  const sc = unwrapOk(r).res.env.get("test")!;
  expect(showScheme(sc, unwrapOk(r).res.aliases)).toContain("number");
});

test("useMemo rejects thunk/body type drift", () => {
  const src = `${HOOKS}
let test = _ =>
  let v = useMemo(() => "nope", []) in
  let _ = v + 1 in 0
`;
  const r = toTypedProgram(src, { open: true, namespaces: preludeNamespaces, plugins });
  expect(isErr(r)).toBe(true);
});
