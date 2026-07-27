import { render } from "preact";
import "./index.css";

import logoImg from "@mochi/root/logo.png";
import App from "./App.mochi";
import codeEmitDts from "./examples/emit-shape.d.ts.txt?raw";
import codeEmitJs from "./examples/emit-shape.js.txt?raw";
import codeEmitSrc from "./examples/emit-shape.mochi?raw";
import codeEmitTs from "./examples/emit-shape.ts.txt?raw";
import codeJsx from "./examples/jsx.mochi?raw";
import codeRecords from "./examples/records.mochi?raw";
import codeVariants from "./examples/variants.mochi?raw";

const rootElem = document.getElementById("app");
if (rootElem) {
  render(
    <App
      logo={logoImg}
      playgroundHref={`${import.meta.env.BASE_URL}playground.html`}
      codeVariants={codeVariants}
      codeRecords={codeRecords}
      codeJsx={codeJsx}
      codeEmitSrc={codeEmitSrc}
      codeEmitJs={codeEmitJs}
      codeEmitTs={codeEmitTs}
      codeEmitDts={codeEmitDts}
    />,
    rootElem,
  );
}
