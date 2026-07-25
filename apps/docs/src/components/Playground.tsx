import { compile, format } from "@mochi/compiler";
import { match } from "@onrails/pattern";
import { isErr, unwrapOk } from "@onrails/result";
import { h, render } from "preact";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import {
  DiagBox,
  EditorInput,
  EditorMirror,
  EmitPane,
  GhostPillBtn,
  PresetSelect,
  PreviewPane,
  SegTab,
  StatusLabel,
} from "../ui/primitives.mochi";
import { HighlightedCode } from "./HighlightCode";

/** Emit is an ESM module (`import { match }…`); playground runs it in `new Function`. */
const stripModuleImports = (js: string): string =>
  js.replace(/^import\s+.+;?\s*$/gm, "").trimStart();

const STORAGE_KEY = "mochi_playground_code_v2";

const PRESETS: Record<string, { name: string; code: string }> = {
  jsx: {
    name: "JSX → h()",
    code: `// jsxPlugin (default-on) desugars to host h(tag, props, children)

let Badge = (props) =>
  <span className="px-2.5 py-0.5 text-3xs font-mono font-bold tracking-wider rounded uppercase bg-fur-subtle text-fur-deep border border-fur-border">
    {props.text}
  </span>

let Card = (props) =>
  <div className="w-full max-w-md p-5 bg-paper border-2 border-line rounded-panel space-y-3 shadow-soft">
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-base font-bold text-ink font-display">{props.title}</h3>
      <Badge text="0 tsc errors" />
    </div>
    <p className="text-xs font-mono text-mute leading-relaxed">
      {"Mochi compiles Hindley-Milner types to readable JS & strict TypeScript."}
    </p>
  </div>

let app = <Card title="Algorithm W + Universal JSX" />`,
  },
  result: {
    name: "Result + switch",
    code: `// Prelude Result — no \`type Result<a, e>\` (that's TS; mochi is \`Result a e\`)

let map = (res, f) =>
  switch res {
    | Ok(val) => Ok(f(val))
    | Err(err) => Err(err)
  }

let res = Ok(21)
let doubled = map(res, x => x * 2)

let app =
  <div className="w-full max-w-md p-4 bg-paper border-2 border-line rounded-panel font-mono text-xs text-fur-deep">
    {"doubled = Ok(42)"}
  </div>`,
  },
  rowPoly: {
    name: "Row polymorphism",
    code: `// greet accepts any record with name + role
let greet = (person) =>
  "Hello, " ++ person.name ++ " (" ++ person.role ++ ")"

let user = { name: "Alan", role: "Maintainer", id: 42 }
let message = greet(user)

let app =
  <div className="w-full max-w-md p-4 bg-paper border-2 border-line rounded-panel font-mono text-xs text-plum">
    {message}
  </div>`,
  },
  fib: {
    name: "Fibonacci",
    code: `let fib = (n) =>
  n <= 1 ? n : fib(n - 1) + fib(n - 2)

let result = fib(10)

let app =
  <div className="w-full max-w-md p-4 bg-paper border-2 border-line rounded-panel font-mono text-xs text-ok">
    {"fib(10) = "} {result}
  </div>`,
  },
};

function safeDecode(encoded: string): string {
  try {
    return window.decodeURIComponent(encoded);
  } catch {
    return "";
  }
}

