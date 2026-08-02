"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/lib/product";
import { isProductAvailable } from "@/lib/product";

type ProductDetailProps = {
  productId: string;
};

export default function ProductDetail({ productId }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "missing">(
    "loading"
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      try {
        const res = await apiFetch(`/api/products/${encodeURIComponent(productId)}`);
        if (res.status === 404) {
          if (!cancelled) setStatus("missing");
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Product = await res.json();
        if (!cancelled) {
          setProduct(data);
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
  }, [productId]);

  if (status === "loading") {
    return (
      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm text-slate">Loading product…</p>
      </section>
    );
  }

  if (status === "missing") {
    return (
      <section className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-paper">
          Product not found
        </h1>
        <p className="mt-2 text-sm text-slate">
          This product may be unavailable.
        </p>
        <Link href="/products" className="mt-6 inline-block text-sm text-brand hover:underline">
          Back to products
        </Link>
      </section>
    );
  }

  if (status === "error" || !product) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm text-slate">
          Couldn’t load this product. Try refreshing the page.
        </p>
        <Link href="/products" className="mt-6 inline-block text-sm text-brand hover:underline">
          Back to products
        </Link>
      </section>
    );
  }

  const available = isProductAvailable(product);

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <Link
        href="/products"
        className="text-sm text-slate transition hover:text-brand"
      >
        ← Back to products
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate/15 bg-brand/10">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center">
              <span className="font-display text-brand/60">PFS</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {product.category?.name ? (
            <p className="font-mono text-xs uppercase tracking-wide text-slate">
              {product.category.name}
            </p>
          ) : null}

          <h1 className="font-display text-3xl font-semibold text-ink dark:text-paper">
            {product.name}
          </h1>

          <p className="font-mono text-2xl font-medium text-brand">
            ${product.price.toFixed(2)}
          </p>

          <p
            className={`text-sm font-medium ${
              available ? "text-success" : "text-slate"
            }`}
          >
            {available ? `In stock · ${product.stock} available` : "Out of stock"}
          </p>

          {product.description ? (
            <p className="text-slate">{product.description}</p>
          ) : null}

          <button
            type="button"
            disabled={!available}
            className="mt-4 w-full max-w-xs rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </section>
  );
}
