"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/lib/product";
import { getDescriptionPreview, isProductAvailable } from "@/lib/product";
import AddToCartButton from "./add-to-cart-button";

type ProductDetailProps = {
  productId: string;
};

export default function ProductDetail({ productId }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "missing">(
    "loading"
  );
  const [activeImage, setActiveImage] = useState(0);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      setActiveImage(0);
      setDescriptionExpanded(false);
      setQuantity(1);
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
  const description = product.description ?? "";
  const { preview, hasMore } = description ? getDescriptionPreview(description) : { preview: "", hasMore: false };

  const gallery = [
    { id: "cover", url: product.imageUrl },
    ...(product.images ?? []).map((img) => ({ id: img.id, url: img.url })),
  ].filter((img) => img.url);
  const activeUrl = gallery[activeImage]?.url ?? gallery[0]?.url;

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <Link
        href="/products"
        className="text-sm text-slate transition hover:text-brand"
      >
        ← Back to products
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="overflow-hidden rounded-2xl border border-slate/15 bg-brand/10">
            {activeUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeUrl}
                alt={product.name}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center">
                <span className="font-display text-brand/60">PFS</span>
              </div>
            )}
          </div>

          {gallery.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {gallery.map((img, index) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`Show image ${index + 1}`}
                  aria-current={index === activeImage}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    index === activeImage
                      ? "border-brand"
                      : "border-transparent opacity-80 hover:opacity-100 hover:border-slate/30"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {product.category?.name ? (
            <span className="inline-flex w-fit items-center rounded-full bg-brand/10 px-3 py-1 font-mono text-xs uppercase tracking-wide text-brand">
              {product.category.name}
            </span>
          ) : null}

          <h1 className="font-display text-3xl font-semibold text-ink dark:text-paper">
            {product.name}
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-2xl font-medium text-brand">
              ${product.price.toFixed(2)}
            </p>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                available ? "bg-success/10 text-success" : "bg-slate/10 text-slate"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${available ? "bg-success" : "bg-slate"}`}
                aria-hidden
              />
              {available ? `In stock · ${product.stock} available` : "Out of stock"}
            </span>
          </div>

          {description ? (
            <div className="border-t border-slate/10 pt-4">
              <p className="min-w-0 whitespace-pre-wrap break-words leading-relaxed text-slate">
                {descriptionExpanded ? description : preview}
                {!descriptionExpanded && hasMore ? "…" : null}
              </p>
              {hasMore ? (
                <button
                  type="button"
                  onClick={() => setDescriptionExpanded((v) => !v)}
                  className="mt-2 text-sm font-medium text-brand hover:underline"
                >
                  {descriptionExpanded ? "See less" : "See more"}
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 flex max-w-xs flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-ink dark:text-paper">
                Quantity
              </span>
              <div className="flex items-center rounded-full border border-slate/20">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={!available || quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="rounded-l-full px-3 py-2 text-slate transition hover:text-brand disabled:opacity-40"
                >
                  <Minus size={14} />
                </button>
                <span className="min-w-[2rem] text-center text-sm font-medium text-ink dark:text-paper">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={!available || quantity >= product.stock}
                  onClick={() =>
                    setQuantity((q) => Math.min(product.stock, q + 1))
                  }
                  className="rounded-r-full px-3 py-2 text-slate transition hover:text-brand disabled:opacity-40"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <AddToCartButton
              productId={product.id}
              quantity={quantity}
              disabled={!available}
              showIcon
              className="w-full px-6 py-3 text-sm"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
