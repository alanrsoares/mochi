import { type Diagnostic, format, formatError } from "@mochi/compiler";
import { match } from "@onrails/pattern";
import { isErr, unwrapOk } from "@onrails/result";
import { h, render } from "preact";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import presetFib from "../examples/presets/fib.mochi?raw";
import presetJsx from "../examples/presets/jsx.mochi?raw";
import presetResult from "../examples/presets/result.mochi?raw";
import presetRowPoly from "../examples/presets/row-poly.mochi?raw";
import { createPlaygroundCompiler } from "../lib/playground-compiler";
import {
  decodeSharedCode,
  encodeSharedCode,
  isSharedCodeWithinLimits,
  MAX_ENCODED_CODE_LENGTH,
} from "../lib/shared-code";
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
const COMPILE_DEBOUNCE_MS = 280;
const URL_SYNC_DEBOUNCE_MS = 360;
/** `text-xs` (12px) × `leading-relaxed` (1.625); replaced by a measured value. */
const EDITOR_LINE_HEIGHT = 19.5;
/** Editor `p-4` top padding (1rem) — active-line bar + gutter share it. */
const EDITOR_PAD_TOP = 16;

type RightTab = "js" | "ts" | "dts" | "output" | "problems" | "settings";

const PRESETS: Record<string, { name: string; code: string }> = {
  jsx: { name: "JSX → h()", code: presetJsx },
  result: { name: "Result + switch", code: presetResult },
  rowPoly: { name: "Row polymorphism", code: presetRowPoly },
  fib: { name: "Fibonacci", code: presetFib },
};

function readAutorun(): boolean {
  const v = localStorage.getItem(AUTORUN_KEY);
  return v === null ? true : v === "1";
}

function readInitialCode(): string {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return saved;
  return PRESETS.jsx.code;
}

function diagSpans(diags: readonly Diagnostic[]): { start: number; end: number }[] {
  return diags.flatMap((d) => (d.span ? [{ start: d.span.start, end: d.span.end }] : []));
}

