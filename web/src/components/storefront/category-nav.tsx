"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { Category } from "@/lib/category";

/** Homepage category chips — each chip opens the full catalog filtered by category. */
export default function CategoryNav() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await apiFetch("/api/homepage/categories");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Category[] = await res.json();
        if (!cancelled) {
          setCategories(data);
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

  function selectCategory(categoryId: string | null) {
    if (!categoryId) {
      router.push("/products");
      return;
    }
    router.push(`/products?category=${encodeURIComponent(categoryId)}`);
  }

  if (status === "loading") {
    return (
      <nav className="flex gap-2 overflow-x-auto px-6 pb-2 md:justify-center">
        <p className="text-sm text-slate">Loading categories…</p>
      </nav>
    );
  }

  if (status === "error") {
    return (
      <nav className="flex gap-2 overflow-x-auto px-6 pb-2 md:justify-center">
        <p className="text-sm text-slate">Couldn’t load categories.</p>
      </nav>
    );
  }

  const chipClass =
    "shrink-0 rounded-full border border-slate/20 px-4 py-1.5 text-sm text-slate transition hover:border-brand hover:text-brand";

  return (
    <nav className="flex gap-2 overflow-x-auto px-6 pb-2 md:justify-center">
      <button
        type="button"
        onClick={() => selectCategory(null)}
        className={chipClass}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => selectCategory(cat.id)}
          className={chipClass}
        >
          {cat.name}
        </button>
      ))}
    </nav>
  );
}
