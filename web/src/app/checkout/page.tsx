"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/storefront/header";
import Footer from "@/components/storefront/footer";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { formatMoney } from "@/lib/cart";

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { cart, loading: cartLoading } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login?redirect=%2Fcheckout");
      return;
    }
    if (user.role === "ADMIN") {
      router.push("/admin");
    }
  }, [authLoading, user, router]);

  const loading = authLoading || cartLoading;
  const hasUnavailable = cart.items.some((item) => !item.available);
  const canProceed = cart.items.length > 0 && !hasUnavailable;

  if (loading || !user || user.role !== "CUSTOMER") {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-lg px-6 py-16">
          <div className="h-8 w-40 animate-pulse rounded bg-slate/10" />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-lg px-6 py-16">
        <Link href="/cart" className="text-sm text-slate transition hover:text-brand">
          ← Back to cart
        </Link>

        <h1 className="mt-4 font-display text-2xl font-semibold text-ink dark:text-paper">
          Checkout
        </h1>

        {cart.items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-slate/15 p-8 text-center">
            <p className="text-slate">Your cart is empty.</p>
            <Link
              href="/products"
              className="mt-4 inline-block text-sm font-medium text-brand hover:underline"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-slate/15 p-6">
              <h2 className="font-display text-lg font-semibold text-ink dark:text-paper">
                Order summary
              </h2>
              <ul className="mt-4 divide-y divide-slate/10 text-sm">
                {cart.items.map((item) => (
                  <li
                    key={item.productId}
                    className="flex justify-between gap-4 py-3"
                  >
                    <span className="text-ink dark:text-paper">
                      {item.product.name}{" "}
                      <span className="text-slate">× {item.quantity}</span>
                    </span>
                    <span className="shrink-0 font-mono text-ink dark:text-paper">
                      {formatMoney(item.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-2 border-t border-slate/10 pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate">Subtotal</dt>
                  <dd className="font-mono">{formatMoney(cart.subtotal)}</dd>
                </div>
                <div className="flex justify-between font-medium">
                  <dt className="text-ink dark:text-paper">Total</dt>
                  <dd className="font-mono text-brand">{formatMoney(cart.total)}</dd>
                </div>
              </dl>
            </div>

            {hasUnavailable ? (
              <p className="text-sm text-amber">
                Some items in your cart are no longer available.{" "}
                <Link href="/cart" className="font-medium hover:underline">
                  Update your cart
                </Link>{" "}
                to continue.
              </p>
            ) : (
              <p className="text-sm text-slate">
                Payment and order placement are coming soon. Your cart is saved
                to your account.
              </p>
            )}

            <button
              type="button"
              disabled={!canProceed}
              className="w-full rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              Place order
            </button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
