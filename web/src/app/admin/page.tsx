"use client";

import { useEffect, useState } from "react";
import {
  Package,
  ShoppingCart,
  Clock,
  CheckCircle2,
  Users,
  Wallet,
} from "lucide-react";
import { authFetch } from "@/lib/api";
import type { DashboardStats } from "@/lib/admin/dashboard";
import AdminStatCard from "@/components/admin/stat-card";

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      try {
        const res = await authFetch("/api/admin/dashboard-stats");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: DashboardStats = await res.json();
        if (!cancelled) {
          setStats(data);
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
  }, []);

  const loading = status === "loading";

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink dark:text-paper">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-slate">
        Overview of your store’s products, orders, and customers.
      </p>

      {status === "error" && (
        <p className="mt-4 text-sm text-slate">
          Couldn’t load dashboard stats. Try refreshing the page.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard
          label="Total Products"
          value={stats?.totalProducts ?? null}
          icon={Package}
          loading={loading}
        />
        <AdminStatCard
          label="Total Orders"
          value={null}
          icon={ShoppingCart}
          hint="Coming soon"
        />
        <AdminStatCard
          label="Pending Orders"
          value={null}
          icon={Clock}
          hint="Coming soon"
        />
        <AdminStatCard
          label="Completed Orders"
          value={null}
          icon={CheckCircle2}
          hint="Coming soon"
        />
        <AdminStatCard
          label="Total Customers"
          value={stats?.totalCustomers ?? null}
          icon={Users}
          loading={loading}
        />
        <AdminStatCard
          label="Total Sales"
          value={null}
          icon={Wallet}
          hint="Coming soon"
        />
      </div>
    </div>
  );
}
