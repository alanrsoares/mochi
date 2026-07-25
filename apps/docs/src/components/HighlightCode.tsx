import { isErr, unwrapOk } from "@onrails/result";
import { hoverAt, type HoverInfo, lex } from "@mochi/compiler";

export type HighlightLanguage = "mochi" | "js";

type TokenSpan = {
  text: string;
  type: "keyword" | "type" | "string" | "number" | "comment" | "operator" | "punctuation" | "jsx" | "plain";
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
  const tokenRegex = /(\/\/.*$|\/\*[\s\S]*?\*\/)|(["'`].*?["'`])|\b(const|let|var|function|return|export|default|import|from|if|else|typeof|null|undefined|true|false)\b|\b([A-Z][A-Za-z0-9_]*)\b|(\d+\.?\d*)|([=><!+\-*/%&|:]+)|([{}()\[\];,])/gm;

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
      // Compute byte offset of caret position in clean code
      let byteOffset = 0;
      for (let j = 0; j < cleanLines.length - 1; j++) {
        byteOffset += cleanLines[j].length + 1; // +1 for \n
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
        // ignore fallback
      }
      continue;
    }

    cleanLines.push(line);
  }

  return { cleanCode: cleanLines.join("\n"), annotations };
}

export function HighlightedCode({
  code,
  lang,
  enableTwoslash = true,
}: {
  code: string;
  lang: HighlightLanguage;
  enableTwoslash?: boolean;
}) {
  const { cleanCode, annotations } = enableTwoslash && lang === "mochi" ? processTwoslash(code) : { cleanCode: code, annotations: [] };
  const spans = lang === "mochi" ? highlightMochiCode(cleanCode) : highlightJsCode(cleanCode);

  // Group spans by line for rendering line-by-line with Twoslash annotations
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
    <code className="font-mono text-xs leading-relaxed block">
      {linesOfSpans.map((lineSpans, lineIdx) => {
        const lineHover = annotationByLine.get(lineIdx);

        return (
          <div key={lineIdx} className="line flex flex-col">
            <div className="flex flex-wrap items-center">
              {lineSpans.map((span, idx) => {
                let cls = "text-slate-200";
                switch (span.type) {
                  case "keyword":
                    cls = "text-rose-400 font-bold";
                    break;
                  case "type":
                    cls = "text-amber-300 font-bold";
                    break;
                  case "string":
                    cls = "text-[#6EE7B7]";
                    break;
                  case "number":
                    cls = "text-cyan-300 font-bold";
                    break;
                  case "comment":
                    cls = "text-slate-500 italic";
                    break;
                  case "jsx":
                    cls = "text-pink-400 font-bold";
                    break;
                  case "operator":
                    cls = "text-rose-300/80";
                    break;
                  case "punctuation":
                    cls = "text-slate-400";
                    break;
                  default:
                    cls = "text-slate-200";
                    break;
                }

                // Query HM hover info for interactive hover card
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
                  <span
                    key={idx}
                    className={`${cls} relative group cursor-help underline underline-offset-4 decoration-rose-500/40 hover:decoration-rose-400 hover:bg-rose-950/30 rounded px-0.5 transition-colors`}
                  >
                    {span.text}
                    {/* Twoslash Interactive Hover Card */}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none w-max max-w-xs shadow-2xl">
                      <span className="block bg-[#121624] border border-[#262f48] text-slate-100 rounded-lg p-2.5 text-[11px] font-mono leading-tight">
                        <span className="block font-bold text-rose-300 border-b border-[#20283d] pb-1 mb-1">
                          {hoverInfo.code}
                        </span>
                        {hoverInfo.doc && (
                          <span className="block text-slate-400 font-sans text-[10px] mt-1 italic">
                            {hoverInfo.doc}
                          </span>
                        )}
                      </span>
                      <span className="block w-2 h-2 bg-[#121624] border-r border-b border-[#262f48] transform rotate-45 mx-auto -mt-1"></span>
                    </span>
                  </span>
                );
              })}
            </div>

            {/* Twoslash Inline // ^? Annotation Badge */}
            {lineHover && (
              <div className="my-1.5 ml-4 inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#161c2e] border border-rose-500/40 text-rose-300 font-mono text-[11px] shadow-lg w-max">
                <span className="text-rose-400 font-bold">↳</span>
                <span className="font-semibold">{lineHover.code}</span>
              </div>
            )}
          </div>
        );
      })}
    </code>
  );
}
