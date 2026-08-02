"use client";

import { useState, type FormEvent } from "react";
import { Pencil, Check, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { updateProfile } from "@/lib/profile";

type PhoneNumberFieldProps = {
  phoneNumber: string | null;
};

/** Formats as the user types: digits only, grouped "0912 234 2345" (max 11 digits). */
function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7, 11)]
    .filter(Boolean)
    .join(" ");
}

export default function PhoneNumberField({ phoneNumber }: PhoneNumberFieldProps) {
  const { applyUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(phoneNumber ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const startEditing = () => {
    setValue(phoneNumber ?? "");
    setError(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setError(null);
    setValue(phoneNumber ?? "");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;

    setPending(true);
    setError(null);

    try {
      const updated = await updateProfile({ phoneNumber: value });
      applyUser(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update phone number");
    } finally {
      setPending(false);
    }
  };

  if (editing) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="tel"
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(formatPhoneInput(e.target.value));
              setError(null);
            }}
            placeholder="0912 234 2345"
            maxLength={13}
            className="min-w-0 flex-1 rounded-xl border border-slate/20 bg-paper px-3.5 py-2 text-sm text-ink outline-none transition focus:border-brand dark:bg-ink/5 dark:text-paper"
          />
          <button
            type="submit"
            disabled={pending}
            aria-label="Save phone number"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check size={16} />
          </button>
          <button
            type="button"
            onClick={cancelEditing}
            disabled={pending}
            aria-label="Cancel"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate/20 text-slate transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-slate">
          11-digit PH mobile number starting with 09.
        </p>
        {error ? (
          <p className="text-xs text-amber" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      {phoneNumber ? (
        <span className="text-sm text-ink dark:text-paper">{phoneNumber}</span>
      ) : (
        <span className="text-sm text-amber">Not set — required for checkout</span>
      )}
      <button
        type="button"
        onClick={startEditing}
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate/20 px-3 py-1.5 text-xs font-medium text-ink transition hover:border-brand hover:text-brand dark:text-paper"
      >
        <Pencil size={12} />
        {phoneNumber ? "Edit" : "Add"}
      </button>
    </div>
  );
}
