import { render } from "preact";
import "./index.css";

// Import components written in Mochi JSX syntax via vite-plugin-mochi!
import FeatureCard from "./components/FeatureCard.mochi";
import HeaderBadge from "./components/HeaderBadge.mochi";
import { Playground } from "./components/Playground";

// Import artwork assets
import logoImg from "@mochi/root/logo.png";
import bootstrapPartyImg from "@mochi/root/illustrations/mochi_bootstrap_party.jpg";
import coderMascotImg from "@mochi/root/illustrations/mochi_coder_mascot.jpg";
import compilerMagicImg from "@mochi/root/illustrations/mochi_compiler_magic.jpg";
import cosmicTypesImg from "@mochi/root/illustrations/mochi_cosmic_types.jpg";
import lspInspectorImg from "@mochi/root/illustrations/mochi_lsp_inspector.jpg";
import stickersImg from "@mochi/root/illustrations/mochi_stickers.jpg";

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 font-sans selection:bg-pink-500/30">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#090d16]/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logoImg} alt="Mochi Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(244,114,182,0.4)]" />
            <span className="text-xl font-extrabold font-display tracking-tight text-white">
              mochi<span className="text-pink-500">.lang</span>
            </span>
            {/* HeaderBadge is a component written in Mochi JSX! */}
            <HeaderBadge label="JSX + Preact Enabled" />
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#playground" className="hover:text-pink-400 transition-colors">Playground</a>
            <a href="#features" className="hover:text-pink-400 transition-colors">Features</a>
            <a href="#interop" className="hover:text-pink-400 transition-colors">Frontend Interop</a>
            <a href="#gallery" className="hover:text-pink-400 transition-colors">Artwork</a>
            <a
              href="https://github.com/alanrsoares/mochi"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg transition-all border border-slate-700 text-xs font-semibold"
            >
              GitHub Repository
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 border-b border-slate-800/60">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-pink-600/15 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-pink-300">
              <span>🚀 Self-Hosted Compiler</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400">0 tsc --strict errors</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-black font-display tracking-tight text-white leading-[1.1]">
              Statically-typed functional code, <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">rendered anywhere</span>.
            </h1>

            <p className="text-lg text-slate-300 leading-relaxed font-normal">
              Mochi is a small, ultra-fast functional programming language featuring Hindley–Milner type inference, row-polymorphic records, universal JSX desugaring, and strict-clean TypeScript code generation.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="#playground"
                className="px-6 py-3.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-pink-600/25 transition-all hover:scale-[1.02]"
              >
                Try In Browser REPL
              </a>
              <code className="px-5 py-3.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl font-mono text-sm flex items-center gap-3">
                <span className="text-pink-400">$</span> bun run mochi app.mochi
              </code>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-pink-500 to-purple-600 opacity-30 blur-xl"></div>
            <img
              src={coderMascotImg}
              alt="Mochi Mascot Banner"
              className="relative rounded-2xl border border-slate-800 shadow-2xl object-cover w-full h-[400px]"
            />
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-20 flex-1">
        {/* Interactive Playground */}
        <section id="playground">
          <Playground />
        </section>

        {/* Feature Cards Grid (Powered by Mochi JSX Components) */}
        <section id="features" className="space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black font-display text-white">Language Architecture & Core Features</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm">
              Built on sound Hindley–Milner type inference (Algorithm W), Mochi provides strict type guarantees without boilerplate annotations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon="✨"
              title="Universal JSX Support"
              description="Native JSX desugaring translates <tag /> elements directly into host h(tag, props, children) calls with zero bundle runtime overhead."
            />
            <FeatureCard
              icon="🔮"
              title="Row-Polymorphic Records"
              description="Structural record typing allows writing functions that operate on any record containing required fields without subtyping complexity."
            />
            <FeatureCard
              icon="🎯"
              title="Exhaustive Pattern Matching"
              description="Pattern matching on algebraic variants and structures with full compile-time exhaustiveness checking."
            />
          </div>
        </section>

        {/* Frontend Interop Section */}
        <section id="interop" className="p-8 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-6 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
            <div>
              <h2 className="text-2xl font-bold font-display text-white mb-1">Frontend Ecosystem & Framework Interop</h2>
              <p className="text-slate-400 text-sm">
                Mochi's Vite plugin (<code className="text-pink-400 font-mono">vite-plugin-mochi</code>) lets you import <code className="text-pink-400 font-mono">.mochi</code> files directly into modern frontend frameworks.
              </p>
            </div>
            <span className="px-4 py-2 bg-pink-500/10 border border-pink-500/30 text-pink-300 font-mono text-xs font-semibold rounded-full self-start md:self-auto">
              Vite 6 + Tailwind v4 + Preact
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-2">
              <div className="font-bold text-pink-400 text-base font-display">Preact (~3KB)</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Direct <code className="text-slate-200">h(tag, props, children)</code> alignment makes Preact the ideal primary runtime for Mochi JSX components.
              </p>
            </div>

            <div className="p-5 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-2">
              <div className="font-bold text-purple-400 text-base font-display">SolidJS & Ripple</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fine-grained signal reactivity and hyperscript adapters allow Mochi components to target VDOM-less DOM updates.
              </p>
            </div>

            <div className="p-5 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-2">
              <div className="font-bold text-indigo-400 text-base font-display">Strict TypeScript</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Emits clean <code className="text-slate-200">.ts</code> output passing <code className="text-slate-200">tsc --strict</code> with 0 errors for seamless TS codebase integration.
              </p>
            </div>
          </div>
        </section>

        {/* Artwork Gallery */}
        <section id="gallery" className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black font-display text-white">Official Artwork & Illustration Gallery</h2>
            <p className="text-slate-400 text-sm">Visual representations of the Mochi compiler, type system, and ecosystem.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group border border-slate-800 bg-slate-900/40 rounded-2xl overflow-hidden hover:border-pink-500/40 transition-colors">
              <img src={compilerMagicImg} alt="Compiler Magic" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="p-4">
                <h3 className="font-bold text-slate-200 font-display">Compiler Magic</h3>
                <p className="text-xs text-slate-400 mt-1">Compiling functional code into clean JS and strict TypeScript.</p>
              </div>
            </div>

            <div className="group border border-slate-800 bg-slate-900/40 rounded-2xl overflow-hidden hover:border-pink-500/40 transition-colors">
              <img src={cosmicTypesImg} alt="Cosmic Type System" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="p-4">
                <h3 className="font-bold text-slate-200 font-display">Cosmic Type System</h3>
                <p className="text-xs text-slate-400 mt-1">Hindley–Milner type inference & row-polymorphic constellations.</p>
              </div>
            </div>

            <div className="group border border-slate-800 bg-slate-900/40 rounded-2xl overflow-hidden hover:border-pink-500/40 transition-colors">
              <img src={lspInspectorImg} alt="LSP Inspector" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="p-4">
                <h3 className="font-bold text-slate-200 font-display">LSP Inspector</h3>
                <p className="text-xs text-slate-400 mt-1">Real-time hover tooltips, type hints, and formatting assistance.</p>
              </div>
            </div>

            <div className="group border border-slate-800 bg-slate-900/40 rounded-2xl overflow-hidden hover:border-pink-500/40 transition-colors">
              <img src={bootstrapPartyImg} alt="Bootstrap Milestone" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="p-4">
                <h3 className="font-bold text-slate-200 font-display">Bootstrap Party</h3>
                <p className="text-xs text-slate-400 mt-1">Celebrating self-hosting milestone with 0 tsc --strict errors.</p>
              </div>
            </div>

            <div className="group border border-slate-800 bg-slate-900/40 rounded-2xl overflow-hidden hover:border-pink-500/40 transition-colors md:col-span-2 lg:col-span-2">
              <img src={stickersImg} alt="Sticker Sheet" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="p-4">
                <h3 className="font-bold text-slate-200 font-display">Sticker Sheet & Poses</h3>
                <p className="text-xs text-slate-400 mt-1">VR coding, Bun rocket jetpack, and CLI prompt mascot stickers.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 bg-[#060911]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Mochi Logo" className="w-6 h-6 object-contain" />
            <span>Mochi Programming Language — Built with Bun & TypeScript</span>
          </div>
          <div>
            <span>GitHub Pages Documentation Site • Powered by Vite + Preact</span>
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
