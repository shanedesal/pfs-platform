"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import Header from "@/components/storefront/header";
import Footer from "@/components/storefront/footer";
import { useAuth } from "@/lib/auth-context";
import {
  fetchOrder,
  formatMoney,
  paymentMethodLabel,
  type Order,
} from "@/lib/orders";

export default function OrderConfirmationPage() {
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = decodeURIComponent(params.orderNumber ?? "");
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/checkout/confirmation/${orderNumber}`)}`);
      return;
    }
    if (user.role === "ADMIN") {
      router.push("/admin");
    }
  }, [authLoading, user, router, orderNumber]);

  useEffect(() => {
    if (authLoading || !user || user.role !== "CUSTOMER" || !orderNumber) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOrder(orderNumber);
        if (!cancelled) setOrder(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load order");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, orderNumber]);

  if (authLoading || !user || user.role !== "CUSTOMER") {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-lg px-6 py-16">
          <div className="h-8 w-48 animate-pulse rounded bg-slate/10" />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-lg px-6 py-16">
        {loading ? (
          <div className="space-y-4">
            <div className="h-8 w-56 animate-pulse rounded bg-slate/10" />
            <div className="h-32 animate-pulse rounded-2xl bg-slate/10" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-slate/15 p-8 text-center">
            <p className="text-amber">{error}</p>
            <Link
              href="/products"
              className="mt-4 inline-block text-sm font-medium text-brand hover:underline"
            >
              Continue shopping
            </Link>
          </div>
        ) : order ? (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle2
                className="mx-auto text-success"
                size={48}
                strokeWidth={1.5}
                aria-hidden
              />
              <h1 className="mt-4 font-display text-2xl font-semibold text-ink dark:text-paper">
                Order confirmed
              </h1>
              <p className="mt-2 text-sm text-slate">
                Thank you, {order.customerName}. Your order has been received.
              </p>
              <p className="mt-4 font-mono text-lg font-medium text-brand">
                {order.orderNumber}
              </p>
            </div>

            <div className="rounded-2xl border border-slate/15 p-6 text-sm">
              <h2 className="font-display text-lg font-semibold text-ink dark:text-paper">
                Order summary
              </h2>

              <ul className="mt-4 divide-y divide-slate/10">
                {order.items.map((item) => (
                  <li
                    key={`${item.productId}-${item.quantity}`}
                    className="flex justify-between gap-4 py-3"
                  >
                    <span className="text-ink dark:text-paper">
                      {item.productName}{" "}
                      <span className="text-slate">× {item.quantity}</span>
                    </span>
                    <span className="shrink-0 font-mono">
                      {formatMoney(item.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-4 space-y-2 border-t border-slate/10 pt-4">
                <div className="flex justify-between font-medium">
                  <dt className="text-ink dark:text-paper">Total</dt>
                  <dd className="font-mono text-brand">{formatMoney(order.total)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-slate/15 p-6 text-sm">
              <h2 className="font-display text-base font-semibold text-ink dark:text-paper">
                Delivery details
              </h2>
              <dl className="mt-3 space-y-2 text-slate">
                <div>
                  <dt className="text-xs uppercase tracking-wide">Email</dt>
                  <dd className="text-ink dark:text-paper">{order.email}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide">Contact</dt>
                  <dd className="text-ink dark:text-paper">{order.contactNumber}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide">Address</dt>
                  <dd className="whitespace-pre-wrap text-ink dark:text-paper">
                    {order.deliveryAddress}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide">Payment</dt>
                  <dd className="text-ink dark:text-paper">
                    {paymentMethodLabel(order.paymentMethod)}
                  </dd>
                </div>
                {order.orderNotes ? (
                  <div>
                    <dt className="text-xs uppercase tracking-wide">Notes</dt>
                    <dd className="whitespace-pre-wrap text-ink dark:text-paper">
                      {order.orderNotes}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/products"
                className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-dark"
              >
                Continue shopping
              </Link>
              <Link
                href="/cart"
                className="inline-flex items-center justify-center rounded-full border border-brand px-6 py-3 text-sm font-medium text-brand transition hover:bg-brand/10"
              >
                View cart
              </Link>
            </div>
          </div>
        ) : null}
      </main>
      <Footer />
    </>
  );
}
