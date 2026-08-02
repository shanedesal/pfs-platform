"use client";

import Link from "next/link";
import { Phone } from "lucide-react";

type CheckoutProfileRequiredProps = {
  variant?: "full" | "compact";
  className?: string;
};

export default function CheckoutProfileRequired({
  variant = "full",
  className = "",
}: CheckoutProfileRequiredProps) {
  if (variant === "compact") {
    return (
      <div
        className={`rounded-xl border border-amber/30 bg-amber/5 p-4 text-sm ${className}`}
        role="alert"
      >
        <p className="font-medium text-ink dark:text-paper">
          Contact number required
        </p>
        <p className="mt-1 text-slate">
          Add a phone number to your profile before you can checkout.
        </p>
        <Link
          href="/account"
          className="mt-3 inline-block text-sm font-medium text-brand hover:underline"
        >
          Go to my account →
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border-2 border-amber/30 bg-amber/5 p-8 text-center ${className}`}
      role="alert"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber/15">
        <Phone className="text-amber" size={28} strokeWidth={1.75} aria-hidden />
      </div>

      <h2 className="mt-5 font-display text-xl font-semibold text-ink dark:text-paper">
        Contact number required
      </h2>

      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate">
        Checkout needs a contact number on your account so we can reach you
        about delivery. Add one from your account page — it only takes a
        moment.
      </p>

      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/account"
          className="inline-flex w-full items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-dark sm:w-auto"
        >
          Go to my account
        </Link>
        <Link
          href="/cart"
          className="inline-flex w-full items-center justify-center rounded-full border border-slate/20 px-6 py-3 text-sm font-medium text-ink transition hover:border-brand hover:text-brand dark:text-paper sm:w-auto"
        >
          Back to cart
        </Link>
      </div>
    </div>
  );
}
