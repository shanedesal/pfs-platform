"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminHeader from "@/components/admin/header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
    } else if (user.role !== "ADMIN") {
      router.push("/");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="h-6 w-40 animate-pulse rounded bg-slate/10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AdminHeader />
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}
