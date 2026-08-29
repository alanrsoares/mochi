import { type Diagnostic, formatError } from "@mochi/compiler";
import { format } from "@mochi/dx/format";
import { isErr, unwrapOk } from "@onrails/result";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import { presetEntries } from "../lib/playground/presets.mochi";
import { clearPreview, renderPreview } from "../lib/playground/preview";
import { persistAutorun, readAutorun } from "../lib/playground/session";
import { EditorInput, EditorMirror, EmitPane, PaneTab, PreviewPane } from "../ui/primitives.mochi";
import { HighlightedCode } from "./HighlightCode";
import { Icon } from "./Icon";
import { PlaygroundProblems } from "./PlaygroundProblems.mochi";
import { PlaygroundRight, PlaygroundSettings } from "./PlaygroundRight.mochi";
import { PlaygroundView } from "./PlaygroundView.mochi";
import { playgroundStatus, usePlaygroundCompile } from "./use-playground-compile";
import { usePlaygroundSource } from "./use-playground-source";

/** `text-xs` (12px) × `leading-relaxed` (1.625); replaced by measured value. */
const EDITOR_LINE_HEIGHT = 19.5;
/** Editor `p-4` top padding — active-line bar + gutter share it. */
const EDITOR_PAD_TOP = 16;

type RightTab = "js" | "ts" | "dts" | "output" | "problems" | "settings";

/** The three emit tabs share one pane shape — id picks the emit, lang the highlighter. */
const EMIT_TABS = [
  { id: "js", lang: "js", empty: "No emit yet — fix Problems or hit Run." },
  { id: "ts", lang: "ts", empty: "No TypeScript emit yet — fix Problems or hit Run." },
  { id: "dts", lang: "ts", empty: "No .d.ts emit yet — fix Problems or hit Run." },
] as const;

const diagSpans = (diags: readonly Diagnostic[]): { start: number; end: number }[] =>
  diags.flatMap((d) => (d.span ? [{ start: d.span.start, end: d.span.end }] : []));

export function Playground() {
  const { code, setCode, bootstrapped, syncShareUrl } = usePlaygroundSource();
  const [autoRun, setAutoRun] = useState(readAutorun);
  const { outputJs, outputTs, outputDts, diagnostics, compileMs, compiling, evaluate } =
    usePlaygroundCompile(code, autoRun, bootstrapped);
  const [activeTab, setActiveTab] = useState<RightTab>("js");
  const [shareCopied, setShareCopied] = useState(false);
  const [formatNotice, setFormatNotice] = useState(false);
  const [splitPct, setSplitPct] = useState(50);
  const [mobilePane, setMobilePane] = useState<"code" | "result">("code");
  const previewRef = useRef<HTMLDivElement>(null);
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

  // Keep preview host mounted; imperative render survives parent re-renders.
  useLayoutEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    if (diagnostics.length > 0 || activeTab !== "output" || !outputJs) {
      clearPreview(el);
      return;
    }
    renderPreview(el, outputJs);
  });

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
    if (preset) setCode(preset.code);
  };

  const problemCount = diagnostics.length;
  const errorSpans = diagSpans(diagnostics);
  const statusOk = diagnostics.length === 0;
  const { text: statusText, state: statusState } = playgroundStatus(compiling, compileMs, statusOk);
  const tabs = (
    [
      { id: "js" as const, label: "JavaScript" },
      { id: "ts" as const, label: "TypeScript" },
      { id: "dts" as const, label: ".d.ts" },
      { id: "output" as const, label: "Output" },
      {
        id: "problems" as const,
        label: `Problems${problemCount ? ` (${problemCount})` : ""}`,
        icon: "circle-alert" as const,
      },
      { id: "settings" as const, label: "Settings", icon: "settings-2" as const },
    ] as const
  ).map((tab) => (
    <PaneTab
      key={tab.id}
      role="tab"
      aria-selected={activeTab === tab.id}
      onClick={() => setActiveTab(tab.id)}
      $active={activeTab === tab.id ? "on" : "off"}
    >
      {"icon" in tab ? <Icon name={tab.icon} className="size-3.5 shrink-0" /> : null}
      {tab.label}
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

  const emits: Record<(typeof EMIT_TABS)[number]["id"], string> = {
    js: outputJs,
    ts: outputTs,
    dts: outputDts,
  };
  const emitTab = EMIT_TABS.find((t) => t.id === activeTab);

  let activePane = null;
  if (emitTab) {
    activePane = (
      <EmitPane className="max-h-none min-h-72 lg:min-h-0">
        {emits[emitTab.id] ? (
          <HighlightedCode code={emits[emitTab.id]} lang={emitTab.lang} />
        ) : (
          <span className="inline-flex items-center gap-2 text-mute">
            <Icon name="file-code" className="size-4 shrink-0 opacity-70" />
            {emitTab.empty}
          </span>
        )}
      </EmitPane>
    );
  } else if (activeTab === "problems") {
    activePane = (
      <PlaygroundProblems
        hasProblems={diagnostics.length > 0}
        diagnosticsFormatted={diagnostics.map((d) => formatError(d, code)).join("\n\n")}
      />
    );
  } else if (activeTab === "settings") {
    activePane = (
      <PlaygroundSettings
        onPreset={handlePresetSelect as () => void}
        presetOptions={presetEntries.map(([key, p]) => (
          <option key={key} value={key}>
            {p.name}
          </option>
        ))}
      />
    );
  }

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
                pane={
                  <>
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
