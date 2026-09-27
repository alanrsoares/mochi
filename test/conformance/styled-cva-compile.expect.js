import tw from "@styled-cva/react";
export const Badge = tw.span("inline-flex items-center rounded-full", { variants: { $tone: { rose: "text-rose-700 bg-rose-50", amber: "text-amber-700 bg-amber-50" } } });
export const hot = h(Badge, { $tone: "rose" }, ["hot"]);
