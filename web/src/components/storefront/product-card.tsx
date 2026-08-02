import Link from "next/link";
import type { Product } from "@/lib/product";
import { isProductAvailable } from "@/lib/product";

export default function ProductCard({ product }: { product: Product }) {
  const available = isProductAvailable(product);
  const categoryName = product.category?.name;

  return (
    <article className="tag-notch group relative flex flex-col overflow-hidden rounded-2xl border border-slate/15 bg-paper-soft transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg dark:bg-ink-soft">
      <div className="relative h-40 overflow-hidden bg-brand/10">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-display text-sm text-brand/60">PFS</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {categoryName ? (
          <p className="font-mono text-xs uppercase tracking-wide text-slate">
            {categoryName}
          </p>
        ) : null}

        <h3 className="font-display text-base leading-snug text-ink dark:text-paper">
          {product.name}
        </h3>

        <p
          className={`text-xs font-medium ${
            available ? "text-success" : "text-slate"
          }`}
        >
          {available ? "In stock" : "Out of stock"}
          {available && product.stock > 0 ? ` · ${product.stock}` : null}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="font-mono text-lg font-medium text-brand">
            ${product.price.toFixed(2)}
          </span>
        </div>

        <div className="flex gap-2 pt-1">
          <Link
            href={`/products/${product.id}`}
            className="flex-1 rounded-full border border-slate/20 px-3 py-2 text-center text-xs font-medium text-ink transition hover:border-brand hover:text-brand dark:text-paper"
          >
            View Details
          </Link>
          <button
            type="button"
            disabled={!available}
            className="flex-1 rounded-full bg-brand px-3 py-2 text-xs font-medium text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}
