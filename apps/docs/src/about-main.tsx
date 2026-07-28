import { render } from "preact";
import "./index.css";

import logoImg from "@mochi/root/logo.png";
import { initColorScheme } from "./lib/color-scheme";
import { AboutPage } from "./pages/AboutPage.mochi";

initColorScheme();

const rootElem = document.getElementById("app");
if (rootElem) {
  render(
    <AboutPage
      logo={logoImg}
      homeHref={import.meta.env.BASE_URL}
      playgroundHref={`${import.meta.env.BASE_URL}playground.html`}
    />,
    rootElem,
  );
}
