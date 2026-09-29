/**
 * The TypeScript core's completion, kept as the parity oracle for
 * `test/bootstrap-complete.spec.ts` after DX moved onto bootstrap (ADR 0120,
 * #103). It goes with the rest of the TS oracle in #104.
 */
import type { Program } from "@mochi/compiler/ast";
import type { Registry } from "@mochi/compiler/check";
import { toTypedProgramRecovering, toTypedProgramWith } from "@mochi/compiler/compile";
import type { CompleteMemberApi, CompletionItem, LanguagePlugin } from "@mochi/compiler/extensions";
import { resolvePlugins, runCompleteMemberHooks } from "@mochi/compiler/extensions";
import type { Env, InferResult, TypeAt } from "@mochi/compiler/infer";
import { lex } from "@mochi/compiler/lexer";
import { parseRecovering } from "@mochi/compiler/parser";
import { INTRINSIC_ELEMENTS } from "@mochi/compiler/plugins/jsx-schema";
import { preludeEnv, preludeNamespaces } from "@mochi/compiler/prelude";
import { isPreludePath } from "@mochi/compiler/prelude-virtual";
import { spanContainsClosed, tightestHit } from "@mochi/compiler/span";
import { indexProgram } from "@mochi/compiler/symbols";
import { foldAliases, type Row, type Type } from "@mochi/compiler/types";
import {
  dedupeSort,
  filterPrefix,
  identPrefixAt,
  type JsxAttrTrigger,
  jsxAttrTriggerAt,
  type MemberTrigger,
  memberTriggerAt,
  rewriteJsxTagToRef,
  withoutMemberSuffix,
} from "@mochi/dx/complete-triggers";
import { documentSymbolsAt } from "@mochi/dx/nav";
import { map, match as matchMaybe } from "@onrails/maybe";
import { isErr, isOk } from "@onrails/result";

