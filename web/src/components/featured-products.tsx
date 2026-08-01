"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/lib/product";
import ProductCard from "./product-card";

type CategoryProductsResponse = {
  category: { id: string; name: string };
  products: Product[];
};

export default function FeaturedProducts({
  categoryId = null,
}: {
  categoryId?: string | null;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      setCategoryName(null);

      try {
        if (categoryId) {
          const res = await apiFetch(
            `/api/products/by-category?categoryId=${encodeURIComponent(categoryId)}`
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data: CategoryProductsResponse = await res.json();
          if (!cancelled) {
            setProducts(data.products);
            setCategoryName(data.category.name);
            setStatus("ready");
          }
          return;
        }

        const res = await apiFetch("/api/homepage/featured");
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
  }, [categoryId]);

  const title = categoryName ? categoryName : "Trending now";
  const subtitle = categoryName
    ? `Products in ${categoryName}`
    : "Most loved by shoppers this week";

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink dark:text-paper">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate">{subtitle}</p>
        </div>
      </div>

      {status === "loading" && (
        <p className="text-sm text-slate">Loading products…</p>
      )}

      {status === "error" && (
        <p className="text-sm text-slate">
          {categoryId
            ? "Couldn’t load products for this category. Try refreshing the page."
            : "Couldn’t load featured products. Try refreshing the page."}
        </p>
      )}

      {status === "ready" && products.length === 0 && (
        <p className="text-sm text-slate">
          {categoryName
            ? `No products in ${categoryName} yet.`
            : "No products to show yet."}
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
