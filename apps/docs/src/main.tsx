import { render } from "preact";
import "./index.css";

import logoImg from "@mochi/root/logo.png";
import App from "./App.mochi";

const CODE_EXAMPLES = {
  variants: `type Result<a, e> = Ok(a) | Err(e)

let unwrapOr = (res, fallback) =>
//  ^?
  switch res {
    | Ok(value) => value
    | Err(_) => fallback
  }`,
  records: `let formatUser = (user) =>
//  ^?
  user.name ++ " (" ++ user.role ++ ")"

let admin = { name: "Alan", role: "Maintainer", id: 42 }
let formatted = formatUser(admin)
//  ^?`,
  jsx: `let Button = (props) =>
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
      codeVariants={CODE_EXAMPLES.variants}
      codeRecords={CODE_EXAMPLES.records}
      codeJsx={CODE_EXAMPLES.jsx}
    />,
    rootElem,
  );
}
