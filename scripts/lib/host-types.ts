// Self-contained type declarations for hosts of the frozen seed (ADR 0109).
//
// Host plugins need the seed's AST and type aliases, but importing the emitted
// `.ts` pulls the whole seed into the host's program, and the seed is only
// strict-clean under plain `--strict` (not `noUncheckedIndexedAccess`). This
// copies just the requested aliases, plus every alias they reference, into one
// `.d.ts`, which `skipLibCheck` leaves alone.
import { readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";

export type HostTypeRoot = { file: string; names: readonly string[] };

/**
 * Exported values a bundle re-exports, typed by their emitted annotations and
 * gathered into one record alias (`name`) that the host loads the bundle as.
 */
export type HostValueRoot = {
  name: string;
  values: readonly HostTypeRoot[];
  /** Host drivers always supply every argument; constructors retain curry overloads. */
  saturated?: boolean;
};

type SeedFile = {
  aliases: Map<string, string>;
  consts: Map<string, string>;
  imports: Map<string, string>;
};

const RUNTIME_TYPES = ["Option", "Result", "_Curry"] as const;

/** End index (exclusive) of the alias starting at `from`: its `;` at depth 0. */
const aliasEnd = (src: string, from: number): number => {
  let depth = 0;
  for (let i = from; i < src.length; i++) {
    const c = src[i]!;
    if (c === '"' || c === "'" || c === "`") {
      i = src.indexOf(c, i + 1);
      continue;
    }
    if (c === "{" || c === "(" || c === "[" || c === "<") depth++;
    else if (c === "}" || c === ")" || c === "]") depth--;
    else if (c === ">" && src[i - 1] !== "=") depth--;
    else if (c === ";" && depth === 0) return i + 1;
  }
  throw new Error(`unterminated type alias at ${from}`);
};

/** End index (exclusive) of a const annotation starting at `from`: its `=` at depth 0. */
const annotationEnd = (src: string, from: number): number => {
  let depth = 0;
  for (let i = from; i < src.length; i++) {
    const c = src[i]!;
    if (c === "{" || c === "(" || c === "[" || c === "<") depth++;
    else if (c === "}" || c === ")" || c === "]") depth--;
    else if (c === ">" && src[i - 1] !== "=") depth--;
    else if (c === "=" && src[i + 1] !== ">" && depth === 0) return i;
  }
  throw new Error(`unterminated const annotation at ${from}`);
};

const readSeedFile = (dir: string, file: string): SeedFile => {
  const src = readFileSync(join(dir, file), "utf8");
  const aliases = new Map<string, string>();
  for (const m of src.matchAll(/^export type ([A-Za-z_$][\w$]*)\b/gm)) {
    aliases.set(m[1]!, src.slice(m.index, aliasEnd(src, m.index + m[0].length)));
  }
  const consts = new Map<string, string>();
  for (const m of src.matchAll(/^export const ([A-Za-z_$][\w$]*): /gm)) {
    const from = m.index + m[0].length;
    consts.set(m[1]!, src.slice(from, annotationEnd(src, from)).trim());
  }
  const imports = new Map<string, string>();
  for (const m of src.matchAll(/^import type \{([^}]*)\} from "([.\w/-]+)";?$/gm)) {
    for (const name of m[1]!
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean))
      imports.set(name, normalize(join(dirname(file), `${m[2]}.ts`)));
  }
  return { aliases, consts, imports };
};

const words = (text: string): Set<string> => new Set(text.match(/[A-Za-z_$][\w$]*/g) ?? []);

/**
 * The `.d.ts` text: each root alias and its closure, in discovery order, then
 * one record alias per value root. A value without an emitted annotation fails
 * the freeze rather than being typed by hand.
 */
export const hostTypesDts = (
  seedDir: string,
  roots: readonly HostTypeRoot[],
  valueRoots: readonly HostValueRoot[] = [],
): string => {
  const files = new Map<string, SeedFile>();
  const fileOf = (file: string): SeedFile => {
    const cached = files.get(file);
    if (cached) return cached;
    const loaded = readSeedFile(seedDir, file);
    files.set(file, loaded);
    return loaded;
  };
  const owner = new Map<string, string>();
  const visited = new Set<string>();
  const out: string[] = [];
  const visitRefs = (text: string, file: string, self: string | null): void => {
    for (const ref of words(text)) {
      if (ref === self) continue;
      if (fileOf(file).aliases.has(ref)) visit(ref, file);
      else {
        const from = fileOf(file).imports.get(ref);
        if (from !== undefined) visit(ref, from);
      }
    }
  };
  const visit = (name: string, file: string): void => {
    const key = `${file}:${name}`;
    if (visited.has(key)) return;
    const seen = owner.get(name);
    const decl = fileOf(file).aliases.get(name);
    if (decl === undefined) throw new Error(`${file} declares no type alias '${name}'`);
    if (seen !== undefined && fileOf(seen).aliases.get(name) !== decl)
      throw new Error(`host type '${name}' is declared differently in ${seen} and ${file}`);
    visited.add(key);
    if (seen !== undefined) {
      visitRefs(decl.slice(decl.indexOf("=")), file, name);
      return;
    }
    owner.set(name, file);
    out.push(decl);
    visitRefs(decl.slice(decl.indexOf("=")), file, name);
  };
  for (const { file, names } of roots) for (const name of names) visit(name, file);
  if (valueRoots.some((root) => root.saturated))
    out.push("type HostFn<A extends unknown[], R> = (...args: A) => R;");
  for (const { name, values, saturated } of valueRoots) {
    const fields: string[] = [];
    for (const { file, names } of values)
      for (const value of names) {
        const annot = fileOf(file).consts.get(value);
        if (annot === undefined) throw new Error(`${file} exports no annotated const '${value}'`);
        visitRefs(annot, file, null);
        const signature = saturated ? annot.replace(/^_Curry</, "HostFn<") : annot;
        fields.push(`  ${value}: ${signature};`);
      }
    out.push(`export type ${name} = {\n${fields.join("\n")}\n};`);
  }
  const body = out.join("\n");
  const used = RUNTIME_TYPES.filter((t) => words(body).has(t));
  const header =
    used.length > 0 ? `import type { ${used.join(", ")} } from "@mochi/compiler/runtime";\n` : "";
  return `// Generated by scripts/freeze-seed.ts — do not edit.\n${header}${body}\n`;
};
