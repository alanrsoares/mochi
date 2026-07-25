import { Playground } from "../components/Playground";

type PlaygroundPageProps = {
  logo: string;
  homeHref: string;
};

/** Full-page playground shell (ReScript try / Gleam language-tour style). */
export function PlaygroundPage({ logo, homeHref }: PlaygroundPageProps) {
  return (
    <div className="site-grain flex min-h-screen flex-col bg-paper text-ink">
      <header className="sticky top-0 z-50 border-line border-b-2 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <a href={homeHref} className="flex items-center gap-3 no-underline">
            <img src={logo} alt="" className="h-8 w-8 rounded-full object-contain" />
            <span className="font-bold font-display text-ink text-lg tracking-tight">
              mochi<span className="text-fur-deep">.lang</span>
            </span>
          </a>
          <nav className="flex items-center gap-4 font-mono text-mute text-xs">
            <a href={homeHref} className="transition-colors hover:text-fur-deep">
              home
            </a>
            <span className="font-semibold text-ink">playground</span>
            <a
              href="https://github.com/alanrsoares/mochi"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border-2 border-line-strong px-3 py-1.5 font-semibold text-ink transition-colors hover:border-fur hover:bg-foam"
            >
              GitHub ↗
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8">
        <div className="mb-6">
          <div className="font-bold font-mono text-2xs text-fur-deep uppercase tracking-eyebrow">
            try
          </div>
          <h1 className="mt-2 font-display font-extrabold text-2xl text-ink tracking-tight">
            Playground
          </h1>
          <p className="mt-2 max-w-xl text-mute text-sm leading-relaxed">
            Edit mochi, compile to JS, preview with Preact. Share via the URL. Cmd+Enter
            recompiles; Cmd+Shift+F formats.
          </p>
        </div>
        <Playground />
      </main>
    </div>
  );
}
