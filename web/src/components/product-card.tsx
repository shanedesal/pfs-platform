import { Star, TrendingUp } from "lucide-react";
import type { MockProduct } from "@/lib/mock-data";

export default function ProductCard({ product }: { product: MockProduct }) {
  return (
    <article className="tag-notch group relative flex flex-col overflow-hidden rounded-2xl border border-slate/15 bg-paper-soft transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg dark:bg-ink-soft">
      {product.badge && (
        <span className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-amber px-2.5 py-1 text-xs font-medium text-ink">
          {product.badge === "Trending" && <TrendingUp size={12} />}
          {product.badge}
        </span>
      )}

      {/* placeholder image area — swap for real product images */}
      <div className="flex h-40 items-center justify-center bg-gradient-to-br from-brand/15 to-brand/5">
        <span className="font-display text-sm text-brand/60">
          {product.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs uppercase tracking-wide text-slate">
          {product.category}
        </p>
        <h3 className="font-display text-base leading-snug text-ink dark:text-paper">
          {product.name}
        </h3>

        <div className="flex items-center gap-1.5 text-sm text-slate">
          <Star size={14} className="fill-amber text-amber" />
          <span>{product.rating}</span>
          <span className="text-slate/60">({product.reviewCount})</span>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-mono text-lg font-medium text-brand">
            ${product.price.toFixed(2)}
          </span>
          <button className="rounded-full bg-ink px-4 py-2 text-xs font-medium text-paper transition hover:bg-brand dark:bg-paper dark:text-ink dark:hover:bg-brand dark:hover:text-paper">
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}
