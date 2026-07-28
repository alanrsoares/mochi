import { logoUrl, mountPage, siteHrefs } from "./lib/site";
import { PlaygroundPage } from "./pages/PlaygroundPage.mochi";

mountPage(<PlaygroundPage logo={logoUrl} homeHref={siteHrefs.home} />);
