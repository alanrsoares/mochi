/**
 * Entry-point plumbing shared by the three MPA pages: cross-page hrefs, the
 * site logo, and the mount ritual (global CSS, color-scheme init, render).
 */
import { render, type VNode } from "preact";
import "../index.css";
import { initColorScheme } from "./color-scheme";

export { logoUrl, siteHrefs } from "./site-hrefs.mochi";

export const mountPage = (page: VNode): void => {
  initColorScheme();
  const rootElem = document.getElementById("app");
  if (rootElem) render(page, rootElem);
};
