/**
 * Completion answered by the self-hosted core (ADR 0120): the bootstrap symbol
 * index's scope frames for values, the bootstrap type table for record members
 * and JSX props, and the graph's export origins for `import * as` members.
 * Node-only, like `bootstrap-index.ts`.
 */
import { resolve } from "node:path";
import {
  type BootstrapGraphCache,
  type BootstrapInferResult,
  type BootstrapTypeAt,
  inferEntryGraphTypesBootstrap,
  inferTypesRecoveringBootstrapSync,
  loadBootstrapGraph,
  resolveImportBootstrap,
} from "@mochi/compiler/bootstrap";
import type { BootstrapPlugin, CompletionItem } from "@mochi/compiler/bootstrap/options";
import type { Row, Stmt, Ty } from "@mochi/compiler/bootstrap/types";
import { INTRINSIC_ELEMENTS } from "@mochi/compiler/plugins/jsx-schema";
import { preludeEnv, preludeNamespaces } from "@mochi/compiler/prelude";
import { isPreludePath } from "@mochi/compiler/prelude-virtual";
import { spanContainsClosed, tightestHit } from "@mochi/compiler/span";
import { type FileIndex, indexStmts, parseStmts } from "./bootstrap-index";
import { indexModule } from "./bootstrap-module-index";
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
} from "./complete-triggers";
import { documentSymbolsAt } from "./nav";

type ReadFile = (path: string) => Promise<string>;

/** A recorded type, as the seed builds it. */
const tyOf = (at: BootstrapTypeAt): Ty => at.ty as Ty;

/** The tightest recorded type containing `offset`. */
const typeAt = (types: readonly BootstrapTypeAt[], offset: number): Ty | null => {
  const hit = tightestHit(types, offset, spanContainsClosed);
  return hit._tag === "Some" ? tyOf(hit.value) : null;
};

/** A row's fields, in declaration order. An open tail contributes none. */
const rowFields = (row: Row): { label: string; ty: Ty }[] =>
  row._tag === "RowExtend" ? [{ label: row.label, ty: row.fieldType }, ...rowFields(row.rest)] : [];

const recordFieldItems = (ty: Ty | null): CompletionItem[] =>
  ty?._tag !== "TyRecord"
    ? []
    : rowFields(ty.row).map(({ label, ty: fieldTy }) => ({
        label,
        kind: fieldTy._tag === "TyFn" ? "method" : "field",
        detail: fieldTy._tag === "TyFn" ? "method" : undefined,
      }));

/** String-literal union members (and lone lits) for attr-value completion. */
const litMembers = (ty: Ty): string[] => {
  if (ty._tag === "TySingleton") return ty.base === "string" ? [ty.value] : [];
  return ty._tag === "TyOneOf" ? ty.members.flatMap(litMembers) : [];
};

/** Props row of a component type `{ … } -> …`, else null. */
const componentPropsRow = (ty: Ty | null): Row | null =>
  ty?._tag === "TyFn" && ty.from._tag === "TyRecord" ? ty.from.row : null;

/** Namespace member labels from the prelude table. */
const preludeNamespaceMembers = (receiver: string): CompletionItem[] | null => {
  const members = preludeNamespaces[receiver];
  return members
    ? Object.keys(members).map((label) => ({
        label,
        kind: "member" as const,
        detail: `${receiver}.${label}`,
      }))
    : null;
};

/** `import * as Alias` members from the frozen graph's export origins. */
const importedNamespaceMembers = async (
  path: string,
  src: string,
  receiver: string,
  readFile: ReadFile,
): Promise<CompletionItem[] | null> => {
  const imported = parseStmts(src)?.find(
    (stmt): stmt is Extract<Stmt, { _tag: "SImportNs" }> =>
      stmt._tag === "SImportNs" && stmt.alias.name === receiver,
  );
  if (!imported) return null;
  const graph = await loadBootstrapGraph(path, src, readFile);
  if (graph._tag === "Err") return null;
  const targetPath = await resolveImportBootstrap(path, imported.from);
  const target = graph.value.find((module) => module.path === targetPath);
  return !target
    ? null
    : [...target.origins.values.keys(), ...target.origins.ctors.keys()].map((label) => ({
        label,
        kind: "member" as const,
        detail: `${receiver}.${label}`,
      }));
};

/**
 * Prelude + namespaces + types/ctors + imports + values visible at `offset`.
 * Order matters: `dedupeSort` keeps the first item per label, so an import is
 * detailed `import`, not `local`.
 */
