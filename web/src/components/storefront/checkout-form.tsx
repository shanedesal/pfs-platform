"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { formatMoney as formatCartMoney } from "@/lib/cart";
import {
  PAYMENT_METHOD_OPTIONS,
  placeOrder,
  type PaymentMethod,
  type PlaceOrderPayload,
} from "@/lib/orders";

type CheckoutFormProps = {
  customerName: string;
  email: string;
  phoneNumber: string | null;
};

type FormState = {
  deliveryAddress: string;
  paymentMethod: PaymentMethod | "";
  orderNotes: string;
};

export default function CheckoutForm({
  customerName,
  email,
  phoneNumber,
}: CheckoutFormProps) {
  const router = useRouter();
  const { cart, refetch } = useCart();
  const [form, setForm] = useState<FormState>({
    deliveryAddress: "",
    paymentMethod: "",
    orderNotes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const hasUnavailable = cart.items.some((item) => !item.available);
  const canSubmit = cart.items.length > 0 && !hasUnavailable && !pending;

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (!form.deliveryAddress.trim()) {
      setError("Delivery address is required");
      return;
    }
    if (!form.paymentMethod) {
      setError("Please select a payment method");
      return;
    }

    const payload: PlaceOrderPayload = {
      deliveryAddress: form.deliveryAddress.trim(),
      paymentMethod: form.paymentMethod,
      orderNotes: form.orderNotes.trim() || undefined,
    };

    setPending(true);
    setError(null);

    try {
      const order = await placeOrder(payload);
      await refetch();
      router.push(`/checkout/confirmation/${encodeURIComponent(order.orderNumber)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
      setPending(false);
    }
  };

  const inputClass =
    "mt-1 w-full rounded-xl border border-slate/20 bg-paper px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand dark:bg-ink/5 dark:text-paper";
  const readOnlyClass =
    "mt-1 w-full rounded-xl border border-slate/15 bg-slate/5 px-4 py-2.5 text-sm text-ink dark:bg-ink/10 dark:text-paper";
  const labelClass = "block text-sm font-medium text-ink dark:text-paper";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-slate/15 bg-slate/5 p-4 text-sm dark:bg-ink/5">
        <p className="text-slate">
          Name, email, and contact number come from your account profile. You
          can update your phone number from your{" "}
          <Link href="/account" className="font-medium text-brand hover:underline">
            account page
          </Link>
          .
        </p>
      </div>

      <div>
        <label htmlFor="customerName" className={labelClass}>
          Customer name
        </label>
        <p id="customerName" className={readOnlyClass}>
          {customerName}
        </p>
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>
          Email address
        </label>
        <p id="email" className={readOnlyClass}>
          {email}
        </p>
      </div>

      <div>
        <label htmlFor="contactNumber" className={labelClass}>
          Contact number
        </label>
        <p id="contactNumber" className={readOnlyClass}>
          {phoneNumber}
        </p>
      </div>

      <div>
        <label htmlFor="deliveryAddress" className={labelClass}>
          Delivery address
        </label>
        <textarea
          id="deliveryAddress"
          required
          rows={3}
          maxLength={500}
          value={form.deliveryAddress}
          onChange={(e) => updateField("deliveryAddress", e.target.value)}
          className={`${inputClass} resize-y`}
          autoComplete="street-address"
        />
      </div>

      <fieldset>
        <legend className={labelClass}>Payment method</legend>
        <div className="mt-2 space-y-2">
          {PAYMENT_METHOD_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate/15 px-4 py-3 transition hover:border-brand/40 has-[:checked]:border-brand has-[:checked]:bg-brand/5"
            >
              <input
                type="radio"
                name="paymentMethod"
                value={option.value}
                checked={form.paymentMethod === option.value}
                onChange={() => updateField("paymentMethod", option.value)}
                className="h-4 w-4 accent-brand"
              />
              <span className="text-sm text-ink dark:text-paper">{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="orderNotes" className={labelClass}>
          Order notes{" "}
          <span className="font-normal text-slate">(optional)</span>
        </label>
        <textarea
          id="orderNotes"
          rows={3}
          maxLength={1000}
          value={form.orderNotes}
          onChange={(e) => updateField("orderNotes", e.target.value)}
          placeholder="Delivery instructions, gift message, etc."
          className={`${inputClass} resize-y`}
        />
      </div>

      {hasUnavailable ? (
        <p className="text-sm text-amber" role="alert">
          Some items in your cart are no longer available. Update your cart to
          continue.
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-amber" role="alert">
          {error}
        </p>
      ) : null}

      <p className="text-xs text-slate">
        No online payment is processed. You will complete payment using your
        selected method when your order is delivered or as instructed.
      </p>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Placing order…" : `Place order · ${formatCartMoney(cart.total)}`}
      </button>
    </form>
  );
}
