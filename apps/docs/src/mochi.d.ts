declare module "*.mochi" {
  import type { ComponentType } from "preact";
  const component: ComponentType<Record<string, any>>;
  export default component;
  export const HeaderBadge: ComponentType<Record<string, any>>;
  export const FeatureCard: ComponentType<Record<string, any>>;
}

declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}
