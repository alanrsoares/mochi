import { type HoverInfo, hoverAt } from "@mochi/compiler";
import { useEffect, useRef, useState } from "preact/hooks";
import {
  highlightMochiCode,
  isHoverable,
  processTwoslash,
  splitSpansIntoLines,
  tokenClass,
} from "../lib/highlight.mochi";
import { HoverToken, TooltipAnchor, TooltipCard, TypeHint } from "../ui/primitives.mochi";

export type HighlightLanguage = "mochi" | "js" | "ts";

/** Span shape from highlight.mochi (`kind` — `type` is a mochi keyword). */
type TokenSpan = {
  text: string;
  kind: string;
  start: number;
};

type ErrorSpan = { start: number; end: number };

const overlapsError = (span: TokenSpan, errors: readonly ErrorSpan[]): boolean => {
  if (span.start < 0 || errors.length === 0) return false;
  const end = span.start + span.text.length;
  return errors.some((e) => span.start < e.end && end > e.start);
};

/** RegExp JS/TS highlighter — no RegExp in mochi prelude; stays host-side. */
export function highlightJsCode(code: string): TokenSpan[] {
  const spans: TokenSpan[] = [];
  const tokenRegex =
    /(\/\/.*$|\/\*[\s\S]*?\*\/)|(["'`].*?["'`])|\b(const|let|var|function|return|export|default|import|from|if|else|typeof|type|interface|null|undefined|true|false|as|readonly|declare)\b|\b([A-Z][A-Za-z0-9_]*)\b|(\d+\.?\d*)|([=><!+\-*/%&|:]+)|([{}()[\];,])/gm;

  let lastIndex = 0;
  let match: RegExpExecArray | null = tokenRegex.exec(code);

  while (match !== null) {
    if (match.index > lastIndex) {
      spans.push({ text: code.slice(lastIndex, match.index), kind: "plain", start: -1 });
    }

    const [fullMatch, comment, str, keyword, typeName, num, op, punct] = match;
    const start = match.index;

    if (comment) spans.push({ text: fullMatch, kind: "comment", start });
    else if (str) spans.push({ text: fullMatch, kind: "string", start });
    else if (keyword) spans.push({ text: fullMatch, kind: "keyword", start });
    else if (typeName) spans.push({ text: fullMatch, kind: "type", start });
    else if (num) spans.push({ text: fullMatch, kind: "number", start });
    else if (op) spans.push({ text: fullMatch, kind: "operator", start });
    else if (punct) spans.push({ text: fullMatch, kind: "punctuation", start });
    else spans.push({ text: fullMatch, kind: "plain", start });

    lastIndex = tokenRegex.lastIndex;
    match = tokenRegex.exec(code);
  }

  if (lastIndex < code.length) {
    spans.push({ text: code.slice(lastIndex), kind: "plain", start: -1 });
  }

  return spans;
}

/** Tailwind `max-w-xs`, mirrored here so placement can clamp before paint. */
const TOOLTIP_MAX_W = 320;
const VIEWPORT_PAD = 8;
const TOKEN_GAP = 8;

type TipPos = { x: number; y: number; place: "top" | "bottom" };

/** Centre above the token, flipping below and clamping to the viewport. */
function placeTooltip(el: HTMLElement): TipPos {
  const rect = el.getBoundingClientRect();
  const halfW = Math.min(TOOLTIP_MAX_W, window.innerWidth - VIEWPORT_PAD * 2) / 2;
  const minX = VIEWPORT_PAD + halfW;
  const maxX = window.innerWidth - VIEWPORT_PAD - halfW;
  const centre = rect.left + rect.width / 2;

  const place = rect.top < 120 ? "bottom" : "top";
  return {
    x: minX > maxX ? window.innerWidth / 2 : Math.min(Math.max(centre, minX), maxX),
    y: place === "top" ? rect.top - TOKEN_GAP : rect.bottom + TOKEN_GAP,
    place,
  };
}

type TokenTooltipProps = { hover: HoverInfo; tip: TipPos };

function TokenTooltip({ hover, tip }: TokenTooltipProps) {
  const arrow = tip.place === "top" ? "-mt-1 border-r-2 border-b-2" : "-mb-1 border-t-2 border-l-2";

  return (
    <TooltipAnchor $place={tip.place} style={{ left: `${tip.x}px`, top: `${tip.y}px` }}>
      {tip.place === "bottom" && (
        <span className={`mx-auto block h-2 w-2 rotate-45 border-line-strong bg-foam ${arrow}`} />
      )}
      <TooltipCard>
        <span className="mb-1 block border-line border-b pb-1 font-bold text-fur-deep">
          {hover.code}
        </span>
        {hover.doc && (
          <span className="mt-1 block font-sans text-3xs text-mute italic">{hover.doc}</span>
        )}
      </TooltipCard>
      {tip.place === "top" && (
        <span className={`mx-auto block h-2 w-2 rotate-45 border-line-strong bg-foam ${arrow}`} />
      )}
    </TooltipAnchor>
  );
}

type HoverResolver = (offset: number) => HoverInfo | null;

type CodeTokenProps = {
  span: TokenSpan;
  resolveHover: HoverResolver | null;
  hasError: boolean;
};

function CodeToken({ span, resolveHover, hasError }: CodeTokenProps) {
  // undefined = not resolved yet; null = resolved, no type under cursor
  const hoverRef = useRef<HoverInfo | null | undefined>(undefined);
  const tokenRef = useRef<HTMLSpanElement>(null);
  const [tip, setTip] = useState<TipPos | null>(null);
  const errCls = hasError
    ? " rounded-sm bg-fur/15 underline decoration-fur decoration-wavy underline-offset-2"
    : "";
  const cls = `${tokenClass(span.kind)}${errCls}`;
  const canHover = resolveHover !== null && span.start >= 0 && isHoverable(span.kind);

  // Fixed coords go stale the moment anything scrolls.
  useEffect(() => {
    if (!tip) return;
    const close = () => setTip(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [tip]);

  if (!canHover) {
    return <span className={cls || undefined}>{span.text}</span>;
  }

  const open = () => {
    if (hoverRef.current === undefined) hoverRef.current = resolveHover(span.start);
    const el = tokenRef.current;
    if (hoverRef.current && el) setTip(placeTooltip(el));
  };

  return (
    <HoverToken
      ref={tokenRef}
      className={cls}
      onMouseEnter={open}
      onMouseLeave={() => setTip(null)}
    >
      {span.text}
      {tip && hoverRef.current ? <TokenTooltip hover={hoverRef.current} tip={tip} /> : null}
    </HoverToken>
  );
}

type HighlightedCodeProps = {
  code: string;
  lang: HighlightLanguage;
  enableTwoslash?: boolean;
  errorSpans?: readonly ErrorSpan[];
  /**
   * Overlay mode for textarea mirrors: one glyph grid matching `whitespace-pre`
   * + regular weight. Docs cards keep the soft-wrap flex layout.
   */
  overlay?: boolean;
  /** Explicit line box height (px) — required for overlay ↔ textarea sync. */
  lineHeightPx?: number;
};

/** Color only — bold/italic shift monospace advance widths vs a plain textarea. */
const overlayTokenClass = (kind: string): string =>
  tokenClass(kind)
    .split(/\s+/)
    .filter((c) => c !== "font-bold" && c !== "italic")
    .join(" ");

export function HighlightedCode({
  code,
  lang,
  enableTwoslash = true,
  errorSpans = [],
  overlay = false,
  lineHeightPx,
}: HighlightedCodeProps) {
  const twoslash = enableTwoslash && lang === "mochi" && !overlay;
  const { cleanCode, annotations } = twoslash
    ? processTwoslash(code)
    : { cleanCode: code, annotations: new Map<number, HoverInfo>() };

  const spans: TokenSpan[] =
    lang === "mochi" ? highlightMochiCode(cleanCode) : highlightJsCode(cleanCode);
  const linesOfSpans: TokenSpan[][] = splitSpansIntoLines(spans);

  // hoverAt recompiles; cache by offset and only resolve on token mouseenter.
  const hoverCache = new Map<number, HoverInfo | null>();
  const resolveHover: HoverResolver | null = twoslash
    ? (offset) => {
        if (hoverCache.has(offset)) return hoverCache.get(offset) ?? null;
        const info = hoverAt(cleanCode, offset);
        hoverCache.set(offset, info);
        return info;
      }
    : null;

  const lineStyle =
    overlay && lineHeightPx !== undefined
      ? { height: `${lineHeightPx}px`, lineHeight: `${lineHeightPx}px` }
      : undefined;

  return (
    <code
      className={
        overlay
          ? "block font-mono font-normal text-base sm:text-xs"
          : "block font-mono text-xs leading-relaxed"
      }
      style={
        overlay && lineHeightPx !== undefined ? { lineHeight: `${lineHeightPx}px` } : undefined
      }
    >
      {linesOfSpans.map((lineSpans, lineIdx) => {
        const lineHover = annotations.get(lineIdx) as HoverInfo | undefined;

        if (overlay) {
          return (
            <div key={lineIdx} className="block overflow-hidden whitespace-pre" style={lineStyle}>
              {lineSpans.length === 0
                ? "\u00a0"
                : lineSpans.map((span, idx) => {
                    const errCls = overlapsError(span, errorSpans)
                      ? " bg-fur/15 underline decoration-fur decoration-wavy underline-offset-2"
                      : "";
                    return (
                      <span key={idx} className={`${overlayTokenClass(span.kind)}${errCls}`}>
                        {span.text}
                      </span>
                    );
                  })}
            </div>
          );
        }

        return (
          <div key={lineIdx} className="line flex flex-col">
            <div className="flex flex-wrap items-center">
              {lineSpans.map((span, idx) => (
                <CodeToken
                  key={idx}
                  span={span}
                  resolveHover={resolveHover}
                  hasError={overlapsError(span, errorSpans)}
                />
              ))}
            </div>

            {lineHover && (
              <TypeHint>
                <span className="font-bold">↳</span>
                <span className="font-semibold">{lineHover.code}</span>
              </TypeHint>
            )}
          </div>
        );
      })}
    </code>
  );
}
