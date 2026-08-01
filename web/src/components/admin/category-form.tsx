"use client";

import { useState } from "react";
import type { AdminCategory } from "@/lib/category";
import type { AdminCategoryInput } from "@/lib/admin/categories";

type CategoryFormProps = {
  initial?: AdminCategory | null;
  onSubmit: (input: AdminCategoryInput) => Promise<void>;
  onCancel: () => void;
};

const inputClass =
  "rounded-lg border border-slate/20 bg-transparent px-4 py-2 text-sm text-ink outline-none focus:border-brand dark:text-paper";

export default function CategoryForm({ initial, onSubmit, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), sortOrder: Number(sortOrder) || 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm text-slate">
        Name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="e.g. Electronics"
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-slate">
        Sort Order
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className={inputClass}
        />
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="mt-2 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-slate/20 px-4 py-2 text-sm text-ink transition hover:border-brand hover:text-brand dark:text-paper"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {submitting ? "Saving…" : initial ? "Save changes" : "Add category"}
        </button>
      </div>
    </form>
  );
}
