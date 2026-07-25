import { isErr } from "@onrails/result";
import { h, render } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { compile } from "@mochi/compiler";

const DEFAULT_CODE = `// Welcome to Mochi! 🐾
// A statically-typed functional language with row polymorphism & JSX

let Badge = (props) =>
  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40">
    {props.text}
  </span>

let Card = (props) =>
  <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-bold text-slate-100 font-display">{props.title}</h3>
      <Badge text="0 tsc errors" />
    </div>
    <p className="text-sm text-slate-400">
      {"Mochi compiles to readable JS and strict-tsc-clean TypeScript."}
    </p>
  </div>

let app = <Card title="Hindley-Milner Type Inference" />
`;

export function Playground() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [outputJs, setOutputJs] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "js">("preview");
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const res = compile(code, { runtime: true });
      if (isErr(res)) {
        const diagnostics: Array<{ kind: string; message: string }> = res.error;
        setError(diagnostics.map((e: { kind: string; message: string }) => `[${e.kind}] ${e.message}`).join("\n"));
        setOutputJs("");
        return;
      }

      setError(null);
      setOutputJs(res.value);

      // Execute compiled code to extract 'app' or top-level component if preview tab active
      if (previewRef.current) {
        previewRef.current.innerHTML = "";
        try {
          // Provide 'h' pragma in scope
          const fn = new Function("h", `${res.value}; return typeof app !== 'undefined' ? app : null;`);
          const vnode = fn(h);
          if (vnode) {
            render(vnode, previewRef.current);
          } else {
            previewRef.current.innerText = "Code executed cleanly. (Define 'let app = <Component />' to preview UI)";
          }
        } catch (execErr: any) {
          previewRef.current.innerText = `Runtime Execution Error: ${execErr.message}`;
        }
      }
    } catch (e: any) {
      setError(e.message);
    }
  }, [code, activeTab]);

  return (
    <div className="my-10 border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/80 shadow-2xl backdrop-blur-xl">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
          </span>
          <h2 className="text-sm font-bold text-slate-200 tracking-wide font-display">
            Interactive Mochi Playground & Live Compiler
          </h2>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === "preview"
                ? "bg-pink-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Live Rendered UI
          </button>
          <button
            onClick={() => setActiveTab("js")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === "js"
                ? "bg-pink-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Compiled JS Output
          </button>
        </div>
      </div>

      {/* Main Grid Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 min-h-[380px]">
        {/* Left: Code Editor */}
        <div className="p-4 flex flex-col bg-slate-950/40">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
            <span>Mochi Source Code (.mochi)</span>
            <span className="text-pink-400">JSX + Preact</span>
          </div>
          <textarea
            value={code}
            onInput={(e) => setCode((e.target as HTMLTextAreaElement).value)}
            className="flex-1 w-full bg-slate-900/60 text-slate-100 font-mono text-sm p-4 rounded-xl border border-slate-800/80 focus:outline-none focus:border-pink-500/60 resize-none selection:bg-pink-500/40"
            rows={14}
          />
        </div>

        {/* Right: Output / Preview */}
        <div className="p-4 flex flex-col bg-slate-950/60">
          {error ? (
            <div className="p-4 bg-red-950/50 border border-red-800/60 rounded-xl text-red-300 font-mono text-xs overflow-auto max-h-[350px] whitespace-pre-wrap">
              <div className="font-bold text-red-400 mb-1">Compilation Diagnostic:</div>
              {error}
            </div>
          ) : activeTab === "preview" ? (
            <div className="flex-1 flex flex-col">
              <div className="text-xs text-slate-400 mb-2 font-mono">Live DOM Component Output</div>
              <div
                ref={previewRef}
                className="flex-1 p-6 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center justify-center min-h-[300px]"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="text-xs text-slate-400 mb-2 font-mono">Emitted JavaScript (Zero Dependencies)</div>
              <pre className="flex-1 p-4 bg-slate-900/80 border border-slate-800 rounded-xl text-xs font-mono text-pink-300 overflow-auto max-h-[350px]">
                {outputJs}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
