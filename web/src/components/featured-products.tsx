"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import type { Product } from "@/lib/product";
import ProductCard from "./product-card";

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/homepage/featured`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Product[] = await res.json();
        if (!cancelled) {
          setProducts(data);
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
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink dark:text-paper">
            Trending now
          </h2>
          <p className="mt-1 text-sm text-slate">
            Most loved by shoppers this week
          </p>
        </div>
      </div>

      {status === "loading" && (
        <p className="text-sm text-slate">Loading products…</p>
      )}

      {status === "error" && (
        <p className="text-sm text-slate">
          Couldn’t load featured products. Try refreshing the page.
        </p>
      )}

      {status === "ready" && products.length === 0 && (
        <p className="text-sm text-slate">No products to show yet.</p>
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
