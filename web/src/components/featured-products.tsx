import { featuredProducts } from "@/lib/mock-data";
import ProductCard from "./product-card";

// Currently reads mock data. Swap the array below for a fetch to
// GET /api/products?sort=rating_desc,sales_desc&limit=8 once the
// backend has ratings/order-count aggregation in place.
export default function FeaturedProducts() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink dark:text-paper">
            Trending now
          </h2>
          <p className="mt-1 text-sm text-slate">
            Most loved by shoppers this week
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {featuredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