export function Playground() {
  const [code, setCode] = useState(readInitialCode);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [outputJs, setOutputJs] = useState("");
  const [outputTs, setOutputTs] = useState("");
  const [outputDts, setOutputDts] = useState("");
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [compileMs, setCompileMs] = useState<number | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [activeTab, setActiveTab] = useState<RightTab>("js");
  const [autoRun, setAutoRun] = useState(readAutorun);
  const [shareCopied, setShareCopied] = useState(false);
  const [formatNotice, setFormatNotice] = useState(false);
  const [splitPct, setSplitPct] = useState(50);
  const previewRef = useRef<HTMLDivElement>(null);
  const splitRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLPreElement>(null);
  const dragging = useRef(false);
  const compileSeq = useRef(0);
  const urlSeq = useRef(0);
  const compilerRef = useRef(createPlaygroundCompiler());
  const [activeLine, setActiveLine] = useState(1);
  const [scrollTop, setScrollTop] = useState(0);
  const [lineHeight, setLineHeight] = useState(EDITOR_LINE_HEIGHT);

  const lineCount = code.split("\n").length;
  const gutterText = Array.from({ length: lineCount }, (_, i) => i + 1).join("\n");

  const syncCursor = useCallback((el: HTMLTextAreaElement) => {
    const before = el.value.slice(0, el.selectionStart);
    let line = 1;
    for (let i = 0; i < before.length; i++) if (before[i] === "\n") line++;
    setActiveLine(line);
  }, []);

  // Measure the real line box once mounted so the active-line bar lines up
  // regardless of font metrics; fall back to the Tailwind `leading-relaxed` guess.
  useLayoutEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const measured = Number.parseFloat(getComputedStyle(el).lineHeight);
    if (Number.isFinite(measured) && measured > 0) setLineHeight(measured);
  }, []);

  // Restore share payload from `?code=` once (async gzip decode).
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const paramCode = new URLSearchParams(window.location.search).get("code");
      if (paramCode && paramCode.length > 0 && paramCode.length <= MAX_ENCODED_CODE_LENGTH) {
        try {
          const decoded = await decodeSharedCode(paramCode);
          if (!cancelled && isSharedCodeWithinLimits(paramCode, decoded) && decoded) {
            setCode(decoded);
          }
        } catch {
          // keep localStorage / preset fallback
        }
      }
      if (!cancelled) setBootstrapped(true);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const compiler = compilerRef.current;
    return () => compiler.dispose();
  }, []);

  useEffect(() => {
    localStorage.setItem(AUTORUN_KEY, autoRun ? "1" : "0");
  }, [autoRun]);

  const syncUrl = useCallback(async (source: string) => {
    urlSeq.current += 1;
    const seq = urlSeq.current;
    try {
      const encoded = await encodeSharedCode(source);
      if (seq !== urlSeq.current) return;
      if (!isSharedCodeWithinLimits(encoded, source)) return;
      const params = new URLSearchParams(window.location.search);
      params.set("code", encoded);
      const next = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
      window.history.replaceState(null, "", next);
      localStorage.setItem(STORAGE_KEY, source);
    } catch {
      // keep last good URL
    }
  }, []);

  const evaluate = useCallback((source: string) => {
    compileSeq.current += 1;
    const seq = compileSeq.current;
    setCompiling(true);
    void compilerRef.current.compile(source).then((result) => {
      if (seq !== compileSeq.current) return;
      setCompiling(false);
      if (result.ok) {
        setDiagnostics([]);
        setOutputJs(result.value.js);
        setOutputTs(result.value.ts);
        setOutputDts(result.value.dts);
        setCompileMs(result.value.ms);
        return;
      }
      setOutputJs("");
      setOutputTs("");
      setOutputDts("");
      setCompileMs(result.error.ms);
      if (result.error.diagnostics) {
        setDiagnostics(result.error.diagnostics);
        return;
      }
      setDiagnostics([
        {
          kind: "check",
          message: result.error.message ?? "Compilation failed",
        },
      ]);
    });
  }, []);
  // Debounced autorun compile.
  useEffect(() => {
    if (!bootstrapped || !autoRun) return;
    const id = window.setTimeout(() => evaluate(code), COMPILE_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [autoRun, bootstrapped, code, evaluate]);

  // Debounced URL + localStorage sync.
  useEffect(() => {
    if (!bootstrapped) return;
    const id = window.setTimeout(() => {
      void syncUrl(code);
    }, URL_SYNC_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [bootstrapped, code, syncUrl]);

  // Keep preview host mounted; imperative render survives parent re-renders.
  useLayoutEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    if (diagnostics.length > 0 || activeTab !== "output" || !outputJs) {
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
        evaluate(code);
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        handleFormat();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [code, evaluate, handleFormat]);

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
    void (async () => {
      await syncUrl(code);
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      } catch {
        setShareCopied(false);
      }
    })();
  };

  const handlePresetSelect = (e: Event) => {
    const key = (e.target as HTMLSelectElement).value;
    if (PRESETS[key]) setCode(PRESETS[key].code);
  };

  const problemCount = diagnostics.length;
  const errorSpans = diagSpans(diagnostics);
  const statusOk = diagnostics.length === 0;
  const statusText = compiling
    ? "compiling…"
    : compileMs === null
      ? statusOk
        ? "ready"
        : "error"
      : statusOk
        ? `ok · ${compileMs.toFixed(1)}ms`
        : `error · ${compileMs.toFixed(1)}ms`;
  const statusState = compiling ? "ok" : statusOk ? "ok" : "err";
  const tabs = (
    [
      ["js", "JavaScript"],
      ["ts", "TypeScript"],
      ["dts", ".d.ts"],
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
    <div
      className={activeTab === "output" && statusOk ? "flex h-full min-h-72 flex-col" : "hidden"}
    >
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
  } else if (activeTab === "ts") {
    activePane = (
      <EmitPane className="max-h-none min-h-72 lg:min-h-0">
        {outputTs ? (
          <HighlightedCode code={outputTs} lang="ts" />
        ) : (
          <span className="text-mute">No TypeScript emit yet — fix Problems or hit Run.</span>
        )}
      </EmitPane>
    );
  } else if (activeTab === "dts") {
    activePane = (
      <EmitPane className="max-h-none min-h-72 lg:min-h-0">
        {outputDts ? (
          <HighlightedCode code={outputDts} lang="ts" />
        ) : (
          <span className="text-mute">No .d.ts emit yet — fix Problems or hit Run.</span>
        )}
      </EmitPane>
    );
  } else if (activeTab === "problems") {
    activePane =
      diagnostics.length > 0 ? (
        <DiagBox className="max-h-none">
          <div className="mb-1 font-bold">diagnostics</div>
          {diagnostics.map((d) => formatError(d, code)).join("\n\n")}
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
      statusState={statusState}
      statusText={statusText}
      onToggleAutoRun={() => setAutoRun((v) => !v)}
      onRun={() => evaluate(code)}
      onFormat={handleFormat}
      onShare={handleShare}
      body={
        <div ref={splitRef} className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div
            className="flex min-h-0 min-w-0 flex-1 flex-col border-line border-b-2 lg:w-(--split) lg:flex-none lg:border-r-2 lg:border-b-0"
            style={{ ["--split" as string]: `${splitPct}%` }}
          >
            <div className="relative flex min-h-72 flex-1 overflow-hidden bg-foam lg:min-h-0">
              <pre
                ref={gutterRef}
                aria-hidden="true"
                className="m-0 select-none overflow-hidden whitespace-pre border-line border-r px-2 py-4 text-right font-mono text-2xs text-mute"
                style={{ lineHeight: `${lineHeight}px` }}
              >
                {gutterText}
              </pre>
              <div className="relative min-w-0 flex-1">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bg-fur/10"
                  style={{
                    height: `${lineHeight}px`,
                    top: `${EDITOR_PAD_TOP + (Math.min(activeLine, lineCount) - 1) * lineHeight - scrollTop}px`,
                  }}
                />
                <EditorMirror ref={mirrorRef} style={{ lineHeight: `${lineHeight}px` }}>
                  <HighlightedCode
                    code={code}
                    lang="mochi"
                    enableTwoslash={false}
                    errorSpans={errorSpans}
                    overlay
                    lineHeightPx={lineHeight}
                  />
                </EditorMirror>
                <EditorInput
                  ref={editorRef}
                  style={{ lineHeight: `${lineHeight}px` }}
                  value={code}
                  onInput={(e: Event) => {
                    const el = e.target as HTMLTextAreaElement;
                    setCode(el.value);
                    syncCursor(el);
                  }}
                  onKeyDown={(e: KeyboardEvent) => {
                    if (e.key !== "Tab") return;
                    e.preventDefault();
                    const el = e.target as HTMLTextAreaElement;
                    const start = el.selectionStart;
                    const end = el.selectionEnd;
                    const next = `${el.value.slice(0, start)}  ${el.value.slice(end)}`;
                    setCode(next);
                    const caret = start + 2;
                    requestAnimationFrame(() => {
                      el.setSelectionRange(caret, caret);
                      syncCursor(el);
                    });
                  }}
                  onClick={(e: Event) => syncCursor(e.target as HTMLTextAreaElement)}
                  onKeyUp={(e: Event) => syncCursor(e.target as HTMLTextAreaElement)}
                  onScroll={(e: Event) => {
                    const el = e.target as HTMLTextAreaElement;
                    setScrollTop(el.scrollTop);
                    if (gutterRef.current) gutterRef.current.scrollTop = el.scrollTop;
                    if (mirrorRef.current) {
                      mirrorRef.current.scrollTop = el.scrollTop;
                      mirrorRef.current.scrollLeft = el.scrollLeft;
                    }
                  }}
                  spellcheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  ariaLabel="Mochi source"
                />
              </div>
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
