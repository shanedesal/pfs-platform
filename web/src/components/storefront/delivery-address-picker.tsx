"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Plus, Check } from "lucide-react";
import {
  type Address,
  type AddressInput,
  listAddresses,
  createAddress,
} from "@/lib/addresses";
import Modal from "./modal";
import AddressForm from "./address-form";

type DeliveryAddressPickerProps = {
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function formatAddressLine(address: Address): string {
  const base = `${address.addressLine1}, ${address.addressLine2}, ${address.city}, ${address.province}`;
  return address.postalCode ? `${base} ${address.postalCode}` : base;
}

export default function DeliveryAddressPicker({
  selectedId,
  onSelect,
}: DeliveryAddressPickerProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const load = async (autoSelect: boolean) => {
    try {
      const data = await listAddresses();
      setAddresses(data);
      setError(null);
      if (autoSelect && !selectedId && data.length > 0) {
        const fallback = data.find((a) => a.isDefault) ?? data[0];
        onSelect(fallback.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(true);
    // Only run once on mount; auto-select uses the initial selectedId snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasDefault = addresses.some((a) => a.isDefault);

  const handleCreate = async (payload: AddressInput) => {
    const created = await createAddress(payload);
    await load(false);
    onSelect(created.id);
    setFormOpen(false);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-16 animate-pulse rounded-xl bg-slate/10" />
        <div className="h-16 animate-pulse rounded-xl bg-slate/10" />
      </div>
    );
  }

  return (
    <div>
      {error ? (
        <p className="mb-2 text-sm text-amber" role="alert">
          {error}
        </p>
      ) : null}

      {addresses.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate/25 p-6 text-center">
          <MapPin size={22} className="text-slate" />
          <p className="text-sm text-slate">
            You don&apos;t have any saved addresses yet.
          </p>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="mt-1 flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
          >
            <Plus size={14} />
            Add delivery address
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {addresses.map((address) => {
            const selected = address.id === selectedId;
            return (
              <button
                key={address.id}
                type="button"
                onClick={() => onSelect(address.id)}
                aria-pressed={selected}
                className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                  selected
                    ? "border-brand bg-brand/5"
                    : "border-slate/15 hover:border-brand/40"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    selected ? "border-brand bg-brand" : "border-slate/30"
                  }`}
                  aria-hidden
                >
                  {selected ? (
                    <Check size={10} className="text-white" strokeWidth={3} />
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink dark:text-paper">
                      {address.label || "Address"}
                    </span>
                    {address.isDefault ? (
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                        Default
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-sm text-slate">
                    {formatAddressLine(address)}
                  </span>
                </span>
              </button>
            );
          })}

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-slate/20 px-3 py-1.5 text-xs font-medium text-ink transition hover:border-brand hover:text-brand dark:text-paper"
            >
              <Plus size={12} />
              Add new address
            </button>
            <Link
              href="/account"
              className="text-xs text-slate transition hover:text-brand hover:underline"
            >
              Manage addresses
            </Link>
          </div>
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Add address"
        widthClassName="max-w-xl"
      >
        <AddressForm
          hasDefault={hasDefault}
          onSubmit={handleCreate}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  );
}
