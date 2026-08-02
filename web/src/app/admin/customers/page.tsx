"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import ConfirmDialog from "@/components/admin/confirm-dialog";
import { formatMoney } from "@/lib/orders";
import {
  fetchAdminCustomers,
  updateAdminCustomerStatus,
  type AdminCustomerListItem,
} from "@/lib/admin/customers";

const PAGE_SIZE = 10;

type StatusFilter = "active" | "disabled" | "";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "disabled", label: "Disabled" },
];

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomerListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");

  const [toggleTarget, setToggleTarget] = useState<AdminCustomerListItem | null>(null);
  const [toggleError, setToggleError] = useState("");
  const [toggling, setToggling] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

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
        const data = await fetchAdminCustomers({
          search,
          status: statusFilter,
          page,
          pageSize: PAGE_SIZE,
        });
        if (!cancelled) {
          setCustomers(data.items);
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
  }, [search, statusFilter, page, reloadKey]);

  function reload() {
    setReloadKey((k) => k + 1);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function handleToggleConfirm() {
    if (!toggleTarget) return;
    setToggling(true);
    setToggleError("");
    try {
      await updateAdminCustomerStatus(toggleTarget.id, !toggleTarget.isActive);
      setToggleTarget(null);
      reload();
    } catch (err) {
      setToggleError(err instanceof Error ? err.message : "Failed to update account status");
    } finally {
      setToggling(false);
    }
  }

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-paper">Customers</h1>
        <p className="mt-1 text-sm text-slate">View and manage customer accounts.</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-full border border-slate/20 px-4 py-2">
          <Search size={16} className="text-slate" />
          <input
            type="search"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate/60"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as StatusFilter);
            setPage(1);
          }}
          className="rounded-lg border border-slate/20 bg-paper py-2 pl-3 pr-9 text-sm text-ink outline-none focus:border-brand dark:bg-ink-soft dark:text-paper"
        >
          {STATUS_OPTIONS.map((s) => (
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
              <th className="px-4 py-3 font-medium">Customer Name</th>
              <th className="px-4 py-3 font-medium">Email Address</th>
              <th className="px-4 py-3 font-medium">Contact Number</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium">Total Purchase</th>
              <th className="px-4 py-3 font-medium">Status</th>
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
                  Couldn’t load customers. Try refreshing the page.
                </td>
              </tr>
            )}
            {status === "ready" && customers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate">
                  No customers found.
                </td>
              </tr>
            )}
            {status === "ready" &&
              customers.map((customer) => (
                <tr key={customer.id} className="border-b border-slate/10 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink dark:text-paper">{customer.name}</td>
                  <td className="px-4 py-3 text-slate">{customer.email}</td>
                  <td className="px-4 py-3 text-slate">{customer.phoneNumber ?? "—"}</td>
                  <td className="px-4 py-3 text-slate">{customer.orderCount}</td>
                  <td className="px-4 py-3 font-mono text-ink dark:text-paper">
                    {formatMoney(customer.totalPurchase)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        customer.isActive
                          ? "bg-success/10 text-success"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {customer.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/customers/${encodeURIComponent(customer.id)}`}
                        className="rounded-full border border-slate/20 px-3 py-1.5 text-xs font-medium text-ink transition hover:border-brand hover:text-brand dark:text-paper"
                      >
                        View Profile
                      </Link>
                      <button
                        onClick={() => {
                          setToggleTarget(customer);
                          setToggleError("");
                        }}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          customer.isActive
                            ? "border-slate/20 text-ink hover:border-red-500 hover:text-red-500 dark:text-paper"
                            : "border-slate/20 text-ink hover:border-success hover:text-success dark:text-paper"
                        }`}
                      >
                        {customer.isActive ? "Disable" : "Enable"}
                      </button>
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
            Page {page} of {totalPages} ({total} customer{total === 1 ? "" : "s"})
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

      <ConfirmDialog
        open={!!toggleTarget}
        title={toggleTarget?.isActive ? "Disable Account" : "Enable Account"}
        message={
          toggleError ||
          (toggleTarget?.isActive
            ? `Are you sure you want to disable "${toggleTarget?.name}"'s account? They will be logged out immediately and won't be able to sign in until re-enabled.`
            : `Are you sure you want to re-enable "${toggleTarget?.name}"'s account? They will be able to sign in again.`)
        }
        confirmLabel={toggleTarget?.isActive ? "Disable" : "Enable"}
        danger={!!toggleTarget?.isActive}
        onConfirm={handleToggleConfirm}
        onCancel={() => {
          setToggleTarget(null);
          setToggleError("");
        }}
        loading={toggling}
      />
    </div>
  );
}
