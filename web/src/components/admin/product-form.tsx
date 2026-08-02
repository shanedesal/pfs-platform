"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import type { AdminProduct } from "@/lib/product";
import { PRODUCT_DESCRIPTION_MAX_LENGTH, PRODUCT_STATUSES } from "@/lib/product";
import type { AdminCategory } from "@/lib/category";
import { uploadAdminProductImage, type AdminProductInput } from "@/lib/admin/products";

type ProductFormProps = {
  initial?: AdminProduct | null;
  categories: AdminCategory[];
  onSubmit: (input: AdminProductInput) => Promise<void>;
  onCancel: () => void;
};

const inputClass =
  "rounded-lg border border-slate/20 bg-transparent px-4 py-2 text-sm text-ink outline-none focus:border-brand dark:text-paper";

/** Solid bg + extra right padding so native caret isn’t flush with the border; works in dark mode. */
const selectClass =
  "rounded-lg border border-slate/20 bg-paper py-2 pl-4 pr-10 text-sm text-ink outline-none focus:border-brand dark:bg-ink-soft dark:text-paper";

export default function ProductForm({ initial, categories, onSubmit, onCancel }: ProductFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [stock, setStock] = useState(initial ? String(initial.stock) : "0");
  const [status, setStatus] = useState(initial?.status ?? "ACTIVE");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");

  const [coverUrl, setCoverUrl] = useState(initial?.imageUrl ?? "");
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUrls, setGalleryUrls] = useState<string[]>(
    initial?.images?.map((img) => img.url) ?? []
  );
  const [galleryUploading, setGalleryUploading] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setCoverUploading(true);
    try {
      const url = await uploadAdminProductImage(file);
      setCoverUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setCoverUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  async function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setError("");
    setGalleryUploading(true);
    try {
      const urls = await Promise.all(files.map((file) => uploadAdminProductImage(file)));
      setGalleryUrls((prev) => [...prev, ...urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setGalleryUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  function removeGalleryImage(index: number) {
    setGalleryUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Product name is required");
      return;
    }
    if (!categoryId) {
      setError("Category is required");
      return;
    }
    if (!coverUrl) {
      setError("Product image is required");
      return;
    }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError("Price must be a non-negative number");
      return;
    }
    const stockNum = Number(stock);
    if (!Number.isFinite(stockNum) || stockNum < 0) {
      setError("Stock quantity must be a non-negative number");
      return;
    }
    if (description.trim().length > PRODUCT_DESCRIPTION_MAX_LENGTH) {
      setError(
        `Description is too long (${description.trim().length.toLocaleString()} / ${PRODUCT_DESCRIPTION_MAX_LENGTH.toLocaleString()} characters)`
      );
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        price: priceNum,
        stock: Math.trunc(stockNum),
        status,
        categoryId,
        imageUrl: coverUrl,
        images: galleryUrls,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm text-slate">
        Product Name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          placeholder="e.g. Wireless Headphones"
          required
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm text-slate">
          Category
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={selectClass}
            required
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate">
          Product Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className={selectClass}
          >
            {PRODUCT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-slate">
        Description
        <textarea
          value={description ?? ""}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={PRODUCT_DESCRIPTION_MAX_LENGTH}
          className={`${inputClass} min-h-20 resize-y`}
          placeholder="Short product description (about 5-8 paragraphs max)"
        />
        <span
          className={`self-end font-mono text-xs ${
            description.length > PRODUCT_DESCRIPTION_MAX_LENGTH * 0.9 ? "text-amber" : "text-slate/60"
          }`}
        >
          {description.length.toLocaleString()} / {PRODUCT_DESCRIPTION_MAX_LENGTH.toLocaleString()}
        </span>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm text-slate">
          Price
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate">
          Stock Quantity
          <input
            type="number"
            min="0"
            step="1"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className={inputClass}
            required
          />
        </label>
      </div>

      <div className="flex flex-col gap-2 text-sm text-slate">
        Product Image
        <div className="flex items-center gap-3">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate/20 bg-paper-soft dark:bg-ink-soft">
            {coverUploading ? (
              <Loader2 size={20} className="animate-spin text-slate" />
            ) : coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="Cover preview" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus size={20} className="text-slate/50" />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="rounded-full border border-slate/20 px-4 py-2 text-sm text-ink transition hover:border-brand hover:text-brand dark:text-paper"
            >
              {coverUrl ? "Replace image" : "Upload image"}
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleCoverChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 text-sm text-slate">
        Additional Images
        <div className="flex flex-wrap gap-3">
          {galleryUrls.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate/20"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Gallery ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeGalleryImage(index)}
                aria-label="Remove image"
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-paper"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={galleryUploading}
            className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate/30 text-slate transition hover:border-brand hover:text-brand disabled:opacity-60"
          >
            {galleryUploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
          </button>
          <input
            ref={galleryInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleGalleryChange}
            className="hidden"
          />
        </div>
      </div>

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
          disabled={submitting || coverUploading || galleryUploading}
          className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {submitting ? "Saving…" : initial ? "Save changes" : "Add product"}
        </button>
      </div>
    </form>
  );
}
