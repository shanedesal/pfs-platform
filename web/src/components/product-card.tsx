import type { Product } from "@/lib/product";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="tag-notch group relative flex flex-col overflow-hidden rounded-2xl border border-slate/15 bg-paper-soft transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg dark:bg-ink-soft">
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-brand/15 to-brand/5">
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
        <h3 className="font-display text-base leading-snug text-ink dark:text-paper">
          {product.name}
        </h3>

        {product.description && (
          <p className="line-clamp-2 text-sm text-slate">{product.description}</p>
        )}

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
