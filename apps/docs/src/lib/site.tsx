/**
 * Entry-point plumbing shared by the three MPA pages: cross-page hrefs, the
 * site logo, and the mount ritual (global CSS, color-scheme init, render).
 */
import { render, type VNode } from "preact";
import "../index.css";
import { initColorScheme } from "./color-scheme";
import { logoImg } from "./illustrations";

export const logoUrl: string = logoImg;

export const siteHrefs = {
  home: import.meta.env.BASE_URL,
  playground: `${import.meta.env.BASE_URL}playground.html`,
  about: `${import.meta.env.BASE_URL}about.html`,
} as const;

export const mountPage = (page: VNode): void => {
  initColorScheme();
  const rootElem = document.getElementById("app");
  if (rootElem) render(page, rootElem);
};
