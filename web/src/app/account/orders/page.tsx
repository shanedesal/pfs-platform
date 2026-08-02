"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, PackageSearch } from "lucide-react";
import Header from "@/components/storefront/header";
import Footer from "@/components/storefront/footer";
import OrderStatusBadge from "@/components/order-status-badge";
import ConfirmDialog from "@/components/storefront/confirm-dialog";
import { useAuth } from "@/lib/auth-context";
import {
  ORDER_STATUSES,
  canCancelOrder,
  cancelOrder,
  formatMoney,
  listMyOrders,
  paymentMethodLabel,
  type OrderListItem,
  type OrderStatus,
} from "@/lib/orders";

const PAGE_SIZE = 10;

function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const [cancelTarget, setCancelTarget] = useState<OrderListItem | null>(null);
  const [cancelPending, setCancelPending] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent("/account/orders")}`);
      return;
    }
    if (user.role === "ADMIN") {
      router.push("/admin");
    }
  }, [authLoading, user, router]);

  const load = async () => {
    setStatus("loading");
    try {
      const data = await listMyOrders({ status: statusFilter, page, pageSize: PAGE_SIZE });
      setOrders(data.items);
      setTotal(data.total);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
      setStatus("error");
    }
  };

  useEffect(() => {
    if (authLoading || !user || user.role !== "CUSTOMER") return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, statusFilter, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelPending(true);
    setCancelError(null);
    try {
      await cancelOrder(cancelTarget.orderNumber);
      setCancelTarget(null);
      await load();
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
        <main className="mx-auto max-w-3xl px-6 py-16">
          <div className="h-8 w-48 animate-pulse rounded bg-slate/10" />
          <div className="mt-6 h-48 animate-pulse rounded-2xl bg-slate/10" />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 text-sm text-slate transition hover:text-brand"
        >
          <ArrowLeft size={15} />
          Back to account
        </Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink dark:text-paper">
              My Orders
            </h1>
            <p className="mt-1 text-sm text-slate">Track your orders and manage cancellations.</p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as OrderStatus | "");
              setPage(1);
            }}
            className="rounded-lg border border-slate/20 bg-paper py-2 pl-3 pr-9 text-sm text-ink outline-none focus:border-brand dark:bg-ink-soft dark:text-paper"
          >
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {cancelError ? (
          <p className="mt-4 text-sm text-amber" role="alert">
            {cancelError}
          </p>
        ) : null}

        <div className="mt-6">
          {status === "loading" ? (
            <div className="space-y-3">
              <div className="h-24 animate-pulse rounded-2xl bg-slate/10" />
              <div className="h-24 animate-pulse rounded-2xl bg-slate/10" />
            </div>
          ) : status === "error" ? (
            <div className="rounded-2xl border border-slate/15 p-8 text-center">
              <p className="text-amber">{error}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate/15 py-12 text-center">
              <PackageSearch size={28} className="text-slate" />
              <p className="text-sm text-slate">
                {statusFilter ? "No orders with this status." : "You haven't placed any orders yet."}
              </p>
              <Link
                href="/products"
                className="mt-2 text-sm font-medium text-brand hover:underline"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {orders.map((order) => (
                <li key={order.id} className="rounded-2xl border border-slate/15 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-slate">{order.orderNumber}</p>
                      <p className="mt-1 text-sm text-ink dark:text-paper">
                        Placed {formatOrderDate(order.createdAt)}
                      </p>
                      <p className="mt-1 text-sm text-slate">
                        {paymentMethodLabel(order.paymentMethod)}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate/10 pt-4">
                    <span className="font-mono text-sm font-medium text-brand">
                      {formatMoney(order.total)}
                    </span>
                    <div className="flex items-center gap-2">
                      {canCancelOrder(order.status) ? (
                        <button
                          type="button"
                          onClick={() => {
                            setCancelError(null);
                            setCancelTarget(order);
                          }}
                          className="rounded-full border border-slate/20 px-3 py-1.5 text-xs font-medium text-ink transition hover:border-amber hover:text-amber dark:text-paper"
                        >
                          Cancel order
                        </button>
                      ) : null}
                      <Link
                        href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}
                        className="rounded-full border border-slate/20 px-3 py-1.5 text-xs font-medium text-ink transition hover:border-brand hover:text-brand dark:text-paper"
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {status === "ready" && total > 0 && (
          <div className="mt-6 flex items-center justify-between text-sm text-slate">
            <span>
              Page {page} of {totalPages} ({total} order{total === 1 ? "" : "s"})
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-full border border-slate/20 px-3 py-1.5 transition hover:border-brand hover:text-brand disabled:opacity-40"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-full border border-slate/20 px-3 py-1.5 transition hover:border-brand hover:text-brand disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Cancel order"
        message={
          cancelTarget
            ? `Cancel order ${cancelTarget.orderNumber}? This can't be undone.`
            : ""
        }
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        loading={cancelPending}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </>
  );
}
