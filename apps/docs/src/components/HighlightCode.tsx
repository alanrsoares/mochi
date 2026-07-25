import { type HoverInfo, hoverAt, lex } from "@mochi/compiler";
import { isErr, unwrapOk } from "@onrails/result";
import { cn } from "@styled-cva/react";
import { hoverToken, tooltipAnchor, tooltipCard } from "../ui/chrome";
import { TypeHint } from "../ui/primitives.mochi";

export type HighlightLanguage = "mochi" | "js";

type TokenSpan = {
  text: string;
  type:
    | "keyword"
    | "type"
    | "string"
    | "number"
    | "comment"
    | "operator"
    | "punctuation"
    | "jsx"
    | "plain";
  offset?: number;
};

export function highlightMochiCode(code: string): TokenSpan[] {
  const lexed = lex(code);
  if (isErr(lexed)) {
    return [{ text: code, type: "plain" }];
  }

  const tokens = unwrapOk(lexed);
  const spans: TokenSpan[] = [];
  let curPos = 0;

  for (const t of tokens) {
    if (t.span.start > curPos) {
      spans.push({
        text: code.slice(curPos, t.span.start),
        type: "plain",
      });
    }

    const tokText = code.slice(t.span.start, t.span.end);
    let type: TokenSpan["type"] = "plain";

    switch (t.t) {
      case "let":
      case "type":
      case "extern":
      case "switch":
      case "import":
      case "export":
        type = "keyword";
        break;
      case "num":
        type = "number";
        break;
      case "str":
      case "tmplstart":
      case "tmplmid":
      case "tmplend":
        type = "string";
        break;
      case "id":
        if (/^[A-Z]/.test(t.v)) {
          type = "type";
        } else {
          type = "plain";
        }
        break;
      case "lt":
      case "gt":
        type = "jsx";
        break;
      case "eq":
      case "arrow":
      case "tarrow":
      case "pipe":
      case "plus":
      case "minus":
      case "star":
      case "slash":
        type = "operator";
        break;
      case "lparen":
      case "rparen":
      case "lbrace":
      case "rbrace":
      case "lbracket":
      case "rbracket":
      case "colon":
      case "dot":
        type = "punctuation";
        break;
      default:
        type = "plain";
        break;
    }

    spans.push({ text: tokText, type, offset: t.span.start });
    curPos = t.span.end;
  }

  if (curPos < code.length) {
    spans.push({ text: code.slice(curPos), type: "plain" });
  }

  return spans;
}

