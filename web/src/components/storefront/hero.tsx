import Link from "next/link";

export default function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <div className="max-w-2xl">
        <p className="font-mono text-sm text-brand">PRODUCTS FOR SALE</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-ink dark:text-paper md:text-5xl">
          Everything you need.
          <br />
          Priced to sell.
        </h1>
        <p className="mt-4 text-slate">
          Browse a growing marketplace of goods from sellers you can trust — no
          markups, no guesswork, just fair tags on everything.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/products"
            className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-dark"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </section>
  );
}
