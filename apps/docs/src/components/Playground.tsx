import { type Diagnostic, formatError } from "@mochi/compiler";
import { format } from "@mochi/dx/format";
import { isErr, unwrapOk } from "@onrails/result";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { presetEntries } from "../lib/playground/presets.mochi";
import { clearPreview, renderPreview } from "../lib/playground/preview";
import { persistAutorun, readAutorun } from "../lib/playground/session";
import { EditorInput, EditorMirror, PaneTab } from "../ui/primitives.mochi";
import { HighlightedCode } from "./HighlightCode";
import { Icon } from "./Icon";
import { PlaygroundProblems } from "./PlaygroundProblems.mochi";
import { PlaygroundExamples, PlaygroundRight } from "./PlaygroundRight.mochi";
import { PlaygroundView } from "./PlaygroundView.mochi";
import { playgroundStatus, usePlaygroundCompile } from "./use-playground-compile";
import { usePlaygroundSource } from "./use-playground-source";

/** `text-xs` (12px) × `leading-relaxed` (1.625); replaced by measured value. */
const EDITOR_LINE_HEIGHT = 19.5;
/** Editor `p-4` top padding — active-line bar + gutter share it. */
const EDITOR_PAD_TOP = 16;

type RightTab = "preview" | "code" | "problems";
type EmitTarget = "js" | "ts" | "dts";

const EMIT_TARGETS = [
  {
    id: "js",
    label: "JavaScript",
    lang: "js",
    file: "app.js",
    detail: "JavaScript executed by the preview.",
  },
  {
    id: "ts",
    label: "TypeScript",
    lang: "ts",
    file: "app.ts",
    detail: "TypeScript with inferred annotations.",
  },
  {
    id: "dts",
    label: "Declarations",
    lang: "ts",
    file: "app.d.mochi.ts",
    detail: "The inferred types available to TypeScript consumers.",
  },
] as const;

const RESULT_VIEWS = [
  { id: "preview", label: "Preview", icon: "play" },
  { id: "code", label: "Generated code", icon: "code" },
  { id: "problems", label: "Problems", icon: "circle-alert" },
] as const;

const diagSpans = (diags: readonly Diagnostic[]): { start: number; end: number }[] =>
  diags.flatMap((d) => (d.span ? [{ start: d.span.start, end: d.span.end }] : []));

