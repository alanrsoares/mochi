// LSP-shaped inlay hints, editor-agnostic so they stay unit-testable under Bun.
// For each top-level `let`, we emit a faded `: type` inset right after the
// binding name — the same inferred type hover reports, shown inline. The
// language server maps each offset onto a Position and each label onto an
// InlayHint of kind Type.
import { flatMap, isErr, map, pipe } from "@onrails/result";
import { check } from "./check";
import { inferProgramTypes, showScheme } from "./infer";
import { lex } from "./lexer";
import { parse } from "./parser";
import { preludeEnv } from "./prelude";

// An inlay hint anchored to a byte offset. `label` includes the leading `: `.
export type Inlay = { offset: number; label: string };

// Type-annotation insets for every top-level binding, or [] when the source
// doesn't typecheck. Open-world so host globals infer.
export const inlayHints = (src: string): Inlay[] => {
  const r = pipe(
    lex(src),
    flatMap(parse),
    flatMap(check),
    flatMap((prog) =>
      map(inferProgramTypes(prog, preludeEnv, { open: true }), (res) => ({ prog, env: res.env })),
    ),
  );
  if (isErr(r)) return [];
  const { prog, env } = r.value;
  const hints: Inlay[] = [];
  for (const s of prog.stmts) {
    if (s.kind !== "let") continue;
    const sc = env.get(s.name);
    if (sc) hints.push({ offset: s.nameSpan.end, label: `: ${showScheme(sc)}` });
  }
  return hints;
};
