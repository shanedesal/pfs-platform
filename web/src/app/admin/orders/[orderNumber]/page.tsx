"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import OrderStatusBadge from "@/components/order-status-badge";
import {
  ORDER_STATUSES,
  formatMoney,
  paymentMethodLabel,
  type Order,
  type OrderStatus,
} from "@/lib/orders";
import { fetchAdminOrder, updateAdminOrderStatus } from "@/lib/admin/orders";

function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = decodeURIComponent(params.orderNumber ?? "");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [statusChoice, setStatusChoice] = useState<OrderStatus | "">("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!orderNumber) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await fetchAdminOrder(orderNumber);
        if (!cancelled) {
          setOrder(data);
          setStatusChoice(data.status);
        }
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
  }, [orderNumber]);

  async function handleStatusUpdate() {
    if (!order || !statusChoice || statusChoice === order.status) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const updated = await updateAdminOrderStatus(order.orderNumber, statusChoice);
      setOrder(updated);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to update order status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-slate transition hover:text-brand"
      >
        <ArrowLeft size={15} />
        Back to orders
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

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <section className="rounded-2xl border border-slate/15 p-6">
                <h2 className="font-display text-base font-semibold text-ink dark:text-paper">
                  Ordered products
                </h2>
                <ul className="mt-4 divide-y divide-slate/10 text-sm">
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

                <dl className="mt-4 space-y-2 border-t border-slate/10 pt-4 text-sm">
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

              {order.orderNotes && (
                <section className="rounded-2xl border border-slate/15 p-6">
                  <h2 className="font-display text-base font-semibold text-ink dark:text-paper">
                    Order notes
                  </h2>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate">{order.orderNotes}</p>
                </section>
              )}
            </div>

            <div className="space-y-6">
              <section className="rounded-2xl border border-slate/15 p-6 text-sm">
                <h2 className="font-display text-base font-semibold text-ink dark:text-paper">
                  Customer information
                </h2>
                <dl className="mt-3 space-y-2 text-slate">
                  <div>
                    <dt className="text-xs uppercase tracking-wide">Name</dt>
                    <dd className="text-ink dark:text-paper">{order.customerName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide">Email</dt>
                    <dd className="text-ink dark:text-paper">{order.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide">Contact</dt>
                    <dd className="text-ink dark:text-paper">{order.contactNumber}</dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-2xl border border-slate/15 p-6 text-sm">
                <h2 className="font-display text-base font-semibold text-ink dark:text-paper">
                  Delivery &amp; payment
                </h2>
                <dl className="mt-3 space-y-2 text-slate">
                  <div>
                    <dt className="text-xs uppercase tracking-wide">Delivery address</dt>
                    <dd className="whitespace-pre-wrap text-ink dark:text-paper">
                      {order.deliveryAddress}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide">Payment method</dt>
                    <dd className="text-ink dark:text-paper">
                      {paymentMethodLabel(order.paymentMethod)}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-2xl border border-slate/15 p-6 text-sm">
                <h2 className="font-display text-base font-semibold text-ink dark:text-paper">
                  Order status
                </h2>
                <select
                  value={statusChoice}
                  onChange={(e) => {
                    setStatusChoice(e.target.value as OrderStatus);
                    setSaved(false);
                    setSaveError(null);
                  }}
                  className="mt-3 w-full rounded-lg border border-slate/20 bg-paper py-2 pl-3 pr-9 text-sm text-ink outline-none focus:border-brand dark:bg-ink-soft dark:text-paper"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleStatusUpdate}
                  disabled={saving || !statusChoice || statusChoice === order.status}
                  className="mt-3 w-full rounded-full bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? "Updating…" : "Update Status"}
                </button>
                {saveError && <p className="mt-2 text-xs text-red-500">{saveError}</p>}
                {saved && !saveError && (
                  <p className="mt-2 text-xs text-success">Order status updated.</p>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
