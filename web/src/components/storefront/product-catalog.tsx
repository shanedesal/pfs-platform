"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Category } from "@/lib/category";
import type { Product, ProductCatalogResponse, ProductCatalogSort } from "@/lib/product";
import ProductCard from "./product-card";

const PAGE_SIZE = 12;

const SORT_OPTIONS: { value: ProductCatalogSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

function parseSort(value: string | null): ProductCatalogSort {
  if (value === "price-asc" || value === "price-desc" || value === "newest") {
    return value;
  }
  return "newest";
}

function ProductCatalogInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = (searchParams.get("q") ?? "").trim();
  const categoryId = searchParams.get("category");
  const sort = parseSort(searchParams.get("sort"));

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [pagesLoaded, setPagesLoaded] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      try {
        const res = await apiFetch("/api/homepage/categories");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Category[] = await res.json();
        if (!cancelled) setCategories(data);
      } catch {
        if (!cancelled) setCategories([]);
      }
    }
    loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filters changed — reset to a fresh first page (replaces the list, doesn't append).
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      setLoadMoreError(false);
      try {
        const params = new URLSearchParams({
          page: "1",
          pageSize: String(PAGE_SIZE),
          sort,
        });
        if (query) params.set("q", query);
        if (categoryId) params.set("categoryId", categoryId);

        const res = await apiFetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: ProductCatalogResponse = await res.json();
        if (!cancelled) {
          setProducts(Array.isArray(data.items) ? data.items : []);
          setTotal(typeof data.total === "number" ? data.total : 0);
          setPagesLoaded(1);
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
  }, [query, categoryId, sort]);

  async function loadMore() {
    const nextPage = pagesLoaded + 1;
    setLoadingMore(true);
    setLoadMoreError(false);
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: String(PAGE_SIZE),
        sort,
      });
      if (query) params.set("q", query);
      if (categoryId) params.set("categoryId", categoryId);

      const res = await apiFetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ProductCatalogResponse = await res.json();
      setProducts((prev) => [...prev, ...(Array.isArray(data.items) ? data.items : [])]);
      setTotal(typeof data.total === "number" ? data.total : 0);
      setPagesLoaded(nextPage);
    } catch {
      setLoadMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  function updateParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products");
  }

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = searchInput.trim();
    updateParams({ q: trimmed || null });
  }

  const canLoadMore = products.length < total;
  const activeCategoryName = categories.find((c) => c.id === categoryId)?.name;

  const chipClass = (active: boolean) =>
    `shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${
      active
        ? "border-brand bg-brand text-white"
        : "border-slate/20 text-slate hover:border-brand hover:text-brand"
    }`;

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold text-ink dark:text-paper">
          Products
        </h1>
        <p className="text-sm text-slate">
          {activeCategoryName
            ? `Browsing ${activeCategoryName}`
            : query
              ? `Results for “${query}”`
              : "Browse the full catalog"}
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <form
          onSubmit={onSearchSubmit}
          role="search"
          className="flex w-full max-w-md items-center gap-2 rounded-full border border-slate/20 px-4 py-2"
        >
          <Search size={16} className="shrink-0 text-slate" aria-hidden />
          <input
            type="search"
            name="q"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products..."
            aria-label="Search products"
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate/60"
          />
        </form>

        <label className="flex items-center gap-2 text-sm text-slate">
          <span className="shrink-0">Sort by</span>
          <select
            value={sort}
            onChange={(e) =>
              updateParams({ sort: e.target.value === "newest" ? null : e.target.value })
            }
            className="rounded-full border border-slate/20 bg-paper px-4 py-2 pr-8 text-sm text-ink outline-none dark:bg-ink-soft dark:text-paper"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <nav className="mb-8 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => updateParams({ category: null })}
          className={chipClass(!categoryId)}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => updateParams({ category: cat.id })}
            className={chipClass(categoryId === cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </nav>

      {status === "loading" && (
        <p className="text-sm text-slate">Loading products…</p>
      )}

      {status === "error" && (
        <p className="text-sm text-slate">
          Couldn’t load products. Try refreshing the page.
        </p>
      )}

      {status === "ready" && products.length === 0 && (
        <p className="text-sm text-slate">
          No products matched your filters. Try a different search or category.
        </p>
      )}

      {status === "ready" && products.length > 0 && (
        <>
          <p className="mb-4 text-xs text-slate">
            Showing {products.length} of {total}
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {canLoadMore && (
            <div className="mt-10 flex flex-col items-center gap-2">
              <button
                type="button"
                disabled={loadingMore}
                onClick={loadMore}
                className="rounded-full border border-slate/20 px-6 py-2.5 text-sm font-medium text-ink transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60 dark:text-paper"
              >
                {loadingMore ? "Loading…" : "Show more products"}
              </button>
              {loadMoreError && (
                <p className="text-xs text-slate">
                  Couldn’t load more products. Try again.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default function ProductCatalog() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-sm text-slate">Loading products…</p>
        </section>
      }
    >
      <ProductCatalogInner />
    </Suspense>
  );
}
