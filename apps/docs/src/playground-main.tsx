import { render } from "preact";
import "./index.css";

import logoImg from "@mochi/root/logo.png";
import PlaygroundPage from "./pages/PlaygroundPage.mochi";

const rootElem = document.getElementById("app");
if (rootElem) {
  render(<PlaygroundPage logo={logoImg} homeHref={import.meta.env.BASE_URL} />, rootElem);
}
