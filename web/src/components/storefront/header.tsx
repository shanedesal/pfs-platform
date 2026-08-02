"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Search, ShoppingCart, User, LogOut } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import Logo from "@/components/logo";
import HeaderSearch from "./header-search";
import { useAuth } from "@/lib/auth-context";

function HeaderActions() {
  const { user, loading, logout } = useAuth();

  return (
    <>
      <ThemeToggle />
      <button aria-label="Cart" className="relative text-ink dark:text-paper">
        <ShoppingCart size={20} />
      </button>

      {loading ? (
        <div className="h-9 w-20 animate-pulse rounded-full bg-slate/10" />
      ) : user ? (
        <div className="flex items-center gap-2">
          <Link
            href={user.role === "ADMIN" ? "/admin" : "/account"}
            className="flex items-center gap-1.5 rounded-full border border-slate/20 px-4 py-2 text-sm text-ink dark:text-paper"
          >
            <User size={14} />
            {user.name}
          </Link>
          <button
            onClick={logout}
            aria-label="Log out"
            className="text-slate hover:text-brand"
          >
            <LogOut size={16} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm text-ink transition hover:text-brand dark:text-paper"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm text-paper dark:bg-paper dark:text-ink"
          >
            <User size={14} />
            Sign Up
          </Link>
        </div>
      )}
    </>
  );
}

function SearchFallback() {
  return (
    <>
      <div className="hidden flex-1 max-w-md items-center gap-2 rounded-full border border-slate/20 px-4 py-2 md:flex">
        <Search size={16} className="text-slate" />
        <input
          type="search"
          placeholder="Search products..."
          disabled
          aria-label="Search products"
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate/60"
        />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-ink md:hidden dark:text-paper" aria-hidden>
          <Search size={20} />
        </span>
        <HeaderActions />
      </div>
    </>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate/10 bg-paper/80 backdrop-blur-md dark:bg-ink/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/">
            <Logo />
          </Link>
          <Link
            href="/products"
            className="hidden text-sm text-ink transition hover:text-brand md:inline dark:text-paper"
          >
            Products
          </Link>
        </div>

        <Suspense fallback={<SearchFallback />}>
          <HeaderSearch endActions={<HeaderActions />} />
        </Suspense>
      </div>
    </header>
  );
}