const valueItems = (
  src: string,
  stmts: readonly Stmt[],
  idx: FileIndex,
  offset: number,
): CompletionItem[] => {
  const items: CompletionItem[] = [];
  for (const name of Object.keys(preludeEnv))
    items.push({ label: name, kind: "value", detail: "prelude" });
  for (const name of Object.keys(preludeNamespaces))
    items.push({ label: name, kind: "value", detail: "namespace" });
  for (const s of documentSymbolsAt(src)) {
    if (s.kind !== "type" && s.kind !== "ctor") continue;
    items.push({ label: s.name, kind: s.kind, detail: s.detail ?? s.kind });
  }
  for (const s of stmts) {
    if (s._tag === "SImportNs")
      items.push({ label: s.alias.name, kind: "value", detail: "import *" });
    if (s._tag === "SImport")
      for (const n of s.names) items.push({ label: n.name, kind: "value", detail: "import" });
  }
  for (const b of idx.bindingsAt(offset)) {
    if (isPreludePath(b.def.path)) continue;
    items.push({ label: b.name, kind: "value", detail: "local" });
  }
  return items;
};

/** Intrinsic tags complete from the generated HTML schema (ADR 0097). */
const intrinsicAttrItems = (trigger: JsxAttrTrigger): CompletionItem[] | null => {
  const schema = INTRINSIC_ELEMENTS[trigger.tag];
  if (!schema) return null;
  if (trigger.kind === "name")
    return filterPrefix(
      Object.keys(schema).map((label) => ({ label, kind: "field" as const, detail: "prop" })),
      trigger.prefix,
    );
  const attrType = schema[trigger.attr];
  return Array.isArray(attrType)
    ? filterPrefix(
        attrType.map((label) => ({ label, kind: "literal" as const, detail: trigger.attr })),
        trigger.prefix,
      )
    : [];
};

/** A component's prop names, or the literal members its attr accepts. */
const propItems = (trigger: JsxAttrTrigger, row: Row): CompletionItem[] => {
  const fields = rowFields(row);
  if (trigger.kind === "name")
    return filterPrefix(
      fields.map(({ label }) => ({ label, kind: "field" as const, detail: "prop" })),
      trigger.prefix,
    );
  const field = fields.find(({ label }) => label === trigger.attr);
  return !field
    ? []
    : filterPrefix(
        litMembers(field.ty).map((label) => ({
          label,
          kind: "literal" as const,
          detail: trigger.attr,
        })),
        trigger.prefix,
      );
};

/** One file's typed query, recovering past holes; imports bind nothing. */
const inferSingle = (src: string, plugins?: readonly BootstrapPlugin[]) => {
  const inferred = inferTypesRecoveringBootstrapSync(src, plugins);
  return inferred._tag === "Ok" ? inferred.value : null;
};

/** The type at `offset` in `src` typed alone, recovering past holes. */
const singleTypeAt = (src: string, offset: number, plugins?: readonly BootstrapPlugin[]) => {
  const inferred = inferSingle(src, plugins);
  return inferred ? typeAt(inferred.types, offset) : null;
};

/** The component's declared type in a typed buffer: its binding's scheme. */
const componentTypeIn = (inferred: BootstrapInferResult, tag: string): Ty | null => {
  const scheme = inferred.env.get(tag) as { ty: Ty } | undefined;
  return scheme?.ty ?? null;
};

/** Options for the bootstrap completion path. */
export type BootstrapCompleteOptions = {
  /** Caller-owned bootstrap graph memo, valid for one `plugins` list. */
  cache?: BootstrapGraphCache;
  /** Self-hosted-core plugins (ADR 0109); omitted means the builtins. */
  plugins?: readonly BootstrapPlugin[];
};

/** The first plugin `completeMembers` answer for an opaque receiver (`tw.`). */
const pluginMembers = (
  trigger: MemberTrigger,
  plugins: readonly BootstrapPlugin[] | undefined,
): CompletionItem[] => {
  const api = { receiver: trigger.receiver, prefix: trigger.prefix };
  for (const plugin of plugins ?? []) {
    const items = plugin.completeMembers?.(api);
    if (items) return items;
  }
  return [];
};

/**
 * Namespace, then the receiver's record fields (typed with `.prefix` cut),
 * then plugin members when the receiver has no fields.
 */
const memberItems = (
  trigger: MemberTrigger,
  namespace: CompletionItem[] | null,
  receiver: () => Ty | null,
  plugins: readonly BootstrapPlugin[] | undefined,
): CompletionItem[] => {
  if (namespace) return filterPrefix(namespace, trigger.prefix);
  const fields = recordFieldItems(receiver());
  return filterPrefix(fields.length > 0 ? fields : pluginMembers(trigger, plugins), trigger.prefix);
};

/**
 * Props for a component tag: the first candidate type that is a component.
 * Callers order them as `propsRowForTag` in complete.ts does: the tag's use
 * site in the intact buffer, its binding's scheme, then the bare tag reference
 * the incomplete open tag is cut back to. Candidates run lazily, in order.
 */
