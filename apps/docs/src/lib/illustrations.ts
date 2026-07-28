/** Mascot art served from `public/illustrations/` — plain URLs, no bundler alias. */
const asset = (p: string): string => `${import.meta.env.BASE_URL}${p}`;

export const bootstrapPartyImg = asset("illustrations/mochi_bootstrap_party.jpg");
export const coderMascotImg = asset("illustrations/mochi_coder_mascot.jpg");
export const compilerMagicImg = asset("illustrations/mochi_compiler_magic.jpg");
export const cosmicTypesImg = asset("illustrations/mochi_cosmic_types.jpg");
export const lspInspectorImg = asset("illustrations/mochi_lsp_inspector.jpg");
export const stickersImg = asset("illustrations/mochi_stickers.jpg");
export const logoImg = asset("logo.png");
