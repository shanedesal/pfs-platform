"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";

type CheckoutButtonProps = {
  productId: string;
  quantity?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
};

export default function CheckoutButton({
  productId,
  quantity = 1,
  disabled = false,
  className = "",
  label = "Checkout",
}: CheckoutButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { addItem } = useCart();
  const [pending, setPending] = useState(false);

  if (authLoading) {
    return (
      <button
        type="button"
        disabled
        className={`rounded-full border border-brand px-3 py-2 text-xs font-medium text-brand opacity-40 ${className}`}
      >
        {label}
      </button>
    );
  }

  if (user?.role === "ADMIN") {
    return null;
  }

  if (!user) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          const redirect = encodeURIComponent(pathname);
          router.push(`/login?redirect=${redirect}`);
        }}
        className={`rounded-full border border-brand px-3 py-2 text-xs font-medium text-brand transition hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      >
        {label}
      </button>
    );
  }

  const handleClick = async () => {
    if (disabled || pending) return;
    setPending(true);
    const ok = await addItem(productId, quantity);
    setPending(false);
    if (ok) {
      router.push("/checkout");
    }
  };

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={handleClick}
      className={`rounded-full border border-brand font-medium text-brand transition hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {pending ? "Preparing…" : label}
    </button>
  );
}
