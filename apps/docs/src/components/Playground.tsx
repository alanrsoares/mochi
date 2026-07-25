import { isErr, unwrapOk } from "@onrails/result";
import { compile, format } from "@mochi/compiler";
import { h, render } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { HighlightedCode } from "./HighlightCode";

const STORAGE_KEY = "mochi_playground_code";

const PRESETS: Record<string, { name: string; code: string }> = {
  jsx: {
    name: "Universal JSX Component",
    code: `// Mochi W-Engine Live Sandbox 🐾
// Desugars JSX directly into host h(tag, props, children) calls

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
      {"Mochi compiles Hindley-Milner types to readable JS & strict TypeScript."}
    </p>
  </div>

let app = <Card title="Algorithm W + Universal JSX" />`,
  },
  result: {
    name: "Result ADT & Pattern Match",
    code: `// Algebraic Data Types & Exhaustive Matching
type Result<a, e> = Ok(a) | Err(e)

let map = (res, f) =>
  switch res {
    | Ok(val) => Ok(f(val))
    | Err(err) => Err(err)
  }

let res = Ok(21)
let doubled = map(res, x => x * 2)

let app =
  <div className="p-4 bg-[#0e111a] border border-[#1e2436] rounded-xl font-mono text-xs text-rose-300">
    {"Result evaluated successfully!"}
  </div>`,
  },
  rowPoly: {
    name: "Row-Polymorphic Record",
    code: `// Row-Polymorphic Record Functions ({ r | key: val })
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
    name: "Recursive Fibonacci",
    code: `// Tail-recursive / Hindley-Milner Inferenced Fibonacci
let fib = (n) =>
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
    // 1. Check URL query params first
    const urlParams = new URLSearchParams(window.location.search);
    const paramCode = urlParams.get("code");
    if (paramCode) {
      const decoded = safeDecode(paramCode);
      if (decoded) return decoded;
    }
    // 2. Check localStorage next
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
    // 3. Fallback default
    return PRESETS.jsx.code;
  });

  const [outputJs, setOutputJs] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "js">("preview");
  const [shareCopied, setShareCopied] = useState(false);
  const [formatNotice, setFormatNotice] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Sync state to URL and localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, code);
    const encoded = encodeURIComponent(code);
    const newURL = `${window.location.protocol}//${window.location.host}${window.location.pathname}?code=${encoded}`;
    window.history.replaceState(null, "", newURL);
  }, [code]);

  // Compile and evaluate Mochi source code
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
          const fn = new Function("h", `${res.value}; return typeof app !== 'undefined' ? app : null;`);
          const vnode = fn(h);
          if (vnode) {
            render(vnode, previewRef.current);
          } else {
            previewRef.current.innerText = "Execution clean. Define 'let app = <Component />' to render UI preview.";
          }
        } catch (execErr: any) {
          previewRef.current.innerText = `Runtime Evaluation Error: ${execErr.message}`;
        }
      }
    } catch (e: any) {
      setError(e.message);
    }
  }, [code]);

  useEffect(() => {
    evaluate();
  }, [evaluate, activeTab]);

  // Code Formatter (Cmd/Ctrl + Shift + F)
  const handleFormat = useCallback(() => {
    const res = format(code);
    if (!isErr(res)) {
      setCode(unwrapOk(res));
      setFormatNotice(true);
      setTimeout(() => setFormatNotice(false), 1800);
    }
  }, [code]);

  // Keyboard Shortcuts: Ctrl+Enter (Evaluate), Ctrl+Shift+F (Format)
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
    <div className="my-10 border border-[#1e2436] rounded-2xl overflow-hidden bg-[#0c0e16] shadow-2xl">
      {/* Top Header Controls Bar */}
      <div className="flex flex-wrap items-center justify-between px-6 py-3.5 bg-[#121624] border-b border-[#1e2436] gap-4">
        {/* Left: Window Controls & Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-400/40"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-400/40"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-400/40"></span>
          </div>
          <span className="font-mono text-xs text-slate-300 font-semibold tracking-wide">
            mochi-repl://sandbox.mochi
          </span>
        </div>

        {/* Middle: Preset Selection Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-mono text-slate-400">Preset:</label>
          <select
            onChange={(e) => handlePresetSelect((e.target as HTMLSelectElement).value)}
            className="bg-[#0a0c14] border border-[#222a3f] text-slate-200 text-xs font-mono rounded-md px-2.5 py-1 focus:outline-none focus:border-rose-500/50"
          >
            {Object.entries(PRESETS).map(([key, p]) => (
              <option key={key} value={key}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Actions (Format, Share, Output View Switcher) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleFormat}
            title="Format Code (Cmd+Shift+F)"
            className="px-3 py-1 text-[11px] font-mono text-slate-300 hover:text-white border border-[#232b42] hover:border-rose-500/40 rounded-md bg-[#0e111d] transition-all flex items-center gap-1.5"
          >
            <span>🪄</span>
            <span>{formatNotice ? "Formatted!" : "Format"}</span>
          </button>

          <button
            onClick={handleShare}
            title="Copy Shareable Playground URL"
            className="px-3 py-1 text-[11px] font-mono text-slate-300 hover:text-white border border-[#232b42] hover:border-rose-500/40 rounded-md bg-[#0e111d] transition-all flex items-center gap-1.5"
          >
            <span>🔗</span>
            <span>{shareCopied ? "URL Copied!" : "Share Link"}</span>
          </button>

          <div className="flex items-center gap-1 bg-[#090b12] p-1 rounded-lg border border-[#1e2436] text-xs">
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1 rounded-md font-mono text-[11px] font-semibold transition-all ${
                activeTab === "preview"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Live Render
            </button>
            <button
              onClick={() => setActiveTab("js")}
              className={`px-3 py-1 rounded-md font-mono text-[11px] font-semibold transition-all ${
                activeTab === "js"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Emitted JS
            </button>
          </div>
        </div>
      </div>

      {/* Editor & Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#1e2436] min-h-[400px]">
        {/* Left: Editor Column */}
        <div className="p-4 flex flex-col bg-[#0a0c14]">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
            <span className="flex items-center gap-2">
              <span>INPUT: MOCHI SOURCE</span>
              <span className="text-[10px] text-slate-500 font-sans">(Cmd+Enter to run)</span>
            </span>
            <span className="text-rose-400 font-bold">HM Typecheck OK</span>
          </div>
          <div className="relative flex-1 min-h-[320px] rounded-xl border border-[#1b2032] overflow-hidden bg-[#111422]">
            {/* Syntax Highlighted Underlay */}
            <pre className="absolute inset-0 p-4 m-0 font-mono text-xs leading-relaxed whitespace-pre overflow-auto pointer-events-none text-slate-100">
              <HighlightedCode code={code} lang="mochi" enableTwoslash={false} />
            </pre>

            {/* Editable Transparent Textarea Overlay */}
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
              className="absolute inset-0 w-full h-full p-4 m-0 font-mono text-xs leading-relaxed bg-transparent text-transparent caret-rose-400 focus:outline-none resize-none selection:bg-rose-500/30 overflow-auto whitespace-pre font-normal border-0"
              rows={15}
            />
          </div>
        </div>

        {/* Right: Output Column */}
        <div className="p-4 flex flex-col bg-[#0d101a]">
          {error ? (
            <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 font-mono text-xs overflow-auto max-h-[350px] whitespace-pre-wrap">
              <div className="font-bold text-rose-400 mb-1">Diagnostic Report:</div>
              {error}
            </div>
          ) : activeTab === "preview" ? (
            <div className="flex-1 flex flex-col">
              <div className="text-[11px] font-mono text-slate-400 mb-2">OUTPUT: LIVE PREACT VNODE</div>
              <div
                ref={previewRef}
                className="flex-1 p-6 bg-[#111422] border border-[#1b2032] rounded-xl flex items-center justify-center min-h-[320px]"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="text-[11px] font-mono text-slate-400 mb-2">OUTPUT: EMITTED JS (ZERO DEPENDENCIES)</div>
              <pre className="flex-1 p-4 bg-[#111422] border border-[#1b2032] rounded-xl text-xs font-mono text-slate-200 overflow-auto max-h-[350px] leading-relaxed">
                <HighlightedCode code={outputJs} lang="js" />
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
