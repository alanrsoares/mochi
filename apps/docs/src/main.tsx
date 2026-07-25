import { render } from "preact";
import "./index.css";

import logoImg from "@mochi/root/logo.png";
import App from "./App.mochi";
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
    />,
    rootElem,
  );
}
