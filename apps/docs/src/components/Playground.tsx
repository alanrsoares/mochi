import { isErr } from "@onrails/result";
import { h, render } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { compile } from "@mochi/compiler";
import { HighlightedCode } from "./HighlightCode";

const DEFAULT_CODE = `// Mochi W-Engine Live Sandbox 🐾
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

let app = <Card title="Algorithm W + Universal JSX" />
`;

export function Playground() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [outputJs, setOutputJs] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "js">("preview");
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
            previewRef.current.innerText =
              "Execution clean. Define 'let app = <Component />' to render UI preview.";
          }
        } catch (execErr: any) {
          previewRef.current.innerText = `Runtime Evaluation Error: ${execErr.message}`;
        }
      }
    } catch (e: any) {
      setError(e.message);
    }
  }, [code, activeTab]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-10 border border-[#1e2436] rounded-2xl overflow-hidden bg-[#0c0e16] shadow-2xl">
      {/* Top Bar Header */}
      <div className="flex flex-wrap items-center justify-between px-6 py-3.5 bg-[#121624] border-b border-[#1e2436] gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-400/40"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-400/40"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-400/40"></span>
          </div>
          <span className="font-mono text-xs text-slate-400 font-semibold tracking-wide">
            mochi-repl://sandbox.mochi
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="px-3 py-1 text-[11px] font-mono text-slate-400 hover:text-slate-200 border border-slate-700/60 rounded-md bg-slate-900/60 transition-colors"
          >
            {copied ? "Copied!" : "Copy Source"}
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

      {/* Code Editor & Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#1e2436] min-h-[380px]">
        {/* Left: Editor */}
        <div className="p-4 flex flex-col bg-[#0a0c14]">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
            <span>INPUT: MOCHI SOURCE</span>
            <span className="text-rose-400 font-bold">HM Typecheck OK</span>
          </div>
          <textarea
            value={code}
            onInput={(e) => setCode((e.target as HTMLTextAreaElement).value)}
            className="flex-1 w-full bg-[#111422] text-slate-100 font-mono text-xs p-4 rounded-xl border border-[#1b2032] focus:outline-none focus:border-rose-500/50 resize-none leading-relaxed selection:bg-rose-500/30"
            rows={14}
          />
        </div>

        {/* Right: Output */}
        <div className="p-4 flex flex-col bg-[#0d101a]">
          {error ? (
            <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 font-mono text-xs overflow-auto max-h-[350px] whitespace-pre-wrap">
              <div className="font-bold text-rose-400 mb-1">
                Diagnostic Report:
              </div>
              {error}
            </div>
          ) : activeTab === "preview" ? (
            <div className="flex-1 flex flex-col">
              <div className="text-[11px] font-mono text-slate-400 mb-2">
                OUTPUT: LIVE PREACT VNODE
              </div>
              <div
                ref={previewRef}
                className="flex-1 p-6 bg-[#111422] border border-[#1b2032] rounded-xl flex items-center justify-center min-h-[300px]"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="text-[11px] font-mono text-slate-400 mb-2">
                OUTPUT: EMITTED JS (ZERO DEPENDENCIES)
              </div>
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
