"use client";

import { useEffect, useState } from "react";
import { MapPin, Pencil, Trash2, Plus, Star } from "lucide-react";
import {
  type Address,
  type AddressInput,
  listAddresses,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
} from "@/lib/addresses";
import Modal from "./modal";
import ConfirmDialog from "./confirm-dialog";
import AddressForm from "./address-form";

export default function AddressBook() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [defaultPendingId, setDefaultPendingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await listAddresses();
      setAddresses(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const hasDefault = addresses.some((a) => a.isDefault);

  const openAddForm = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEditForm = (address: Address) => {
    setEditing(address);
    setFormOpen(true);
  };

  const closeForm = () => setFormOpen(false);

  const handleSubmit = async (payload: AddressInput) => {
    if (editing) {
      await updateAddress(editing.id, payload);
    } else {
      await createAddress(payload);
    }
    await load();
    setFormOpen(false);
  };

  const handleSetDefault = async (address: Address) => {
    if (address.isDefault || defaultPendingId) return;
    setDefaultPendingId(address.id);
    try {
      await setDefaultAddress(address.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set default address");
    } finally {
      setDefaultPendingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletePending(true);
    try {
      await deleteAddress(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete address");
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate/15">
      <div className="flex items-center justify-between border-b border-slate/15 bg-slate/5 px-5 py-3 dark:bg-ink/5">
        <h2 className="text-sm font-medium text-ink dark:text-paper">
          Delivery addresses
        </h2>
        <button
          type="button"
          onClick={openAddForm}
          className="flex items-center gap-1.5 rounded-full border border-slate/20 px-3 py-1.5 text-xs font-medium text-ink transition hover:border-brand hover:text-brand dark:text-paper"
        >
          <Plus size={12} />
          Add address
        </button>
      </div>

      <div className="p-5">
        {error ? (
          <p className="text-sm text-amber" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            <div className="h-20 animate-pulse rounded-xl bg-slate/10" />
            <div className="h-20 animate-pulse rounded-xl bg-slate/10" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <MapPin size={24} className="text-slate" />
            <p className="text-sm text-slate">
              No saved addresses yet. Add one to speed up checkout.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {addresses.map((address) => (
              <li
                key={address.id}
                className={`rounded-xl border p-4 ${
                  address.isDefault
                    ? "border-brand/40 bg-brand/5"
                    : "border-slate/15"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink dark:text-paper">
                        {address.label || "Address"}
                      </p>
                      {address.isDefault ? (
                        <span className="flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-xs font-medium text-white">
                          <Star size={10} fill="currentColor" />
                          Default
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-ink dark:text-paper">
                      {address.addressLine1}, {address.addressLine2}, {address.city},{" "}
                      {address.province}
                      {address.postalCode ? ` ${address.postalCode}` : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditForm(address)}
                      aria-label="Edit address"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-slate transition hover:bg-paper-soft hover:text-brand dark:hover:bg-ink"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(address)}
                      aria-label="Delete address"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-slate transition hover:bg-paper-soft hover:text-amber dark:hover:bg-ink"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {!address.isDefault ? (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(address)}
                    disabled={defaultPendingId === address.id}
                    className="mt-3 text-xs font-medium text-brand transition hover:underline disabled:opacity-60"
                  >
                    {defaultPendingId === address.id ? "Setting default…" : "Set as default"}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? "Edit address" : "Add address"}
        widthClassName="max-w-xl"
      >
        <AddressForm
          initial={editing}
          hasDefault={hasDefault}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete address"
        message={
          deleteTarget
            ? `Remove "${deleteTarget.label || deleteTarget.addressLine1}"? This can't be undone.`
            : ""
        }
        loading={deletePending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}
