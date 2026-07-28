import bootstrapPartyImg from "@mochi/root/illustrations/mochi_bootstrap_party.jpg";
import coderMascotImg from "@mochi/root/illustrations/mochi_coder_mascot.jpg";
import compilerMagicImg from "@mochi/root/illustrations/mochi_compiler_magic.jpg";
import cosmicTypesImg from "@mochi/root/illustrations/mochi_cosmic_types.jpg";
import lspInspectorImg from "@mochi/root/illustrations/mochi_lsp_inspector.jpg";
import stickersImg from "@mochi/root/illustrations/mochi_stickers.jpg";

/** One scrolly beat — copy lives here so the layout stays dumb. */
export type AboutChapter = {
  id: string;
  kicker: string;
  title: string;
  body: string[];
  src: string;
  alt: string;
};

export const SPARK_TALK_URL = "https://www.youtube.com/watch?v=24S5u_4gx7w";

export const aboutChapters: AboutChapter[] = [
  {
    id: "spark",
    kicker: "origin",
    title: "Why would I write a language?",
    body: [
      "It started as a question I couldn't put down: what is actually in a language? Not the surface of syntax, but the principles underneath it — and how much of correctness could live in enforceable constraints and tooling, instead of docs and hope.",
      "Building one felt like the only honest way to find out.",
    ],
    src: cosmicTypesImg,
    alt: "Astronaut Mochi floating through type-system constellations",
  },
  {
    id: "core",
    kicker: "compiler",
    title: "Start with a small compiler",
    body: [
      "I kept the first version small enough to hold in my head: a lexer, a parser, Hindley–Milner inference, and a code generator that writes the JavaScript I would have written by hand.",
      "One rule shaped everything after it: every pass returns a value, errors included. No exceptions flying across the pipeline, no partial states to reason about.",
    ],
    src: compilerMagicImg,
    alt: "Mochi the corgi conjuring an AST into JavaScript and TypeScript",
  },
  {
    id: "selfhost",
    kicker: "self-hosting",
    title: "Teach it to rebuild itself",
    body: [
      "The honesty check came later: rewrite the compiler in mochi, compile that to TypeScript, and let tsc --strict be the judge.",
      "Watching the error count fall from 537 to 0 taught me more about my own type system than any spec could have. It still runs on every push, so the language can't quietly drift.",
    ],
    src: bootstrapPartyImg,
    alt: "Corgi crowd celebrating a zero-error bootstrap build",
  },
  {
    id: "editor",
    kicker: "tooling",
    title: "Make the editor tell the truth",
    body: [
      "Hover, diagnostics, and the formatter all come from the same passes as the compiler — there is no second model of the language that can slowly drift out of sync.",
      "If the editor lies, the language lies. Looking back, pulling tooling into the language early is the decision I'm happiest with.",
    ],
    src: lspInspectorImg,
    alt: "Detective Mochi inspecting types with a magnifying glass",
  },
  {
    id: "friends",
    kicker: "interop",
    title: "Let it live with friends",
    body: [
      "mochi isn't trying to replace a codebase; it moves in with one. JSX compiles to any h()-shaped host, extern bindings call npm packages directly, and generated .d.ts files let TypeScript import it back with full types.",
      "These pages are the dogfood — the site you're reading is written in mochi and rendered by Preact.",
    ],
    src: coderMascotImg,
    alt: "Mochi the corgi typing away at a keyboard",
  },
  {
    id: "name",
    kicker: "coda",
    title: "Named after a good dog",
    body: [
      "The name was the easiest decision of the whole project: Mochi is my beautiful corgi girl. She has no opinions about type systems, and that keeps things in perspective.",
    ],
    src: stickersImg,
    alt: "Sticker sheet of Mochi the corgi mascot",
  },
];
