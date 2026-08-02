"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/storefront/header";
import Footer from "@/components/storefront/footer";
import OrderStatusBadge from "@/components/order-status-badge";
import ConfirmDialog from "@/components/storefront/confirm-dialog";
import { useAuth } from "@/lib/auth-context";
import {
  canCancelOrder,
  cancelOrder,
  fetchOrder,
  formatMoney,
  paymentMethodLabel,
  type Order,
} from "@/lib/orders";

function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MyOrderDetailPage() {
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = decodeURIComponent(params.orderNumber ?? "");
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelPending, setCancelPending] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/account/orders/${orderNumber}`)}`);
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
      setLoadError(null);
      try {
        const data = await fetchOrder(orderNumber);
        if (!cancelled) setOrder(data);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load order");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, orderNumber]);

  const handleCancel = async () => {
    if (!order) return;
    setCancelPending(true);
    setCancelError(null);
    try {
      const updated = await cancelOrder(order.orderNumber);
      setOrder(updated);
      setCancelOpen(false);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Failed to cancel order");
    } finally {
      setCancelPending(false);
    }
  };

  if (authLoading || !user || user.role !== "CUSTOMER") {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-2xl px-6 py-16">
          <div className="h-8 w-48 animate-pulse rounded bg-slate/10" />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-sm text-slate transition hover:text-brand"
        >
          <ArrowLeft size={15} />
          Back to my orders
        </Link>

        {loading ? (
          <div className="mt-6 space-y-4">
            <div className="h-8 w-56 animate-pulse rounded bg-slate/10" />
            <div className="h-40 animate-pulse rounded-2xl bg-slate/10" />
          </div>
        ) : loadError || !order ? (
          <div className="mt-6 rounded-2xl border border-slate/15 p-8 text-center">
            <p className="text-amber">{loadError ?? "Order not found."}</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-semibold text-ink dark:text-paper">
                  Order {order.orderNumber}
                </h1>
                <p className="mt-1 text-sm text-slate">Placed {formatOrderDate(order.createdAt)}</p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            <section className="rounded-2xl border border-slate/15 p-6 text-sm">
              <h2 className="font-display text-base font-semibold text-ink dark:text-paper">
                Ordered products
              </h2>
              <ul className="mt-4 divide-y divide-slate/10">
                {order.items.map((item) => (
                  <li key={item.productId} className="flex items-center gap-4 py-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink dark:text-paper">{item.productName}</p>
                      <p className="text-slate">
                        {formatMoney(item.unitPrice)} × {item.quantity}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-ink dark:text-paper">
                      {formatMoney(item.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-4 space-y-2 border-t border-slate/10 pt-4">
                <div className="flex justify-between text-slate">
                  <dt>Subtotal</dt>
                  <dd className="font-mono">{formatMoney(order.subtotal)}</dd>
                </div>
                <div className="flex justify-between font-medium">
                  <dt className="text-ink dark:text-paper">Total</dt>
                  <dd className="font-mono text-brand">{formatMoney(order.total)}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-slate/15 p-6 text-sm">
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
            </section>

            {canCancelOrder(order.status) ? (
              <section className="rounded-2xl border border-slate/15 p-6 text-sm">
                <h2 className="font-display text-base font-semibold text-ink dark:text-paper">
                  Cancel this order
                </h2>
                <p className="mt-2 text-slate">
                  You can cancel this order while it&apos;s still pending confirmation.
                </p>
                {cancelError ? <p className="mt-2 text-amber">{cancelError}</p> : null}
                <button
                  type="button"
                  onClick={() => setCancelOpen(true)}
                  className="mt-3 rounded-full border border-slate/20 px-4 py-2 text-sm font-medium text-ink transition hover:border-amber hover:text-amber dark:text-paper"
                >
                  Cancel order
                </button>
              </section>
            ) : null}
          </div>
        )}
      </main>
      <Footer />

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel order"
        message={order ? `Cancel order ${order.orderNumber}? This can't be undone.` : ""}
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        loading={cancelPending}
        onConfirm={handleCancel}
        onCancel={() => setCancelOpen(false)}
      />
    </>
  );
}
