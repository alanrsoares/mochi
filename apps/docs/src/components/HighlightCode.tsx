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

export function HighlightedCode({
  code,
  lang,
  enableTwoslash = true,
}: {
  code: string;
  lang: HighlightLanguage;
  enableTwoslash?: boolean;
}) {
  const spans = lang === "mochi" ? highlightMochiCode(code) : highlightJsCode(code);

  return (
    <code className="font-mono text-xs leading-relaxed">
      {spans.map((span, idx) => {
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

        // Query Mochi HM type hover info at offset if twoslash is enabled
        let hoverInfo: HoverInfo | null = null;
        if (enableTwoslash && lang === "mochi" && span.offset !== undefined && (span.type === "type" || span.type === "plain" || span.type === "keyword")) {
          try {
            hoverInfo = hoverAt(code, span.offset);
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
            {/* Twoslash Pseudo-LSP Hover Card */}
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
    </code>
  );
}
