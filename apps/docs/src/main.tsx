import { render } from "preact";
import "./index.css";
import App from "./App.mochi";

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

const rootElem = document.getElementById("app");
if (rootElem) {
  render(
    <App
      logo={logoImg}
      coderMascot={coderMascotImg}
      compilerMagic={compilerMagicImg}
      cosmicTypes={cosmicTypesImg}
      lspInspector={lspInspectorImg}
      bootstrapParty={bootstrapPartyImg}
      stickers={stickersImg}
      codeVariants={CODE_EXAMPLES.variants}
      codeRecords={CODE_EXAMPLES.records}
      codeJsx={CODE_EXAMPLES.jsx}
    />,
    rootElem,
  );
}
