import { compile, format } from "@mochi/compiler";
import { isErr, unwrapOk } from "@onrails/result";
import { h, render } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { HighlightedCode } from "./HighlightCode";

const STORAGE_KEY = "mochi_playground_code";

const PRESETS: Record<string, { name: string; code: string }> = {
  jsx: {
    name: "JSX → h()",
    code: `// JSX desugars to host h(tag, props, children)

let Badge = (props) =>
  <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
    {props.text}
  </span>

let Card = (props) =>
  <div className="p-5 bg-[#0e111a] border border-[#1e2436] rounded-xl space-y-3 shadow-lg">
    <div className="flex items-center justify-between">
      <h3 className="text-base font-bold text-slate-100 font-display">{props.title}</h3>
      <Badge text="0 tsc errors" />
    </div>
    <p className="text-xs font-mono text-slate-400 leading-relaxed">
      {"HM types → readable JS + strict TypeScript."}
    </p>
  </div>

let app = <Card title="Algorithm W + JSX" />`,
  },
  result: {
    name: "Result + switch",
    code: `type Result<a, e> = Ok(a) | Err(e)

let map = (res, f) =>
  switch res {
    | Ok(val) => Ok(f(val))
    | Err(err) => Err(err)
  }

let res = Ok(21)
let doubled = map(res, x => x * 2)

let app =
  <div className="p-4 bg-[#0e111a] border border-[#1e2436] rounded-xl font-mono text-xs text-rose-300">
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
  <div className="p-4 bg-[#0e111a] border border-[#1e2436] rounded-xl font-mono text-xs text-amber-300">
    {message}
  </div>`,
  },
  fib: {
    name: "Fibonacci",
    code: `let fib = (n) =>
  if n <= 1 then n else fib(n - 1) + fib(n - 2)

let result = fib(10)

let app =
  <div className="p-4 bg-[#0e111a] border border-[#1e2436] rounded-xl font-mono text-xs text-emerald-300">
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

      if (previewRef.current) {
        previewRef.current.innerHTML = "";
        try {
          const fn = new Function(
            "h",
            `${res.value}; return typeof app !== 'undefined' ? app : null;`,
          );
          const vnode = fn(h);
          if (vnode) {
            render(vnode, previewRef.current);
          } else {
            previewRef.current.innerText = "Compiled. Bind `let app = …` to preview UI.";
          }
        } catch (execErr: any) {
          previewRef.current.innerText = `Runtime error: ${execErr.message}`;
        }
      }
    } catch (e: any) {
      setError(e.message);
    }
  }, [code]);

  useEffect(() => {
    evaluate();
  }, [evaluate, activeTab]);

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
      <div className="flex flex-wrap items-center justify-between gap-3 border-[var(--line)] border-b-2 bg-[var(--peach)] px-4 py-3">
        <span className="font-mono font-semibold text-[var(--mute)] text-xs tracking-wide">
          playground
        </span>

        <div className="flex items-center gap-2">
          <label htmlFor="playground-preset" className="font-mono text-[11px] text-[var(--mute)]">
            Preset
          </label>
          <select
            id="playground-preset"
            onChange={(e) => handlePresetSelect((e.target as HTMLSelectElement).value)}
            className="rounded-full border-2 border-[var(--line)] bg-[var(--foam)] px-3 py-1 font-mono text-[var(--ink)] text-xs focus:border-[var(--fur)] focus:outline-none"
          >
            {Object.entries(PRESETS).map(([key, p]) => (
              <option key={key} value={key}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFormat}
            title="Format (Cmd+Shift+F)"
            className="rounded-full border-2 border-[var(--line)] bg-[var(--foam)] px-3 py-1 font-mono text-[11px] text-[var(--mute)] transition-colors hover:border-[var(--fur)] hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--bao)] focus-visible:outline-offset-2"
          >
            {formatNotice ? "Formatted" : "Format"}
          </button>

          <button
            type="button"
            onClick={handleShare}
            title="Copy playground URL"
            className="rounded-full border-2 border-[var(--line)] bg-[var(--foam)] px-3 py-1 font-mono text-[11px] text-[var(--mute)] transition-colors hover:border-[var(--fur)] hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--bao)] focus-visible:outline-offset-2"
          >
            {shareCopied ? "Copied" : "Share"}
          </button>

          <div className="flex items-center gap-1 rounded-full border-2 border-[var(--line)] bg-[var(--foam)] p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`rounded-full px-3 py-1 font-mono font-semibold text-[11px] transition-colors ${
                activeTab === "preview"
                  ? "bg-[var(--fur)] text-white"
                  : "text-[var(--mute)] hover:text-[var(--ink)]"
              }`}
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("js")}
              className={`rounded-full px-3 py-1 font-mono font-semibold text-[11px] transition-colors ${
                activeTab === "js"
                  ? "bg-[var(--fur)] text-white"
                  : "text-[var(--mute)] hover:text-[var(--ink)]"
              }`}
            >
              JS
            </button>
          </div>
        </div>
      </div>

      <div className="grid min-h-100 grid-cols-1 divide-y-2 divide-[var(--line)] lg:grid-cols-2 lg:divide-x-2 lg:divide-y-0">
        <div className="flex flex-col bg-[var(--foam)] p-4">
          <div className="mb-2 flex items-center justify-between font-mono text-[11px] text-[var(--mute)]">
            <span className="flex items-center gap-2">
              <span>source</span>
              <span className="text-[10px]">Cmd+Enter</span>
            </span>
            <span
              className={error ? "font-bold text-[var(--fur-deep)]" : "font-bold text-[var(--ok)]"}
            >
              {error ? "error" : "ok"}
            </span>
          </div>
          <div className="relative min-h-80 flex-1 overflow-hidden rounded-[var(--radius)] border-2 border-[var(--line)] bg-[var(--paper)]">
            <pre className="pointer-events-none absolute inset-0 m-0 overflow-auto whitespace-pre p-4 font-mono text-[var(--ink)] text-xs leading-relaxed">
              <HighlightedCode code={code} lang="mochi" enableTwoslash={false} />
            </pre>

            <textarea
              value={code}
              onInput={(e) => setCode((e.target as HTMLTextAreaElement).value)}
              onScroll={(e) => {
                const preElem = (e.target as HTMLTextAreaElement).previousElementSibling;
                if (preElem) {
                  preElem.scrollTop = (e.target as HTMLTextAreaElement).scrollTop;
                  preElem.scrollLeft = (e.target as HTMLTextAreaElement).scrollLeft;
                }
              }}
              spellcheck={false}
              autoComplete="off"
              autoCorrect="off"
              className="absolute inset-0 m-0 h-full w-full resize-none overflow-auto whitespace-pre border-0 bg-transparent p-4 font-mono font-normal text-transparent text-xs leading-relaxed caret-[var(--fur-deep)] selection:bg-[color-mix(in_oklab,var(--fur)_30%,transparent)] focus:outline-none"
              rows={15}
            />
          </div>
        </div>

        <div className="flex flex-col bg-[var(--peach)] p-4">
          {error ? (
            <div className="max-h-87.5 overflow-auto whitespace-pre-wrap rounded-[var(--radius)] border-2 border-[var(--fur)] bg-[color-mix(in_oklab,var(--fur)_12%,white)] p-4 font-mono text-[var(--fur-deep)] text-xs">
              <div className="mb-1 font-bold">diagnostics</div>
              {error}
            </div>
          ) : activeTab === "preview" ? (
            <div className="flex flex-1 flex-col">
              <div className="mb-2 font-mono text-[11px] text-[var(--mute)]">preview</div>
              <div
                ref={previewRef}
                className="flex min-h-80 flex-1 items-center justify-center rounded-[var(--radius)] border-2 border-[var(--line)] bg-[var(--foam)] p-6"
              />
            </div>
          ) : (
            <div className="flex flex-1 flex-col">
              <div className="mb-2 font-mono text-[11px] text-[var(--mute)]">emitted js</div>
              <pre className="max-h-87.5 flex-1 overflow-auto rounded-[var(--radius)] border-2 border-[var(--line)] bg-[var(--foam)] p-4 font-mono text-[var(--ink)] text-xs leading-relaxed">
                <HighlightedCode code={outputJs} lang="js" />
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