const jsxItems = (
  trigger: JsxAttrTrigger,
  candidates: readonly (() => Ty | null)[],
): CompletionItem[] => {
  const intrinsic = intrinsicAttrItems(trigger);
  if (intrinsic) return intrinsic;
  for (const candidate of candidates) {
    const row = componentPropsRow(candidate());
    if (row) return propItems(trigger, row);
  }
  return [];
};

/** The single-file candidates for a tag's type, in `jsxItems` order. */
const singleTagTypes = (
  src: string,
  trigger: JsxAttrTrigger,
  plugins: readonly BootstrapPlugin[] | undefined,
): (() => Ty | null)[] => {
  let direct: BootstrapInferResult | null | undefined;
  const typed = () => {
    if (direct === undefined) direct = inferSingle(src, plugins);
    return direct;
  };
  return [
    () => {
      const inferred = typed();
      return inferred && typeAt(inferred.types, trigger.tagStart + 1);
    },
    () => {
      const inferred = typed();
      return inferred && componentTypeIn(inferred, trigger.tag);
    },
    () =>
      singleTypeAt(
        rewriteJsxTagToRef(src, trigger.tagStart, trigger.tag),
        trigger.tagStart + 1,
        plugins,
      ),
  ];
};

const valuesAt = (
  src: string,
  offset: number,
  idx: (stmts: readonly Stmt[]) => FileIndex | null,
) => {
  const stmts = parseStmts(src);
  const index = stmts && idx(stmts);
  return !stmts || !index
    ? []
    : filterPrefix(valueItems(src, stmts, index, offset), identPrefixAt(src, offset));
};

/** Single-file completion at `offset`; imports resolve nothing. */
export const bootstrapCompleteAt = (
  src: string,
  offset: number,
  opts: BootstrapCompleteOptions = {},
): CompletionItem[] => {
  const member = memberTriggerAt(src, offset);
  if (member)
    return dedupeSort(
      memberItems(
        member,
        preludeNamespaceMembers(member.receiver),
        () => singleTypeAt(withoutMemberSuffix(src, member), member.recvStart, opts.plugins),
        opts.plugins,
      ),
    );
  const jsx = jsxAttrTriggerAt(src, offset);
  if (jsx) return dedupeSort(jsxItems(jsx, singleTagTypes(src, jsx, opts.plugins)));
  return dedupeSort(valuesAt(src, offset, (stmts) => indexStmts("<complete>", stmts)));
};

/**
 * The type at `offset` in `src` as the entry of `path`'s import graph. A graph
 * that fails to load or typecheck degrades to the single-file answer.
 */
const graphTypeAt = async (
  path: string,
  src: string,
  offset: number,
  readFile: ReadFile,
  opts: BootstrapCompleteOptions,
): Promise<Ty | null> => {
  const inferred = await inferEntryGraphTypesBootstrap(
    path,
    src,
    readFile,
    opts.cache,
    opts.plugins,
  );
  if (inferred._tag === "Err") return singleTypeAt(src, offset, opts.plugins);
  const entryPath = resolve(path);
  const entry = inferred.value.find((module) => module.path === entryPath);
  return entry ? typeAt(entry.types, offset) : null;
};

/**
 * Module-aware completion: imported bindings resolve through the dependency
 * graph, `import * as` members come from its export origins, and record /
 * JSX-prop types from the graph's inference.
 */
export const moduleBootstrapCompleteAt = async (
  path: string,
  src: string,
  offset: number,
  readFile: ReadFile,
  opts: BootstrapCompleteOptions = {},
): Promise<CompletionItem[]> => {
  const member = memberTriggerAt(src, offset);
  if (member) {
    const namespace =
      preludeNamespaceMembers(member.receiver) ??
      (await importedNamespaceMembers(path, src, member.receiver, readFile));
    const receiver = namespace
      ? null
      : await graphTypeAt(path, withoutMemberSuffix(src, member), member.recvStart, readFile, opts);
    return dedupeSort(memberItems(member, namespace, () => receiver, opts.plugins));
  }
  const jsx = jsxAttrTriggerAt(src, offset);
  if (jsx) {
    // An imported component only types through the graph: its use site, then
    // the bare tag reference. The single-file answers cover a graph that
    // cannot type the buffer at all.
    const atUse = await graphTypeAt(path, src, jsx.tagStart + 1, readFile, opts);
    const atRef = componentPropsRow(atUse)
      ? null
      : await graphTypeAt(
          path,
          rewriteJsxTagToRef(src, jsx.tagStart, jsx.tag),
          jsx.tagStart + 1,
          readFile,
          opts,
        );
    return dedupeSort(
      jsxItems(jsx, [() => atUse, () => atRef, ...singleTagTypes(src, jsx, opts.plugins)]),
    );
  }
  const idx = await indexModule(path, src, readFile);
  return dedupeSort(valuesAt(src, offset, () => idx));
};
