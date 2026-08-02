"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";

type AddToCartButtonProps = {
  productId: string;
  quantity?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
  showIcon?: boolean;
};

export default function AddToCartButton({
  productId,
  quantity = 1,
  disabled = false,
  className = "",
  label = "Add to Cart",
  showIcon = false,
}: AddToCartButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { addItem } = useCart();
  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState(false);

  if (authLoading) {
    return (
      <button
        type="button"
        disabled
        className={`rounded-full bg-brand px-3 py-2 text-xs font-medium text-white opacity-40 ${className}`}
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
        className={`rounded-full bg-brand px-3 py-2 text-xs font-medium text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      >
        {label}
      </button>
    );
  }

  const handleClick = async () => {
    if (disabled || pending) return;
    setPending(true);
    setAdded(false);
    const ok = await addItem(productId, quantity);
    setPending(false);
    if (ok) {
      setAdded(true);
      window.setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={handleClick}
      className={`flex items-center justify-center gap-2 rounded-full bg-brand font-medium text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {showIcon ? <ShoppingCart size={16} /> : null}
      {pending ? "Adding…" : added ? "Added!" : label}
    </button>
  );
}
