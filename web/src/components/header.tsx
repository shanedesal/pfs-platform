import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingCart, User } from "lucide-react";
import ThemeToggle from "./theme-toggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate/10 bg-paper/80 backdrop-blur-md dark:bg-ink/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="relative h-9 w-24 sm:h-10 sm:w-28 md:h-11 md:w-32"
        >
          <Image
            src="/logo.svg"
            alt="PFS"
            fill
            priority
            className="object-contain"
          />
        </Link>

        <div className="hidden flex-1 max-w-md items-center gap-2 rounded-full border border-slate/20 px-4 py-2 md:flex">
          <Search size={16} className="text-slate" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate/60"
          />
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            aria-label="Cart"
            className="relative text-ink dark:text-paper"
          >
            <ShoppingCart size={20} />
          </button>
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm text-paper dark:bg-paper dark:text-ink"
          >
            <User size={14} />
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}
