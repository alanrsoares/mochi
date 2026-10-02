import productsSource from "../examples/products.mochi?raw";
import { HighlightedCode } from "./HighlightCode";
import { ProductSearch } from "./ProductSearch";
import hostSource from "./ProductSearch.tsx?raw";

export function IntegrationDemo() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
      <div className="min-w-0 space-y-5">
        <div>
          <h3 className="mb-2 font-mono text-fur-deep text-xs">products.mochi · filter and sort</h3>
          <pre className="overflow-x-auto rounded border border-line bg-foam p-4">
            <HighlightedCode code={productsSource} lang="mochi" />
          </pre>
        </div>
        <div>
          <h3 className="mb-2 font-mono text-fur-deep text-xs">
            ProductSearch.tsx · import it into Preact
          </h3>
          <pre className="max-h-64 overflow-auto rounded border border-line bg-foam p-4">
            <HighlightedCode code={hostSource} lang="ts" enableTwoslash={false} />
          </pre>
        </div>
      </div>
      <div className="border-line border-t pt-5 lg:border-t-0 lg:pt-0">
        <h3 className="mb-4 font-semibold">Try the same code</h3>
        <ProductSearch />
        <p className="mt-6 text-mute text-sm">
          Preact owns the input state. Mochi filters the data and preserves each product’s id.
          TypeScript checks the import against its generated declaration.
        </p>
      </div>
      <p className="text-mute text-xs lg:col-span-2">
        Generate the sidecar with <code>mochi dts --write products.mochi</code>; enable{" "}
        <code>allowArbitraryExtensions</code> and the Mochi Vite plugin in the host app.
      </p>
    </div>
  );
}
