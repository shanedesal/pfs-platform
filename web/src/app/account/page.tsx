"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Mail, Phone, Calendar, LogOut } from "lucide-react";
import Header from "@/components/storefront/header";
import Footer from "@/components/storefront/footer";
import CheckoutProfileRequired from "@/components/storefront/checkout-profile-required";
import PhoneNumberField from "@/components/storefront/phone-number-field";
import AddressBook from "@/components/storefront/address-book";
import { hasCheckoutContactNumber } from "@/lib/checkout-profile";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatMemberSince(createdAt: string | null | undefined): string | null {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

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
      <>
        <Header />
        <main className="mx-auto max-w-3xl px-6 py-16">
          <div className="h-24 animate-pulse rounded-2xl bg-slate/10" />
          <div className="mt-6 h-48 animate-pulse rounded-2xl bg-slate/10" />
        </main>
        <Footer />
      </>
    );
  }

  const memberSince = formatMemberSince(user.createdAt);
  const rowClass =
    "flex items-center justify-between gap-4 px-5 py-4 first:pt-5 last:pb-5";

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-paper">
          My Account
        </h1>
        <p className="mt-1 text-sm text-slate">
          Manage your profile and contact details.
        </p>

        {!hasCheckoutContactNumber(user) ? (
          <div className="mt-6">
            <CheckoutProfileRequired variant="compact" />
          </div>
        ) : null}

        {/* Identity header */}
        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-slate/15 bg-slate/5 p-6 dark:bg-ink/5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-semibold text-white">
            {getInitials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold text-ink dark:text-paper">
              {user.name}
            </p>
            <span className="mt-1 inline-flex items-center rounded-full border border-slate/20 px-2.5 py-0.5 text-xs font-medium text-slate">
              {user.role === "ADMIN" ? "Administrator" : "Customer"}
            </span>
          </div>
        </div>

        {/* Contact details */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate/15">
          <h2 className="border-b border-slate/15 bg-slate/5 px-5 py-3 text-sm font-medium text-ink dark:bg-ink/5 dark:text-paper">
            Contact details
          </h2>
          <div className="divide-y divide-slate/10">
            <div className={rowClass}>
              <div className="flex items-center gap-3 text-sm text-slate">
                <Mail size={16} className="shrink-0" />
                Email
              </div>
              <span className="truncate text-sm text-ink dark:text-paper">
                {user.email}
              </span>
            </div>
            <div className={rowClass}>
              <div className="flex items-center gap-3 text-sm text-slate">
                <Phone size={16} className="shrink-0" />
                Phone
              </div>
              <div className="min-w-0 flex-1">
                <PhoneNumberField phoneNumber={user.phoneNumber} />
              </div>
            </div>
          </div>
        </section>

        {/* Delivery addresses (customers only) */}
        {user.role === "CUSTOMER" ? <AddressBook /> : null}

        {/* Account meta */}
        {memberSince ? (
          <section className="mt-6 overflow-hidden rounded-2xl border border-slate/15">
            <div className={rowClass}>
              <div className="flex items-center gap-3 text-sm text-slate">
                <Calendar size={16} className="shrink-0" />
                Member since
              </div>
              <span className="text-sm text-ink dark:text-paper">{memberSince}</span>
            </div>
          </section>
        ) : null}

        <button
          onClick={logout}
          className="mt-8 flex items-center gap-2 rounded-full border border-slate/20 px-4 py-2 text-sm text-ink transition hover:border-amber hover:text-amber dark:text-paper"
        >
          <LogOut size={14} />
          Log out
        </button>
      </main>
      <Footer />
    </>
  );
}