export function Playground() {
  const { code, setCode, bootstrapped, syncShareUrl } = usePlaygroundSource();
  const [autoRun, setAutoRun] = useState(readAutorun);
  const {
    outputJs,
    outputTs,
    outputDts,
    outputSource,
    diagnostics,
    compileMs,
    compiling,
    evaluate,
  } = usePlaygroundCompile(code, autoRun, bootstrapped);
  const [activeTab, setActiveTab] = useState<RightTab>("preview");
  const [emitTarget, setEmitTarget] = useState<EmitTarget>("js");
  const [copyNotice, setCopyNotice] = useState("");
  const copySeq = useRef(0);
  const [shareCopied, setShareCopied] = useState(false);
  const [formatNotice, setFormatNotice] = useState(false);
  const [splitPct, setSplitPct] = useState(50);
  const [mobilePane, setMobilePane] = useState<"code" | "result">("code");
  const previewRef = useRef<HTMLElement>(null);
  const splitRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLPreElement>(null);
  const dragging = useRef(false);
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

  useEffect(() => {
    persistAutorun(autoRun);
  }, [autoRun]);

  useEffect(() => {
    ++copySeq.current;
    setCopyNotice("");
  }, [outputJs, outputTs, outputDts, emitTarget]);

  // Keep preview host mounted; imperative render survives parent re-renders.
  useLayoutEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    if (diagnostics.length > 0 || activeTab !== "preview" || !outputJs) {
      clearPreview(el);
      return;
    }
    renderPreview(el, outputJs);
    return () => clearPreview(el);
  }, [diagnostics, activeTab, outputJs]);

  const handleFormat = useCallback(() => {
    const res = format(code);
    if (!isErr(res)) {
      setCode(unwrapOk(res));
      setFormatNotice(true);
      setTimeout(() => setFormatNotice(false), 1800);
    }
  }, [code, setCode]);

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
      await syncShareUrl(code);
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
    const preset = presetEntries.find(([k]) => k === key)?.[1];
    if (preset) {
      setCode(preset.code);
      setActiveTab("preview");
      setMobilePane("result");
    }
  };

  const problemCount = diagnostics.length;
  const errorSpans = diagSpans(diagnostics);
  const statusOk = diagnostics.length === 0;
  const { text: statusText, state: statusState } = playgroundStatus(compiling, compileMs, statusOk);
  const tabs = RESULT_VIEWS.map((tab, index) => (
    <PaneTab
      key={tab.id}
      id={`result-tab-${tab.id}`}
      role="tab"
      aria-selected={activeTab === tab.id}
      aria-controls="result-panel"
      tabIndex={activeTab === tab.id ? 0 : -1}
      onClick={() => setActiveTab(tab.id)}
      onKeyDown={(event: KeyboardEvent) => {
        const next =
          event.key === "ArrowRight"
            ? (index + 1) % RESULT_VIEWS.length
            : event.key === "ArrowLeft"
              ? (index + RESULT_VIEWS.length - 1) % RESULT_VIEWS.length
              : event.key === "Home"
                ? 0
                : event.key === "End"
                  ? RESULT_VIEWS.length - 1
                  : null;
        if (next === null) return;
        event.preventDefault();
        const view = RESULT_VIEWS[next]!;
        setActiveTab(view.id);
        document.getElementById(`result-tab-${view.id}`)?.focus();
      }}
      $active={activeTab === tab.id ? "on" : "off"}
      className="px-2.5 focus-visible:outline-2 focus-visible:outline-fur focus-visible:outline-offset-[-2px] sm:px-3"
    >
      <Icon name={tab.icon} className="hidden size-3.5 shrink-0 sm:block" />
      {tab.label}
      {tab.id === "problems" && problemCount > 0 ? (
        <span className="rounded bg-fur/15 px-1.5 text-fur-deep">{problemCount}</span>
      ) : null}
    </PaneTab>
  ));

  const outputHost = (
    <div className={activeTab === "preview" ? "block" : "hidden"}>
      <div className="border-line border-b px-4 py-4 sm:px-6">
        <h2 className="font-semibold text-sm">Live preview</h2>
        <p className="mt-1 text-mute text-xs">
          The UI bound to <code>app</code>, including Task results.
        </p>
      </div>
      {diagnostics.length > 0 ? (
        <div className="space-y-3 px-4 py-6 sm:px-6">
          <p className="font-semibold text-sm">Fix the source to see its result.</p>
          <button
            type="button"
            className="text-fur-deep text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-fur"
            onClick={() => setActiveTab("problems")}
          >
            View {problemCount} {problemCount === 1 ? "problem" : "problems"}
          </button>
        </div>
      ) : !outputJs ? (
        <p className="px-4 py-6 text-mute text-sm" role="status">
          {compiling ? "Compiling your source…" : "Run your source to see its result."}
        </p>
      ) : null}
      <section
        ref={previewRef}
        className={statusOk && outputJs ? "min-h-48 overflow-auto bg-foam p-4 sm:p-6" : "hidden"}
        aria-label="Live preview"
        aria-live="polite"
      />
    </div>
  );

  const emits: Record<EmitTarget, string> = { js: outputJs, ts: outputTs, dts: outputDts };
  const target = EMIT_TARGETS.find((t) => t.id === emitTarget)!;
  const generated = emits[emitTarget];
  const copyGenerated = async (): Promise<void> => {
    const seq = ++copySeq.current;
    try {
      await navigator.clipboard.writeText(generated);
      if (seq === copySeq.current) setCopyNotice("Copied");
    } catch {
      if (seq === copySeq.current) setCopyNotice("Could not copy. Select the code to copy it.");
    }
  };

  const activePane =
    activeTab === "code" ? (
      <div>
        <div className="space-y-2 border-line border-b px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="sr-only">Generated code format</span>
              <select
                aria-label="Generated code format"
                value={emitTarget}
                onChange={(event) => {
                  ++copySeq.current;
                  setCopyNotice("");
                  setEmitTarget(event.currentTarget.value as EmitTarget);
                }}
                className="rounded-lg border border-line bg-foam px-2 py-1.5 text-base text-ink focus-visible:outline-2 focus-visible:outline-fur sm:text-sm"
              >
                {EMIT_TARGETS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <span className="font-mono text-mute text-xs">{target.file}</span>
            </label>
            <button
              type="button"
              disabled={!generated}
              onClick={() => void copyGenerated()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-sm hover:bg-peach focus-visible:outline-2 focus-visible:outline-fur disabled:opacity-40"
              aria-label="Copy generated code"
            >
              <Icon name={copyNotice === "Copied" ? "check" : "copy"} className="size-3.5" />
              {copyNotice === "Copied" ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="text-mute text-xs">{target.detail}</p>
          {copyNotice ? (
            <p role="status" className="text-mute text-xs">
              {copyNotice}
            </p>
          ) : null}
        </div>
        {generated ? (
          <pre className="m-0 overflow-auto whitespace-pre bg-foam p-4 font-mono text-xs leading-5">
            <HighlightedCode code={generated} lang={target.lang} overlay lineHeightPx={20} />
          </pre>
        ) : (
          <p role="status" className="px-4 py-6 text-mute text-sm">
            {compiling
              ? "Compiling your source…"
              : diagnostics.length
                ? "Generated code is unavailable until the source compiles."
                : "Run your source to generate code."}
          </p>
        )}
      </div>
    ) : activeTab === "problems" ? (
      <div className="p-4 sm:p-6">
        <PlaygroundProblems
          hasProblems={diagnostics.length > 0}
          hasRun={compileMs !== null}
          diagnosticsFormatted={diagnostics.map((d) => formatError(d, code)).join("\n\n")}
        />
      </div>
    ) : null;

  return (
    <PlaygroundView
      autoRun={autoRun}
      formatNotice={formatNotice}
      shareCopied={shareCopied}
      compiling={compiling}
      statusState={statusState}
      statusText={statusText}
      onToggleAutoRun={() => setAutoRun((v) => !v)}
      onRun={() => {
        evaluate(code);
        if (!window.matchMedia("(min-width: 1024px)").matches) setMobilePane("result");
      }}
      onFormat={handleFormat}
      onShare={handleShare}
      body={
        <>
          <div
            className="grid shrink-0 grid-cols-2 border-line border-b-2 bg-peach lg:hidden"
            role="tablist"
            aria-label="Editor or result"
          >
            <PaneTab
              className="flex justify-center"
              role="tab"
              aria-selected={mobilePane === "code"}
              onClick={() => setMobilePane("code")}
              $active={mobilePane === "code" ? "on" : "off"}
            >
              <Icon name="code" className="size-3.5 shrink-0" />
              Code
            </PaneTab>
            <PaneTab
              className="flex justify-center"
              role="tab"
              aria-selected={mobilePane === "result"}
              onClick={() => setMobilePane("result")}
              $active={mobilePane === "result" ? "on" : "off"}
            >
              <Icon name="panel-right" className="size-3.5 shrink-0" />
              Result
            </PaneTab>
          </div>
          <div ref={splitRef} className="flex min-h-0 flex-1 flex-col lg:flex-row">
            <div
              className={`${mobilePane === "code" ? "flex" : "hidden"} min-h-0 min-w-0 flex-1 flex-col border-line lg:flex lg:w-(--split) lg:flex-none lg:border-r-2`}
              style={{ ["--split" as string]: `${splitPct}%` }}
            >
              <div className="relative flex min-h-0 flex-1 overflow-hidden bg-foam">
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

            <div
              className={`${mobilePane === "result" ? "flex" : "hidden"} min-h-0 min-w-0 flex-1 lg:flex`}
            >
              <PlaygroundRight
                tabs={tabs}
                panelId="result-panel"
                labelledBy={`result-tab-${activeTab}`}
                examples={
                  <PlaygroundExamples
                    onPreset={handlePresetSelect as () => void}
                    presetKey={presetEntries.find(([, p]) => p.code === code)?.[0] ?? ""}
                    presetOptions={presetEntries.map(([key, p]) => (
                      <option key={key} value={key}>
                        {p.name}
                      </option>
                    ))}
                  />
                }
                pane={
                  <>
                    {outputSource !== null && outputSource !== code ? (
                      <p role="status" className="border-line border-b bg-peach px-4 py-3 text-sm">
                        {autoRun
                          ? "Updating this result…"
                          : "Source changed. Run to update this result."}
                      </p>
                    ) : null}
                    {outputHost}
                    {activePane}
                  </>
                }
              />
            </div>
          </div>
        </>
      }
    />
  );
}
