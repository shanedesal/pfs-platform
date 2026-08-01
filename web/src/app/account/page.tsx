"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AccountPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="h-6 w-40 animate-pulse rounded bg-slate/10" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-2xl font-semibold text-ink dark:text-paper">
        My Account
      </h1>

      <div className="mt-6 rounded-2xl border border-slate/15 p-6">
        <dl className="grid grid-cols-[100px_1fr] gap-y-3 text-sm">
          <dt className="text-slate">Name</dt>
          <dd className="text-ink dark:text-paper">{user.name}</dd>

          <dt className="text-slate">Email</dt>
          <dd className="text-ink dark:text-paper">{user.email}</dd>

          <dt className="text-slate">Role</dt>
          <dd className="text-ink dark:text-paper">{user.role}</dd>
        </dl>
      </div>

      <button
        onClick={logout}
        className="mt-6 rounded-full border border-slate/20 px-4 py-2 text-sm text-ink transition hover:border-brand hover:text-brand dark:text-paper"
      >
        Log out
      </button>
    </div>
  );
}
