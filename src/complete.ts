/**
 * LSP-shaped completion, computed from the compiler pipeline but free of any
 * editor/protocol dependency so it stays unit-testable under Bun (ADR 0013).
 *
 * Member completions after `.` tolerate incomplete buffers (`Task.`, `r.ab`) via
 * a lexical rewrite that strips `.prefix` before typechecking. Value completions
 * include nested locals via `bindingsAt` on the symbol index.
 */
import { resolve } from "node:path";
import { map, match as matchMaybe } from "@onrails/maybe";
import { isErr } from "@onrails/result";
import type { Program } from "./ast";
import { toTypedProgram } from "./compile";
import type {
  CompleteMemberApi,
  CompletionItem,
  CompletionKind,
  LanguagePlugin,
} from "./extensions";
import { resolvePlugins, runCompleteMemberHooks } from "./extensions";
import type { Env, InferResult, TypeAt } from "./infer";
import { lex } from "./lexer";
import { moduleContext } from "./module";
import { documentSymbolsAt } from "./nav";
import { parse } from "./parser";
import { preludeEnv, preludeNamespaces } from "./prelude";
import { isPreludePath } from "./prelude-virtual";
import { spanContainsClosed, tightestHit } from "./span";
import { indexProgram } from "./symbols";
import { foldAliases, type Type } from "./types";

export type { CompletionItem, CompletionKind };

export type CompleteOptions = {
  plugins?: LanguagePlugin[];
  /** `import * as Alias` member schemes (module-aware path). */
  nsImports?: Map<string, Env>;
};

/** Lexical `receiver.prefix` ending at `offset` — incomplete buffers included. */
type MemberTrigger = {
  receiver: string;
  prefix: string;
  /** Index of `.` in `src`. */
  dotStart: number;
  /** Start of the receiver identifier. */
  recvStart: number;
};

const memberTriggerAt = (src: string, offset: number): MemberTrigger | null => {
  const before = src.slice(0, offset);
  const m = before.match(/([A-Za-z_][\w]*)\.([\w]*)$/);
  if (!m || m.index === undefined) return null;
  const receiver = m[1]!;
  const prefix = m[2]!;
  return {
    receiver,
    prefix,
    recvStart: m.index,
    dotStart: m.index + receiver.length,
  };
};

/** Identifier (or empty) being typed at `offset` when not in a member trigger. */
const identPrefixAt = (src: string, offset: number): string => {
  const before = src.slice(0, offset);
  const m = before.match(/([A-Za-z_][\w]*)$/);
  return m?.[1] ?? "";
};

/** Prefer structural record under an alias fold for field listing. */
const recordFieldItems = (t: Type, aliases: InferResult["aliases"]): CompletionItem[] => {
  const folded = foldAliases(t, aliases);
  const row = folded.kind === "record" ? folded.row : t.kind === "record" ? t.row : null;
  if (!row) return [];
  const out: CompletionItem[] = [];
  let cur = row;
  while (cur.kind === "extend") {
    const fieldT = foldAliases(cur.type, aliases);
    out.push({
      label: cur.label,
      kind: fieldT.kind === "arrow" ? "method" : "field",
      detail: fieldT.kind === "arrow" ? "method" : undefined,
    });
    cur = cur.rest;
  }
  return out;
};

const tightestType = (types: TypeAt[], offset: number) =>
  tightestHit(types, offset, spanContainsClosed);

const filterPrefix = (items: CompletionItem[], prefix: string): CompletionItem[] => {
  if (!prefix) return items;
  return items.filter((i) => i.label.startsWith(prefix));
};

const dedupeSort = (items: CompletionItem[]): CompletionItem[] => {
  const seen = new Set<string>();
  const out: CompletionItem[] = [];
  for (const i of items) {
    if (seen.has(i.label)) continue;
    seen.add(i.label);
    out.push(i);
  }
  return out.toSorted((a, b) => a.label.localeCompare(b.label));
};

const parseProgram = (src: string, plugins?: LanguagePlugin[]): Program | null => {
  const lexed = lex(src);
  if (isErr(lexed)) return null;
  const parsed = parse(lexed.value, { plugins });
  return isErr(parsed) ? null : parsed.value;
};

/** Namespace member labels — prelude table or `import * as` env. */
const namespaceMembers = (
  receiver: string,
  nsImports: Map<string, Env> | undefined,
): CompletionItem[] | null => {
  const prelude = preludeNamespaces[receiver];
  if (prelude) {
    return Object.keys(prelude).map((label) => ({
      label,
      kind: "member" as const,
      detail: `${receiver}.${label}`,
    }));
  }
  const imported = nsImports?.get(receiver);
  if (imported) {
    return [...imported.keys()].map((label) => ({
      label,
      kind: "member" as const,
      detail: `${receiver}.${label}`,
    }));
  }
  return null;
};

