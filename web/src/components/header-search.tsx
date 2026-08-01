"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

type HeaderSearchProps = {
  endActions: ReactNode;
};

export default function HeaderSearch({ endActions }: HeaderSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    if (mobileOpen) {
      mobileInputRef.current?.focus();
    }
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    setMobileOpen(false);
    if (!trimmed) {
      router.push("/");
      return;
    }
    router.push(`/?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <>
      <form
        onSubmit={onSubmit}
        role="search"
        className="hidden flex-1 max-w-md items-center gap-2 rounded-full border border-slate/20 px-4 py-2 md:flex"
      >
        <Search size={16} className="shrink-0 text-slate" aria-hidden />
        <input
          type="search"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          aria-label="Search products"
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate/60"
        />
      </form>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="text-ink dark:text-paper md:hidden"
          aria-label={mobileOpen ? "Close search" : "Search products"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X size={20} /> : <Search size={20} />}
        </button>
        {endActions}
      </div>

      {mobileOpen ? (
        <div className="absolute inset-x-0 top-full border-b border-slate/10 bg-paper/95 px-6 py-3 backdrop-blur-md dark:bg-ink/95 md:hidden">
          <form
            onSubmit={onSubmit}
            role="search"
            className="mx-auto flex max-w-7xl items-center gap-2 rounded-full border border-slate/20 px-4 py-2"
          >
            <Search size={16} className="shrink-0 text-slate" aria-hidden />
            <input
              ref={mobileInputRef}
              type="search"
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate/60"
            />
          </form>
        </div>
      ) : null}
    </>
  );
}
