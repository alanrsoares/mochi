import { render } from "preact";
import "./index.css";

// Import components written in Mochi JSX syntax via vite-plugin-mochi!
import FeatureCard from "./components/FeatureCard.mochi";
import HeaderBadge from "./components/HeaderBadge.mochi";
import { HighlightedCode } from "./components/HighlightCode";
import { Playground } from "./components/Playground";

// Import artwork assets
import logoImg from "@mochi/root/logo.png";
import bootstrapPartyImg from "@mochi/root/illustrations/mochi_bootstrap_party.jpg";
import coderMascotImg from "@mochi/root/illustrations/mochi_coder_mascot.jpg";
import compilerMagicImg from "@mochi/root/illustrations/mochi_compiler_magic.jpg";
import cosmicTypesImg from "@mochi/root/illustrations/mochi_cosmic_types.jpg";
import lspInspectorImg from "@mochi/root/illustrations/mochi_lsp_inspector.jpg";
import stickersImg from "@mochi/root/illustrations/mochi_stickers.jpg";

const CODE_EXAMPLES = {
  variants: `// Algebraic Variants & Exhaustive Pattern Matching
type Result<a, e> = Ok(a) | Err(e)

let unwrapOr = (res, fallback) =>
//  ^?
  switch res {
    | Ok(value) => value
    | Err(_) => fallback
  }`,
  records: `// Row-Polymorphic Record Operations
let formatUser = (user) =>
//  ^?
  user.name ++ " (" ++ user.role ++ ")"

let admin = { name: "Alan", role: "Maintainer", id: 42 }
let formatted = formatUser(admin)
//  ^?`,
  jsx: `// Universal JSX Component Desugaring
let Button = (props) =>
//  ^?
  <button className={props.kind} disabled={props.disabled}>
    {props.label}
  </button>

let app = <Button kind="primary" label="Click me" disabled={false} />`,
};

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0b0d14] text-slate-100 font-sans selection:bg-rose-500/30 selection:text-rose-200">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 bg-[#0b0d14]/90 border-b border-[#1b2030] backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Mochi Logo" className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold font-display tracking-tight text-white">
              mochi<span className="text-rose-500">.lang</span>
            </span>
            <HeaderBadge label="v0.1.0 • JSX + Preact" />
          </div>

          <nav className="hidden md:flex items-center gap-6 font-mono text-xs text-slate-400">
            <a href="#playground" className="hover:text-rose-400 transition-colors">/playground</a>
            <a href="#syntax" className="hover:text-rose-400 transition-colors">/syntax</a>
            <a href="#architecture" className="hover:text-rose-400 transition-colors">/architecture</a>
            <a href="#interop" className="hover:text-rose-400 transition-colors">/interop</a>
            <a href="#artwork" className="hover:text-rose-400 transition-colors">/artwork</a>
            <a
              href="https://github.com/alanrsoares/mochi"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-[#141826] hover:bg-[#1a2033] text-slate-200 rounded border border-[#232a40] transition-all font-semibold"
            >
              GitHub ↗
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 border-b border-[#1b2030] bg-[#0d0f18]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#151928] border border-[#252d44] text-[11px] font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Self-Hosted Compiler Target</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 font-bold">0 tsc --strict errors</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-white leading-[1.1]">
              Statically-typed functional compiler with <span className="text-transparent bg-clip-text bg-linear-to-r from-rose-400 via-pink-400 to-amber-300">zero runtime overhead</span>.
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed font-sans max-w-xl">
              Mochi compiles Hindley–Milner type signatures, row-polymorphic records, and JSX expressions into clean JavaScript and strict-type-checked TypeScript output.
            </p>

            <div className="flex flex-wrap gap-4 pt-2 font-mono text-xs">
              <a
                href="#playground"
                className="px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow-lg shadow-rose-600/20 transition-all hover:-translate-y-0.5"
              >
                Open Live REPL ➔
              </a>
              <div className="px-4 py-3 bg-[#131624] border border-[#20273c] text-slate-300 rounded-lg flex items-center gap-2">
                <span className="text-rose-400 font-bold">$</span>
                <span>bun run mochi app.mochi</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="p-2 bg-[#121522] border border-[#20273c] rounded-2xl shadow-2xl">
              <img
                src={coderMascotImg}
                alt="Mochi Mascot Banner"
                className="rounded-xl object-cover w-full h-90 filter brightness-95 contrast-105"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-20 flex-1">
        {/* Live REPL & Compiler Section */}
        <section id="playground" className="scroll-mt-20">
          <Playground />
        </section>

        {/* Syntax & Code Examples Section with Twoslash Hover */}
        <section id="syntax" className="space-y-8 scroll-mt-20">
          <div className="space-y-2">
            <div className="font-mono text-xs text-rose-400 font-bold uppercase tracking-widest">// SYNTAX & TYPE SYSTEM TOUR</div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-3xl font-extrabold font-display text-white tracking-tight">
                Language Tour & Interactive Twoslash Tooltips
              </h2>
              <span className="font-mono text-xs text-slate-400 bg-[#121624] border border-[#20283d] px-3 py-1 rounded self-start md:self-auto">
                💡 Hover symbols below for HM inferred types
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#111422] border border-[#1e2436] rounded-xl overflow-hidden flex flex-col">
              <div className="px-4 py-2.5 bg-[#151928] border-b border-[#1e2436] font-mono text-xs font-bold text-rose-300 flex items-center justify-between">
                <span>01. Algebraic Variants</span>
                <span className="text-[10px] text-slate-500">Result&lt;a, e&gt;</span>
              </div>
              <pre className="p-4 bg-[#0a0c14] overflow-x-auto flex-1 font-mono text-xs leading-relaxed">
                <HighlightedCode code={CODE_EXAMPLES.variants} lang="mochi" enableTwoslash={true} />
              </pre>
            </div>

            <div className="bg-[#111422] border border-[#1e2436] rounded-xl overflow-hidden flex flex-col">
              <div className="px-4 py-2.5 bg-[#151928] border-b border-[#1e2436] font-mono text-xs font-bold text-amber-300 flex items-center justify-between">
                <span>02. Row Polymorphism</span>
                <span className="text-[10px] text-slate-500">{`{ r | name: Str }`}</span>
              </div>
              <pre className="p-4 bg-[#0a0c14] overflow-x-auto flex-1 font-mono text-xs leading-relaxed">
                <HighlightedCode code={CODE_EXAMPLES.records} lang="mochi" enableTwoslash={true} />
              </pre>
            </div>

            <div className="bg-[#111422] border border-[#1e2436] rounded-xl overflow-hidden flex flex-col">
              <div className="px-4 py-2.5 bg-[#151928] border-b border-[#1e2436] font-mono text-xs font-bold text-pink-300 flex items-center justify-between">
                <span>03. JSX Component Desugar</span>
                <span className="text-[10px] text-slate-500">h(tag, props, children)</span>
              </div>
              <pre className="p-4 bg-[#0a0c14] overflow-x-auto flex-1 font-mono text-xs leading-relaxed">
                <HighlightedCode code={CODE_EXAMPLES.jsx} lang="mochi" enableTwoslash={true} />
              </pre>
            </div>
          </div>
        </section>

        {/* Core Architecture Cards (Rendered via Mochi JSX Components) */}
        <section id="architecture" className="space-y-8 scroll-mt-20">
          <div className="space-y-2">
            <div className="font-mono text-xs text-rose-400 font-bold uppercase tracking-widest">// ARCHITECTURE & TYPE SYSTEM</div>
            <h2 className="text-3xl font-extrabold font-display text-white tracking-tight">Compiler Core Specifications</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              tag="AST / DESUGAR"
              spec="ADR 0007"
              title="Universal JSX Lowering"
              description="Transforms <tag /> elements directly into host h(tag, props, children) calls during AST parse pass with no extra VDOM runtime library."
              subtext="h(tag, props, children)"
            />
            <FeatureCard
              tag="ALGORITHM W"
              spec="Hindley-Milner"
              title="Row-Polymorphic Records"
              description="Infers structural record shapes using row variables. Functions accept any record containing matching field schemas."
              subtext="{ r | key: val }"
            />
            <FeatureCard
              tag="CODEGEN HOOKS"
              spec="ADR 0026"
              title="Strict TypeScript Output"
              description="Emits clean .ts code passing tsc --strict with 0 type errors. Reuses HM inference tables for TS type annotations."
              subtext="0 tsc --strict errors"
            />
          </div>
        </section>

        {/* Framework Interop Section */}
        <section id="interop" className="p-8 bg-[#111422] border border-[#1e2436] rounded-2xl space-y-6 scroll-mt-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e2436] pb-6">
            <div>
              <div className="font-mono text-xs text-rose-400 font-bold uppercase tracking-widest mb-1">// FRONTEND INTEROP MATRIX</div>
              <h2 className="text-2xl font-bold font-display text-white">Vite Plugin (.mochi) Module Loader</h2>
            </div>
            <div className="font-mono text-xs px-3 py-1 bg-[#181c2e] border border-[#272f48] text-slate-300 rounded">
              vite-plugin-mochi v0.1.0
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 bg-[#0b0e17] border border-[#1b2030] rounded-xl space-y-3">
              <div className="font-mono text-xs text-rose-400 font-bold uppercase">Preact (~3KB)</div>
              <h3 className="font-bold text-slate-100 font-display">Native h() Alignment</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Preact exports <code className="text-slate-200 font-mono">h(tag, props, children)</code> directly matching Mochi's JSX desugar output with zero adapter wrappers.
              </p>
            </div>

            <div className="p-5 bg-[#0b0e17] border border-[#1b2030] rounded-xl space-y-3">
              <div className="font-mono text-xs text-pink-400 font-bold uppercase">styled-cva</div>
              <h3 className="font-bold text-slate-100 font-display">Host UI Kit</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Factories and JSX both live in <code className="text-slate-200 font-mono">.mochi</code> — <code className="text-slate-200 font-mono">extern tw</code> from <code className="text-slate-200 font-mono">@styled-cva/react</code> (Preact compat), call-form <code className="text-slate-200 font-mono">tw.div(…)</code>, and <code className="text-slate-200 font-mono">$tone</code> variant props.
              </p>
            </div>

            <div className="p-5 bg-[#0b0e17] border border-[#1b2030] rounded-xl space-y-3">
              <div className="font-mono text-xs text-amber-400 font-bold uppercase">SolidJS & Ripple</div>
              <h3 className="font-bold text-slate-100 font-display">Fine-Grained Signals</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Supports hyperscript handlers (<code className="text-slate-200 font-mono">solid-js/h</code>) to target signal-based DOM execution without VDOM overhead.
              </p>
            </div>

            <div className="p-5 bg-[#0b0e17] border border-[#1b2030] rounded-xl space-y-3">
              <div className="font-mono text-xs text-emerald-400 font-bold uppercase">TypeScript Strict</div>
              <h3 className="font-bold text-slate-100 font-display">Strict Type Contracts</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Generates strict <code className="text-slate-200 font-mono">.ts</code> definitions so TS frontend code can import Mochi modules safely.
              </p>
            </div>
          </div>
        </section>

        {/* Official Artwork Section */}
        <section id="artwork" className="space-y-8 scroll-mt-20">
          <div className="space-y-2">
            <div className="font-mono text-xs text-rose-400 font-bold uppercase tracking-widest">// BRAND ARTWORK & ARCHITECTURE</div>
            <h2 className="text-3xl font-extrabold font-display text-white tracking-tight">Official Illustration Gallery</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#111422] border border-[#1e2436] rounded-xl overflow-hidden group">
              <img src={compilerMagicImg} alt="Compiler Magic" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="p-4 space-y-1">
                <div className="font-mono text-[10px] text-rose-400 font-bold uppercase">COMPILER LOWERING</div>
                <h3 className="font-bold text-slate-100 font-display">Compiler Magic</h3>
                <p className="text-xs text-slate-400">AST transformation into JS and strict TypeScript.</p>
              </div>
            </div>

            <div className="bg-[#111422] border border-[#1e2436] rounded-xl overflow-hidden group">
              <img src={cosmicTypesImg} alt="Cosmic Type System" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="p-4 space-y-1">
                <div className="font-mono text-[10px] text-amber-400 font-bold uppercase">TYPE INFERENCE</div>
                <h3 className="font-bold text-slate-100 font-display">Cosmic Type System</h3>
                <p className="text-xs text-slate-400">Hindley–Milner algorithm & row polymorphism.</p>
              </div>
            </div>

            <div className="bg-[#111422] border border-[#1e2436] rounded-xl overflow-hidden group">
              <img src={lspInspectorImg} alt="LSP Inspector" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="p-4 space-y-1">
                <div className="font-mono text-[10px] text-emerald-400 font-bold uppercase">LANGUAGE SERVER</div>
                <h3 className="font-bold text-slate-100 font-display">LSP Inspector</h3>
                <p className="text-xs text-slate-400">Real-time hover tooltips, type hints & diagnostics.</p>
              </div>
            </div>

            <div className="bg-[#111422] border border-[#1e2436] rounded-xl overflow-hidden group">
              <img src={bootstrapPartyImg} alt="Bootstrap Party" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="p-4 space-y-1">
                <div className="font-mono text-[10px] text-purple-400 font-bold uppercase">SELF-HOSTING</div>
                <h3 className="font-bold text-slate-100 font-display">Bootstrap Party</h3>
                <p className="text-xs text-slate-400">Self-hosting milestone with 0 tsc --strict errors.</p>
              </div>
            </div>

            <div className="bg-[#111422] border border-[#1e2436] rounded-xl overflow-hidden group md:col-span-2">
              <img src={stickersImg} alt="Stickers" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="p-4 space-y-1">
                <div className="font-mono text-[10px] text-rose-400 font-bold uppercase">STICKER SHEET</div>
                <h3 className="font-bold text-slate-100 font-display">Mochi Sticker Sheet & Poses</h3>
                <p className="text-xs text-slate-400">Official mascot artwork, VR coding & CLI poses.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1b2030] py-8 bg-[#080a10]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Mochi Logo" className="w-5 h-5 object-contain" />
            <span>Mochi Programming Language — Built on Bun & TypeScript</span>
          </div>
          <div>
            <span>GitHub Pages Documentation App • Vite + Preact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

const rootElem = document.getElementById("app");
if (rootElem) {
  render(<App />, rootElem);
}
