"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
    } else if (user.role !== "ADMIN") {
      router.push("/");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="h-6 w-40 animate-pulse rounded bg-slate/10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-slate/10 bg-paper/80 backdrop-blur-md dark:bg-ink/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="relative h-9 w-24 sm:h-10 sm:w-28">
              <Image src="/logo.svg" alt="PFS" fill className="object-contain" />
            </span>
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

      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}
