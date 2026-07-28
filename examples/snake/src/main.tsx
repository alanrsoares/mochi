import { render } from "preact";
import "./index.css";

import { App } from "./App.mochi";

const rootElem = document.getElementById("app");
if (rootElem) {
  render(<App />, rootElem);
}
