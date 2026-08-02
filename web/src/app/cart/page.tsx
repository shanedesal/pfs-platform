"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/storefront/header";
import Footer from "@/components/storefront/footer";
import CartView from "@/components/storefront/cart-view";
import { useAuth } from "@/lib/auth-context";

export default function CartPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login?redirect=%2Fcart");
      return;
    }
    if (user.role === "ADMIN") {
      router.push("/admin");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== "CUSTOMER") {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-5xl px-6 py-16">
          <div className="h-8 w-32 animate-pulse rounded bg-slate/10" />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-paper">
          Shopping cart
        </h1>
        <p className="mt-2 text-sm text-slate">
          {user.name}, review your items before checkout.
        </p>
        <div className="mt-8">
          <CartView />
        </div>
      </main>
      <Footer />
    </>
  );
}
