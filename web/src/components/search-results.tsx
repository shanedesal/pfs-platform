"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/lib/product";
import ProductCard from "./product-card";

type SearchResponse = {
  q: string;
  products: Product[];
};

export default function SearchResults({ query }: { query: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const q = query.trim();
    if (!q) {
      setProducts([]);
      setStatus("ready");
      return;
    }

    setStatus("loading");

    async function load() {
      try {
        const res = await apiFetch(
          `/api/products/search?q=${encodeURIComponent(q)}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: SearchResponse = await res.json();
        if (!cancelled) {
          setProducts(data.products);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink dark:text-paper">
            Search results
          </h2>
          <p className="mt-1 text-sm text-slate">
            Showing matches for &ldquo;{query.trim()}&rdquo;
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-slate transition hover:text-brand"
        >
          Clear search
        </Link>
      </div>

      {status === "loading" && (
        <p className="text-sm text-slate">Searching products…</p>
      )}

      {status === "error" && (
        <p className="text-sm text-slate">
          Couldn’t search products. Try refreshing the page.
        </p>
      )}

      {status === "ready" && products.length === 0 && (
        <p className="text-sm text-slate">
          No products matched &ldquo;{query.trim()}&rdquo;. Try a different term.
        </p>
      )}

      {status === "ready" && products.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
