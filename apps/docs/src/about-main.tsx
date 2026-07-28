import { logoUrl, mountPage, siteHrefs } from "./lib/site";
import { AboutPage } from "./pages/AboutPage.mochi";

mountPage(
  <AboutPage logo={logoUrl} homeHref={siteHrefs.home} playgroundHref={siteHrefs.playground} />,
);
