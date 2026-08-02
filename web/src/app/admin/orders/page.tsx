"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import OrderStatusBadge from "@/components/order-status-badge";
import { ORDER_STATUSES, formatMoney, paymentMethodLabel, type OrderStatus } from "@/lib/orders";
import { fetchAdminOrders, type AdminOrderListItem } from "@/lib/admin/orders";

const PAGE_SIZE = 10;

function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");

  // Debounce search input before it drives the API query.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      try {
        const data = await fetchAdminOrders({
          search,
          status: statusFilter,
          page,
          pageSize: PAGE_SIZE,
        });
        if (!cancelled) {
          setOrders(data.items);
          setTotal(data.total);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [search, statusFilter, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-paper">Orders</h1>
        <p className="mt-1 text-sm text-slate">View and manage customer orders.</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-full border border-slate/20 px-4 py-2">
          <Search size={16} className="text-slate" />
          <input
            type="search"
            placeholder="Search by order number or customer..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate/60"
          />
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

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate/15">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate/15 bg-paper-soft text-xs uppercase tracking-wide text-slate dark:bg-ink-soft">
            <tr>
              <th className="px-4 py-3 font-medium">Order Number</th>
              <th className="px-4 py-3 font-medium">Customer Name</th>
              <th className="px-4 py-3 font-medium">Order Date</th>
              <th className="px-4 py-3 font-medium">Total Amount</th>
              <th className="px-4 py-3 font-medium">Payment Method</th>
              <th className="px-4 py-3 font-medium">Order Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {status === "loading" && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate">
                  Loading…
                </td>
              </tr>
            )}
            {status === "error" && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate">
                  Couldn’t load orders. Try refreshing the page.
                </td>
              </tr>
            )}
            {status === "ready" && orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate">
                  No orders found.
                </td>
              </tr>
            )}
            {status === "ready" &&
              orders.map((order) => (
                <tr key={order.id} className="border-b border-slate/10 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-ink dark:text-paper">
                    {order.orderNumber}
                  </td>
                  <td className="px-4 py-3 font-medium text-ink dark:text-paper">
                    {order.customerName}
                  </td>
                  <td className="px-4 py-3 text-slate">{formatOrderDate(order.createdAt)}</td>
                  <td className="px-4 py-3 font-mono text-ink dark:text-paper">
                    {formatMoney(order.total)}
                  </td>
                  <td className="px-4 py-3 text-slate">{paymentMethodLabel(order.paymentMethod)}</td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <Link
                        href={`/admin/orders/${encodeURIComponent(order.orderNumber)}`}
                        className="rounded-full border border-slate/20 px-3 py-1.5 text-xs font-medium text-ink transition hover:border-brand hover:text-brand dark:text-paper"
                      >
                        View Details
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {status === "ready" && total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate">
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
    </div>
  );
}
