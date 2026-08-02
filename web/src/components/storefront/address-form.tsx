"use client";

import { useState, type FormEvent } from "react";
import type { Address, AddressInput } from "@/lib/addresses";

type AddressFormProps = {
  initial?: Address | null;
  hasDefault: boolean;
  onSubmit: (payload: AddressInput) => Promise<void>;
  onCancel: () => void;
};

type FormState = {
  label: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
};

function toFormState(address?: Address | null): FormState {
  return {
    label: address?.label ?? "",
    addressLine1: address?.addressLine1 ?? "",
    addressLine2: address?.addressLine2 ?? "",
    city: address?.city ?? "",
    province: address?.province ?? "",
    postalCode: address?.postalCode ?? "",
    isDefault: address?.isDefault ?? false,
  };
}

export default function AddressForm({
  initial,
  hasDefault,
  onSubmit,
  onCancel,
}: AddressFormProps) {
  const [form, setForm] = useState<FormState>(toFormState(initial));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;

    if (!form.addressLine1.trim()) {
      setError("Street address is required");
      return;
    }
    if (!form.addressLine2.trim()) {
      setError("Barangay is required");
      return;
    }
    if (!form.city.trim()) {
      setError("City is required");
      return;
    }
    if (!form.province.trim()) {
      setError("Province is required");
      return;
    }

    setPending(true);
    setError(null);

    try {
      await onSubmit({
        label: form.label.trim() || undefined,
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2.trim(),
        city: form.city.trim(),
        province: form.province.trim(),
        postalCode: form.postalCode.trim() || undefined,
        isDefault: form.isDefault,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save address");
      setPending(false);
    }
  };

  const inputClass =
    "mt-1 w-full rounded-xl border border-slate/20 bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand dark:bg-ink/5 dark:text-paper";
  const labelClass = "block text-sm font-medium text-ink dark:text-paper";

  const isCurrentDefault = initial?.isDefault ?? false;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="label" className={labelClass}>
          Label <span className="font-normal text-slate">(optional)</span>
        </label>
        <input
          id="label"
          type="text"
          maxLength={30}
          value={form.label}
          onChange={(e) => updateField("label", e.target.value)}
          placeholder="Home, Work, etc."
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="addressLine1" className={labelClass}>
          Street address
        </label>
        <input
          id="addressLine1"
          type="text"
          required
          maxLength={200}
          value={form.addressLine1}
          onChange={(e) => updateField("addressLine1", e.target.value)}
          placeholder="House/unit no., building, street"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="addressLine2" className={labelClass}>
          Barangay
        </label>
        <input
          id="addressLine2"
          type="text"
          required
          maxLength={200}
          value={form.addressLine2}
          onChange={(e) => updateField("addressLine2", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="city" className={labelClass}>
            City / municipality
          </label>
          <input
            id="city"
            type="text"
            required
            maxLength={100}
            value={form.city}
            onChange={(e) => updateField("city", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="province" className={labelClass}>
            Province
          </label>
          <input
            id="province"
            type="text"
            required
            maxLength={100}
            value={form.province}
            onChange={(e) => updateField("province", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="postalCode" className={labelClass}>
            Postal code <span className="font-normal text-slate">(optional)</span>
          </label>
          <input
            id="postalCode"
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={form.postalCode}
            onChange={(e) => updateField("postalCode", e.target.value.replace(/\D/g, ""))}
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-ink dark:text-paper">
        <input
          type="checkbox"
          checked={form.isDefault}
          disabled={isCurrentDefault || (!hasDefault && !initial)}
          onChange={(e) => updateField("isDefault", e.target.checked)}
          className="h-4 w-4 accent-brand"
        />
        {isCurrentDefault
          ? "This is your default address"
          : "Set as default address"}
      </label>

      {error ? (
        <p className="text-sm text-amber" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-full border border-slate/20 px-4 py-2 text-sm text-ink transition hover:border-brand hover:text-brand disabled:opacity-60 dark:text-paper"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save address"}
        </button>
      </div>
    </form>
  );
}
