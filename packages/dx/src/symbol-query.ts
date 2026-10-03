/** Node-only document-outline query over the frozen bootstrap parser. */
import { loadGraph } from "@mochi/compiler/graph";
import { None } from "@mochi/compiler/runtime";
import { lex, parseRecovering } from "@mochi/compiler/syntax";
import type { DocSymbol, WorkspaceSymbol } from "./nav";

type CompilerSpan = { start: number; end: number };
type CompilerToken = { tok: { _tag: string; value?: string }; start: number; end: number };
type CompilerStmt = {
  _tag: string;
  name?: string;
  nameSpan?: CompilerSpan;
  span?: CompilerSpan;
  ctors?: Array<{ name: string }>;
};

/** Top-level outline from the bootstrap parser, including variant constructors. */
export const documentSymbolsFromSource = (src: string): DocSymbol[] => {
  const lexed = lex(src) as { _tag: "Ok"; value: CompilerToken[] } | { _tag: "Err" };
  if (lexed._tag === "Err") return [];
  const parsed = parseRecovering(lexed.value, None) as { stmts: CompilerStmt[] };
  const out: DocSymbol[] = [];
  for (const stmt of parsed.stmts) {
    if ((stmt._tag === "SLet" || stmt._tag === "SExtern") && stmt.name && stmt.nameSpan) {
      if (stmt._tag !== "SLet" || !stmt.name.startsWith("$"))
        out.push({
          name: stmt.name,
          kind: stmt._tag === "SLet" ? "let" : "extern",
          span: stmt.nameSpan,
        });
      continue;
    }
    if (stmt._tag !== "SType" || !stmt.name || !stmt.nameSpan || !stmt.span) continue;
    out.push({ name: stmt.name, kind: "type", span: stmt.nameSpan });
    const tokens = lexed.value.filter(
      (token) => stmt.span!.start <= token.start && token.end <= stmt.span!.end,
    );
    for (const ctor of stmt.ctors ?? []) {
      const ctorToken = tokens.find(
        (token, index) =>
          tokens[index - 1]?.tok._tag === "TBar" &&
          token.tok._tag === "TId" &&
          token.tok.value === ctor.name,
      );
      if (ctorToken)
        out.push({
          name: ctor.name,
          kind: "ctor",
          span: { start: ctorToken.start, end: ctorToken.end },
          detail: stmt.name,
        });
    }
  }
  return out;
};

/** Workspace-outline search over the bootstrap dependency graph. */
export const workspaceSymbolsFromGraph = async (
  entry: string,
  query: string,
  readFile: (path: string) => Promise<string>,
  liveSrc?: string,
): Promise<WorkspaceSymbol[]> => {
  const src = liveSrc ?? (await readFile(entry).catch(() => ""));
  const graph = await loadGraph(entry, src, readFile);
  const q = query.toLowerCase();
  const modules = graph._tag === "Ok" ? graph.value : [{ path: entry, src }];
  return modules.flatMap((module) =>
    documentSymbolsFromSource(module.src)
      .filter((symbol) => !q || symbol.name.toLowerCase().includes(q))
      .map((symbol) => ({ ...symbol, path: module.path })),
  );
};