export function highlightJsCode(code: string): TokenSpan[] {
  const spans: TokenSpan[] = [];
  const tokenRegex =
    /(\/\/.*$|\/\*[\s\S]*?\*\/)|(["'`].*?["'`])|\b(const|let|var|function|return|export|default|import|from|if|else|typeof|null|undefined|true|false)\b|\b([A-Z][A-Za-z0-9_]*)\b|(\d+\.?\d*)|([=><!+\-*/%&|:]+)|([{}()[\];,])/gm;

  let lastIndex = 0;
  let match: RegExpExecArray | null = tokenRegex.exec(code);

  while (match !== null) {
    if (match.index > lastIndex) {
      spans.push({ text: code.slice(lastIndex, match.index), type: "plain" });
    }

    const [fullMatch, comment, str, keyword, typeName, num, op, punct] = match;

    if (comment) spans.push({ text: fullMatch, type: "comment" });
    else if (str) spans.push({ text: fullMatch, type: "string" });
    else if (keyword) spans.push({ text: fullMatch, type: "keyword" });
    else if (typeName) spans.push({ text: fullMatch, type: "type" });
    else if (num) spans.push({ text: fullMatch, type: "number" });
    else if (op) spans.push({ text: fullMatch, type: "operator" });
    else if (punct) spans.push({ text: fullMatch, type: "punctuation" });
    else spans.push({ text: fullMatch, type: "plain" });

    lastIndex = tokenRegex.lastIndex;
    match = tokenRegex.exec(code);
  }

  if (lastIndex < code.length) {
    spans.push({ text: code.slice(lastIndex), type: "plain" });
  }

  return spans;
}

interface TwoslashAnnotation {
  lineIndex: number;
  hover: HoverInfo;
}

function processTwoslash(code: string): { cleanCode: string; annotations: TwoslashAnnotation[] } {
  const lines = code.split("\n");
  const cleanLines: string[] = [];
  const annotations: TwoslashAnnotation[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(\s*)\/\/\s*(\^+)\?/);

    if (match && cleanLines.length > 0) {
      const caretCol = line.indexOf("^");
      let byteOffset = 0;
      for (let j = 0; j < cleanLines.length - 1; j++) {
        byteOffset += cleanLines[j].length + 1;
      }
      const lastLine = cleanLines[cleanLines.length - 1];
      byteOffset += Math.min(caretCol, Math.max(0, lastLine.length - 1));

      const currentCleanCode = cleanLines.join("\n");
      try {
        const hover = hoverAt(currentCleanCode, byteOffset);
        if (hover) {
          annotations.push({ lineIndex: cleanLines.length - 1, hover });
        }
      } catch {
        // hoverAt can fail on partial caret lines
      }
      continue;
    }

    cleanLines.push(line);
  }

  return { cleanCode: cleanLines.join("\n"), annotations };
}

type HighlightedCodeProps = {
  code: string;
  lang: HighlightLanguage;
  enableTwoslash?: boolean;
};

export function HighlightedCode({ code, lang, enableTwoslash = true }: HighlightedCodeProps) {
  const { cleanCode, annotations } =
    enableTwoslash && lang === "mochi"
      ? processTwoslash(code)
      : { cleanCode: code, annotations: [] };
  const spans = lang === "mochi" ? highlightMochiCode(cleanCode) : highlightJsCode(cleanCode);

  const linesOfSpans: TokenSpan[][] = [[]];
  for (const span of spans) {
    const parts = span.text.split("\n");
    for (let p = 0; p < parts.length; p++) {
      if (p > 0) {
        linesOfSpans.push([]);
      }
      if (parts[p].length > 0) {
        linesOfSpans[linesOfSpans.length - 1].push({
          ...span,
          text: parts[p],
        });
      }
    }
  }

  const annotationByLine = new Map<number, HoverInfo>();
  for (const ann of annotations) {
    annotationByLine.set(ann.lineIndex, ann.hover);
  }

  return (
    <code className="block font-mono text-xs leading-relaxed">
      {linesOfSpans.map((lineSpans, lineIdx) => {
        const lineHover = annotationByLine.get(lineIdx);

        return (
          <div key={lineIdx} className="line flex flex-col">
            <div className="flex flex-wrap items-center">
              {lineSpans.map((span, idx) => {
                let cls = "text-ink";
                switch (span.type) {
                  case "keyword":
                    cls = "text-plum font-bold";
                    break;
                  case "type":
                    cls = "text-fur-deep font-bold";
                    break;
                  case "string":
                    cls = "text-ok";
                    break;
                  case "number":
                    cls = "text-code-number font-bold";
                    break;
                  case "comment":
                    cls = "text-mute italic";
                    break;
                  case "jsx":
                    cls = "text-lavender-deep font-bold";
                    break;
                  case "operator":
                    cls = "text-fur-deep/80";
                    break;
                  case "punctuation":
                    cls = "text-mute";
                    break;
                  default:
                    cls = "text-ink";
                    break;
                }

                let hoverInfo: HoverInfo | null = null;
                if (
                  enableTwoslash &&
                  lang === "mochi" &&
                  span.offset !== undefined &&
                  (span.type === "type" || span.type === "plain" || span.type === "keyword")
                ) {
                  try {
                    hoverInfo = hoverAt(cleanCode, span.offset);
                  } catch {
                    hoverInfo = null;
                  }
                }

                if (!hoverInfo) {
                  return (
                    <span key={idx} className={cls}>
                      {span.text}
                    </span>
                  );
                }

                return (
                  <span key={idx} className={cn(hoverToken(), cls)}>
                    {span.text}
                    <span className={tooltipAnchor()}>
                      <span className={tooltipCard()}>
                        <span className="mb-1 block border-line border-b pb-1 font-bold text-fur-deep">
                          {hoverInfo.code}
                        </span>
                        {hoverInfo.doc && (
                          <span className="mt-1 block font-sans text-3xs text-mute italic">
                            {hoverInfo.doc}
                          </span>
                        )}
                      </span>
                      <span className="mx-auto -mt-1 block h-2 w-2 rotate-45 transform border-line-strong border-r-2 border-b-2 bg-foam"></span>
                    </span>
                  </span>
                );
              })}
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
