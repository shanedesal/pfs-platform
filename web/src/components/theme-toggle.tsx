"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

function setCookie(name: string, value: string, days = 365) {
  document.cookie = `${name}=${value}; path=/; max-age=${days * 24 * 60 * 60}; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = getCookie("pfs-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const shouldBeDark = stored ? stored === "dark" : prefersDark;
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    setCookie("pfs-theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate/20 text-ink transition hover:border-brand hover:text-brand dark:text-paper dark:hover:text-brand"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
