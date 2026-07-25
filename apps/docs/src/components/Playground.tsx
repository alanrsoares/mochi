import { compile, format } from "@mochi/compiler";
import { match } from "@onrails/pattern";
import { isErr, unwrapOk } from "@onrails/result";
import { h, render } from "preact";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import presetFib from "../examples/presets/fib.mochi?raw";
import presetJsx from "../examples/presets/jsx.mochi?raw";
import presetResult from "../examples/presets/result.mochi?raw";
import presetRowPoly from "../examples/presets/row-poly.mochi?raw";
import {
  DiagBox,
  EditorInput,
  EditorMirror,
  EmitPane,
  PaneTab,
  PreviewPane,
} from "../ui/primitives.mochi";
import { HighlightedCode } from "./HighlightCode";
import { PlaygroundRight, PlaygroundSettings } from "./PlaygroundRight.mochi";
import PlaygroundView from "./PlaygroundView.mochi";

/** Emit is an ESM module (`import { match }…`); playground runs it in `new Function`. */
const stripModuleImports = (js: string): string =>
  js.replace(/^import\s+.+;?\s*$/gm, "").trimStart();

const STORAGE_KEY = "mochi_playground_code_v2";
const AUTORUN_KEY = "mochi_playground_autorun";

type RightTab = "js" | "output" | "problems" | "settings";

const PRESETS: Record<string, { name: string; code: string }> = {
  jsx: { name: "JSX → h()", code: presetJsx },
  result: { name: "Result + switch", code: presetResult },
  rowPoly: { name: "Row polymorphism", code: presetRowPoly },
  fib: { name: "Fibonacci", code: presetFib },
};

function safeDecode(encoded: string): string {
  try {
    return window.decodeURIComponent(encoded);
  } catch {
    return "";
  }
}

function readAutorun(): boolean {
  const v = localStorage.getItem(AUTORUN_KEY);
  return v === null ? true : v === "1";
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
  const [activeTab, setActiveTab] = useState<RightTab>("js");
  const [autoRun, setAutoRun] = useState(readAutorun);
  const [shareCopied, setShareCopied] = useState(false);
  const [formatNotice, setFormatNotice] = useState(false);
  const [splitPct, setSplitPct] = useState(50);
  const previewRef = useRef<HTMLDivElement>(null);
  const splitRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, code);
    const encoded = encodeURIComponent(code);
    const newURL = `${window.location.protocol}//${window.location.host}${window.location.pathname}?code=${encoded}`;
    window.history.replaceState(null, "", newURL);
  }, [code]);

  useEffect(() => {
    localStorage.setItem(AUTORUN_KEY, autoRun ? "1" : "0");
  }, [autoRun]);

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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setOutputJs("");
    }
  }, [code]);

  useEffect(() => {
    if (autoRun) evaluate();
  }, [autoRun, evaluate]);

  // Keep preview host mounted; imperative render survives parent re-renders.
  useLayoutEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    if (error || activeTab !== "output" || !outputJs) {
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
    } catch (execErr: unknown) {
      render(null, el);
      el.innerText = `Runtime error: ${execErr instanceof Error ? execErr.message : String(execErr)}`;
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
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "e" || e.key === "E" || e.key === "Enter") {
        e.preventDefault();
        evaluate();
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        handleFormat();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [evaluate, handleFormat]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !splitRef.current) return;
      const rect = splitRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.min(70, Math.max(30, pct)));
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handlePresetSelect = (e: Event) => {
    const key = (e.target as HTMLSelectElement).value;
    if (PRESETS[key]) setCode(PRESETS[key].code);
  };

  const problemCount = error ? error.split("\n").filter(Boolean).length : 0;

  const tabs = (
    [
      ["js", "JavaScript"],
      ["output", "Output"],
      ["problems", `Problems${problemCount ? ` (${problemCount})` : ""}`],
      ["settings", "Settings"],
    ] as const
  ).map(([id, label]) => (
    <PaneTab
      key={id}
      role="tab"
      aria-selected={activeTab === id}
      onClick={() => setActiveTab(id)}
      $active={activeTab === id ? "on" : "off"}
    >
      {label}
    </PaneTab>
  ));

  // Keep Output host mounted across tab switches so imperative preview isn't wiped.
  const outputHost = (
    <div className={activeTab === "output" && !error ? "flex h-full min-h-72 flex-col" : "hidden"}>
      <PreviewPane ref={previewRef} className="min-h-72 lg:min-h-0" />
    </div>
  );

  let activePane = null;
  if (activeTab === "js") {
    activePane = (
      <EmitPane className="max-h-none min-h-72 lg:min-h-0">
        {outputJs ? (
          <HighlightedCode code={outputJs} lang="js" />
        ) : (
          <span className="text-mute">No emit yet — fix Problems or hit Run.</span>
        )}
      </EmitPane>
    );
  } else if (activeTab === "problems") {
    activePane = error ? (
      <DiagBox className="max-h-none">
        <div className="mb-1 font-bold">diagnostics</div>
        {error}
      </DiagBox>
    ) : (
      <p className="font-mono text-mute text-xs">No problems.</p>
    );
  } else if (activeTab === "settings") {
    activePane = (
      <PlaygroundSettings
        onPreset={handlePresetSelect as () => void}
        presetOptions={Object.entries(PRESETS).map(([key, p]) => (
          <option key={key} value={key}>
            {p.name}
          </option>
        ))}
      />
    );
  }

  return (
    <PlaygroundView
      autoRunLabel={autoRun ? "Auto-run ✓" : "Auto-run"}
      formatLabel={formatNotice ? "Formatted" : "Format"}
      shareLabel={shareCopied ? "Copied!" : "Copy Share Link"}
      statusState={error ? "err" : "ok"}
      statusText={error ? "error" : "ok"}
      onToggleAutoRun={() => setAutoRun((v) => !v)}
      onRun={evaluate}
      onFormat={handleFormat}
      onShare={handleShare}
      body={
        <div ref={splitRef} className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div
            className="flex min-h-0 min-w-0 flex-1 flex-col border-line border-b-2 lg:w-(--split) lg:flex-none lg:border-r-2 lg:border-b-0"
            style={{ ["--split" as string]: `${splitPct}%` }}
          >
            <div className="relative min-h-72 flex-1 overflow-hidden bg-foam lg:min-h-0">
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
                ariaLabel="Mochi source"
              />
            </div>
          </div>

          <button
            type="button"
            aria-label="Resize editor"
            className="hidden w-2 shrink-0 cursor-col-resize items-center justify-center border-0 bg-peach p-0 hover:bg-fur/20 lg:flex"
            onMouseDown={() => {
              dragging.current = true;
              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
            }}
          >
            <span className="h-8 w-1 rounded-full bg-line-strong" />
          </button>

          <PlaygroundRight
            tabs={tabs}
            pane={
              <>
                {outputHost}
                {activePane}
              </>
            }
          />
        </div>
      }
    />
  );
}
