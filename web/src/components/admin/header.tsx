"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Logo from "@/components/logo";
import ThemeToggle from "@/components/theme-toggle";

export default function AdminHeader() {
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-slate/10 bg-paper/80 backdrop-blur-md dark:bg-ink/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/admin" className="flex items-center gap-2">
          <Logo />
          <span className="rounded-full border border-slate/20 px-2 py-0.5 text-xs font-medium text-slate">
            Admin
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm text-slate transition hover:text-brand"
          >
            Back to store
          </Link>
          <ThemeToggle />
          <button
            onClick={logout}
            aria-label="Log out"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate/20 text-ink transition hover:border-brand hover:text-brand dark:text-paper"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