export type CompleteOptions = {
  plugins?: LanguagePlugin[];
  /** `import * as Alias` member schemes (module-aware path). */
  nsImports?: Map<string, Env>;
  /** Named `import { X }` schemes (module-aware path). */
  imports?: Env;
  /** Cross-module variant registry for check (module-aware path). */
  importedReg?: Registry;
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

const rowLabels = (row: Row): string[] => {
  const out: string[] = [];
  let cur = row;
  while (cur.kind === "extend") {
    out.push(cur.label);
    cur = cur.rest;
  }
  return out;
};

const rowField = (row: Row, label: string): Type | null => {
  let cur = row;
  while (cur.kind === "extend") {
    if (cur.label === label) return cur.type;
    cur = cur.rest;
  }
  return null;
};

/** String-literal union members (and lone lits) for attr-value completion. */
const litMembers = (t: Type): string[] => {
  if (t.kind === "lit" && t.base === "string") return [t.value];
  if (t.kind === "union") return t.members.flatMap(litMembers);
  return [];
};

/** Props row of a component scheme `Record -> …`, else null. */
const componentPropsRow = (t: Type, aliases: InferResult["aliases"]): Row | null => {
  const folded = foldAliases(t, aliases);
  return folded.kind === "arrow" && folded.from.kind === "record" ? folded.from.row : null;
};

const tightestType = (types: TypeAt[], offset: number) =>
  tightestHit(types, offset, spanContainsClosed);

// Recovering: completion is *most* wanted mid-edit, when the file does not yet
// parse — the intact prefix still yields members and locals (C9 slice e).
const parseProgram = (src: string, plugins?: LanguagePlugin[]): Program | null => {
  const lexed = lex(src);
  return isErr(lexed) ? null : parseRecovering(lexed.value, { plugins }).program;
};

const emptyReg = (): Registry => ({ ctor: new Map(), type: new Map() });

/** Typecheck `src`, using module import schemes when provided. */
const typedOf = (src: string, opts: CompleteOptions) => {
  const plugins = resolvePlugins(opts.plugins);
  if (opts.imports) {
    const prog = parseProgram(src, plugins);
    if (!prog) return null;
    const r = toTypedProgramWith(
      prog,
      {
        imports: opts.imports,
        nsImports: opts.nsImports,
        importedReg: opts.importedReg ?? emptyReg(),
      },
      { plugins },
    );
    return isOk(r) ? r.value : null;
  }
  const r = toTypedProgramRecovering(src, {
    namespaces: preludeNamespaces,
    nsImports: opts.nsImports,
    plugins,
  });
  return isOk(r) ? r.value : null;
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
  return imported
    ? [...imported.keys()].map((label) => ({
        label,
        kind: "member" as const,
        detail: `${receiver}.${label}`,
      }))
    : null;
};

/**
 * Strip `.prefix` so `… = r.` / `… = Task.m` becomes `… = r` / `… = Task`, then
 * typecheck and read the receiver's zonked type for record field labels.
 */
const recordFieldsAt = (
  src: string,
  trigger: MemberTrigger,
  opts: CompleteOptions,
): CompletionItem[] => {
  const typed = typedOf(withoutMemberSuffix(src, trigger), opts);
  return !typed
    ? []
    : matchMaybe(
        map(tightestType(typed.res.types, trigger.recvStart), (hit) =>
          recordFieldItems(hit.type, typed.res.aliases),
        ),
        (items) => items,
        () => [],
      );
};

const pluginMembers = (api: CompleteMemberApi, plugins: LanguagePlugin[]): CompletionItem[] => {
  const hooks = plugins.flatMap((p) => (p.completeMembers ? [p.completeMembers] : []));
  return runCompleteMemberHooks(hooks, api) ?? [];
};

/** Resolve a component's props row: typed buffer, else rewrite incomplete JSX. */
const propsRowForTag = (
  src: string,
  trigger: JsxAttrTrigger,
  opts: CompleteOptions,
): { row: Row; aliases: InferResult["aliases"] } | null => {
  const fromTyped = (typed: NonNullable<ReturnType<typeof typedOf>>) => {
    const fromHit = matchMaybe(
      map(tightestType(typed.res.types, trigger.tagStart + 1), (hit) =>
        componentPropsRow(hit.type, typed.res.aliases),
      ),
      (row) => row,
      () => null,
    );
    if (fromHit) return { row: fromHit, aliases: typed.res.aliases };
    const sc = typed.res.env.get(trigger.tag);
    if (!sc) return null;
    const row = componentPropsRow(sc.type, typed.res.aliases);
    return row ? { row, aliases: typed.res.aliases } : null;
  };

  const direct = typedOf(src, opts);
  if (direct) {
    const got = fromTyped(direct);
    if (got) return got;
  }

  // Incomplete `$tone="` / mid-attr: replace open tag through EOF with the tag ref.
  const rewritten = rewriteJsxTagToRef(src, trigger.tagStart, trigger.tag);
  const typed = typedOf(rewritten, opts);
  return typed ? fromTyped(typed) : null;
};

const jsxAttrItems = (
  src: string,
  trigger: JsxAttrTrigger,
  opts: CompleteOptions,
): CompletionItem[] => {
  const intrinsic = INTRINSIC_ELEMENTS[trigger.tag];
  if (intrinsic) {
    if (trigger.kind === "name") {
      return filterPrefix(
        Object.keys(intrinsic).map((label) => ({
          label,
          kind: "field" as const,
          detail: "prop",
        })),
        trigger.prefix,
      );
    }
    const attrType = intrinsic[trigger.attr];
    return Array.isArray(attrType)
      ? filterPrefix(
          attrType.map((label) => ({
            label,
            kind: "literal" as const,
            detail: trigger.attr,
          })),
          trigger.prefix,
        )
      : [];
  }

  const props = propsRowForTag(src, trigger, opts);
  if (!props) return [];
  if (trigger.kind === "name") {
    return filterPrefix(
      rowLabels(props.row).map((label) => ({
        label,
        kind: "field" as const,
        detail: "prop",
      })),
      trigger.prefix,
    );
  }
  const fieldT = rowField(props.row, trigger.attr);
  if (!fieldT) return [];
  const folded = foldAliases(fieldT, props.aliases);
  return filterPrefix(
    litMembers(folded).map((label) => ({
      label,
      kind: "literal" as const,
      detail: trigger.attr,
    })),
    trigger.prefix,
  );
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
  const fields = recordFieldsAt(src, trigger, opts);
  return fields.length > 0
    ? filterPrefix(fields, trigger.prefix)
    : filterPrefix(
        pluginMembers({ receiver: trigger.receiver, prefix: trigger.prefix }, plugins),
        trigger.prefix,
      );
};

/** The TypeScript-core answer for `src` at `offset`. */
export const completeAtTs = (
  src: string,
  offset: number,
  opts: CompleteOptions,
): CompletionItem[] => {
  const trigger = memberTriggerAt(src, offset);
  if (trigger) return dedupeSort(membersAt(src, trigger, opts));
  const jsx = jsxAttrTriggerAt(src, offset);
  return jsx
    ? dedupeSort(jsxAttrItems(src, jsx, opts))
    : dedupeSort(filterPrefix(valueItems(src, offset, opts.plugins), identPrefixAt(src, offset)));
};
