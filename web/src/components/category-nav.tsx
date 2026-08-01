"use client";

import { useState } from "react";

const categories = [
  "All",
  "Electronics",
  "Fashion",
  "Home",
  "Beauty",
  "Sports",
  "Toys",
];

export default function CategoryNav() {
  const [active, setActive] = useState("All");

  return (
    <nav className="flex gap-2 overflow-x-auto px-6 pb-2 md:justify-center">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setActive(cat)}
          className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${
            active === cat
              ? "border-brand bg-brand text-white"
              : "border-slate/20 text-slate hover:border-brand hover:text-brand"
          }`}
        >
          {cat}
        </button>
      ))}
    </nav>
  );
}
