"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatMoney } from "@/lib/cart";

type CartViewProps = {
  showCheckoutAction?: boolean;
};

export default function CartView({ showCheckoutAction = true }: CartViewProps) {
  const { cart, loading, actionError, clearActionError, updateQuantity, removeItem } =
    useCart();
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (loading) {
    return <p className="text-sm text-slate">Loading cart…</p>;
  }

  if (cart.items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate/15 p-8 text-center">
        <p className="text-slate">Your cart is empty.</p>
        <Link
          href="/products"
          className="mt-4 inline-block text-sm font-medium text-brand hover:underline"
        >
          Browse products
        </Link>
      </div>
    );
  }

  const hasUnavailable = cart.items.some((item) => !item.available);

  const handleQuantity = async (productId: string, next: number) => {
    if (next < 1) return;
    setPendingId(productId);
    clearActionError();
    await updateQuantity(productId, next);
    setPendingId(null);
  };

  const handleRemove = async (productId: string) => {
    setPendingId(productId);
    clearActionError();
    await removeItem(productId);
    setPendingId(null);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <ul className="divide-y divide-slate/10 rounded-2xl border border-slate/15">
        {cart.items.map((item) => {
          const busy = pendingId === item.productId;
          return (
            <li
              key={item.productId}
              className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
            >
              <Link
                href={`/products/${item.productId}`}
                className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate/10 bg-brand/10"
              >
                {item.product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${item.productId}`}
                  className="font-display text-base font-medium text-ink hover:text-brand dark:text-paper"
                >
                  {item.product.name}
                </Link>
                <p className="mt-1 font-mono text-sm text-brand">
                  {formatMoney(item.product.price)}
                </p>
                {!item.available ? (
                  <p className="mt-1 text-xs font-medium text-amber">
                    No longer available — remove to continue
                  </p>
                ) : item.quantity > item.product.stock ? (
                  <p className="mt-1 text-xs font-medium text-amber">
                    Only {item.product.stock} in stock
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                <div className="flex items-center rounded-full border border-slate/20">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={busy || item.quantity <= 1}
                    onClick={() => handleQuantity(item.productId, item.quantity - 1)}
                    className="rounded-l-full px-3 py-2 text-slate transition hover:text-brand disabled:opacity-40"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="min-w-[2rem] text-center text-sm font-medium text-ink dark:text-paper">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={
                      busy ||
                      !item.available ||
                      item.quantity >= item.product.stock
                    }
                    onClick={() => handleQuantity(item.productId, item.quantity + 1)}
                    className="rounded-r-full px-3 py-2 text-slate transition hover:text-brand disabled:opacity-40"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <p className="font-mono text-sm font-medium text-ink dark:text-paper">
                  {formatMoney(item.lineTotal)}
                </p>

                <button
                  type="button"
                  aria-label="Remove item"
                  disabled={busy}
                  onClick={() => handleRemove(item.productId)}
                  className="text-slate transition hover:text-brand disabled:opacity-40"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="h-fit rounded-2xl border border-slate/15 p-6">
        <h2 className="font-display text-lg font-semibold text-ink dark:text-paper">
          Order summary
        </h2>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate">Subtotal</dt>
            <dd className="font-mono text-ink dark:text-paper">
              {formatMoney(cart.subtotal)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-slate/10 pt-2 font-medium">
            <dt className="text-ink dark:text-paper">Total</dt>
            <dd className="font-mono text-brand">{formatMoney(cart.total)}</dd>
          </div>
        </dl>

        {actionError ? (
          <p className="mt-4 text-sm text-amber" role="alert">
            {actionError}
          </p>
        ) : null}

        {hasUnavailable ? (
          <p className="mt-4 text-sm text-amber">
            Remove unavailable items before checkout.
          </p>
        ) : null}

        {showCheckoutAction ? (
          <Link
            href="/checkout"
            aria-disabled={hasUnavailable}
            className={`mt-6 flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition ${
              hasUnavailable
                ? "pointer-events-none bg-brand/40 text-white"
                : "bg-brand text-white hover:bg-brand-dark"
            }`}
          >
            Proceed to checkout
          </Link>
        ) : null}
      </aside>
    </div>
  );
}