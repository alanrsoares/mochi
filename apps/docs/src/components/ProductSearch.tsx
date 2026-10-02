import { useState } from "preact/hooks";
import { searchProducts } from "../examples/products.mochi";

const products = [
  { id: "tea", name: "Matcha tea", price: 12 },
  { id: "bowl", name: "Ceramic bowl", price: 24 },
  { id: "whisk", name: "Bamboo whisk", price: 18 },
];

export function ProductSearch() {
  const [query, setQuery] = useState("");
  const visible = searchProducts(query, products);
  return (
    <div className="space-y-4">
      <label className="block font-semibold text-sm">
        Search products
        <input
          className="mt-2 block w-full rounded border border-line bg-paper px-3 py-2 font-normal"
          value={query}
          onInput={(e) => setQuery(e.currentTarget.value)}
          placeholder="Try tea or bowl"
        />
      </label>
      <p className="text-mute text-xs" aria-live="polite">
        {visible.length} {visible.length === 1 ? "product" : "products"} · lowest price first
      </p>
      <ul className="divide-y divide-line">
        {visible.map((p) => (
          <li key={p.id} className="flex justify-between gap-4 py-3">
            <span>{p.name}</span>
            <span className="font-mono">${p.price}</span>
          </li>
        ))}
      </ul>
      {visible.length === 0 && <p>No products match “{query}”.</p>}
    </div>
  );
}