export function Playground() {
  const [code, setCode] = useState<string>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paramCode = urlParams.get("code");
    if (paramCode) {
      const decoded = safeDecode(paramCode);
      if (decoded) return decoded;
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
    return PRESETS.jsx.code;
  });

  const [outputJs, setOutputJs] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "js">("preview");
  const [shareCopied, setShareCopied] = useState(false);
  const [formatNotice, setFormatNotice] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, code);
    const encoded = encodeURIComponent(code);
    const newURL = `${window.location.protocol}//${window.location.host}${window.location.pathname}?code=${encoded}`;
    window.history.replaceState(null, "", newURL);
  }, [code]);

  const evaluate = useCallback(() => {
    try {
      const res = compile(code, { runtime: true });
      if (isErr(res)) {
        const diagnostics: Array<{ kind: string; message: string }> = res.error;
        setError(diagnostics.map((e) => `[${e.kind}] ${e.message}`).join("\n"));
        setOutputJs("");
        return;
      }
      setError(null);
      setOutputJs(res.value);
    } catch (e: any) {
      setError(e.message);
      setOutputJs("");
    }
  }, [code]);

  useEffect(() => {
    evaluate();
  }, [evaluate]);

  // Imperative Preact into a host React also reconciles. Sibling HighlightCode
  // setState (Result/Fib lex slower than JSX) re-renders the parent and wipes
  // those children — re-paint after every commit while preview is showing.
  useLayoutEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    if (error || activeTab !== "preview" || !outputJs) {
      render(null, el);
      return;
    }
    try {
      const fn = new Function(
        "h",
        "match",
        `${stripModuleImports(outputJs)}; return typeof app !== 'undefined' ? app : null;`,
      );
      const vnode = fn(h, match);
      render(vnode ?? null, el);
      if (!vnode) el.innerText = "Compiled. Bind `let app = …` to preview UI.";
    } catch (execErr: any) {
      render(null, el);
      el.innerText = `Runtime error: ${execErr.message}`;
    }
  });

  const handleFormat = useCallback(() => {
    const res = format(code);
    if (!isErr(res)) {
      setCode(unwrapOk(res));
      setFormatNotice(true);
      setTimeout(() => setFormatNotice(false), 1800);
    }
  }, [code]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        evaluate();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "F" || e.key === "f")) {
        e.preventDefault();
        handleFormat();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [evaluate, handleFormat]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handlePresetSelect = (key: string) => {
    if (PRESETS[key]) {
      setCode(PRESETS[key].code);
    }
  };

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-line border-b-2 bg-peach px-4 py-3">
        <span className="font-mono font-semibold text-mute text-xs tracking-wide">playground</span>

        <div className="flex items-center gap-2">
          <label htmlFor="playground-preset" className="font-mono text-2xs text-mute">
            Preset
          </label>
          <PresetSelect
            id="playground-preset"
            onChange={(e: Event) => handlePresetSelect((e.target as HTMLSelectElement).value)}
          >
            {Object.entries(PRESETS).map(([key, p]) => (
              <option key={key} value={key}>
                {p.name}
              </option>
            ))}
          </PresetSelect>
        </div>

        <div className="flex items-center gap-2">
          <GhostPillBtn type="button" onClick={handleFormat} title="Format (Cmd+Shift+F)">
            {formatNotice ? "Formatted" : "Format"}
          </GhostPillBtn>

          <GhostPillBtn type="button" onClick={handleShare} title="Copy playground URL">
            {shareCopied ? "Copied" : "Share"}
          </GhostPillBtn>

          <div className="flex items-center gap-1 rounded-full border-2 border-line bg-foam p-1 text-xs">
            <SegTab
              type="button"
              onClick={() => setActiveTab("preview")}
              $active={activeTab === "preview" ? "on" : "off"}
            >
              Preview
            </SegTab>
            <SegTab
              type="button"
              onClick={() => setActiveTab("js")}
              $active={activeTab === "js" ? "on" : "off"}
            >
              JS
            </SegTab>
          </div>
        </div>
      </div>

      <div className="grid min-h-100 grid-cols-1 divide-y-2 divide-line lg:grid-cols-2 lg:divide-x-2 lg:divide-y-0">
        <div className="flex flex-col bg-foam p-4">
          <div className="mb-2 flex items-center justify-between font-mono text-2xs text-mute">
            <span className="flex items-center gap-2">
              <span>source</span>
              <span className="text-3xs">Cmd+Enter</span>
            </span>
            <StatusLabel $state={error ? "err" : "ok"}>{error ? "error" : "ok"}</StatusLabel>
          </div>
          <div className="relative min-h-80 flex-1 overflow-hidden rounded-panel border-2 border-line bg-paper">
            <EditorMirror>
              <HighlightedCode code={code} lang="mochi" enableTwoslash={false} />
            </EditorMirror>

            <EditorInput
              value={code}
              onInput={(e: Event) => setCode((e.target as HTMLTextAreaElement).value)}
              onScroll={(e: Event) => {
                const preElem = (e.target as HTMLTextAreaElement).previousElementSibling;
                if (preElem) {
                  preElem.scrollTop = (e.target as HTMLTextAreaElement).scrollTop;
                  preElem.scrollLeft = (e.target as HTMLTextAreaElement).scrollLeft;
                }
              }}
              spellcheck={false}
              autoComplete="off"
              autoCorrect="off"
              rows={15}
            />
          </div>
        </div>

        <div className="flex flex-col bg-peach p-4">
          {error ? (
            <DiagBox>
              <div className="mb-1 font-bold">diagnostics</div>
              {error}
            </DiagBox>
          ) : null}
          {/* Keep host mounted so imperative preview isn't wiped by remount races. */}
          <div
            className={`flex flex-1 flex-col ${error || activeTab !== "preview" ? "hidden" : ""}`}
          >
            <div className="mb-2 font-mono text-2xs text-mute">preview</div>
            <PreviewPane ref={previewRef} />
          </div>
          <div className={`flex flex-1 flex-col ${error || activeTab !== "js" ? "hidden" : ""}`}>
            <div className="mb-2 font-mono text-2xs text-mute">emitted js</div>
            <EmitPane>
              <HighlightedCode code={outputJs} lang="js" />
            </EmitPane>
          </div>
        </div>
      </div>
    </div>
  );
}
