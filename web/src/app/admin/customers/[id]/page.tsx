"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import ConfirmDialog from "@/components/admin/confirm-dialog";
import OrderStatusBadge from "@/components/order-status-badge";
import { formatMoney, paymentMethodLabel } from "@/lib/orders";
import {
  fetchAdminCustomer,
  updateAdminCustomerStatus,
  type AdminCustomerDetail,
} from "@/lib/admin/customers";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id ?? "");

  const [customer, setCustomer] = useState<AdminCustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toggleError, setToggleError] = useState("");
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await fetchAdminCustomer(id);
        if (!cancelled) setCustomer(data);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load customer");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleToggleConfirm() {
    if (!customer) return;
    setToggling(true);
    setToggleError("");
    try {
      const updated = await updateAdminCustomerStatus(customer.id, !customer.isActive);
      setCustomer({ ...customer, isActive: updated.isActive });
      setConfirmOpen(false);
    } catch (err) {
      setToggleError(err instanceof Error ? err.message : "Failed to update account status");
    } finally {
      setToggling(false);
    }
  }

  return (
    <div>
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1.5 text-sm text-slate transition hover:text-brand"
      >
        <ArrowLeft size={15} />
        Back to customers
      </Link>

      {loading ? (
        <div className="mt-6 space-y-4">
          <div className="h-8 w-56 animate-pulse rounded bg-slate/10" />
          <div className="h-40 animate-pulse rounded-2xl bg-slate/10" />
        </div>
      ) : loadError || !customer ? (
        <div className="mt-6 rounded-2xl border border-slate/15 p-8 text-center">
          <p className="text-amber">{loadError ?? "Customer not found."}</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink dark:text-paper">
                {customer.name}
              </h1>
              <p className="mt-1 text-sm text-slate">Customer since {formatDate(customer.createdAt)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  customer.isActive ? "bg-success/10 text-success" : "bg-red-500/10 text-red-500"
                }`}
              >
                {customer.isActive ? "Active" : "Disabled"}
              </span>
              <button
                onClick={() => {
                  setToggleError("");
                  setConfirmOpen(true);
                }}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  customer.isActive
                    ? "border-slate/20 text-ink hover:border-red-500 hover:text-red-500 dark:text-paper"
                    : "border-slate/20 text-ink hover:border-success hover:text-success dark:text-paper"
                }`}
              >
                {customer.isActive ? "Disable Account" : "Enable Account"}
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <section className="rounded-2xl border border-slate/15 p-6">
                <h2 className="font-display text-base font-semibold text-ink dark:text-paper">
                  Order history
                </h2>
                {customer.orders.length === 0 ? (
                  <p className="mt-4 text-sm text-slate">This customer hasn&apos;t placed any orders yet.</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate/15 text-xs uppercase tracking-wide text-slate">
                        <tr>
                          <th className="py-2 pr-3 font-medium">Order Number</th>
                          <th className="py-2 pr-3 font-medium">Date</th>
                          <th className="py-2 pr-3 font-medium">Payment</th>
                          <th className="py-2 pr-3 font-medium">Status</th>
                          <th className="py-2 pr-3 font-medium">Total</th>
                          <th className="py-2 pr-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customer.orders.map((order) => (
                          <tr key={order.id} className="border-b border-slate/10 last:border-0">
                            <td className="py-3 pr-3 font-mono text-xs text-ink dark:text-paper">
                              {order.orderNumber}
                            </td>
                            <td className="py-3 pr-3 text-slate">{formatDate(order.createdAt)}</td>
                            <td className="py-3 pr-3 text-slate">
                              {paymentMethodLabel(order.paymentMethod)}
                            </td>
                            <td className="py-3 pr-3">
                              <OrderStatusBadge status={order.status} />
                            </td>
                            <td className="py-3 pr-3 font-mono text-ink dark:text-paper">
                              {formatMoney(order.total)}
                            </td>
                            <td className="py-3 pr-3 text-right">
                              <Link
                                href={`/admin/orders/${encodeURIComponent(order.orderNumber)}`}
                                className="rounded-full border border-slate/20 px-3 py-1 text-xs font-medium text-ink transition hover:border-brand hover:text-brand dark:text-paper"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-2xl border border-slate/15 p-6 text-sm">
                <h2 className="font-display text-base font-semibold text-ink dark:text-paper">
                  Customer information
                </h2>
                <dl className="mt-3 space-y-3 text-slate">
                  <div>
                    <dt className="text-xs uppercase tracking-wide">Email</dt>
                    <dd className="text-ink dark:text-paper">{customer.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide">Contact</dt>
                    <dd className="text-ink dark:text-paper">{customer.phoneNumber ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide">Number of orders</dt>
                    <dd className="text-ink dark:text-paper">{customer.orderCount}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide">Total purchase amount</dt>
                    <dd className="font-mono text-ink dark:text-paper">
                      {formatMoney(customer.totalPurchase)}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-2xl border border-slate/15 p-6 text-sm">
                <h2 className="font-display text-base font-semibold text-ink dark:text-paper">
                  Saved addresses
                </h2>
                {customer.addresses.length === 0 ? (
                  <p className="mt-4 text-slate">No saved addresses.</p>
                ) : (
                  <ul className="mt-4 space-y-4">
                    {customer.addresses.map((address) => (
                      <li key={address.id} className="flex gap-2 border-b border-slate/10 pb-4 last:border-0 last:pb-0">
                        <MapPin size={16} className="mt-0.5 shrink-0 text-slate" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-ink dark:text-paper">
                              {address.label || "Address"}
                            </span>
                            {address.isDefault && (
                              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-slate">
                            {address.addressLine1}, {address.addressLine2}
                          </p>
                          <p className="text-slate">
                            {address.city}, {address.province}
                            {address.postalCode ? ` ${address.postalCode}` : ""}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {customer && (
        <ConfirmDialog
          open={confirmOpen}
          title={customer.isActive ? "Disable Account" : "Enable Account"}
          message={
            toggleError ||
            (customer.isActive
              ? `Are you sure you want to disable "${customer.name}"'s account? They will be logged out immediately and won't be able to sign in until re-enabled.`
              : `Are you sure you want to re-enable "${customer.name}"'s account? They will be able to sign in again.`)
          }
          confirmLabel={customer.isActive ? "Disable" : "Enable"}
          danger={customer.isActive}
          onConfirm={handleToggleConfirm}
          onCancel={() => {
            setConfirmOpen(false);
            setToggleError("");
          }}
          loading={toggling}
        />
      )}
    </div>
  );
}