/**
 * Strip `.prefix` so `… = r.` / `… = Task.m` becomes `… = r` / `… = Task`, then
 * typecheck and read the receiver's zonked type for record field labels.
 */
const recordFieldsAt = (
  src: string,
  trigger: MemberTrigger,
  plugins?: LanguagePlugin[],
): CompletionItem[] => {
  const rewritten =
    src.slice(0, trigger.dotStart) + src.slice(trigger.dotStart + 1 + trigger.prefix.length);
  const r = toTypedProgram(rewritten, {
    open: true,
    namespaces: preludeNamespaces,
    plugins,
  });
  if (isErr(r)) return [];
  return matchMaybe(
    map(tightestType(r.value.res.types, trigger.recvStart), (hit) =>
      recordFieldItems(hit.type, r.value.res.aliases),
    ),
    (items) => items,
    () => [],
  );
};

const pluginMembers = (api: CompleteMemberApi, plugins: LanguagePlugin[]): CompletionItem[] => {
  const hooks = plugins.flatMap((p) => (p.completeMembers ? [p.completeMembers] : []));
  return runCompleteMemberHooks(hooks, api) ?? [];
};

/** Prelude + namespaces + types/ctors + imports + values visible at `offset`. */
const valueItems = (src: string, offset: number, plugins?: LanguagePlugin[]): CompletionItem[] => {
  const items: CompletionItem[] = [];
  for (const name of Object.keys(preludeEnv)) {
    items.push({ label: name, kind: "value", detail: "prelude" });
  }
  for (const name of Object.keys(preludeNamespaces)) {
    items.push({ label: name, kind: "value", detail: "namespace" });
  }
  // Types/ctors from the outline; values come from bindingsAt (scope-aware).
  for (const s of documentSymbolsAt(src)) {
    if (s.kind !== "type" && s.kind !== "ctor") continue;
    items.push({
      label: s.name,
      kind: s.kind,
      detail: s.detail ?? s.kind,
    });
  }
  const prog = parseProgram(src, plugins);
  if (prog) {
    for (const s of prog.stmts) {
      if (s.kind !== "import") continue;
      if (s.alias) items.push({ label: s.alias.name, kind: "value", detail: "import *" });
      for (const n of s.names) items.push({ label: n.name, kind: "value", detail: "import" });
    }
    for (const b of indexProgram("<complete>", prog).bindingsAt(offset, "value")) {
      if (isPreludePath(b.def.path)) continue;
      items.push({ label: b.name, kind: "value", detail: "local" });
    }
  }
  return items;
};

const membersAt = (
  src: string,
  trigger: MemberTrigger,
  opts: CompleteOptions,
): CompletionItem[] => {
  const plugins = resolvePlugins(opts.plugins);
  const ns = namespaceMembers(trigger.receiver, opts.nsImports);
  if (ns) return filterPrefix(ns, trigger.prefix);
  const fields = recordFieldsAt(src, trigger, plugins);
  if (fields.length > 0) return filterPrefix(fields, trigger.prefix);
  return filterPrefix(
    pluginMembers({ receiver: trigger.receiver, prefix: trigger.prefix }, plugins),
    trigger.prefix,
  );
};

/**
 * Completions at `offset`. Member trigger (after `.`) prefers namespaces, then
 * record fields, then plugin hooks. Otherwise values visible at the cursor
 * (prelude, top-level, nested locals).
 */
export const completeAt = (
  src: string,
  offset: number,
  opts: CompleteOptions = {},
): CompletionItem[] => {
  const trigger = memberTriggerAt(src, offset);
  if (trigger) return dedupeSort(membersAt(src, trigger, opts));
  return dedupeSort(
    filterPrefix(valueItems(src, offset, opts.plugins), identPrefixAt(src, offset)),
  );
};

export type ModuleCompleteOptions = { plugins?: LanguagePlugin[] };

/**
 * Module-aware completion: resolve imports so `import * as R` members and
 * plugin-backed `tw.*` work. Degrades to single-file `completeAt` if the dep
 * graph can't be resolved.
 */
export const moduleCompleteAt = async (
  path: string,
  src: string,
  offset: number,
  readFile: (p: string) => Promise<string>,
  opts: ModuleCompleteOptions = {},
): Promise<CompletionItem[]> => {
  const entry = resolve(path);
  const read = (p: string): Promise<string> =>
    resolve(p) === entry ? Promise.resolve(src) : readFile(p);
  const ctx = await moduleContext(entry, read, { plugins: opts.plugins });
  if (isErr(ctx)) return completeAt(src, offset, { plugins: opts.plugins });
  return completeAt(src, offset, {
    plugins: opts.plugins,
    nsImports: ctx.value.nsImports,
  });
};
